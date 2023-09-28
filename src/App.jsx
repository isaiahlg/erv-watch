import {useState} from 'react';
import Map from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import DeckGL from '@deck.gl/react';
import {GeoJsonLayer} from '@deck.gl/layers';
import {H3HexagonLayer} from '@deck.gl/geo-layers';
import {interpolateRdBu} from 'd3-scale-chromatic';
import H3_URL from '/data/geojson/h3.json'

// Source data 
// const BUSES_URL = '/src/geojson/buses2nozero.json';
// const LINES_URL = '/src/geojson/lines2.json';
const BUSES_URL = 'https://raw.githubusercontent.com/geohai/vite-vis-dss/main/data/geojson/buses2nozero.json';
const LINES_URL = 'https://raw.githubusercontent.com/geohai/vite-vis-dss/main/data/geojson/lines2.json'
// const H3_URL = 'https://raw.githubusercontent.com/geohai/vite-vis-dss/main/data/geojson/h3.json'

// style map
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
const INITIAL_VIEW_STATE = {
  latitude: 37.78,
  longitude: -122.212,
  zoom: 15,
  maxZoom: 20,
  pitch: 60,
  bearing: 0
};
const toRGBArray = rgbStr => rgbStr.match(/\d+/g).map(Number);
const COLOR_SCALE = v => toRGBArray(interpolateRdBu(v));

const getTooltip = ({object}) => object && object.properties.name;

// primary component
export default function App({buses = BUSES_URL, lines = LINES_URL, hexes = H3_URL, mapStyle = MAP_STYLE}) {
  const [viewLines, toggleLines] = useState(true);
  const [viewBuses, toggleBuses] = useState(true);
  const [viewH3, toggleH3] = useState(true);
  console.log(H3_URL)

  const busesLayer = new GeoJsonLayer({
      id: 'geojson1',
      data: buses,
      opacity: 0.8,
      filled: true,
      pointType: 'circle',
      pointRadiusMaxPixels: 20,
      radiusUnits: 'meters',
      getPointRadius: f => 500 * Math.abs(f.properties.voltage-1),
      getFillColor: f => COLOR_SCALE(-20*(f.properties.voltage-1) + 0.5),
      getLineColor: f => COLOR_SCALE(-20*(f.properties.voltage-1) + 0.5),
      pickable: true,
      visible: viewBuses
    })
  
  const linesLayer = new GeoJsonLayer({
    id: 'geojson2',
    data: lines,
    opacity: 0.1,
    getLineColor: [255, 255, 255],
    getLineWidth: 2,
    pickable: true,
    visible: viewLines
  })

  const h3Layer = new H3HexagonLayer({
    id: 'h3-1',
    data: hexes,
    opacity: 0.8,
    filled: true,
    extruded: false,
    getHexagon: d => d.hex,
    getFillColor: d => COLOR_SCALE(-20*(d.voltage-1) + 0.5),
    // get the correct hexes from the new repo, convert to datatype
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
          busesLayer,
          linesLayer,
          h3Layer
        ]}
        initialViewState={INITIAL_VIEW_STATE}
        controller={true}
        getTooltip={getTooltip}
      >
        <button 
          onClick = {() => toggleBuses(!viewBuses)}
          style = {buttonStyle(viewBuses, 0)}> 
          Buses
        </button>
        <button 
          onClick = {() => toggleLines(!viewLines)}
          style = {buttonStyle(viewLines, 1)}> 
          Lines
        </button>
        <button 
          onClick = {() => toggleH3(!viewH3)}
          style = {buttonStyle(viewH3, 2)}> 
          H3 Hexes
        </button>
        <Map reuseMaps mapLib={maplibregl} mapStyle={mapStyle} preventStyleDiffing={true} />
      </DeckGL>
  );
}
