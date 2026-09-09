// Demo content. Replace with a real API when the backend lands — see store.js.
// Placeholder imagery only — swap these for real photos (or your own aerial
// stills) before this goes anywhere near a user.
const photo = (slug) => `https://picsum.photos/seed/trekov-${slug}/900/1200`
const face = (who) => `https://i.pravatar.cc/200?u=trekov-${who}`

export const USERS = {
  u_me:    { id: 'u_me',    name: 'You',            handle: 'you',           avatar: face('me') },
  u_aria:  { id: 'u_aria',  name: 'Aria Nandan',    handle: 'ariaflies',     avatar: face('1') },
  u_kabir: { id: 'u_kabir', name: 'Kabir Sethi',    handle: 'kabirshoots',   avatar: face('2') },
  u_mei:   { id: 'u_mei',   name: 'Mei Lin',        handle: 'meiwanders',    avatar: face('3') },
  u_tara:  { id: 'u_tara',  name: 'Tara Fernandes', handle: 'tarafromabove', avatar: face('4') },
  u_dev:   { id: 'u_dev',   name: 'Dev Rathore',    handle: 'devonfoot',     avatar: face('5') },
}

export const POSTS = [
  {
    id: 'p1', authorId: 'u_aria', createdAt: '2026-09-05T09:12:00Z',
    media: { type: 'image', src: photo('himalaya-lake') },
    place: { name: 'Pangong Tso', region: 'Ladakh', country: 'India', lat: 33.75, lng: 78.65 },
    caption: 'Held the drone up for four minutes before my fingers gave out. Worth every second of the cold.',
    tags: ['lake', 'himalaya', 'aerial'], bestTime: 'Jun–Sep',
    likes: 2841, comments: [
      { id: 'c1', userId: 'u_dev',  text: 'The colour shift around 4pm here is unreal.', createdAt: '2026-09-05T11:02:00Z' },
      { id: 'c2', userId: 'u_mei',  text: 'How bad was the altitude on day one?',        createdAt: '2026-09-05T12:40:00Z' },
    ],
  },
  {
    id: 'p2', authorId: 'u_kabir', createdAt: '2026-09-04T16:30:00Z',
    media: { type: 'image', src: photo('kashmir-valley') },
    place: { name: 'Gurez Valley', region: 'Kashmir', country: 'India', lat: 34.63, lng: 74.83 },
    caption: 'Almost nobody comes here. Two guesthouses, one road in, and the Kishanganga running through all of it.',
    tags: ['valley', 'offbeat', 'river'], bestTime: 'May–Oct',
    likes: 1203, comments: [
      { id: 'c3', userId: 'u_aria', text: 'Adding this immediately.', createdAt: '2026-09-04T18:15:00Z' },
    ],
  },
  {
    id: 'p3', authorId: 'u_tara', createdAt: '2026-09-04T07:05:00Z',
    media: { type: 'image', src: photo('desert-saltflat') },
    place: { name: 'Rann of Kutch', region: 'Gujarat', country: 'India', lat: 23.85, lng: 69.86 },
    caption: 'White salt to the horizon in every direction. There is no scale reference anywhere — the drone shots look fake.',
    tags: ['desert', 'salt-flat', 'sunset'], bestTime: 'Nov–Feb',
    likes: 3492, comments: [],
  },
  {
    id: 'p4', authorId: 'u_mei', createdAt: '2026-09-03T13:48:00Z',
    media: { type: 'image', src: photo('tea-plantation') },
    place: { name: 'Munnar Tea Hills', region: 'Kerala', country: 'India', lat: 10.09, lng: 77.06 },
    caption: 'The rows read like contour lines from 300 feet. Go on a weekday, the roads are a car park otherwise.',
    tags: ['hills', 'green', 'aerial'], bestTime: 'Sep–Mar',
    likes: 1876, comments: [
      { id: 'c4', userId: 'u_kabir', text: 'Best light is right after the morning mist lifts, ~7:30.', createdAt: '2026-09-03T15:00:00Z' },
    ],
  },
  {
    id: 'p5', authorId: 'u_dev', createdAt: '2026-09-02T19:20:00Z',
    media: { type: 'image', src: photo('monastery-himalaya') },
    place: { name: 'Key Monastery', region: 'Spiti Valley', country: 'India', lat: 32.29, lng: 78.01 },
    caption: 'Thousand-year-old monastery stacked on a hill at 13,600 ft. Stayed the night. The monks feed you dal at 6am.',
    tags: ['monastery', 'himalaya', 'culture'], bestTime: 'Jun–Sep',
    likes: 2210, comments: [],
  },
  {
    id: 'p6', authorId: 'u_aria', createdAt: '2026-09-01T10:10:00Z',
    media: { type: 'image', src: photo('waterfall-cliff') },
    place: { name: 'Nohkalikai Falls', region: 'Meghalaya', country: 'India', lat: 25.28, lng: 91.68 },
    caption: 'Tallest plunge waterfall in the country. It rains here more than almost anywhere on earth — plan for grey.',
    tags: ['waterfall', 'monsoon', 'northeast'], bestTime: 'Sep–Nov',
    likes: 1544, comments: [],
  },
  {
    id: 'p7', authorId: 'u_tara', createdAt: '2026-08-31T08:00:00Z',
    media: { type: 'image', src: photo('hampi-ruins') },
    place: { name: 'Hampi Boulders', region: 'Karnataka', country: 'India', lat: 15.33, lng: 76.46 },
    caption: 'Ruins and granite boulders for 40 square kilometres. Rent a cycle, get lost on purpose.',
    tags: ['ruins', 'unesco', 'sunrise'], bestTime: 'Oct–Feb',
    likes: 987, comments: [],
  },
  {
    id: 'p8', authorId: 'u_kabir', createdAt: '2026-08-30T17:45:00Z',
    media: { type: 'image', src: photo('backwater-boat') },
    place: { name: 'Alleppey Backwaters', region: 'Kerala', country: 'India', lat: 9.5, lng: 76.34 },
    caption: 'Skip the big houseboats. A small country boat at 5pm through the narrow canals is the actual thing.',
    tags: ['backwaters', 'boat', 'slow'], bestTime: 'Nov–Feb',
    likes: 2054, comments: [],
  },
  {
    id: 'p9', authorId: 'u_mei', createdAt: '2026-08-29T06:30:00Z',
    media: { type: 'image', src: photo('mountain-lake') },
    place: { name: 'Gurudongmar Lake', region: 'Sikkim', country: 'India', lat: 28.02, lng: 88.71 },
    caption: '17,800 ft. One of the highest lakes in the world. Permits take two days — start them before you arrive.',
    tags: ['lake', 'high-altitude', 'permit'], bestTime: 'Apr–Jun',
    likes: 3110, comments: [],
  },
  {
    id: 'p10', authorId: 'u_dev', createdAt: '2026-08-28T12:00:00Z',
    media: { type: 'image', src: photo('beach-sunset') },
    place: { name: 'Radhanagar Beach', region: 'Andaman Islands', country: 'India', lat: 11.98, lng: 92.95 },
    caption: 'Sunset side of Havelock. Empty by 7am if you can drag yourself out.',
    tags: ['beach', 'island', 'sunset'], bestTime: 'Nov–Apr',
    likes: 1699, comments: [],
  },
]
