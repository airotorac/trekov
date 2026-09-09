import { useState } from 'react'
import { selectSearch, selectTags, useStore } from '../lib/store'
import { compact } from '../lib/format'
import { SaveIcon, SearchIcon } from './Icons'
import Media from './Media'
import PostCard from './PostCard'

export default function Explore() {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(null)
  const results = useStore((s) => selectSearch(s, q))
  const tags = useStore(selectTags)

  if (open) {
    const post = results.find((p) => p.id === open)
    if (post) {
      return (
        <>
          <header className="sticky top-0 z-30 flex items-center gap-3 px-4 h-14 bg-ink/85 backdrop-blur-xl border-b border-line">
            <button onClick={() => setOpen(null)} className="text-sm text-brand font-medium">← Explore</button>
          </header>
          <PostCard post={post} />
        </>
      )
    }
  }

  return (
    <>
      <header className="sticky top-0 z-30 px-4 py-3 bg-ink/85 backdrop-blur-xl border-b border-line">
        <div className="flex items-center gap-2 bg-raised rounded-full px-4 py-2.5">
          <SearchIcon size={19} className="text-mist shrink-0" />
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search places, regions, tags…"
            className="bg-transparent flex-1 text-sm outline-none placeholder:text-mist min-w-0"
          />
          {q && <button onClick={() => setQ('')} className="text-xs text-mist shrink-0">Clear</button>}
        </div>
        <div className="flex gap-2 overflow-x-auto no-bar mt-3 -mx-4 px-4">
          {tags.map((t) => (
            <button key={t} onClick={() => setQ(q === t ? '' : t)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs border transition
                          ${q === t ? 'bg-brand text-ink border-brand font-semibold' : 'border-line text-mist hover:text-white'}`}>
              #{t}
            </button>
          ))}
        </div>
      </header>

      {results.length === 0 ? (
        <p className="text-center text-mist text-sm py-20">No places match “{q}”.</p>
      ) : (
        <div className="grid grid-cols-3 gap-0.5 p-0.5">
          {results.map((p) => (
            <button key={p.id} onClick={() => setOpen(p.id)} className="relative aspect-square group">
              <Media media={p.media} alt={p.place.name} className="size-full object-cover" />
              <span className="absolute inset-x-0 bottom-0 p-1.5 text-[10px] font-medium text-left leading-tight
                               bg-gradient-to-t from-black/80 to-transparent pt-6 truncate block">
                {p.place.name}
              </span>
              {p.saved && (
                <span className="absolute top-1.5 right-1.5 text-brand"><SaveIcon size={15} filled /></span>
              )}
            </button>
          ))}
        </div>
      )}
      <p className="text-center text-xs text-mist py-8">{results.length} places</p>
    </>
  )
}
