import React from 'react'
import panelImage from '../assets/images/panel-monocrystaline.png'
import panelImageWebp from '../assets/images/panel-monocrystaline.webp'
import './SolarPanelsPane.css'

interface SolarPanelProps {
  width: number
  index: number
}

const SolarPanel: React.FunctionComponent<SolarPanelProps> = (props) => {
  return (
    <div className='panel' >
      <picture >
        <source type="image/webp"  srcSet={panelImageWebp} />
        <img width={props.width} src={panelImage} />
      </picture>

      <div className="number-overlay">
        <span aria-hidden="true">{props.index}</span>
      </div>
    </div>
  )
}

export interface SolarPanelsPaneProps {
  numberOfPanels: number
}

const renderPanel = (index: number) => {
  return <SolarPanel width={50} key={index} index={index} />
}

export const SolarPanelsPane: React.FunctionComponent<SolarPanelsPaneProps> = (props) => {
  const number = props.numberOfPanels
  const panels = Array.from(Array(number).keys()).map(x => x + 1)
  return (
    <div className="panelPane">
      {panels.map(renderPanel)}
    </div>
  )
}