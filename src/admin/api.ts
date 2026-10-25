// Calls to the admin API (api/*.ts) and the ImageKit upload.
import type { CollectionName } from '../lib/schema'

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly details: string[] = [],
  ) {
    super(message)
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response
  try {
    res = await fetch(path, { ...init, headers: init.body ? { 'content-type': 'application/json' } : undefined, credentials: 'same-origin' })
  } catch {
    throw new ApiError(0, 'Could not reach the server. Check your internet connection.')
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    if (res.status === 401 && path !== '/api/login') window.dispatchEvent(new Event('admin:logged-out'))
    throw new ApiError(res.status, data.error ?? `Request failed (${res.status})`, data.details)
  }
  return data as T
}

const send = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) })

export const api = {
  session: () => request<{ loggedIn: boolean; name?: string }>('/api/session'),
  login: (name: string, password: string) => request<{ name: string }>('/api/login', send('POST', { name, password })),
  logout: () => request('/api/logout', send('POST', {})),
  load: <T>(name: CollectionName) => request<{ data: T; sha: string }>(`/api/content?name=${name}`),
  save: (name: CollectionName, data: unknown, sha: string, summary: string) => request<{ sha: string }>('/api/content', send('PUT', { name, data, sha, summary })),
  drafts: () => request<Drafts>('/api/drafts'),
  publish: () => request<{ published: boolean }>('/api/drafts', send('POST', { action: 'publish' })),
  discard: () => request('/api/drafts', send('POST', { action: 'discard' })),
}

export type Drafts = { pending: number; files: string[]; changes: { message: string; by: string; at: string }[]; previewUrl?: string }

// Photos are resized in the browser before upload, so even large phone photos upload quickly
const MAX_SIDE = 2000

async function shrink(file: File): Promise<Blob> {
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') return file
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/webp', 0.86))
  return blob && blob.size < file.size ? blob : file
}

const safeName = (name: string) =>
  name
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'image'

type Uploaded = { filePath: string; url: string }

async function upload(blob: Blob, fileName: string, folder: string): Promise<Uploaded> {
  const auth = await request<{ token: string; expire: number; signature: string; publicKey: string; uploadUrl?: string }>('/api/imagekit-auth')
  const form = new FormData()
  form.append('file', blob, fileName)
  form.append('fileName', fileName)
  form.append('folder', `/maanran/${folder}`)
  form.append('useUniqueFileName', 'true')
  form.append('publicKey', auth.publicKey)
  form.append('signature', auth.signature)
  form.append('expire', String(auth.expire))
  form.append('token', auth.token)
  let res: Response
  try {
    res = await fetch(auth.uploadUrl ?? 'https://upload.imagekit.io/api/v1/files/upload', { method: 'POST', body: form })
  } catch {
    throw new ApiError(0, 'The upload failed. Check your internet connection.')
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(res.status, `Upload failed: ${data.message ?? res.status}`)
  return { filePath: data.filePath, url: data.url ?? data.filePath }
}

// Uploads one image to ImageKit and returns the path to store in the content (shown through imageUrl())
export async function uploadImage(file: File, folder: string): Promise<string> {
  if (!file.type.startsWith('image/')) throw new ApiError(400, 'Please choose an image file (JPG, PNG, WebP or SVG).')
  const blob = await shrink(file)
  const ext = blob.type === 'image/webp' ? 'webp' : (file.name.split('.').pop() ?? 'jpg')
  return (await upload(blob, `${safeName(file.name)}.${ext}`, folder)).filePath
}

const MAX_FILE_MB = 25

// Uploads a document (e.g. a PDF catalogue) as-is and returns its full address, which download links use directly
export async function uploadFile(file: File, folder: string, accept: string) {
  if (accept && !accept.split(',').some((t) => file.type === t.trim())) throw new ApiError(400, 'Please choose a PDF file.')
  if (file.size > MAX_FILE_MB * 1024 * 1024) throw new ApiError(400, `This file is larger than ${MAX_FILE_MB} MB. Please compress it and try again.`)
  const ext = (file.name.split('.').pop() ?? 'pdf').toLowerCase()
  const { url } = await upload(file, `${safeName(file.name)}.${ext}`, folder)
  return { url, type: ext.toUpperCase(), size: sizeLabel(file.size) }
}

export const sizeLabel = (bytes: number) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`)
