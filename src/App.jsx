import {useEffect, useState} from 'react';
import Map from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import DeckGL from '@deck.gl/react';
import {GeoJsonLayer} from '@deck.gl/layers';
import {csv} from 'd3-fetch';
import {interpolateRdBu} from 'd3-scale-chromatic';

const BUSES_URL = 'data/json/schools.geo.json';

// style map
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
const INITIAL_VIEW_STATE = {
  latitude: 37.49,
  longitude: -77.5,
  zoom: 11,
  maxZoom: 20,
  pitch: 60,
  bearing: 0
};
const toRGBArray = rgbStr => rgbStr.match(/\d+/g).map(Number);
const RDBU_COLOR_SCALE = v => toRGBArray(interpolateRdBu(v));
const getTooltip = ({object}) => JSON.stringify(object);

// primary component
export default function App() {
  const [viewBuses, toggleBuses] = useState(true);
  const [timestep, setTimestep] = useState(24);
  const [allLoads, setAllLoads] = useState([]);
  const [currentLoads, setCurrentLoads] = useState([]);
  const [animate, setAnimate] = useState(false);
  
  let hour = timestep % 24;
  let day = Math.floor(timestep / 24) % 7 + 1;
  
  // effect to fetch all data at the start of the app
  useEffect(() => { 
    const fetchData = async () => {
      const data = await csv('data/csv/hourly_load_timesteps.csv');
      console.log("Fetched the full load data: ", data)
      setAllLoads(data);
    };

    fetchData();
  }, []);

  // effect to animate the timestep
  useEffect(() => {
    if (animate) {
      const interval = setInterval(() => {
        setTimestep((timestep + 1) % 168)
      }, 100)
      return () => clearInterval(interval)
    }
  }, [animate, timestep])

  // effect to fetch loads for current timestep
  useEffect(() => {
    console.log("New timestep: ", timestep)
    const getLoadsByTimestep = (timestep) => {
      return allLoads.filter((l) => +l.timestep === timestep);
    };
    setCurrentLoads(getLoadsByTimestep(timestep));
    // console.log("Current loads: ", getLoadsByTimestep(timestep)) 
  }, [allLoads, timestep]);
  
  // function to update the timestep when buttons are clicked
  const stepTime = (hours) => {
    setTimestep(timestep + hours % 168);
  };

  const busLayer = new GeoJsonLayer({
    id: 'buses',
    data: BUSES_URL,
    pointType: 'circle',
    radiusUnits: 'meters',
    getPointRadius: s => {
      var power = +currentLoads.find(d => +d.school_id === s.properties.ID).power
      return power + 200
    },
    getFillColor: s => {
      var power = +currentLoads.find(d => +d.school_id === s.properties.ID).power
      return RDBU_COLOR_SCALE(1-power/800)
    },
    updateTriggers: {
      getFillColor: currentLoads,
      getPointRadius: currentLoads,
    },
    getLineWidth: 0,
    visible: viewBuses
  })

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
          busLayer,
        ]}
        initialViewState={INITIAL_VIEW_STATE}
        controller={true}
        getTooltip={getTooltip}
      >
        <button 
          onClick = {() => toggleBuses(!viewBuses)}
          style = {layerButtonStyle(viewBuses, 0.1)}> 
          Buses
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
          style = {playButtonStyle(2.2)}> 
          Day: {day} Hour: {hour}
        </button>
        <Map reuseMaps mapLib={maplibregl} mapStyle={MAP_STYLE} preventStyleDiffing={true} />
      </DeckGL>
  );
}
