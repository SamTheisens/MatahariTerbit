import React from 'react'
import panelImage from '../assets/images/panel-monocrystaline.png'
import './SolarPanelsPane.css'

interface SolarPanelProps {
  width: number
}

const SolarPanel: React.FunctionComponent<SolarPanelProps> = (props) => {
  return (
    <div style={{ float: 'left' }} >
      <img width={props.width} src={panelImage} />
    </div>
  )
}

export interface SolarPanelsPaneProps {
  numberOfPanels: number
}

const renderPanel = (index: number) => {
  return <SolarPanel width={50} key={index} />
}

export const SolarPanelsPane: React.FunctionComponent<SolarPanelsPaneProps> = (props) => {
  const number = props.numberOfPanels || 1
  const panels = Array.from(Array(number).keys()).map(x => x + 1)
  return (
    <div className="panelPane">
      {panels.map(renderPanel)}
    </div>
  )
}