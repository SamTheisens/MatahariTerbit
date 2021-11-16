import { Coords } from 'google-map-react'

export async function geocode(location: Coords) {
  const geocoder = new window.google.maps.Geocoder()
  const { results } = await geocoder.geocode({ location })
  return results[0]
}

export interface LtaResponse {
  annual: {
    data: {
      DIF: number
      DNI: number
      ELE: number
      GHI: number
      GTI_opta: number
      OPTA: number
      TEMP: number
    }
  }
}

export interface IrradianceInfo {
  // [DNI] Direct normal irradiation in kWh/m2
  dni: number
  // [GHI] Global horizontal irradiation in kWh/m2
  ghi: number
  // [DIF] Diffuse horizontal irradiation in kWh/m2
  dif: number
  // [GTIO_opta] Global tilted irradiation at optimum angle in kWh/m2
  gtio: number
  // [OPTA] Optimum tilt of PV modules in degrees
  opta: number
  // [TEMP] Air temperature in celsius
  temperature: number
  // [ELE] Terrain elevation in meters
  elevation: number
}

export async function irradiance({ lat, lng }: Coords): Promise<IrradianceInfo> {
  const result = await fetch(`https://api.globalsolaratlas.info/data/lta?loc=${lat},${lng}`, {
    method: 'GET',
    headers: { 'accept': 'application/json', 'content-type': 'application/json' }
  })
  if (result.status < 200 || result.status >= 300) { throw new Error(result.statusText) }
  const response: LtaResponse = await result.json()
  if (!response?.annual?.data) { throw new Error('Invalid data') }
  const { DNI: dni, GHI: ghi, DIF: dif, GTI_opta: gtio, OPTA: opta, TEMP: temperature, ELE: elevation } = response.annual.data
  return { dni, ghi, dif, gtio, opta, temperature, elevation }
}
