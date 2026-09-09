# Trekov

**trekov.in · trekov.com**

A map of places worth going. Zoom into anywhere, see what people actually shot
there, save the place to your To Visit list, and build a trip you can send to
whoever is coming with you.

The map is the feed. Photos live at the coordinates they were taken, not in a
chronological timeline.

## Two pages, one build

| Path | What it is |
|---|---|
| `/` | Marketing site (`index.html`, hand-written CSS, no framework) |
| `/app/` | The app (`app/index.html` → React + Leaflet) |

## What works today

| Screen | Behaviour |
|---|---|
| **Map** | Satellite map with a marker per place, thumbnail and photo count. Markers cluster at low zoom and split as you zoom in. Search flies to a place. |
| **Place sheet** | Tap a marker: blurb, best season, photo count, Maps link, Recent / Most-liked photo grid, Save place, Add to trip |
| **Photo** | Full view with author, caption, tags, like and comments |
| **Trips** | Create a trip, add stops from the map, reorder them, per-stop notes, dates, trip notes, delete |
| **Share** | A trip encodes into a link. Opening it shows the itinerary and offers to save it — no backend, no account |
| **To Visit** | Saved places grouped by country, with season and Maps link |
| **Post** | Upload a photo or video against an existing place, or a new one you pin on a map |
| **You** | Your photos, counts, delete, reset demo data |

Records live in `localStorage`; uploaded media lives in IndexedDB (too large for
`localStorage`). Nothing leaves the device.

## Run it

```bash
npm install
npm run dev
```

## Deploy

`.github/workflows/deploy.yml` builds and publishes to GitHub Pages on every push
to `main`. `public/CNAME` pins the custom domain to `trekov.in`.

DNS at your registrar — the same records used for vayuveer.in:

```
A     @     185.199.108.153
A     @     185.199.109.153
A     @     185.199.110.153
A     @     185.199.111.153
CNAME www   <your-github-username>.github.io
```

Point `trekov.com` at the same place with a registrar-level forward to `trekov.in`.

## Architecture

```
index.html        marketing site
app/index.html    app entry
src/
  lib/store.js    all reads + writes, memoised selectors, useSyncExternalStore
  lib/media.js    IndexedDB blob storage for uploads
  lib/share.js    trip <-> link encoding
  lib/seed.js     demo places, posts and users
  components/     MapView, PlaceSheet, PhotoViewer, Trips, TripDetail,
                  SharedTrip, Saved, Profile, Composer, PinMap, TabBar
```

**A place is the primary record**; posts hang off it, and both the saved list and
a trip's stops are just ordered lists of place ids. `store.js` is the only module
that touches storage, so a real backend (Supabase fits: Postgres + auth + object
storage) replaces that one file without touching a component.

Two implementation notes worth keeping:

- Selectors are memoised against state identity. They build new arrays, and
  `useSyncExternalStore` compares snapshots by identity — unmemoised, the app
  re-renders forever.
- Overlays render through `Portal`. The card entrance animation leaves a
  `transform` behind, which makes that element the containing block for
  `position: fixed` children and pins sheets to the card instead of the viewport.

## Maps

Tiles come from Esri's keyless services — World Imagery for the satellite base,
World Boundaries and Places for labels. Attribution is required and is rendered
on the map. CARTO's dark basemap was tried first and watermarks "API KEY
REQUIRED" without a key.

## Before this is real

- **Replace the demo imagery.** `seed.js` pulls neutral placeholder photos that do
  *not* depict the places named. Substitute your own aerial stills.
- **Backend.** Auth, a `places` / `posts` / `saves` / `trips` schema, object storage.
- **Share links are unsigned and public.** Anyone with the URL sees the itinerary.
- **Video** uploads work, but there's no transcoding or thumbnailing.
- **Moderation and reporting** before any public launch.
- **Wire up the early-access form.** `index.html` has a `FORM_ENDPOINT` constant;
  until it's set the form hands off to the visitor's mail client.

## Brand

`brand/` holds the mark: a map pin whose negative space is a two-peak range —
the save and the trek in one shape.

- `mark.svg` — gradient, primary
- `mark-mono.svg` — single colour, inherits `currentColor`
- `app-icon.svg` — 512×512 rounded-square for the app stores
- `preview.html` — open in a browser to see every size and lockup

Brand green `#00C08B` (light `#3DDC97`, deep `#0E9F6E`), ink `#0B0F0E`,
accent sun `#FFB33E`. Wordmark is Outfit 600, tracking `-0.035em`, lowercase.
