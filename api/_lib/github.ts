// Reads and writes the content files in the GitHub repository.
// Edits are saved to the "drafts" branch; Publish merges drafts into "main", which Vercel deploys as the live site.
import { env, HttpError } from './http.js'

export const LIVE = 'main'
export const DRAFTS = 'drafts'
export const CONTENT_DIR = 'src/content'

const repo = () => process.env.GITHUB_REPO || 'maanranenterprises-cyber/maanran-public-website'

const RETRY_MS = 400
// GitHub occasionally answers with a temporary error; reads are safe to try again once
const temporary = (status: number) => status === 429 || status >= 500

async function gh<T>(path: string, init: RequestInit = {}, allow: number[] = []): Promise<{ status: number; data: T }> {
  const method = init.method ?? 'GET'
  const send = () =>
    fetch(`https://api.github.com/repos/${repo()}${path}`, {
      ...init,
      cache: 'no-store',
      headers: {
        authorization: `Bearer ${env('GITHUB_TOKEN')}`,
        accept: 'application/vnd.github+json',
        'x-github-api-version': '2022-11-28',
        ...(init.body ? { 'content-type': 'application/json' } : {}),
      },
    })
  let res: Response
  try {
    res = await send()
    if (method === 'GET' && temporary(res.status)) res = await new Promise((r) => setTimeout(r, RETRY_MS)).then(send)
  } catch {
    if (method !== 'GET') throw new HttpError(502, 'Could not reach GitHub. Please try again.')
    res = await new Promise((r) => setTimeout(r, RETRY_MS)).then(send)
  }
  if (!res.ok && !allow.includes(res.status)) {
    const detail = await res.text()
    console.error(`GitHub ${method} ${path} failed: ${res.status} ${detail}`)
    if (res.status === 401 || res.status === 403) throw new HttpError(500, 'The server could not access GitHub. Check the GITHUB_TOKEN setting in Vercel.')
    // The code and request in the message make an occasional failure easy to diagnose
    throw new HttpError(502, `GitHub did not accept the request (${res.status} on ${method} ${path.split('?')[0]}). Please try again.`)
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

export const compare = async (base: string, head: string) => (await gh<Compare>(`/compare/${base}...${head}`)).data
export const compareDrafts = () => compare(LIVE, DRAFTS)

type Commit = { sha: string; parents: { sha: string }[]; commit: { message: string; author: { name: string; date: string }; committer: { date: string } } }

// The newest commit on the live branch: what the website should be showing once Vercel has finished building
export async function liveHead() {
  const { data } = await gh<Commit>(`/commits/${LIVE}`)
  return { sha: data.sha, at: data.commit.committer.date }
}

export const PUBLISH_MESSAGE = 'Publish website changes'

// Recent publishes (the merge commits Publish creates), newest first, each with the edits it made live
export async function listPublishes(limit: number) {
  const { data } = await gh<Commit[]>(`/commits?sha=${LIVE}&per_page=100`)
  const merges = data.filter((c) => c.commit.message.startsWith(PUBLISH_MESSAGE) && c.parents.length === 2).slice(0, limit)
  return Promise.all(
    merges.map(async (c) => {
      const diff = await compare(c.parents[0].sha, c.parents[1].sha)
      return {
        sha: c.sha,
        before: c.parents[0].sha,
        by: editorOf(c.commit.message, c.commit.author.name),
        at: c.commit.committer.date,
        edits: diff.commits.map((e) => e.commit.message.replace(/ \(by [^)]*\)$/, '')).reverse(),
        files: (diff.files ?? []).filter((f) => f.filename.startsWith(`${CONTENT_DIR}/`)).map((f) => f.filename.slice(CONTENT_DIR.length + 1)),
      }
    }),
  )
}

// Makes sure the drafts branch exists and, when it holds no unpublished edits, catches it up with the live site
// (so code changes pushed to main are not lost when the next edit is published).
export async function prepareDrafts() {
  const liveSha = await branchSha(LIVE)
  if (!liveSha) throw new HttpError(500, `The ${LIVE} branch was not found on GitHub.`)
  const draftSha = await branchSha(DRAFTS)
  if (!draftSha) {
    // 422: another request created it at the same moment, which is fine
    await gh('/git/refs', { method: 'POST', body: JSON.stringify({ ref: `refs/heads/${DRAFTS}`, sha: liveSha }) }, [422])
    return
  }
  const diff = await compareDrafts()
  if (diff.ahead_by === 0 && diff.behind_by > 0) {
    // Several admin requests can arrive together and all try this catch-up; GitHub may refuse all but one.
    // A refusal is fine if drafts has been caught up by the other request (or holds new edits saved meanwhile).
    const res = await gh(`/git/refs/heads/${DRAFTS}`, { method: 'PATCH', body: JSON.stringify({ sha: liveSha, force: true }) }, [409, 422])
    if (res.status === 409 || res.status === 422) {
      const now = await compareDrafts()
      if (!(now.behind_by === 0 || now.ahead_by > 0)) throw new HttpError(502, 'GitHub was busy updating the drafts. Please try again.')
    }
  }
}

type FileData = { content: string; sha: string }

// Returns the parsed JSON file and its version (sha) from the drafts branch, or from an earlier commit when `ref` is given
export async function readContent(file: string, ref: string = DRAFTS) {
  const { data } = await gh<FileData>(`/contents/${CONTENT_DIR}/${file}?ref=${ref}`)
  return { data: JSON.parse(Buffer.from(data.content, 'base64').toString('utf8')) as unknown, sha: data.sha }
}

// Saves a JSON file to drafts. `sha` is the version the editor started from; if someone saved in between, GitHub refuses (409).
// Commits are made as the token's GitHub account (no separate author), so Vercel always treats them as the owner's —
// needed once the repository is private on Vercel's Hobby plan. The editor's name is kept in the message: "… (by Ravi)".
export const editorOf = (message: string, fallback: string) => message.match(/\(by (.+)\)$/)?.[1] ?? fallback

export async function writeContent(file: string, data: unknown, sha: string, message: string) {
  const body = {
    message,
    branch: DRAFTS,
    sha,
    content: Buffer.from(`${JSON.stringify(data, null, 2)}\n`, 'utf8').toString('base64'),
  }
  const res = await gh<{ content: { sha: string } }>(`/contents/${CONTENT_DIR}/${file}`, { method: 'PUT', body: JSON.stringify(body) }, [409])
  if (res.status === 409) throw new HttpError(409, 'Someone else changed this since you opened it. Reload to see the latest version, then make your change again.')
  return res.data.content.sha
}

// Saves several JSON files to drafts in one commit (e.g. a new product and its category's code counter).
// Fails with 409 if drafts moved on since the editor loaded `files[0]` (someone else saved in between).
export async function writeContents(files: { file: string; data: unknown; sha: string }[], message: string) {
  const head = await branchSha(DRAFTS)
  for (const f of files) {
    const current = await gh<FileData>(`/contents/${CONTENT_DIR}/${f.file}?ref=${head}`)
    if (current.data.sha !== f.sha) throw new HttpError(409, 'Someone else changed this since you opened it. Reload to see the latest version, then make your change again.')
  }
  const { data: base } = await gh<{ tree: { sha: string } }>(`/git/commits/${head}`)
  const { data: tree } = await gh<{ sha: string }>('/git/trees', {
    method: 'POST',
    body: JSON.stringify({
      base_tree: base.tree.sha,
      tree: files.map((f) => ({ path: `${CONTENT_DIR}/${f.file}`, mode: '100644', type: 'blob', content: `${JSON.stringify(f.data, null, 2)}\n` })),
    }),
  })
  const { data: commit } = await gh<{ sha: string }>('/git/commits', { method: 'POST', body: JSON.stringify({ message, tree: tree.sha, parents: [head] }) })
  // Not forced: if another save landed after we read `head`, GitHub refuses and nothing is lost
  const moved = await gh(`/git/refs/heads/${DRAFTS}`, { method: 'PATCH', body: JSON.stringify({ sha: commit.sha, force: false }) }, [422])
  if (moved.status === 422) throw new HttpError(409, 'Someone else saved at the same moment. Reload and make your change again.')
  const { data: saved } = await gh<FileData>(`/contents/${CONTENT_DIR}/${files[0].file}?ref=${commit.sha}`)
  return saved.sha
}

// Publishes every saved draft in one merge commit; returns false when there was nothing to publish
export async function publishDrafts(by: string) {
  const res = await gh<{ sha: string }>(`/merges`, { method: 'POST', body: JSON.stringify({ base: LIVE, head: DRAFTS, commit_message: `${PUBLISH_MESSAGE} (by ${by})` }) }, [409])
  if (res.status === 409) throw new HttpError(409, 'The drafts clash with a recent change to the live site. Please contact your developer.')
  return res.status === 201
}

// Throws away all unpublished edits by pointing drafts back at the live site
export async function discardDrafts() {
  const liveSha = await branchSha(LIVE)
  await gh(`/git/refs/heads/${DRAFTS}`, { method: 'PATCH', body: JSON.stringify({ sha: liveSha, force: true }) })
}
