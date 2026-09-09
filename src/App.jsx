import { useEffect, useState } from 'react'
import { selectSaved, useStore } from './lib/store'
import Composer from './components/Composer'
import Explore from './components/Explore'
import Feed from './components/Feed'
import Profile from './components/Profile'
import Saved from './components/Saved'
import TabBar from './components/TabBar'

const TABS = ['feed', 'explore', 'saved', 'profile']
const readHash = () => {
  const h = window.location.hash.replace('#', '')
  return TABS.includes(h) ? h : 'feed'
}

export default function App() {
  const [tab, setTab] = useState(readHash)
  const [composing, setComposing] = useState(false)
  const savedCount = useStore(selectSaved).length

  // Hash routing keeps the back button working and survives a refresh,
  // and works unchanged on GitHub Pages with no server rewrite rules.
  useEffect(() => {
    const sync = () => setTab(readHash())
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  function go(next) {
    if (next === 'post') return setComposing(true)
    window.location.hash = next
    setTab(next)
    document.getElementById('scroll')?.scrollTo({ top: 0 })
  }

  const screens = {
    feed: <Feed />,
    explore: <Explore />,
    saved: <Saved onExplore={() => go('explore')} />,
    profile: <Profile onPost={() => setComposing(true)} />,
  }

  return (
    <div className="min-h-full flex justify-center bg-black">
      <div className="relative w-full max-w-[520px] min-h-screen flex flex-col bg-ink
                      sm:border-x sm:border-line">
        <main id="scroll" className="flex-1 overflow-y-auto">{screens[tab]}</main>
        <TabBar tab={tab} onChange={go} savedCount={savedCount} />
      </div>

      {composing && (
        <Composer
          onClose={() => setComposing(false)}
          onPosted={() => { setComposing(false); go('profile') }}
        />
      )}
    </div>
  )
}
