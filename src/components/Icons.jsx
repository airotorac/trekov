const MARK = 'M32 61C32 61 53 40.5 53 25A21 21 0 1 0 11 25C11 40.5 32 61 32 61ZM17 34.5L26.5 20L31.5 28L37.5 11.5L47 34.5Z'

/** The Trekov mark: a map pin whose negative space is a two-peak range. */
export function Logo({ size = 28, mono = false, className = '' }) {
  const gid = `tk-${size}${mono ? 'm' : ''}`
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} role="img" aria-label="Trekov">
      {!mono && (
        <defs>
          <linearGradient id={gid} x1="8" y1="4" x2="56" y2="60" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#3DDC97" />
            <stop offset=".55" stopColor="#00C08B" />
            <stop offset="1" stopColor="#0E9F6E" />
          </linearGradient>
        </defs>
      )}
      <path fill={mono ? 'currentColor' : `url(#${gid})`} fillRule="evenodd" d={MARK} />
    </svg>
  )
}

export function Wordmark({ size = 22, showMark = true }) {
  return (
    <span className="flex items-center gap-2">
      {showMark && <Logo size={size * 1.05} />}
      <span className="font-semibold tracking-[-0.035em]" style={{ fontSize: size }}>trekov</span>
    </span>
  )
}

const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' }
const Icon = ({ children, size = 24, filled, ...rest }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" {...rest}
       fill={filled ? 'currentColor' : 'none'} stroke="currentColor"
       strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
)

export const HeartIcon = (p) => (
  <Icon {...p}><path d="M12 20.5 4.6 13.3a4.6 4.6 0 0 1 6.5-6.5l.9.9.9-.9a4.6 4.6 0 0 1 6.5 6.5Z" /></Icon>
)
export const CommentIcon = (p) => (
  <Icon {...p} filled={false}><path d="M20 12a7.5 7.5 0 0 1-10.9 6.7L4 20l1.3-4.6A7.5 7.5 0 1 1 20 12Z" /></Icon>
)
/** Save-to-list: a pin, matching the brand mark's language. */
export const SaveIcon = (p) => (
  <Icon {...p}><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" /><circle cx="12" cy="10" r="2.4" /></Icon>
)
export const HomeIcon = (p) => (
  <Icon {...p}><path d="M4 10.4 12 4l8 6.4V20a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1Z" /></Icon>
)
export const SearchIcon = (p) => (
  <Icon {...p}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-3.4-3.4" /></Icon>
)
export const PlusIcon = (p) => (
  <Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>
)
export const UserIcon = (p) => (
  <Icon {...p}><circle cx="12" cy="8.5" r="3.8" /><path d="M4.8 20a7.2 7.2 0 0 1 14.4 0" /></Icon>
)
export const CloseIcon = (p) => (
  <Icon {...p}><path d="m6 6 12 12M18 6 6 18" /></Icon>
)
export const BackIcon = (p) => (
  <Icon {...p}><path d="M15 5 8 12l7 7" /></Icon>
)
export const SendIcon = (p) => (
  <Icon {...p}><path d="M20 4 3 11l7 2.6L12.6 21Z" /></Icon>
)
export const CalendarIcon = (p) => (
  <Icon {...p}><rect x="3.5" y="5" width="17" height="15" rx="2.5" /><path d="M8 3v4M16 3v4M3.5 10h17" /></Icon>
)
export const TrashIcon = (p) => (
  <Icon {...p}><path d="M4 7h16M9 7V5h6v2M6.5 7l.8 12.1a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4L17.5 7" /></Icon>
)
export const CameraIcon = (p) => (
  <Icon {...p}><path d="M3.5 8.5h3l1.4-2h6.2l1.4 2h3a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 2 18v-8A1.5 1.5 0 0 1 3.5 8.5Z" /><circle cx="12" cy="14" r="3.4" /></Icon>
)
export const CompassIcon = (p) => (
  <Icon {...p}><circle cx="12" cy="12" r="8.6" /><path d="m15.2 8.8-2 4.4-4.4 2 2-4.4Z" /></Icon>
)
export const RouteIcon = (p) => (
  <Icon {...p}><circle cx="6.5" cy="6.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" /><path d="M9 6.5h5A3.5 3.5 0 0 1 14 13.5h-4a3.5 3.5 0 0 0 0 7h5" /></Icon>
)
