import { useState } from 'react'
import { addComment, getUser, meId } from '../lib/store'
import { timeAgo } from '../lib/format'
import { CloseIcon, SendIcon } from './Icons'
import Portal from './Portal'

export default function CommentSheet({ post, onClose }) {
  const [text, setText] = useState('')

  function submit(e) {
    e.preventDefault()
    addComment(post.id, text)
    setText('')
  }

  return (
    <Portal>
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-label="Comments">
      <button className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-label="Close comments" />
      <div className="sheet-up relative w-full max-w-[520px] max-h-[78vh] flex flex-col rounded-t-3xl border-t border-line bg-surface">
        <header className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h2 className="font-semibold">
            Comments <span className="text-mist font-normal">· {post.comments.length}</span>
          </h2>
          <button onClick={onClose} className="text-mist hover:text-white" aria-label="Close">
            <CloseIcon size={22} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {post.comments.length === 0 && (
            <p className="text-mist text-sm py-8 text-center">No comments yet. Ask them something about the place.</p>
          )}
          {post.comments.map((c) => {
            const u = getUser(c.userId)
            return (
              <div key={c.id} className="flex gap-3">
                <img src={u.avatar} alt="" className="size-9 rounded-full object-cover shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm">
                    <span className="font-semibold">{u.handle}</span>{' '}
                    <span className="text-mist text-xs">{timeAgo(c.createdAt)}</span>
                  </p>
                  <p className="text-sm text-white/90 break-words">{c.text}</p>
                </div>
              </div>
            )
          })}
        </div>

        <form onSubmit={submit} className="flex items-center gap-3 p-4 border-t border-line pb-[max(1rem,env(safe-area-inset-bottom))]">
          <img src={getUser(meId).avatar} alt="" className="size-9 rounded-full object-cover" />
          <input
            value={text} onChange={(e) => setText(e.target.value)}
            placeholder="Add a comment…"
            className="flex-1 bg-raised rounded-full px-4 py-2.5 text-sm outline-none placeholder:text-mist focus:ring-2 focus:ring-brand/50"
          />
          <button type="submit" disabled={!text.trim()}
                  className="text-brand disabled:text-mist disabled:opacity-50 p-1" aria-label="Post comment">
            <SendIcon size={22} />
          </button>
        </form>
      </div>
    </div>
    </Portal>
  )
}
