import { getUser, selectSaved, toggleSave, useStore } from '../lib/store'
import { mapsUrl } from '../lib/format'
import { CalendarIcon, CloseIcon, Logo } from './Icons'
import Media from './Media'

/** The to-visit list — the reason the app exists. */
export default function Saved({ onExplore }) {
  const saved = useStore(selectSaved)

  const byRegion = saved.reduce((acc, p) => {
    const key = p.place.country || 'Elsewhere'
    ;(acc[key] ||= []).push(p)
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
            Tap <span className="text-brand font-medium">Save</span> on any post and the place lands here,
            ready for the next time you're actually planning a trip.
          </p>
          <button onClick={onExplore}
                  className="mt-2 rounded-full bg-brand text-ink font-semibold text-sm px-5 py-2.5">
            Find places
          </button>
        </div>
      ) : (
        <div className="p-4 space-y-7">
          {Object.entries(byRegion).map(([country, list]) => (
            <section key={country}>
              <h2 className="text-xs uppercase tracking-[0.14em] text-mist mb-3">{country}</h2>
              <ul className="space-y-3">
                {list.map((p) => (
                  <li key={p.id} className="rise flex gap-3 bg-surface border border-line rounded-2xl p-3">
                    <Media media={p.media} alt={p.place.name} className="size-20 rounded-xl object-cover shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold leading-tight truncate">{p.place.name}</p>
                      <p className="text-xs text-mist truncate">{p.place.region}</p>
                      {p.bestTime && (
                        <p className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] text-sun/90 bg-sun/10 rounded-full px-2 py-0.5">
                          <CalendarIcon size={12} /> {p.bestTime}
                        </p>
                      )}
                      <p className="text-[11px] text-mist mt-1.5 truncate">
                        via @{getUser(p.authorId).handle}
                      </p>
                    </div>
                    <div className="flex flex-col items-end justify-between shrink-0">
                      <button onClick={() => toggleSave(p.id)} className="text-mist hover:text-rose p-1"
                              aria-label={`Remove ${p.place.name}`}>
                        <CloseIcon size={17} />
                      </button>
                      <a href={mapsUrl(p.place)} target="_blank" rel="noreferrer"
                         className="text-xs text-brand font-medium">Map</a>
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
