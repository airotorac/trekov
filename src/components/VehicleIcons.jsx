import { vehicleSvg } from '../lib/vehicleArt'

const wrap = (kind) => ({ size = 40, id = 'v', colour = 'green', className = '' }) => (
  <span className={className} style={{ lineHeight: 0 }}
        dangerouslySetInnerHTML={{ __html: vehicleSvg(kind, { colour, size, id }) }} />
)

export const CarIcon = wrap('car')
export const BikeIcon = wrap('bike')

export const VEHICLES = [
  { id: 'car',  label: 'Car',  Icon: CarIcon },
  { id: 'bike', label: 'Bike', Icon: BikeIcon },
]

export { COLOURS, VEHICLE_SVG } from '../lib/vehicleArt'
