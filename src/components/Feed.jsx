import { selectFeed, useStore } from '../lib/store'
import { Wordmark } from './Icons'
import PostCard from './PostCard'

export default function Feed() {
  const posts = useStore(selectFeed)

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 h-14
                         bg-ink/85 backdrop-blur-xl border-b border-line">
        <Wordmark size={21} />
        <span className="text-xs text-mist">Places worth going</span>
      </header>
      <div>
        {posts.map((p) => <PostCard key={p.id} post={p} />)}
        <p className="text-center text-xs text-mist py-10">You're all caught up.</p>
      </div>
    </>
  )
}
