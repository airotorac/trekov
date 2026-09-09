import { createPortal } from 'react-dom'

/**
 * Overlays must escape the post they were opened from: an element with a
 * transform (our `.rise` entrance animation leaves one behind) becomes the
 * containing block for `position: fixed` descendants, which would pin a
 * sheet to the card instead of the viewport.
 */
export default function Portal({ children }) {
  return createPortal(children, document.body)
}
