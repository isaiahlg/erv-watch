import {useState} from 'react';
// import {Map, NavigationControl} from 'react-map-gl';
import {Map} from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import DeckGL from '@deck.gl/react';
import {GeoJsonLayer} from '@deck.gl/layers';
import {LightingEffect, AmbientLight, _SunLight as SunLight} from '@deck.gl/core';


// Source data GeoJSON
const DATA_URL =
  'https://raw.githubusercontent.com/isaiahlg/dssVis/main/data/geojson/busses.json'; // eslint-disable-line


const INITIAL_VIEW_STATE = {
  latitude: 37.8044,
  longitude: -122.2712,
  zoom: 13,
  maxZoom: 16,
  pitch: 45,
  bearing: 0
};

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

// const NAV_CONTROL_STYLE = {
//   position: 'absolute',
//   top: 10,
//   left: 10
// };

// todo: find out what this does
const ambientLight = new AmbientLight({
  color: [255, 255, 255],
  intensity: 1.0
});

// todo: find out what this does
const dirLight = new SunLight({
  timestamp: Date.UTC(2019, 7, 1, 22),
  color: [255, 255, 255],
  intensity: 1.0,
  _shadow: true
});

// todo: change this tool tip
function getTooltip({object}) {
  return (
    object && {
      html: `\
  <div><b>Average Property Value</b></div>
  <div>${object.properties.valuePerParcel} / parcel</div>
  <div>${object.properties.valuePerSqm} / m<sup>2</sup></div>
  <div><b>Growth</b></div>
  <div>${Math.round(object.properties.growth * 100)}%</div>
  `
    }
  );
}

export default function App({data = DATA_URL, mapStyle = MAP_STYLE}) {
  const [effects] = useState(() => {
    const lightingEffect = new LightingEffect({ambientLight, dirLight});
    lightingEffect.shadowColor = [0, 0, 0, 0.5];
    return [lightingEffect];
  });

  const layers = [
    // only needed when using shadows - a plane for shadows to drop on
    // new PolygonLayer({
    //   id: 'ground',
    //   data: landCover,
    //   stroked: false,
    //   getPolygon: f => f,
    //   getFillColor: [0, 0, 0, 0]
    // }),
    new GeoJsonLayer({
      id: 'geojson',
      data,
      opacity: 0.8,
      stroked: false,
      filled: true,
      extruded: true,
      wireframe: true,
      getElevation: f => Math.sqrt(f.properties.valuePerSqm) * 10,
      // getFillColor: f => COLOR_SCALE(f.properties.growth),
      getLineColor: [255, 255, 255],
      pickable: true
    })
  ];

  console.log(data)

  return (
    <DeckGL
      layers={layers}
      effects={effects}
      initialViewState={INITIAL_VIEW_STATE}
      controller={true}
      getTooltip={getTooltip}
    >
      <Map reuseMaps mapLib={maplibregl} mapStyle={mapStyle} preventStyleDiffing={true} />
      {/* <NavigationControl /> */}
    </DeckGL>
  );
}
