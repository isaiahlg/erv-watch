import Map from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import DeckGL from '@deck.gl/react';
import {GeoJsonLayer} from '@deck.gl/layers';
import {interpolateRdBu} from 'd3-scale-chromatic';

// Source data 
const BUSES_URL = '/data/geojson/buses2nozero.json';
const LINES_URL = '/data/geojson/lines2.json'

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
export default function App({buses = BUSES_URL, lines = LINES_URL, mapStyle = MAP_STYLE}) {
  const layers = [
    new GeoJsonLayer({
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
      pickable: true
    }),
    new GeoJsonLayer({
      id: 'geojson2',
      data: lines,
      opacity: 0.1,
      getLineColor: [255, 255, 255],
      getLineWidth: 2,
      pickable: true
    })
  ];

  return (
      <DeckGL
        layers={layers}
        initialViewState={INITIAL_VIEW_STATE}
        controller={true}
        getTooltip={getTooltip}
      >
        <Map reuseMaps mapLib={maplibregl} mapStyle={mapStyle} preventStyleDiffing={true} />
      </DeckGL>
  );
}
