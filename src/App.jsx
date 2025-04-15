import {useState, useEffect} from 'react';
import Map from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import DeckGL from '@deck.gl/react';
import {GeoJsonLayer} from '@deck.gl/layers';
import {interpolateRdBu} from 'd3-scale-chromatic';
import {csv} from 'd3-fetch';


const DATA_URL = 'data/';
const LINES_URL = DATA_URL + 'json/lines.geo.json';
const BUSES_URL = DATA_URL + 'json/buses.geo.json';

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
const getTooltip = ({object}) => JSON.stringify(object);

// primary component
export default function App() {
  const [viewLines, toggleLines] = useState(true);
  const [viewGlyphs, toggleGlyphs] = useState(true);
  
  const [allBuses, setAllBuses] = useState([]);
  
  const [loading, setLoading] = useState(true);

  // effect to fetch all data at the start of the app
  useEffect(() => { 
    const fetchData = async () => {
      setLoading(true);
      const buses = await csv(BUSES_URL);
      console.log("Fetched the bus data: ", buses)
      setAllBuses(buses);
      setLoading(false);
    };
    fetchData();
  }, []);

  console.log("All buses: ", allBuses) // do something with all buses

  // layers
  const lineLayer = new GeoJsonLayer({
    id: 'lines',
    data: LINES_URL,
    opacity: 0.1,
    getLineColor: [255, 255, 255],
    getLineWidth: 2,
    pickable: true,
    visible: viewLines
  })

  const glyphLayer = new GeoJsonLayer({
      id: 'glyphs',
      data: BUSES_URL,
      opacity: 0.8,
      filled: true,
      pointType: 'circle',
      radiusUnits: 'meters',
      getPointRadius: f => {
        var voltage = loading ? 1 : +f.properties.voltage
        return 800 * Math.abs(voltage-1.01)
      },
      getFillColor: f => {
        var voltage = loading ? 1 : +f.properties.voltage
        return RDBU_COLOR_SCALE(-20*(voltage-1) + 0.5)
      },
      updateTriggers: {
        getFillColor: [loading],
        getPointRadius: [loading]
      },
      getLineWidth: 0,
      pickable: true,
      visible: viewGlyphs
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

  return (
      <DeckGL
        layers={[
          glyphLayer,
          lineLayer
        ]}
        initialViewState={INITIAL_VIEW_STATE}
        controller={true}
        getTooltip={getTooltip}
      >
        <button 
          onClick = {() => toggleLines(!viewLines)}
          style = {layerButtonStyle(viewLines, 0.2)}> 
          Lines
        </button>
        <button 
          onClick = {() => toggleGlyphs(!viewGlyphs)}
          style = {layerButtonStyle(viewGlyphs, 1)}> 
          Glyphs
        </button>
        <img src="loading.gif" style={{position: 'absolute', left: '45%', top: '30%', width: 200, height: 200, opacity: 0.5, display: loading ? 'block' : 'none'}} />
        <Map reuseMaps mapLib={maplibregl} mapStyle={MAP_STYLE} preventStyleDiffing={true} />
      </DeckGL>
  );
}