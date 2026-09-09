// Loads the Google Maps JavaScript API once, on demand.
//
// Resolves with `google.maps`; rejects when there is no key, no network, the
// key is refused, or the script fails to arrive. Callers fall back to Leaflet
// on rejection — Google Maps cannot run offline at all, so that fallback is
// what keeps navigation working with the radio off.

const KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY
const TIMEOUT_MS = 10_000

let pending = null
let refused = false

export const hasGoogleKey = () => Boolean(KEY)

export function loadGoogleMaps() {
  if (window.google?.maps?.Map) return Promise.resolve(window.google.maps)
  if (refused) return Promise.reject(new Error('Google Maps key was refused'))
  if (!KEY) return Promise.reject(new Error('No VITE_GOOGLE_MAPS_KEY'))
  if (!navigator.onLine) return Promise.reject(new Error('Offline'))
  if (pending) return pending

  pending = new Promise((resolve, reject) => {
    const fail = (why) => { refused = why === 'auth'; pending = null; reject(new Error(why)) }
    const timer = setTimeout(() => fail('timeout'), TIMEOUT_MS)

    // Google calls this on an invalid/over-quota key after the script loads.
    window.gm_authFailure = () => { clearTimeout(timer); fail('auth') }
    window.__tkGmapsReady = () => { clearTimeout(timer); resolve(window.google.maps) }

    const s = document.createElement('script')
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(KEY)}` +
            `&callback=__tkGmapsReady&v=weekly&loading=async&libraries=geometry`
    s.async = true
    s.onerror = () => { clearTimeout(timer); fail('script') }
    document.head.appendChild(s)
  })
  return pending
}
