import { useEffect, useState } from 'react'
import { CATEGORIES, findNearby } from '../lib/nearby'

const RADIUS_KM = 8

/**
 * What is around a place. Partner listings are marked and come first; the
 * rest is Google's data so a category is never empty in a town nobody has
 * signed up in yet.
 */
export default function Nearby({ centre, centreName }) {
  const [category, setCategory] = useState(CATEGORIES[0].id)
  const [results, setResults] = useState([])
  const [state, setState] = useState('idle')

  useEffect(() => {
    if (!centre) return
    let live = true
    setState('loading')
    findNearby(category, centre, { radiusKm: RADIUS_KM }).then((hits) => {
      if (!live) return
      setResults(hits)
      setState(hits.length ? 'ready' : 'empty')
    })
    return () => { live = false }
  }, [category, centre?.lat, centre?.lng])

  if (!centre) return null

  const active = CATEGORIES.find((c) => c.id === category)

  return (
    <section>
      <h2 className="text-xs uppercase tracking-[0.14em] text-mist mb-1">Around you</h2>
      <p className="text-[11px] text-mist mb-3">
        Within {RADIUS_KM} km of {centreName || 'here'}
      </p>

      <div className="flex gap-1.5 overflow-x-auto no-bar mb-3">
        {CATEGORIES.map((c) => (
          <button key={c.id} onClick={() => setCategory(c.id)} aria-pressed={category === c.id}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs border transition
                              ${category === c.id
                                ? 'bg-brand text-ink border-brand font-semibold'
                                : 'border-line text-mist hover:text-white'}`}>
            <span aria-hidden="true">{c.icon}</span> {c.label}
          </button>
        ))}
      </div>

      {state === 'loading' && <p className="text-sm text-mist py-3">Looking for {active.label.toLowerCase()}…</p>}
      {state === 'empty' && (
        <p className="text-sm text-mist py-3 leading-relaxed">
          Nothing found near here. Not every road has been mapped — if you know somewhere,
          it belongs on Trekov.
        </p>
      )}

      <ul className="grid grid-cols-2 gap-2">
        {results.map((r) => (
          <li key={r.id}
              className={`flex flex-col rounded-2xl border p-3 ${r.partner ? 'border-brand/50 bg-brand/5' : 'border-line bg-surface'}`}>
            {r.partner && (
              <span className="self-start rounded-full bg-brand text-ink text-[9px] font-bold
                               uppercase tracking-[0.1em] px-1.5 py-0.5 mb-1.5">
                {r.verified ? 'Verified partner' : 'Partner'}
              </span>
            )}
            <p className="text-sm font-semibold leading-tight line-clamp-2">{r.name}</p>
            {r.detail && <p className="text-[11px] text-mist line-clamp-2 mt-0.5">{r.detail}</p>}

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-[11px]">
              {r.rating != null && (
                <span className="text-sun">★ {r.rating.toFixed(1)}
                  {r.reviews ? <span className="text-mist"> ({r.reviews})</span> : null}
                </span>
              )}
              {r.openNow === true && <span className="text-brand">Open</span>}
              {r.openNow === false && <span className="text-mist">Closed</span>}
            </div>

            <div className="flex items-center gap-3 mt-auto pt-2 text-[11px] font-semibold">
              {r.phone && <a href={`tel:${r.phone}`} className="text-brand">Call</a>}
              <a href={`https://www.google.com/maps/search/?api=1&query=${r.lat},${r.lng}`}
                 target="_blank" rel="noreferrer" className="text-brand ml-auto">Map</a>
            </div>
          </li>
        ))}
      </ul>

      {state === 'ready' && !results.some((r) => r.partner) && (
        <p className="text-[11px] text-mist mt-3 leading-relaxed">
          These come from Google. Businesses listed with Trekov appear above them —
          <a href="mailto:punit13690@gmail.com?subject=Listing%20on%20Trekov" className="text-brand"> get listed</a>.
        </p>
      )}
    </section>
  )
}
