import {useEffect, useState} from 'react';
import Map from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import DeckGL from '@deck.gl/react';
import {GeoJsonLayer, ColumnLayer} from '@deck.gl/layers';
import {H3HexagonLayer} from '@deck.gl/geo-layers';
import {HexagonLayer, HeatmapLayer, GridLayer} from '@deck.gl/aggregation-layers';
import {csv} from 'd3-fetch';
import {interpolateRdBu} from 'd3-scale-chromatic';

// data imports
// const DATA_PATH = 'https://raw.githubusercontent.com/geohai/vite-vis-dss/evsatscale2/data/evsatscale/v2/';
const DATA_PATH = 'data/evsatscale/v2/';
const HOURLY_LOADS = 'loads_pivot.csv';
const LOADS_GEO_JSON = 'charge_location_data.geo.json';
const LOADS_JSON = 'charge_location_data.json';
const LOADS_H3 = 'locations_h3.json';
const DATETIMES = 'timesteps.csv';

// style map
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
const INITIAL_VIEW_STATE = {
  latitude: 37.5,
  longitude: -77.2,
  zoom: 9.8,
  maxZoom: 20,
  pitch: 60,
  bearing: 170
};
const toRGBArray = rgbStr => rgbStr.match(/\d+/g).map(Number);
const RDBU_COLOR_SCALE = v => toRGBArray(interpolateRdBu(v));
const getTooltip = ({object}) => JSON.stringify(object);

// primary component
export default function AppEV() {
  const [viewPoints, togglePoints] = useState(true);
  const [viewGlyphs, toggleGlyphs] = useState(false);
  const [viewColumns, toggleColumns] = useState(false);
  const [viewHex, toggleHex] = useState(true);
  const [viewH3, toggleH3] = useState(false);
  const [viewGrid, toggleGrid] = useState(false);
  const [viewHeatmap, toggleHeatmap] = useState(false);

  const [h3res, setH3res] = useState(7);
  const [allLoads, setAllLoads] = useState([]);
  const [currentLoads, setCurrentLoads] = useState([]);
  const [datetimes, setDatetimes] = useState([]);
  const [timestep, setTimestep] = useState(44);
  const [animate, setAnimate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [speed, setSpeed] = useState(8);

  let hour = timestep % 24;
  let day = Math.floor(timestep / 24) % 7 + 1;
  
  // effect to fetch all data at the start of the app
  useEffect(() => { 
    const fetchData = async () => {
      setLoading(true);
      const load_data = await csv(DATA_PATH + HOURLY_LOADS);
      const datetimes_data = await csv(DATA_PATH + DATETIMES);
      setAllLoads(load_data);
      setDatetimes(datetimes_data);
      setLoading(false);
    };
    fetchData();
  }, []);

  // effect to fetch loads for current timestep
  useEffect(() => {
    const getLoadsByTimestep = (timestep) => {
      return allLoads[timestep]; // timesteps are 1 indexed, JS is 0 indexed
    };
    setCurrentLoads(getLoadsByTimestep(timestep));
  }, [allLoads, timestep]);
  
  // function to update the timestep when buttons are clicked
  const stepTime = (hours) => {
    const mod = datetimes.length;
    const new_timestep = (timestep + hours) % mod;
    const new_positive_timestep = (new_timestep + mod) % mod
    setTimestep(new_positive_timestep);
  };

  // effect to animate the timestep
  useEffect(() => {
    if (animate) {
      const interval = setInterval(() => {
        setTimestep((timestep + 1) % 168)
      }, 1000/speed)
      return () => clearInterval(interval)
    }
  }, [animate, timestep, speed])

  // layers
  const pointsLayer = new GeoJsonLayer({
    id: 'points',
    data: DATA_PATH + LOADS_GEO_JSON,
    pointType: 'circle',
    radiusUnits: 'meters',
    getPointRadius: 200,
    getFillColor: [255, 255, 255],
    getLineWidth: 0,
    visible: viewPoints
  })

  const glyphLayer = new GeoJsonLayer({
    id: 'glyphs',
    data: DATA_PATH + LOADS_GEO_JSON,
    pointType: 'circle',
    radiusUnits: 'meters',
    getPointRadius: s => {
      if (loading) {return 0}
      var load = +currentLoads[s.properties.ID];
      return 3 * (load + 100)
    },
    getFillColor: s => {
      if (loading) {return RDBU_COLOR_SCALE(1)}
      var load = +currentLoads[s.properties.ID];
      return RDBU_COLOR_SCALE(1-load/800)
    },
    updateTriggers: {
      getFillColor: currentLoads,
      getPointRadius: currentLoads,
    },
    getLineWidth: 0,
    visible: viewGlyphs
  })

  const columnLayer = new ColumnLayer({
    id: 'column-layer',
    data: DATA_PATH + LOADS_JSON,
    opacity: 0.9,
    diskResolution: 24,
    radius: 500,
    extruded: true,
    pickable: true,
    elevationScale: 10,
    getPosition: d => d.geometry.coordinates,
    getFillColor: s => {
      if (loading) {return RDBU_COLOR_SCALE(1)}
      var load = +currentLoads[s.ID];
      return RDBU_COLOR_SCALE(1-load/800)
    },
    getElevation: s => {
      if (loading) {return 0}
      var load = +currentLoads[s.ID];
      return load
    },
    updateTriggers: {
      getFillColor: currentLoads,
      getElevation: currentLoads,
    },
    getLineWidth: 0,
    visible: viewColumns
  })

  const hexLayer = new HexagonLayer({
    id: 'hex',
    data: DATA_PATH + LOADS_JSON,
    opacity: 0.9,
    filled: true,
    extruded: true,
    radius: 150*(3**(9-h3res)),
    elevationDomain: [0, 1000],
    elevationScale: 10,
    getElevationWeight: s => {
      if (loading) {return 0}
      var load = +currentLoads[s.ID];
      return load;
    },
    elevationAggregation: 'SUM',
    colorDomain: [0, 1000],
    colorRange: [
      [5,48,97],
      [33,102,172],
      [67,147,195],
      [146,197,222],
      [209,229,240],
      [247,247,247],
      [253,219,199],
      [244,165,130],
      [214,96,77],
      [178,24,43],
      [103,0,31]
  ],
    getColorWeight: s => {
      if (loading) {return 0}
      var load = +currentLoads[s.ID];
      return load;
    },
    colorAggregation: 'SUM',
    getPosition: d => {
      var coord = d.geometry.coordinates;
      return coord
    },
    updateTriggers: {
      getPosition: [currentLoads, h3res],
      getColorWeight: currentLoads,
      getElevationValue: currentLoads,
    },
    getLineWidth: 0,
    visible: viewHex
  })

  const h3Layer = new H3HexagonLayer({
    id: 'h3',
    data: DATA_PATH + LOADS_H3,
    pickable: true,
    wireframe: false,
    filled: true,
    extruded: true,
    getHexagon: d => {
      if (loading) {return null}
      if (d.res == h3res) {
        return d.h3
      }
      return null
    },
    getFillColor: d => {
      var load = d.sum / d.count
      return RDBU_COLOR_SCALE(1-load/5000)
    },
    getElevation: d => {
      var load = d.sum / d.count
      return load
    },
    updateTriggers: {
      getHexagon: [currentLoads, h3res],
      getFillColor: currentLoads,
      getElevation: currentLoads,
    },
    visible: viewH3,
  })

  const gridLayer = new GridLayer({
    id: 'grid',
    data: DATA_PATH + LOADS_JSON,
    opacity: 0.9,
    filled: true,
    extruded: true,
    cellSize: 250*(3**(9-h3res)),
    elevationDomain: [0, 1000],
    elevationScale: 10,
    getElevationWeight: s => {
      if (loading) {return 0}
      var load = +currentLoads[s.ID];
      return load;
    },
    elevationAggregation: 'SUM',
    colorDomain: [0, 1000],
    colorRange: [
      [5,48,97],
      [33,102,172],
      [67,147,195],
      [146,197,222],
      [209,229,240],
      [247,247,247],
      [253,219,199],
      [244,165,130],
      [214,96,77],
      [178,24,43],
      [103,0,31]
  ],
    getColorWeight: s => {
      if (loading) {return 0}
      var load = +currentLoads[s.ID];
      return load;
    },
    colorAggregation: 'SUM',
    getPosition: d => {
      var coord = d.geometry.coordinates;
      return coord
    },
    updateTriggers: {
      getPosition: [currentLoads, h3res], 
      getColorWeight: currentLoads,
      getElevationValue: currentLoads,
    },
    getLineWidth: 0,
    visible: viewGrid
  })

  const heatmapLayer = new HeatmapLayer({
    id: 'heatmap',
    data: DATA_PATH + LOADS_JSON,
    radiusPixels: 150,
    colorRange: [
      [5,48,97],
      [33,102,172],
      [67,147,195],
      [146,197,222],
      [209,229,240],
      [247,247,247],
      [253,219,199],
      [244,165,130],
      [214,96,77],
      [178,24,43],
      [103,0,31]
    ],
    intensity: 1,
    colorDomain: [0.1, 5],
    weightsTextureSize: 256,
    getPosition: d => {
      var coord = d.geometry.coordinates;
      return coord
    },
    getWeight: s => {
      if (loading) {return 0}
      var load = +currentLoads[s.ID];;
      return load;
    },
    aggregation: 'SUM',
    updateTriggers: {
      getWeight: currentLoads,
    },
    visible: viewHeatmap
  })

  // button styles
  const layerButtonStyle = (view, n) => {
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

  const infoButtonStyle = (n) => {
    return ({
    position: 'absolute', 
    right: 5 + 75*n, 
    top: 5,
    color: 'white',
    backgroundColor: 'black',
    border: 'none',
    padding: '10px',
    borderRadius: '10px',
    boxShadow: '0px 0px 10px 0 rgba(255, 255, 255, 0.2)'
  })};

  const skipButtonStyle = (n) => {
    return ({
    position: 'absolute', 
    right: 5 + 75*n, 
    top: 5,
    color: 'white',
    backgroundColor: 'green',
    border: 'none',
    padding: '10px',
    borderRadius: '10px',
    boxShadow: '0px 0px 10px 0 rgba(255, 255, 255, 0.2)'
  })};

  const playButtonStyle = (n) => {
    return ({
    position: 'absolute', 
    right: 5 + 75*n, 
    top: 5,
    color: 'white',
    backgroundColor: animate ? 'red' : 'green',
    border: 'none',
    padding: '10px',
    borderRadius: '10px',
    boxShadow: '0px 0px 10px 0 rgba(255, 255, 255, 0.2)'
  })};

  return (
      <DeckGL
        layers={[
          columnLayer,
          hexLayer,
          h3Layer,
          gridLayer,
          heatmapLayer,
          glyphLayer,
          pointsLayer
        ]}
        initialViewState={INITIAL_VIEW_STATE}
        controller={true}
        getTooltip={getTooltip}
      >
        <button 
          onClick = {() => togglePoints(!viewPoints)}
          style = {layerButtonStyle(viewPoints, 0.1)}> 
          Points
        </button>
        <button 
          onClick = {() => toggleGlyphs(!viewGlyphs)}
          style = {layerButtonStyle(viewGlyphs, 1)}> 
          Glyphs
        </button>
        <button 
          onClick = {() => toggleColumns(!viewColumns)}
          style = {layerButtonStyle(viewColumns, 2)}> 
          Columns
        </button>
        <button 
          onClick = {() => toggleHex(!viewHex)}
          style = {layerButtonStyle(viewHex, 3.1)}> 
          Hex
        </button>
        <button 
          onClick = {() => toggleH3(!viewH3)}
          style = {layerButtonStyle(viewH3, 3.8)}> 
          H3
        </button>
        <button 
          onClick = {() => toggleGrid(!viewGrid)}
          style = {layerButtonStyle(viewGrid, 4.4)}> 
          Grid
        </button>
        <button 
          onClick = {() => toggleHeatmap(!viewHeatmap)}
          style = {layerButtonStyle(viewHeatmap, 5.1)}> 
          Heatmap
        </button>
        <button 
          onClick = {() => stepTime(1)}
          style = {skipButtonStyle(0)}> 
          ►►
        </button>
        <button 
          onClick = {() => setAnimate(!animate)}
          style = {playButtonStyle(0.7)}> 
          {animate ? "■" : "►"}
        </button>
        <button 
         onClick = {() => stepTime(-1)}
          style = {skipButtonStyle(1.25)}> 
          ◄◄
        </button>        
        <button 
         onClick = {() => setSpeed(speed === 1 ? speed : speed / 2)}
          style = {skipButtonStyle(1.97)}> 
          ▼
        </button>
        <button 
         onClick = {() => setSpeed(speed * 2)}
          style = {skipButtonStyle(2.5)}> 
          ▲
        </button>
        <button 
          style = {infoButtonStyle(3.1)}> 
          Speed: {speed}x
        </button>
        <button 
          style = {infoButtonStyle(4.4)}> 
          Day: {day} 
        </button>
        <button 
          style = {infoButtonStyle(5.3)}> 
          Hour: {hour}
        </button>
        <button
          style = {infoButtonStyle(6.3)}>
          Res: {h3res}
        </button>
        <button 
         onClick = {() => setH3res(h3res < 8 ? h3res + 1 : h3res)}
          style = {skipButtonStyle(7.2)}> 
          ►
        </button>
        <button 
         onClick = {() => setH3res(h3res > 1 ? h3res - 1 : h3res)}
          style = {skipButtonStyle(7.7)}> 
          ◄
        </button>
        <img src="loading.gif" style={{position: 'absolute', left: '45%', top: '30%', width: 200, height: 200, opacity: 0.5, display: loading ? 'block' : 'none'}} />
        <Map reuseMaps mapLib={maplibregl} mapStyle={MAP_STYLE} preventStyleDiffing={true} />
      </DeckGL>
  );
}