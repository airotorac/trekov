import { bikeSvg, carSvg } from '../lib/vehicleArt'

const wrap = (fn) => ({ size = 40, id = 'v', tint, className = '' }) => (
  <span className={className} style={{ lineHeight: 0 }}
        dangerouslySetInnerHTML={{ __html: fn(id, size, tint) }} />
)

export const CarIcon = wrap(carSvg)
export const BikeIcon = wrap(bikeSvg)

export const VEHICLES = [
  { id: 'car',  label: 'Car',  Icon: CarIcon },
  { id: 'bike', label: 'Bike', Icon: BikeIcon },
]

export { VEHICLE_SVG } from '../lib/vehicleArt'
