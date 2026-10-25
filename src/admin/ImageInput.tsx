// Image fields: upload to ImageKit (drop or choose a file), preview, replace, remove, and reorder for galleries.
import { useId, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Trash2 } from 'lucide-react'
import { imageUrl } from '../lib/media'
import { uploadImage } from './api'
import { Field } from './ui'

function useUpload(folder: string) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const upload = async (files: FileList | File[]) => {
    setBusy(true)
    setError('')
    const paths: string[] = []
    try {
      for (const f of Array.from(files)) paths.push(await uploadImage(f, folder))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
    return paths
  }
  return { busy, error, upload }
}

function DropZone({ onFiles, busy, multiple, compact }: { onFiles: (f: FileList) => void; busy: boolean; multiple?: boolean; compact?: boolean }) {
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  return (
    <button
      type="button"
      onClick={() => input.current?.click()}
      onDragOver={(e) => (e.preventDefault(), setOver(true))}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files)
      }}
      disabled={busy}
      className={`flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed text-sm text-muted transition hover:border-blue hover:text-blue ${over ? 'border-blue bg-blue/5 text-blue' : 'border-line'} ${compact ? 'aspect-square' : 'py-8'}`}
    >
      {busy ? <Loader2 className="size-6 animate-spin" /> : <ImagePlus className="size-6" />}
      <span className="font-semibold">{busy ? 'Uploading…' : compact ? 'Add' : multiple ? 'Drop images here or click to choose' : 'Drop an image here or click to choose'}</span>
      {!compact && !busy && <span className="text-xs">JPG, PNG, WebP or SVG. Large photos are resized automatically.</span>}
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple={multiple}
        hidden
        onChange={(e) => {
          if (e.target.files?.length) onFiles(e.target.files)
          e.target.value = ''
        }}
      />
    </button>
  )
}

const Preview = ({ path, contain }: { path: string; contain?: boolean }) => (
  <img src={imageUrl(path, 480)} alt="" className={`size-full rounded-lg bg-soft ${contain ? 'object-contain p-2' : 'object-cover'}`} />
)

export function ImageInput({ label, hint, value, onChange, folder, contain }: { label: string; hint?: string; value: string; onChange: (v: string) => void; folder: string; contain?: boolean }) {
  const id = useId()
  const { busy, error, upload } = useUpload(folder)
  const onFiles = async (files: FileList) => {
    const [path] = await upload([files[0]])
    if (path) onChange(path)
  }
  return (
    <Field label={label} hint={hint} error={error} id={id}>
      {value ? (
        <div className="flex items-center gap-4">
          <div className="aspect-[4/3] w-48 shrink-0 overflow-hidden rounded-xl border border-line">
            <Preview path={value} contain={contain} />
          </div>
          <div className="grid gap-2">
            <DropZoneButton label="Replace" busy={busy} onFiles={onFiles} />
            <button type="button" onClick={() => onChange('')} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline">
              <Trash2 className="size-4" /> Remove
            </button>
          </div>
        </div>
      ) : (
        <DropZone onFiles={onFiles} busy={busy} />
      )}
    </Field>
  )
}

function DropZoneButton({ label, busy, onFiles }: { label: string; busy: boolean; onFiles: (f: FileList) => void }) {
  const input = useRef<HTMLInputElement>(null)
  return (
    <>
      <button type="button" disabled={busy} onClick={() => input.current?.click()} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-semibold hover:border-ink/30">
        {busy ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />} {busy ? 'Uploading…' : label}
      </button>
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => (e.target.files?.length && onFiles(e.target.files), (e.target.value = ''))} />
    </>
  )
}

export function ImagesInput({ label, hint, value, onChange, folder, contain }: { label: string; hint?: string; value: string[]; onChange: (v: string[]) => void; folder: string; contain?: boolean }) {
  const id = useId()
  const { busy, error, upload } = useUpload(folder)
  const move = (i: number, by: number) => {
    const next = [...value]
    ;[next[i], next[i + by]] = [next[i + by], next[i]]
    onChange(next)
  }
  return (
    <Field label={label} hint={hint ?? 'The first image is the main one. Use the arrows to change the order.'} error={error} id={id}>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {value.map((path, i) => (
          <li key={`${path}-${i}`} className="group relative aspect-square overflow-hidden rounded-xl border border-line">
            <Preview path={path} contain={contain} />
            {i === 0 && <span className="absolute left-2 top-2 rounded-full bg-ink/80 px-2 py-0.5 text-[10px] font-bold uppercase text-white">Main</span>}
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-ink/70 to-transparent p-2 text-white">
              <span className="flex gap-1">
                <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move earlier" className="rounded bg-white/20 p-1 disabled:opacity-30">
                  <ArrowLeft className="size-4" />
                </button>
                <button type="button" disabled={i === value.length - 1} onClick={() => move(i, 1)} aria-label="Move later" className="rounded bg-white/20 p-1 disabled:opacity-30">
                  <ArrowRight className="size-4" />
                </button>
              </span>
              <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label="Remove image" className="rounded bg-white/20 p-1 hover:bg-brand">
                <Trash2 className="size-4" />
              </button>
            </div>
          </li>
        ))}
        <li>
          <DropZone multiple compact={value.length > 0} busy={busy} onFiles={async (f) => onChange([...value, ...(await upload(f))])} />
        </li>
      </ul>
    </Field>
  )
}
