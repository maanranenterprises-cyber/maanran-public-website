// Reads a Google Maps place link (the short maps.app.goo.gl "Share" link or the full address-bar link)
// into what the footer map needs: the listing ID and the pin's coordinates.
import { HttpError } from './http.js'

export type Place = { cid: string; latitude: number; longitude: number }

const BAD_LINK = 'Could not find a business listing in that Google Maps link. Open your listing in Google Maps, press Share and paste the link.'

export async function placeFromLink(link: string): Promise<Place> {
  let url = link
  // Short links redirect to the full place link, which holds the details
  if (/^https:\/\/(maps\.app\.)?goo\.gl\//.test(link)) {
    const res = await fetch(link, { redirect: 'manual' }).catch(() => null)
    if (!res) throw new HttpError(502, 'Could not reach Google Maps to check the link. Please try again.')
    url = res.headers.get('location') ?? ''
  }
  url = decodeURIComponent(url)
  // The listing ID is the second hex number in "!1s0x…:0x…", or given directly as "cid=…"
  const hex = url.match(/!1s0x[0-9a-f]+:0x([0-9a-f]+)/i)?.[1]
  const cid = hex ? BigInt(`0x${hex}`).toString() : url.match(/[?&]cid=(\d+)/)?.[1]
  const latitude = Number(url.match(/!3d(-?\d+\.\d+)/)?.[1])
  const longitude = Number(url.match(/!4d(-?\d+\.\d+)/)?.[1])
  if (!cid || !Number.isFinite(latitude) || !Number.isFinite(longitude)) throw new HttpError(422, BAD_LINK)
  return { cid, latitude, longitude }
}
