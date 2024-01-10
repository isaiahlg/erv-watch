import {useState} from 'react';
import Map from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import DeckGL from '@deck.gl/react';
import {GeoJsonLayer} from '@deck.gl/layers';
import {H3HexagonLayer, S2Layer} from '@deck.gl/geo-layers';
import {GridLayer} from '@deck.gl/aggregation-layers';
import {interpolateRdBu, interpolateRdPu} from 'd3-scale-chromatic';

const LINES_URL = 'https://raw.githubusercontent.com/geohai/vite-vis-dss/main/data/json/lines.geo.json';
const BUSES_URL = 'https://raw.githubusercontent.com/geohai/vite-vis-dss/main/data/json/buses.geo.json';
const H3_URL = 'https://raw.githubusercontent.com/geohai/vite-vis-dss/main/data/json/h3r10.json';
const S2_URL = 'https://raw.githubusercontent.com/geohai/vite-vis-dss/main/data/json/s2r16.json';
const VORONOI_URL = 'https://raw.githubusercontent.com/geohai/vite-vis-dss/main/data/json/voronoi.geo.json';
const CONTOUR_URL = 'https://raw.githubusercontent.com/geohai/vite-vis-dss/main/data/json/contours.json'
const EV_STATIONS_URL = 'https://raw.githubusercontent.com/geohai/vite-vis-dss/main/data/json/evstations.geo.json'
const PV_URL = 'https://raw.githubusercontent.com/geohai/vite-vis-dss/main/data/json/pv.geo.json'
const STORAGE_URL = 'https://raw.githubusercontent.com/geohai/vite-vis-dss/main/data/json/storage.geo.json'
const TX_URL = 'https://raw.githubusercontent.com/geohai/vite-vis-dss/main/data/json/tx.geo.json'

// style map
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
const INITIAL_VIEW_STATE = {
  latitude: 37.817,
  longitude: -122.242,
  zoom: 16,
  maxZoom: 20,
  pitch: 60,
  bearing: 0
};
const toRGBArray = rgbStr => rgbStr.match(/\d+/g).map(Number);
const RDBU_COLOR_SCALE = v => toRGBArray(interpolateRdBu(v));
const RDPU_COLOR_SCALE = v => toRGBArray(interpolateRdPu(v));
const getTooltip = ({object}) => JSON.stringify(object);
const range = n => [...Array(n).keys()]
const RdBuDiscrete = range(102).map(i => RDBU_COLOR_SCALE(1-i/101));

// primary component
export default function App() {
  const [viewLines, toggleLines] = useState(true);
  const [viewBuses, toggleBuses] = useState(true);
  const [viewGlyphs, toggleGlyphs] = useState(false);
  const [viewH3, toggleH3] = useState(false);
  const [viewS2, toggleS2] = useState(false);
  const [viewVoronoi, toggleVoronoi] = useState(true);
  const [viewContours, toggleContours] = useState(false);
  const [viewCurrents, toggleCurrents] = useState(false);
  const [viewEVStations, toggleEVStations] = useState(true);
  const [viewPV, togglePV] = useState(false);
  const [viewStorage, toggleStorage] = useState(true);
  const [viewTX, toggleTX] = useState(true);

  const lineLayer = new GeoJsonLayer({
    id: 'lines',
    data: LINES_URL,
    opacity: 0.1,
    getLineColor: [255, 255, 255],
    getLineWidth: 2,
    pickable: true,
    visible: viewLines
  })

  const busLayer = new GeoJsonLayer({
    id: 'buses',
    data: BUSES_URL,
    opacity: 0.1,
    filled: true,
    pointType: 'circle',
    radiusUnits: 'meters',
    getPointRadius: 4,
    getFillColor: [255, 255, 255],
    getLineWidth: 0,
    pickable: true,
    visible: viewBuses
  })

  const glyphLayer = new GeoJsonLayer({
      id: 'glyphs',
      data: BUSES_URL,
      opacity: 0.8,
      filled: true,
      pointType: 'circle',
      pointRadiusMaxPixels: 50,
      radiusUnits: 'meters',
      getPointRadius: f => 400 * Math.abs(f.properties.voltage-1),
      getFillColor: f => RDBU_COLOR_SCALE(-20*(f.properties.voltage-1) + 0.5),
      getLineWidth: 0,
      pickable: true,
      visible: viewGlyphs
    })

  const h3Layer = new H3HexagonLayer({
    id: 'h3-1',
    data: H3_URL,
    opacity: 0.6,
    filled: true,
    extruded: false,
    getHexagon: d => d.h3,
    getFillColor: d => RDBU_COLOR_SCALE(-20*(d.voltage-1) + 0.5),
    getLineWidth: 0,
    visible: viewH3
  })

  const s2Layer = new S2Layer({
    id: 's2-1',
    data: S2_URL,
    opacity: 0.6,
    filled: true,
    extruded: false,
    getS2Token: d => d.s2,
    getFillColor: d => RDBU_COLOR_SCALE(-20*(d.voltage-1) + 0.5),
    getLineWidth: 0,
    visible: viewS2
  })

  const voronoiLayer = new GeoJsonLayer({
    id: 'voronoi',
    data: VORONOI_URL,
    opacity: 0.6,
    filled: true,
    getFillColor: f => RDBU_COLOR_SCALE(-20*(f.properties.voltage-1) + 0.5),
    getLineWidth: 0,
    pickable: true,
    visible: viewVoronoi
  })

  const contourLayer = new GridLayer({
    id: 'contours',
    data: CONTOUR_URL,
    opacity: 0.8,
    cellSize: 14,
    getPosition: d => d.geometry.coordinates,
    getColorWeight: d => d.properties.voltage,
    colorDomain: [0.975, 1.025],
    colorRange: RdBuDiscrete,
    colorAggregation: 'MEAN',
    pickable: true,
    visible: viewContours
  })

  const currentLayer = new GeoJsonLayer({
    id: 'currents',
    data: LINES_URL,
    opacity: 1,
    getLineColor: f => RDPU_COLOR_SCALE(f.properties.current),
    getLineWidth: 2,
    pickable: true,
    visible: viewCurrents
  })

  const evStationLayer = new GeoJsonLayer({
    id: 'evStations',
    data: EV_STATIONS_URL,
    opacity: 0.5,
    pointType: 'icon',
    iconAtlas: 'https://raw.githubusercontent.com/geohai/vite-vis-dss/main/public/ev-charge-icon.png',
    iconMapping: {marker: {
      x: 0, 
      y: 0, 
      width: 250, 
      height: 337, 
      mask: false,
      anchorY: 337,
    }},
    getIcon: () => 'marker',
    getIconSize: 2,
    iconSizeScale: 30,
    iconSizeUnits: 'meters',
    iconBillboard: true,
    pickable: true,
    visible: viewEVStations
  })

  const pvLayer = new GeoJsonLayer({
    id: 'pv',
    data: PV_URL,
    opacity: 0.5,
    pointType: 'icon',
    iconAtlas: 'public/pv.png',
    iconMapping: {marker: {
      x: 0, 
      y: 0, 
      width: 512, 
      height: 412, 
      mask: false,
      anchorY: 412,
    }},
    getIcon: () => 'marker',
    getIconSize: 0.3,
    iconSizeScale: 30,
    iconSizeUnits: 'meters',
    iconBillboard: true,
    pickable: true,
    visible: viewPV
  })

  const storageLayer = new GeoJsonLayer({
    id: 'storage',
    data: STORAGE_URL,
    opacity: 0.5,
    pointType: 'icon',
    iconAtlas: 'public/storage.png',
    iconMapping: {marker: {
      x: 0, 
      y: 0, 
      width: 512, 
      height: 390, 
      mask: false,
      anchorY: 390,
    }},
    getIcon: () => 'marker',
    getIconSize: 0.7,
    iconSizeScale: 30,
    iconSizeUnits: 'meters',
    iconBillboard: true,
    pickable: true,
    visible: viewStorage
  })

  const txLayer = new GeoJsonLayer({
    id: 'tx',
    data: TX_URL,
    opacity: 0.5,
    pointType: 'icon',
    iconAtlas: 'public/tx.png',
    iconMapping: {marker: {
      x: 0, 
      y: 0, 
      width: 800, 
      height: 600, 
      mask: false,
      anchorY: 600,
    }},
    getIcon: () => 'marker',
    getIconSize: 0.3,
    iconSizeScale: 30,
    iconSizeUnits: 'meters',
    iconBillboard: true,
    pickable: true,
    visible: viewTX
  })

  const buttonStyle = (view, n) => {
    return ({
    position: 'absolute', 
    left: 5 + 75*n, 
    top: 5,
    color: 'white',
    backgroundColor: view ? 'blue' : 'gray',
    border: 'none',
    padding: '10px',
    borderRadius: '10px',
    boxShadow: '0px 0px 10px 0 rgba(255, 255, 255, 0.2)'
  })};

  return (
      <DeckGL
        layers={[
          contourLayer,
          voronoiLayer,
          s2Layer,
          h3Layer,
          glyphLayer,
          busLayer,
          evStationLayer,
          storageLayer,
          pvLayer,
          txLayer,
          currentLayer,
          lineLayer
        ]}
        initialViewState={INITIAL_VIEW_STATE}
        controller={true}
        getTooltip={getTooltip}
      >
        <button 
          onClick = {() => toggleLines(!viewLines)}
          style = {buttonStyle(viewLines, 0)}> 
          Lines
        </button>
        <button 
          onClick = {() => toggleBuses(!viewBuses)}
          style = {buttonStyle(viewBuses, 0.9)}> 
          Buses
        </button>
        <button 
          onClick = {() => toggleGlyphs(!viewGlyphs)}
          style = {buttonStyle(viewGlyphs, 1.9)}> 
          Glyphs
        </button>
        <button 
          onClick = {() => toggleH3(!viewH3)}
          style = {buttonStyle(viewH3, 2.9)}> 
          H3 Hexes
        </button>
        <button 
          onClick = {() => toggleS2(!viewS2)}
          style = {buttonStyle(viewS2, 4.2)}> 
          S2 Tiles
        </button>
        <button 
          onClick = {() => toggleVoronoi(!viewVoronoi)}
          style = {buttonStyle(viewVoronoi, 5.3)}> 
          Voronoi
        </button>
        <button 
          onClick = {() => toggleContours(!viewContours)}
          style = {buttonStyle(viewContours, 6.4)}> 
          Contours
        </button>
        <button 
          onClick = {() => toggleCurrents(!viewCurrents)}
          style = {buttonStyle(viewCurrents, 7.6)}> 
          Currents
        </button>
        <button 
          onClick = {() => toggleEVStations(!viewEVStations)}
          style = {buttonStyle(viewEVStations, 8.8)}> 
          EV Stations
        </button>
        <button 
          onClick = {() => togglePV(!viewPV)}
          style = {buttonStyle(viewPV, 10.2)}> 
          PV
        </button>
        <button 
          onClick = {() => toggleStorage(!viewStorage)}
          style = {buttonStyle(viewStorage, 10.9)}> 
          Storage
        </button>
        <button 
          onClick = {() => toggleTX(!viewTX)}
          style = {buttonStyle(viewTX, 12)}> 
          Transformers
        </button>
        <Map reuseMaps mapLib={maplibregl} mapStyle={MAP_STYLE} preventStyleDiffing={true} />
      </DeckGL>
  );
}
