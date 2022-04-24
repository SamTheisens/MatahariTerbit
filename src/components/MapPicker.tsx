import { DownOutlined, UpOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import GoogleMapReact, { Coords, Point } from 'google-map-react'
import React, { useEffect, useLayoutEffect, useState } from 'react'
import { DEFAULT_ZOOM, GOOGLE_MAPS_KEY, INITIAL_INPUT_DATA } from '../constants'
import i18n from '../i18n'
import { MapState, mapStore } from '../util/mapStore'
import { formatNumber } from '../services/Formatters'
import { MapMarker } from './MapMarker'
import './MapPicker.css'
import { IrradiationGauge } from './IrradiationGauge'
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

export interface MapPickerProps {
  value?: MapState
  onChange?: (value: MapState) => void
}

const distanceToMouse = (pt: Point, { x, y }: Point) => Math.sqrt((pt.x - x) * (pt.x - x) + (pt.y - 24 - y) * (pt.y - 24 - y))

export const MapPicker: React.FunctionComponent<MapPickerProps> = (props) => {
  const [position, setPosition] = useState<Coords>(props.value!.location)
  const [center, setCenter] = useState<Coords>(props.value!.location)
  const [zoom, setZoom] = useState<number>(DEFAULT_ZOOM)
  const [draggable, setDraggable] = useState<boolean>(true)
  const [mapState, setMapState] = useState<MapState>(props.value!)
  const [collapsed, setCollapsed] = useState<boolean>(false)

  useLayoutEffect(() => {
    mapStore.subscribe((value) => {
      setMapState(value)
      if (props.onChange) { props.onChange(value) }
    })
  }, [])

  const updatePosition = async (location: Coords) => {
    mapStore.setLocation(location)
    setPosition(location)
  }

  const onMouseDrag = (childKey: string, childProps: unknown, location: Coords) => {
    setDraggable(false)
    updatePosition(location)
  }

  const setLocation = (coordinates: Coords) => {
    updatePosition(coordinates)
    setCenter(coordinates)
    setZoom(16)
  }

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const coordinates = { lat: coords.latitude, lng: coords.longitude } as Coords
      setLocation(coordinates)
    }, () => {
      setLocation(INITIAL_INPUT_DATA.location.location)
    })
  }, [])

  function LocationMarker() {
    const map = useMapEvents({
      loading() {
        map.locate()
      },
      click(e) {
        setLocation(e.latlng)
        map.flyTo(e.latlng, map.getZoom(), { animate: true })
      },
      locationfound(e) {
        setPosition(e.latlng)
        map.flyTo(e.latlng, map.getZoom(), { animate: false })
      }
    })
    useEffect(() => {
      map.locate()
    })

    return position ? (
      <Marker position={position} icon={L.icon({ iconUrl: '../assets/images/logo.png' })}>
        <Popup>You are here</Popup>
      </Marker>
    ): null
  }
  return (
    <div>
      <div className={`map-picker ${collapsed ? 'collapsed' : 'expanded'}`}>

        <div className="ant-input map-picker-header">
          <div className="map-picker-address" onClick={() => { setCollapsed(!collapsed) }}>
            {mapState.address ?? 'Choose your address ...'}
          </div>
          {mapState.info && (<div className="map-picker-irradiation" onClick={() => setCollapsed(!collapsed)}>{formatNumber(mapState.info.dni, i18n.language)}&nbsp;kWh/m2</div>)}
          <Button
            style={{ color: '#bfbfbf' }}
            icon={collapsed ? <DownOutlined /> : <UpOutlined />}
            type="text"
            loading={false}
            size="small"
            onClick={() => { setCollapsed(!collapsed) }} />
        </div>
        <div className="map-picker-view">
          <MapContainer center={[center.lat, center.lng]} zoom={25} scrollWheelZoom={false} style={{ height: '400px' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker />
            {/*<Marker position={[defaultLocation.lat, defaultLocation.lng]} icon={ikoon}>*/}

            {/*  /!*  <Popup>*!/*/}
            {/*  /!*    A pretty CSS3 popup. <br /> Easily customizable.*!/*/}
            {/*  /!*  </Popup>*!/*/}
            {/*</Marker>*/}
          </MapContainer>
        </div>
      </div>
      <div>
        <GoogleMapReact draggable={draggable} bootstrapURLKeys={{ key: GOOGLE_MAPS_KEY }} center={center} zoom={zoom}
          options={{ mapTypeControl: false, mapTypeId: 'hybrid' }}
          yesIWantToUseGoogleMapApiInternals
          onChildMouseDown={onMouseDrag}
          onChildMouseUp={() => { setDraggable(true) }}
          onChildMouseMove={onMouseDrag}
          onClick={({ lat, lng }) => updatePosition({ lat, lng })}
          distanceToMouse={distanceToMouse}>
          <MapMarker lat={position.lat} lng={position.lng} />
        </GoogleMapReact>
      </div>
      <IrradiationGauge value={mapState} />
    </div>
  )
}
