import { HomeIcon, PlusIcon, SaveIcon, SearchIcon, UserIcon } from './Icons'

const TABS = [
  { id: 'feed',    label: 'Feed',    Icon: HomeIcon },
  { id: 'explore', label: 'Explore', Icon: SearchIcon },
  { id: 'post',    label: 'Post',    Icon: PlusIcon, primary: true },
  { id: 'saved',   label: 'To Visit', Icon: SaveIcon },
  { id: 'profile', label: 'You',     Icon: UserIcon },
]

export default function TabBar({ tab, onChange, savedCount }) {
  return (
    <nav className="sticky bottom-0 z-30 flex items-stretch border-t border-line bg-ink/90 backdrop-blur-xl
                    pb-[env(safe-area-inset-bottom)]">
      {TABS.map(({ id, label, Icon, primary }) => {
        const active = tab === id
        if (primary) {
          return (
            <button key={id} onClick={() => onChange(id)} aria-label="Post a place"
                    className="flex-1 flex items-center justify-center py-2">
              <span className="grid place-items-center size-11 rounded-2xl bg-brand text-ink shadow-lg shadow-brand/20
                               active:scale-95 transition">
                <Icon size={24} />
              </span>
            </button>
          )
        }
        return (
          <button key={id} onClick={() => onChange(id)} aria-current={active ? 'page' : undefined}
                  className={`relative flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] transition
                              ${active ? 'text-brand' : 'text-mist hover:text-white'}`}>
            <span className="relative">
              <Icon size={23} filled={active && id === 'saved'} />
              {id === 'saved' && savedCount > 0 && (
                <span className="absolute -top-1 -right-2 min-w-4 h-4 px-1 rounded-full bg-brand text-ink
                                 text-[9px] font-bold grid place-items-center tabular-nums">
                  {savedCount}
                </span>
              )}
            </span>
            {label}
          </button>
        )
      })}
    </nav>
  )
}
