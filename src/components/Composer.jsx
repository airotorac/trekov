import { useEffect, useRef, useState } from 'react'
import { createPost } from '../lib/store'
import { CameraIcon, CloseIcon, Logo } from './Icons'
import Portal from './Portal'

const MAX_MB = 40

export default function Composer({ onClose, onPosted }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [form, setForm] = useState({ name: '', region: '', country: 'India', caption: '', tags: '', bestTime: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const input = useRef(null)

  useEffect(() => {
    if (!file) return setPreview('')
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  function pick(e) {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > MAX_MB * 1024 * 1024) return setError(`That file is over ${MAX_MB}MB. Pick a smaller one.`)
    setError('')
    setFile(f)
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const ready = file && form.name.trim() && form.region.trim()

  async function submit(e) {
    e.preventDefault()
    if (!ready || busy) return
    setBusy(true)
    try {
      await createPost({
        file,
        place: { name: form.name.trim(), region: form.region.trim(), country: form.country.trim() || 'Elsewhere' },
        caption: form.caption.trim(),
        tags: form.tags.split(',').map((t) => t.trim().replace(/^#/, '')).filter(Boolean),
        bestTime: form.bestTime.trim(),
      })
      onPosted()
    } catch (err) {
      console.error(err)
      setError('Could not save that post. Try a smaller file.')
      setBusy(false)
    }
  }

  const field = 'w-full bg-raised rounded-xl px-3.5 py-2.5 text-sm outline-none placeholder:text-mist focus:ring-2 focus:ring-brand/50'

  return (
    <Portal>
    <div className="fixed inset-0 z-50 bg-ink flex flex-col">
      <header className="flex items-center justify-between px-4 h-14 border-b border-line shrink-0">
        <button onClick={onClose} className="text-mist hover:text-white" aria-label="Cancel"><CloseIcon size={22} /></button>
        <span className="flex items-center gap-2 font-semibold"><Logo size={18} /> New place</span>
        <button form="composer" type="submit" disabled={!ready || busy}
                className="text-sm font-semibold text-brand disabled:text-mist disabled:opacity-50">
          {busy ? 'Posting…' : 'Post'}
        </button>
      </header>

      <form id="composer" onSubmit={submit} className="flex-1 overflow-y-auto p-4 space-y-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <button type="button" onClick={() => input.current?.click()}
                className="w-full aspect-[4/5] max-h-[46vh] rounded-2xl border border-dashed border-line bg-surface
                           overflow-hidden flex flex-col items-center justify-center gap-3 text-mist hover:border-brand transition">
          {preview ? (
            file.type.startsWith('video')
              ? <video src={preview} className="size-full object-cover" muted autoPlay loop playsInline />
              : <img src={preview} alt="" className="size-full object-cover" />
          ) : (
            <>
              <CameraIcon size={30} />
              <span className="text-sm">Add a photo or video</span>
              <span className="text-xs">Up to {MAX_MB}MB</span>
            </>
          )}
        </button>
        <input ref={input} type="file" accept="image/*,video/*" onChange={pick} className="hidden" />

        {error && <p className="text-sm text-rose">{error}</p>}

        <div className="grid grid-cols-2 gap-3">
          <input className={field} placeholder="Place name *" value={form.name} onChange={set('name')} required />
          <input className={field} placeholder="Region *" value={form.region} onChange={set('region')} required />
        </div>
        <input className={field} placeholder="Country" value={form.country} onChange={set('country')} />
        <textarea className={`${field} min-h-24 resize-none`} placeholder="What should someone know before they go?"
                  value={form.caption} onChange={set('caption')} />
        <div className="grid grid-cols-2 gap-3">
          <input className={field} placeholder="Best time (Nov–Feb)" value={form.bestTime} onChange={set('bestTime')} />
          <input className={field} placeholder="tags, comma, separated" value={form.tags} onChange={set('tags')} />
        </div>
        <p className="text-xs text-mist leading-relaxed">
          Media stays on this device. Nothing is uploaded to a server yet.
        </p>
      </form>
    </div>
    </Portal>
  )
}
