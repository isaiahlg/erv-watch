# Vis DSS with Vite, React, and Deck.gl

This is an app for visualizing OpenDSS data using Vite, React, and Deck.gl. It's based on the template for vite.js + React, and the GeoJsonLayer example from deck.gl. 

<!-- insert an image from public called screenshot.png -->
![Screenshot](public/screenshot.png)
## Deck.gl
This is a minimal standalone version of the GeoJsonLayer (Polygons) example
on [deck.gl](http://deck.gl) website.

### Usage

Copy the content of this folder to your project. 

```bash
# install dependencies
npm install
# or
yarn
# bundle and serve the app with vite
npm start
```

### Data format

Sample data is stored in [deck.gl Example Data](https://github.com/visgl/deck.gl-data/tree/master/examples/geojson), showing the property values of Vancouver. [Source](http://data.vancouver.ca/)

To use your own data, check out
the [documentation of GeoJsonLayer](../../../docs/api-reference/layers/geojson-layer.md).

### Basemap

The basemap in this example is provided by [CARTO free basemap service](https://carto.com/basemaps). To use an alternative base map solution, visit [this guide](https://deck.gl/docs/get-started/using-with-map#using-other-basemap-services)


## Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh
