// Customer enquiries, stored privately in Redis (never in the public content files or GitHub).
// Keys: enq:<id> → the enquiry as JSON; enq:index → sorted set of ids by time; enq:new → set of ids still "New".
import { redis } from './redis.js'

export const STATUSES = ['new', 'contacted', 'quoted', 'closed', 'spam'] as const
export type Status = (typeof STATUSES)[number]

export type Enquiry = {
  id: string
  at: string
  channel: 'form' | 'whatsapp'
  page: string
  name: string
  phone: string
  email: string
  city: string
  interest: string
  quantity: string
  message: string
  product: string
  status: Status
  note: string
  updatedBy?: string
  updatedAt?: string
}

const INDEX = 'enq:index'
const NEW = 'enq:new'
const key = (id: string) => `enq:${id}`

export async function addEnquiry(e: Enquiry) {
  await redis([
    ['SET', key(e.id), JSON.stringify(e)],
    ['ZADD', INDEX, Date.parse(e.at), e.id],
    ['SADD', NEW, e.id],
  ])
}

export async function listEnquiries() {
  const [ids] = (await redis([['ZREVRANGE', INDEX, 0, -1]])) as [string[]]
  if (!ids.length) return []
  const [values] = (await redis([['MGET', ...ids.map(key)]])) as [(string | null)[]]
  return values.filter((v): v is string => Boolean(v)).map((v) => JSON.parse(v) as Enquiry)
}

export async function countNew() {
  const [n] = await redis([['SCARD', NEW]])
  return Number(n)
}

export async function getEnquiry(id: string) {
  const [v] = (await redis([['GET', key(id)]])) as [string | null]
  return v ? (JSON.parse(v) as Enquiry) : null
}

export async function saveEnquiry(e: Enquiry) {
  await redis([['SET', key(e.id), JSON.stringify(e)], e.status === 'new' ? ['SADD', NEW, e.id] : ['SREM', NEW, e.id]])
}

export async function deleteEnquiry(id: string) {
  await redis([
    ['DEL', key(id)],
    ['ZREM', INDEX, id],
    ['SREM', NEW, id],
  ])
}
