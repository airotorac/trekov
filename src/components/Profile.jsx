import { deletePost, resetAll, selectMine, selectSaved, useStore } from '../lib/store'
import { TrashIcon, Wordmark } from './Icons'
import Media from './Media'

export default function Profile({ onPost }) {
  const profile = useStore((s) => s.profile)
  const mine = useStore(selectMine)
  const saved = useStore(selectSaved)
  const totalLikes = mine.reduce((n, p) => n + p.likes, 0)

  const stats = [
    ['Posts', mine.length],
    ['Saved', saved.length],
    ['Likes', totalLikes],
  ]

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 h-14
                         bg-ink/85 backdrop-blur-xl border-b border-line">
        <h1 className="text-lg font-semibold">@{profile.handle}</h1>
        <Wordmark size={16} />
      </header>

      <div className="p-5 flex items-center gap-4">
        <img src={profile.avatar} alt="" className="size-20 rounded-full object-cover ring-2 ring-brand/40" />
        <div className="min-w-0">
          <p className="text-lg font-semibold leading-tight">{profile.name}</p>
          <p className="text-sm text-mist leading-snug mt-0.5">{profile.bio}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 mx-5 rounded-2xl border border-line bg-surface divide-x divide-line">
        {stats.map(([label, value]) => (
          <div key={label} className="py-3 text-center">
            <p className="text-lg font-semibold tabular-nums">{value}</p>
            <p className="text-[11px] uppercase tracking-[0.12em] text-mist">{label}</p>
          </div>
        ))}
      </div>

      <h2 className="px-5 pt-7 pb-3 text-xs uppercase tracking-[0.14em] text-mist">Your posts</h2>

      {mine.length === 0 ? (
        <div className="text-center px-10 py-10">
          <p className="text-sm text-mist leading-relaxed">
            Nothing posted yet. Put up a place you've actually been — that's what makes someone else's list.
          </p>
          <button onClick={onPost} className="mt-4 rounded-full bg-brand text-ink font-semibold text-sm px-5 py-2.5">
            Post a place
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-0.5 px-0.5">
          {mine.map((p) => (
            <div key={p.id} className="relative aspect-square group">
              <Media media={p.media} alt={p.place.name} className="size-full object-cover" />
              <span className="absolute inset-x-0 bottom-0 p-1.5 text-[10px] font-medium leading-tight
                               bg-gradient-to-t from-black/80 to-transparent pt-6 truncate block">
                {p.place.name}
              </span>
              <button onClick={() => deletePost(p.id)} aria-label={`Delete ${p.place.name}`}
                      className="absolute top-1.5 right-1.5 rounded-full bg-black/60 p-1.5 text-white/80 hover:text-rose">
                <TrashIcon size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="px-5 py-10">
        <button onClick={() => confirm('Reset Trekov to demo content? Your posts and saved list will be cleared.') && resetAll()}
                className="text-xs text-mist underline underline-offset-4 hover:text-rose">
          Reset demo data
        </button>
      </div>
    </>
  )
}
