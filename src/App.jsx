// import {useState} from 'react';
// import {Map, NavigationControl} from 'react-map-gl';
import {Map} from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import DeckGL from '@deck.gl/react';
import {GeoJsonLayer} from '@deck.gl/layers';
// import {LightingEffect, AmbientLight, _SunLight as SunLight} from '@deck.gl/core';


// Source data GeoJSON
const BUSES_URL =
  'https://raw.githubusercontent.com/isaiahlg/vite-vis-dss/main/data/geojson/buses2.json?token=GHSAT0AAAAAACGEBKG4B4NA3DOZDOFLI3VKZICG5NA'; // eslint-disable-line

const LINES_URL = 
  'https://raw.githubusercontent.com/isaiahlg/vite-vis-dss/main/data/geojson/lines2.json?token=GHSAT0AAAAAACGEBKG5P2SE2DO4PV2VWST2ZICHXZQ'

const INITIAL_VIEW_STATE = {
  latitude: 37.78,
  longitude: -122.212,
  zoom: 14,
  maxZoom: 16,
  pitch: 60,
  bearing: 0
};

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

// const NAV_CONTROL_STYLE = {
//   position: 'absolute',
//   top: 10,
//   left: 10
// };

export default function App({buses = BUSES_URL, lines = LINES_URL, mapStyle = MAP_STYLE}) {
  const layers = [
    new GeoJsonLayer({
      id: 'geojson1',
      data: buses,
      opacity: 0.8,
      // stroked: true,
      filled: true,
      // extruded: false,
      // wireframe: true,
      getPointRadius: 5,
      getFillColor: [60, 120, 255],
      // getElevation: f => Math.sqrt(f.properties.valuePerSqm) * 10,
      // getFillColor: f => COLOR_SCALE(f.properties.growth),
      getLineColor: [60, 120, 255],
      // pickable: true
    }),
    new GeoJsonLayer({
      id: 'geojson2',
      data: lines,
      opacity: 0.8,
      // stroked: true,
      filled: true,
      // extruded: false,
      // wireframe: true,
      // getElevation: f => Math.sqrt(f.properties.valuePerSqm) * 10,
      // getFillColor: f => COLOR_SCALE(f.properties.growth),
      getLineColor: [255, 120, 0],
      getLineWidth: 2,
      // pickable: true
    })
  ];

  return (
    <DeckGL
      layers={layers}
      // effects={effects}
      initialViewState={INITIAL_VIEW_STATE}
      controller={true}
      // getTooltip={getTooltip}
    >
      <Map reuseMaps mapLib={maplibregl} mapStyle={mapStyle} preventStyleDiffing={true} />
      {/* <NavigationControl /> */}
    </DeckGL>
  );
}
