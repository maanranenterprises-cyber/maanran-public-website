// Admin only. GET /api/enquiries → all enquiries (newest first) and counts per status;
// GET /api/enquiries?count=new → just the number still "New" (polled for the badge);
// PATCH /api/enquiries { id, status?, note? } → updates one, recording who and when; DELETE /api/enquiries { id }.
import { countNew, deleteEnquiry, getEnquiry, listEnquiries, saveEnquiry, STATUSES, type Status } from './_lib/enquiries.js'
import { handle, HttpError, json, readJson, requireSameOrigin } from './_lib/http.js'
import { requireSession } from './_lib/session.js'

export function GET(request: Request) {
  return handle(async () => {
    requireSession(request)
    if (new URL(request.url).searchParams.get('count') === 'new') return json({ new: await countNew() })
    const enquiries = await listEnquiries()
    const counts = Object.fromEntries(STATUSES.map((s) => [s, enquiries.filter((e) => e.status === s).length]))
    return json({ enquiries, counts })
  })
}

export function PATCH(request: Request) {
  return handle(async () => {
    requireSameOrigin(request)
    const session = requireSession(request)
    const { id, status, note } = await readJson<{ id?: unknown; status?: unknown; note?: unknown }>(request)
    const enquiry = typeof id === 'string' ? await getEnquiry(id) : null
    if (!enquiry) throw new HttpError(404, 'This enquiry no longer exists. It may have been deleted.')
    if (status !== undefined) {
      if (!STATUSES.includes(status as Status)) throw new HttpError(400, 'Unknown status.')
      enquiry.status = status as Status
    }
    if (note !== undefined) {
      if (typeof note !== 'string' || note.length > 2000) throw new HttpError(400, 'Notes must be under 2000 characters.')
      enquiry.note = note.trim()
    }
    enquiry.updatedBy = session.name
    enquiry.updatedAt = new Date().toISOString()
    await saveEnquiry(enquiry)
    return json({ enquiry })
  })
}

export function DELETE(request: Request) {
  return handle(async () => {
    requireSameOrigin(request)
    requireSession(request)
    const { id } = await readJson<{ id?: unknown }>(request)
    if (typeof id !== 'string') throw new HttpError(400, 'Missing enquiry.')
    await deleteEnquiry(id)
    return json({ deleted: true })
  })
}
