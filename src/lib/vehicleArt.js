/**
 * Vehicle artwork, as SVG strings.
 *
 * Kept out of the React file so Leaflet's divIcon (which takes HTML) and any
 * plain-JS consumer can use it without pulling in a JSX transform.
 *
 * Top-down vehicle icons with enough shading to read as three-dimensional.
 *
 * Top-down (rather than a 3/4 isometric view) because the same artwork is
 * reused as the moving map marker, where it gets rotated to the direction of
 * travel — a 3/4 view looks wrong the moment it turns.
 *
 * The artwork lives here as strings so Leaflet's divIcon (which takes HTML,
 * not React) and the React selector share one source. Rendering the components
 * with react-dom/server instead pulled 77KB into the client bundle for two
 * icons, which is not a trade worth making.
 *
 * Gradient ids are suffixed per instance so several copies can coexist.
 */

const TINT = { hi: '#8CF3CE', mid: '#00C08B', lo: '#0A6E51' }

const defs = (id, t) => `
  <defs>
    <linearGradient id="body-${id}" x1="12" y1="4" x2="38" y2="46" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${t.hi}"/>
      <stop offset=".45" stop-color="${t.mid}"/>
      <stop offset="1" stop-color="${t.lo}"/>
    </linearGradient>
    <linearGradient id="glass-${id}" x1="18" y1="9" x2="32" y2="22" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#D8F7EC"/>
      <stop offset="1" stop-color="#123B31"/>
    </linearGradient>
    <linearGradient id="shine-${id}" x1="13" y1="6" x2="21" y2="44" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#fff" stop-opacity=".6"/>
      <stop offset=".55" stop-color="#fff" stop-opacity=".07"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="shadow-${id}" cx="24" cy="25" r="21" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#000" stop-opacity=".5"/>
      <stop offset="1" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
  </defs>`

/* Body is inset to x 11–37 so the wheels genuinely protrude at the corners. */
const CAR = (id) => `
  <ellipse cx="24" cy="25" rx="17" ry="21" fill="url(#shadow-${id})"/>
  <g fill="#1E2B27" stroke="#3B4C46" stroke-width=".7">
    <rect x="5.4" y="11" width="7.6" height="10" rx="2.8"/>
    <rect x="35" y="11" width="7.6" height="10" rx="2.8"/>
    <rect x="5.4" y="26.8" width="7.6" height="10" rx="2.8"/>
    <rect x="35" y="26.8" width="7.6" height="10" rx="2.8"/>
  </g>
  <path d="M24 3.5c5.2 0 8.6 2.9 9.6 7.8l.9 4.6c.6 3.2.9 6.5.9 9.8s-.3 6.6-.9 9.8l-.6 3c-.6 3-3 4.9-9.9 4.9s-9.3-1.9-9.9-4.9l-.6-3c-.6-3.2-.9-6.5-.9-9.8s.3-6.6.9-9.8l.9-4.6C15.4 6.4 18.8 3.5 24 3.5Z"
        fill="url(#body-${id})"/>
  <path d="M17.6 14.6c1-1.5 3.2-2.3 6.4-2.3s5.4.8 6.4 2.3l1.2 1.9c.4.7-.1 1.5-.9 1.4a56 56 0 0 0-13.4 0c-.8.1-1.3-.7-.9-1.4Z"
        fill="url(#glass-${id})"/>
  <path d="M18 33.9c-.5-.7 0-1.5.9-1.4a54 54 0 0 0 10.2 0c.9-.1 1.4.7.9 1.4l-.9 1.4c-.8 1.1-2.6 1.7-5.1 1.7s-4.3-.6-5.1-1.7Z"
        fill="url(#glass-${id})" opacity=".8"/>
  <rect x="18.6" y="20" width="10.8" height="10" rx="3.2" fill="#fff" opacity=".13"/>
  <path d="M24 3.5c-5.2 0-8.6 2.9-9.6 7.8l-.9 4.6c-.6 3.2-.9 6.5-.9 9.8s.3 6.6.9 9.8l.6 3c.2 1 .6 1.8 1.4 2.4-2-.9-2.7-2.3-3-3.8l-.6-3c-.6-3.2-.9-6.5-.9-9.8s.3-6.6.9-9.8l.9-4.6C12.8 6.4 17.6 3.5 24 3.5Z"
        fill="url(#shine-${id})"/>
  <g fill="#FFF6D4"><rect x="15.6" y="5.6" width="4.2" height="2.3" rx="1.15"/><rect x="28.2" y="5.6" width="4.2" height="2.3" rx="1.15"/></g>
  <g fill="#FF5C7A"><rect x="16.2" y="39.6" width="4.2" height="2" rx="1"/><rect x="27.6" y="39.6" width="4.2" height="2" rx="1"/></g>`

/* A bike is narrow: the tank is ~10px wide and the handlebars sit on top of
   it, which is what actually makes the silhouette legible from above. */
const BIKE = (id) => `
  <ellipse cx="24" cy="26" rx="11" ry="17" fill="url(#shadow-${id})"/>
  <rect x="21" y="3" width="6" height="12.5" rx="3" fill="#1E2B27" stroke="#3B4C46" stroke-width=".7"/>
  <rect x="19.9" y="30" width="8.2" height="13.5" rx="4" fill="#1E2B27" stroke="#3B4C46" stroke-width=".7"/>
  <path d="M24 9.5c2.9 0 4.8 1.9 5.3 5.2l.9 5.7c.5 3.1.2 5.9-1 8.4l-1.2 2.6c-.7 1.5-2 2.3-4 2.3s-3.3-.8-4-2.3l-1.2-2.6c-1.2-2.5-1.5-5.3-1-8.4l.9-5.7c.5-3.3 2.4-5.2 5.3-5.2Z"
        fill="url(#body-${id})"/>
  <path d="M24 9.5c-2.9 0-4.8 1.9-5.3 5.2l-.9 5.7c-.5 3.1-.2 5.9 1 8.4l1.2 2.6c.3.6.7 1.1 1.2 1.4-1.6-.3-2.6-1-3.1-2l-1.2-2.6c-1.2-2.5-1.5-5.3-1-8.4l.9-5.7c.5-3.3 3.3-5.2 7.2-5.2Z"
        fill="url(#shine-${id})"/>
  <rect x="20.4" y="24.5" width="7.2" height="8.5" rx="3" fill="#0B120F" opacity=".7"/>
  <g>
    <rect x="8.5" y="14.6" width="31" height="3.2" rx="1.6" fill="#1B2825"/>
    <rect x="8.5" y="14.6" width="31" height="1.4" rx=".7" fill="#fff" opacity=".18"/>
    <circle cx="10.4" cy="16.2" r="2.9" fill="#0B120F"/>
    <circle cx="37.6" cy="16.2" r="2.9" fill="#0B120F"/>
  </g>
  <path d="M21.2 11.6c.6-1 1.6-1.5 2.8-1.5s2.2.5 2.8 1.5l.5 1c.3.6-.1 1.2-.8 1.1a30 30 0 0 0-5 0c-.7.1-1.1-.5-.8-1.1Z"
        fill="url(#glass-${id})"/>
  <rect x="21.6" y="5.2" width="4.8" height="2.4" rx="1.2" fill="#FFF6D4"/>
  <rect x="21.9" y="40.2" width="4.2" height="2" rx="1" fill="#FF5C7A"/>`

const svg = (art) => (id, size, t = TINT) =>
  `<svg viewBox="0 0 48 48" width="${size}" height="${size}" aria-hidden="true">${defs(id, t)}${art(id, t)}</svg>`

export const carSvg = svg(CAR)
export const bikeSvg = svg(BIKE)


export const VEHICLE_SVG = {
  car: carSvg('mk-car', 40),
  bike: bikeSvg('mk-bike', 40),
}
