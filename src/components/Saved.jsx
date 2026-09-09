import { selectSavedPlaces, toggleSavePlace, useStore } from '../lib/store'
import { CalendarIcon, CloseIcon, Logo, NavIcon } from './Icons'
import Media from './Media'

/** The to-visit list — places, not posts. */
export default function Saved({ onExplore, onOpenPlace, onNavigate }) {
  const saved = useStore(selectSavedPlaces)

  const byCountry = saved.reduce((acc, p) => {
    ;(acc[p.country || 'Elsewhere'] ||= []).push(p)
    return acc
  }, {})

  return (
    <>
      <header className="sticky top-0 z-30 flex items-baseline justify-between px-4 h-14
                         bg-ink/85 backdrop-blur-xl border-b border-line">
        <h1 className="text-lg font-semibold">To Visit</h1>
        <span className="text-xs text-mist">{saved.length} {saved.length === 1 ? 'place' : 'places'}</span>
      </header>

      {saved.length === 0 ? (
        <div className="flex flex-col items-center text-center gap-4 px-10 py-24">
          <Logo size={54} />
          <h2 className="text-lg font-semibold">Your list is empty</h2>
          <p className="text-sm text-mist leading-relaxed">
            Zoom the map into somewhere, open a place and tap
            <span className="text-brand font-medium"> Save place</span>. It lands here,
            ready for the next time you're actually planning a trip.
          </p>
          <button onClick={onExplore} className="mt-2 rounded-full bg-brand text-ink font-semibold text-sm px-5 py-2.5">
            Open the map
          </button>
        </div>
      ) : (
        <div className="p-4 space-y-7">
          {Object.entries(byCountry).map(([country, list]) => (
            <section key={country}>
              <h2 className="text-xs uppercase tracking-[0.14em] text-mist mb-3">{country}</h2>
              <ul className="space-y-3">
                {list.map((p) => (
                  <li key={p.id} className="rise flex gap-3 bg-surface border border-line rounded-2xl p-3">
                    <button onClick={() => onOpenPlace(p.id)} className="shrink-0">
                      {p.cover
                        ? <Media media={p.cover} alt={p.name} className="size-20 rounded-xl object-cover" />
                        : <span className="grid place-items-center size-20 rounded-xl bg-raised"><Logo size={22} /></span>}
                    </button>
                    <button onClick={() => onOpenPlace(p.id)} className="min-w-0 flex-1 text-left">
                      <p className="font-semibold leading-tight truncate">{p.name}</p>
                      <p className="text-xs text-mist truncate">{p.region}</p>
                      {p.bestTime && (
                        <p className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] text-sun/90 bg-sun/10 rounded-full px-2 py-0.5">
                          <CalendarIcon size={12} /> {p.bestTime}
                        </p>
                      )}
                      <p className="text-[11px] text-mist mt-1.5">{p.postCount} photo{p.postCount === 1 ? '' : 's'}</p>
                    </button>
                    <div className="flex flex-col items-end justify-between shrink-0 gap-2">
                      <button onClick={() => toggleSavePlace(p.id)} className="text-mist hover:text-rose p-1"
                              aria-label={`Remove ${p.name}`}>
                        <CloseIcon size={17} />
                      </button>
                      <button onClick={() => onNavigate?.(p.id)}
                              className="flex items-center gap-1.5 rounded-full bg-brand text-ink text-xs font-semibold px-3 py-1.5"
                              aria-label={`Navigate to ${p.name}`}>
                        <NavIcon size={13} filled /> Go
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  )
}
