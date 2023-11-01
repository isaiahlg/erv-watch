import {useState} from 'react';
import Map from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import DeckGL from '@deck.gl/react';
import {GeoJsonLayer} from '@deck.gl/layers';
import {H3HexagonLayer, S2Layer} from '@deck.gl/geo-layers';
import {GridLayer} from '@deck.gl/aggregation-layers';
import {interpolateRdBu} from 'd3-scale-chromatic';

const LINES_URL = 'https://raw.githubusercontent.com/geohai/vite-vis-dss/main/data/json/lines.geo.json';
const BUSES_URL = 'https://raw.githubusercontent.com/geohai/vite-vis-dss/main/data/json/buses.geo.json';
const H3_URL = 'https://raw.githubusercontent.com/geohai/vite-vis-dss/main/data/json/h3r10.json';
const S2_URL = 'https://raw.githubusercontent.com/geohai/vite-vis-dss/main/data/json/s2r16.json';
const VORONOI_URL = 'https://raw.githubusercontent.com/geohai/vite-vis-dss/main/data/json/voronoi.geo.json';
const CONTOUR_URL = 'https://raw.githubusercontent.com/geohai/vite-vis-dss/main/data/json/contours.json'
const CONTOUR_PTS_URL = 'https://raw.githubusercontent.com/geohai/vite-vis-dss/main/data/json/contours.geo.json'

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
const getTooltip = ({object}) => JSON.stringify(object);
const range = n => [...Array(n).keys()]
const RdBuDiscrete = range(102).map(i => COLOR_SCALE(1-i/101));

// primary component
export default function App({
  buses = BUSES_URL, 
  lines = LINES_URL, 
  hexes = H3_URL, 
  s2tiles = S2_URL,
  voronoi = VORONOI_URL,
  contours = CONTOUR_URL,
  contourPts = CONTOUR_PTS_URL,
  mapStyle = MAP_STYLE
}) {
  const [viewLines, toggleLines] = useState(true);
  const [viewBuses, toggleBuses] = useState(false);
  const [viewGlyphs, toggleGlyphs] = useState(true);
  const [viewH3, toggleH3] = useState(false);
  const [viewS2, toggleS2] = useState(false);
  const [viewVoronoi, toggleVoronoi] = useState(false);
  const [viewContours, toggleContours] = useState(false);
  const [viewContourPts, toggleContourPts] = useState(false);

  const lineLayer = new GeoJsonLayer({
    id: 'lines',
    data: lines,
    opacity: 0.1,
    getLineColor: [255, 255, 255],
    getLineWidth: 2,
    pickable: true,
    visible: viewLines
  })

  const busLayer = new GeoJsonLayer({
    id: 'buses',
    data: buses,
    opacity: 0.1,
    filled: true,
    pointType: 'circle',
    radiusUnits: 'meters',
    getPointRadius: 3,
    getFillColor: [255, 255, 255],
    getLineColor: [255, 255, 255],
    pickable: true,
    visible: viewBuses
  })

  const glyphLayer = new GeoJsonLayer({
      id: 'glyphs',
      data: buses,
      opacity: 0.8,
      filled: true,
      pointType: 'circle',
      pointRadiusMaxPixels: 50,
      radiusUnits: 'meters',
      getPointRadius: f => 400 * Math.abs(f.properties.voltage-1),
      getFillColor: f => COLOR_SCALE(-20*(f.properties.voltage-1) + 0.5),
      getLineWidth: 0,
      pickable: true,
      visible: viewGlyphs
    })

  const h3Layer = new H3HexagonLayer({
    id: 'h3-1',
    data: hexes,
    opacity: 0.6,
    filled: true,
    extruded: false,
    getHexagon: d => d.h3,
    getFillColor: d => COLOR_SCALE(-20*(d.voltage-1) + 0.5),
    getLineWidth: 0,
    visible: viewH3
  })

  const s2Layer = new S2Layer({
    id: 's2-1',
    data: s2tiles,
    opacity: 0.6,
    filled: true,
    extruded: false,
    getS2Token: d => d.s2,
    getFillColor: d => COLOR_SCALE(-20*(d.voltage-1) + 0.5),
    getLineWidth: 0,
    visible: viewS2
  })

  const voronoiLayer = new GeoJsonLayer({
    id: 'voronoi',
    data: voronoi,
    opacity: 0.6,
    filled: true,
    getFillColor: f => COLOR_SCALE(-20*(f.properties.voltage-1) + 0.5),
    getLineWidth: 0,
    pickable: true,
    visible: viewVoronoi
  })

  const contourLayer = new GridLayer({
    id: 'contours',
    data: contours,
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

  const contourPtsLayer = new GeoJsonLayer({
    id: 'contourPts',
    data: contourPts,
    opacity: 1,
    filled: true, 
    pointType: 'circle',
    radiusUnits: 'meters',
    getPointRadius: 2,
    getFillColor: f => COLOR_SCALE(-20*(f.properties.voltage-1) + 0.5),
    getLineColor: f => COLOR_SCALE(-20*(f.properties.voltage-1) + 0.5),
    getLineWidth: 1,
    pickable: true,
    visible: viewContourPts
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
          contourPtsLayer,
          contourLayer,
          voronoiLayer,
          s2Layer,
          h3Layer,
          glyphLayer,
          busLayer,
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
          onClick = {() => toggleContourPts(!viewContourPts)}
          style = {buttonStyle(viewContourPts, 7.6)}> 
          ContourPts
        </button>
        <Map reuseMaps mapLib={maplibregl} mapStyle={mapStyle} preventStyleDiffing={true} />
      </DeckGL>
  );
}
