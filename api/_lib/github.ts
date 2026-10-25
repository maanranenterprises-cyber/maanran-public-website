// Reads and writes the content files in the GitHub repository.
// Edits are saved to the "drafts" branch; Publish merges drafts into "main", which Vercel deploys as the live site.
import { env, HttpError } from './http.js'

export const LIVE = 'main'
export const DRAFTS = 'drafts'
export const CONTENT_DIR = 'src/content'

const repo = () => process.env.GITHUB_REPO || 'maanranenterprises-cyber/maanran-public-website'

async function gh<T>(path: string, init: RequestInit = {}, allow: number[] = []): Promise<{ status: number; data: T }> {
  const res = await fetch(`https://api.github.com/repos/${repo()}${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      authorization: `Bearer ${env('GITHUB_TOKEN')}`,
      accept: 'application/vnd.github+json',
      'x-github-api-version': '2022-11-28',
      ...(init.body ? { 'content-type': 'application/json' } : {}),
    },
  })
  if (!res.ok && !allow.includes(res.status)) {
    const detail = await res.text()
    console.error(`GitHub ${init.method ?? 'GET'} ${path} failed: ${res.status} ${detail}`)
    if (res.status === 401 || res.status === 403) throw new HttpError(500, 'The server could not access GitHub. Check the GITHUB_TOKEN setting in Vercel.')
    throw new HttpError(502, 'GitHub did not accept the request. Please try again.')
  }
  const data = res.status === 204 ? (null as T) : ((await res.json()) as T)
  return { status: res.status, data }
}

type Ref = { object: { sha: string } }
type Compare = {
  ahead_by: number
  behind_by: number
  files?: { filename: string; status: string }[]
  commits: { sha: string; commit: { message: string; author: { name: string; date: string } } }[]
}

const branchSha = async (branch: string) => (await gh<Ref>(`/git/ref/heads/${branch}`, {}, [404])).data?.object?.sha ?? null

export const compareDrafts = async () => (await gh<Compare>(`/compare/${LIVE}...${DRAFTS}`)).data

// Makes sure the drafts branch exists and, when it holds no unpublished edits, catches it up with the live site
// (so code changes pushed to main are not lost when the next edit is published).
export async function prepareDrafts() {
  const liveSha = await branchSha(LIVE)
  if (!liveSha) throw new HttpError(500, `The ${LIVE} branch was not found on GitHub.`)
  const draftSha = await branchSha(DRAFTS)
  if (!draftSha) {
    await gh('/git/refs', { method: 'POST', body: JSON.stringify({ ref: `refs/heads/${DRAFTS}`, sha: liveSha }) })
    return
  }
  const diff = await compareDrafts()
  if (diff.ahead_by === 0 && diff.behind_by > 0) {
    await gh(`/git/refs/heads/${DRAFTS}`, { method: 'PATCH', body: JSON.stringify({ sha: liveSha, force: true }) })
  }
}

type FileData = { content: string; sha: string }

// Returns the parsed JSON file and its version (sha) from the drafts branch
export async function readContent(file: string) {
  const { data } = await gh<FileData>(`/contents/${CONTENT_DIR}/${file}?ref=${DRAFTS}`)
  return { data: JSON.parse(Buffer.from(data.content, 'base64').toString('utf8')) as unknown, sha: data.sha }
}

// Saves a JSON file to drafts. `sha` is the version the editor started from; if someone saved in between, GitHub refuses (409).
export async function writeContent(file: string, data: unknown, sha: string, message: string, author: string) {
  const body = {
    message,
    branch: DRAFTS,
    sha,
    content: Buffer.from(`${JSON.stringify(data, null, 2)}\n`, 'utf8').toString('base64'),
    author: { name: author, email: 'admin@maanran.com' },
  }
  const res = await gh<{ content: { sha: string } }>(`/contents/${CONTENT_DIR}/${file}`, { method: 'PUT', body: JSON.stringify(body) }, [409])
  if (res.status === 409) throw new HttpError(409, 'Someone else changed this since you opened it. Reload to see the latest version, then make your change again.')
  return res.data.content.sha
}

// Publishes every saved draft in one merge commit; returns false when there was nothing to publish
export async function publishDrafts(by: string) {
  const res = await gh(`/merges`, { method: 'POST', body: JSON.stringify({ base: LIVE, head: DRAFTS, commit_message: `Publish website changes (by ${by})` }) }, [409])
  if (res.status === 409) throw new HttpError(409, 'The drafts clash with a recent change to the live site. Please contact your developer.')
  return res.status === 201
}

// Throws away all unpublished edits by pointing drafts back at the live site
export async function discardDrafts() {
  const liveSha = await branchSha(LIVE)
  await gh(`/git/refs/heads/${DRAFTS}`, { method: 'PATCH', body: JSON.stringify({ sha: liveSha, force: true }) })
}
