import { useState } from 'react'
import { getUser, toggleLike, toggleSave } from '../lib/store'
import { compact, mapsUrl, timeAgo } from '../lib/format'
import { CalendarIcon, CommentIcon, HeartIcon, Logo, SaveIcon } from './Icons'
import Media from './Media'
import CommentSheet from './CommentSheet'
import Portal from './Portal'

export default function PostCard({ post }) {
  const [sheet, setSheet] = useState(false)
  const [burst, setBurst] = useState(false)
  const [toast, setToast] = useState('')
  const author = getUser(post.authorId)

  function like() {
    if (!post.likedByMe) { setBurst(true); setTimeout(() => setBurst(false), 340) }
    toggleLike(post.id)
  }

  function save() {
    const nowSaved = toggleSave(post.id)
    setToast(nowSaved ? 'Saved to To Visit' : 'Removed from To Visit')
    setTimeout(() => setToast(''), 1700)
  }

  return (
    <article className="rise border-b border-line pb-4">
      <header className="flex items-center gap-3 px-4 py-3">
        <img src={author.avatar} alt="" className="size-9 rounded-full object-cover" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-tight truncate">{author.name}</p>
          <p className="text-xs text-mist truncate">@{author.handle} · {timeAgo(post.createdAt)}</p>
        </div>
      </header>

      <div className="relative">
        <Media
          media={post.media}
          alt={`${post.place.name}, ${post.place.region}`}
          className="w-full aspect-[4/5] object-cover bg-raised"
        />

        {/* The place is the point of the post, so it rides on the image. */}
        <a
          href={mapsUrl(post.place)} target="_blank" rel="noreferrer"
          className="absolute left-3 bottom-3 flex items-center gap-2 rounded-full bg-black/55 backdrop-blur-md
                     px-3 py-2 text-sm border border-white/10 hover:bg-black/70 transition max-w-[85%]"
        >
          <Logo size={16} />
          <span className="font-medium truncate">{post.place.name}</span>
          <span className="text-mist truncate">· {post.place.region}</span>
        </a>

        {post.saved && (
          <span className="absolute right-3 bottom-3 rounded-full bg-brand text-ink text-xs font-semibold px-2.5 py-1.5">
            On your list
          </span>
        )}
      </div>

      <div className="flex items-center gap-1 px-2 pt-3">
        <button onClick={like} aria-pressed={post.likedByMe}
                aria-label={post.likedByMe ? 'Unlike' : 'Like'}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition
                            ${post.likedByMe ? 'text-rose' : 'text-white/80 hover:text-white'}`}>
          <span className={burst ? 'pop' : ''}><HeartIcon size={23} filled={post.likedByMe} /></span>
          <span className="text-sm tabular-nums">{compact(post.likes)}</span>
        </button>

        <button onClick={() => setSheet(true)} aria-label="Comments"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-white/80 hover:text-white transition">
          <CommentIcon size={23} />
          <span className="text-sm tabular-nums">{post.comments.length}</span>
        </button>

        <button onClick={save} aria-pressed={post.saved}
                aria-label={post.saved ? 'Remove from To Visit' : 'Save to To Visit'}
                className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition text-sm font-medium
                            ${post.saved
                              ? 'bg-brand text-ink border-brand'
                              : 'border-line text-white/85 hover:border-brand hover:text-brand'}`}>
          <SaveIcon size={19} filled={post.saved} />
          {post.saved ? 'Saved' : 'Save'}
        </button>
      </div>

      <div className="px-4 pt-2 space-y-2">
        <p className="text-[15px] leading-snug text-white/90">{post.caption}</p>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {post.bestTime && (
            <span className="inline-flex items-center gap-1.5 text-sun/90 bg-sun/10 rounded-full px-2.5 py-1">
              <CalendarIcon size={13} /> Best {post.bestTime}
            </span>
          )}
          {post.tags.map((t) => (
            <span key={t} className="text-mist">#{t}</span>
          ))}
        </div>
      </div>

      {toast && (
        <Portal>
          <div className="fixed left-1/2 -translate-x-1/2 bottom-24 z-[60] rounded-full bg-white text-ink
                          text-sm font-medium px-4 py-2 shadow-lg pointer-events-none">
            {toast}
          </div>
        </Portal>
      )}

      {sheet && <CommentSheet post={post} onClose={() => setSheet(false)} />}
    </article>
  )
}
