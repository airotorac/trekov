import { useEffect, useState } from 'react'
import { resolveSrc } from '../lib/media'

/** Renders a post's media, resolving IndexedDB blobs for user uploads. */
export default function Media({ media, className = '', alt = '' }) {
  const [src, setSrc] = useState(media.blobKey ? '' : media.src)

  useEffect(() => {
    let live = true
    resolveSrc(media).then((s) => live && setSrc(s))
    return () => { live = false }
  }, [media])

  if (!src) return <div className={`${className} bg-raised animate-pulse`} />

  return media.type === 'video' ? (
    <video src={src} className={className} playsInline muted loop autoPlay />
  ) : (
    <img src={src} className={className} alt={alt} loading="lazy" />
  )
}
