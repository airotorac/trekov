# Trekov

**trekov.in · trekov.com**

A place-first travel feed. People post the places they've actually been; everyone
else saves them to a **To Visit** list. Like Instagram, except the unit of value is
the *place*, not the post.

## What works today

| Screen | Behaviour |
|---|---|
| **Feed** | Chronological posts — photo/video, author, place chip linking to Google Maps, best-time-to-go, tags |
| **Explore** | Full-text search across place, region, country, caption and tags; tag chips; 3-up grid; tap through to the post |
| **To Visit** | The saved list, grouped by country, with best-season chips, who recommended it, and a map link |
| **Post** | Upload a photo or video, name the place and region, add caption, season and tags |
| **You** | Your posts, counts for posts / saved / likes, delete a post, reset demo data |
| Everywhere | Like, comment, save — all persisted across reloads |

Saved places, likes and comments live in `localStorage`; uploaded media lives in
IndexedDB (too large for `localStorage`). Nothing leaves the device yet.

## Run it

```bash
npm install
npm run dev
```

## Deploy

`.github/workflows/deploy.yml` builds and publishes to GitHub Pages on every push
to `main`, so deploying stays "git push". `public/CNAME` pins the custom domain
to `trekov.in`.

DNS at your registrar — the same four A records plus a CNAME used for vayuveer.in:

```
A     @     185.199.108.153
A     @     185.199.109.153
A     @     185.199.110.153
A     @     185.199.111.153
CNAME www   <your-github-username>.github.io
```

Point `trekov.com` at the same place with a registrar-level forward to `trekov.in`
(or add it as a second custom domain later).

## Architecture

```
src/
  lib/store.js    all reads + writes, memoised selectors, useSyncExternalStore
  lib/media.js    IndexedDB blob storage for uploads
  lib/seed.js     demo content
  components/     one file per screen + PostCard, CommentSheet, Composer, TabBar
```

`store.js` is the only module that touches storage. Swapping in a real backend
(Supabase is the natural fit — Postgres + auth + object storage) means rewriting
that one file; no component changes.

## Before this is real

- **Replace the demo imagery.** `seed.js` pulls neutral placeholder photos that do
  *not* depict the places named. Substitute your own aerial stills.
- **Backend.** Auth, a `posts` / `likes` / `saves` / `comments` schema, and object
  storage for media.
- **Video.** Uploads work, but there's no transcoding or thumbnailing.
- **Moderation and reporting** before any public launch.

## Brand

`brand/` holds the mark: a map pin whose negative space is a two-peak range —
the save and the trek in one shape.

- `mark.svg` — gradient, primary
- `mark-mono.svg` — single colour, inherits `currentColor`
- `app-icon.svg` — 512×512 rounded-square for the app stores
- `preview.html` — open in a browser to see every size and lockup

Brand green `#00C08B` (light `#3DDC97`, deep `#0E9F6E`), ink `#0B0F0E`,
accent sun `#FFB33E`. Wordmark is Outfit 600, tracking `-0.035em`, lowercase.
