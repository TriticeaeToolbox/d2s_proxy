import config from './config.mjs';
import { get } from './http.mjs';

const getOrthos = async (project) => {
  const orthos = [];

  // Get all of the project's flights
  const { error, data:flights } = await get(`/projects/${project}/flights`);

  // Parse each flight
  if ( flights && Array.isArray(flights) ) {
    flights.forEach((f) => {

      // Parse the flight's data products
      if ( f.data_products ) {
        f.data_products.forEach((dp) => {

          // Only include ortho products
          if ( dp.data_type === 'ortho' ) {
            const url = dp.url + `?API_KEY=${config.d2s.apikey}`;
            const layer = config.tileserver.replaceAll('{url}', url);

            // Add data product info to list of orthos
            orthos.push({
              flight: f.id,
              sensor: f.sensor,
              platform: f.platform,
              data_product: dp.id,
              date: f.acquisition_date,
              url: layer,
              attribution: "Data2Science"
            });
          }

        });
      }

    });
  }

  return {
    error: error,
    success: !error && orthos.length > 0,
    orthos
  }
}


const getCoords = async (project) => {
  const coords = {};

  // Get the project's vector layers
  const { error:errorVL, data:vector_layers } = await get(`/projects/${project}/vector_layers`);

  // Get the vector layer that has a type of polygon
  let vector;
  if ( vector_layers && Array.isArray(vector_layers) ) {
    vector_layers.forEach((vl) => {
      if ( vl.geom_type === 'polygon' ) {
        vector = vl.layer_id;
      }
    });
  }

  // Download the vector layer
  const { error:errorGJ, data:geo_json } = await get(`/projects/${project}/vector_layers/${vector}/download?format=json`);
  
  // Parse each feature in the vector layer
  if ( geo_json.features && Array.isArray(geo_json.features) ) {
    geo_json.features.forEach((f) => {
      const plot = f.properties.properties.plot_num;
      coords[plot] = f;
    });
  }

  return {
    error: errorVL || errorGJ,
    success: !errorVL && !errorGJ && Object.keys(coords).length > 0,
    coords: coords
  }
}


export { getOrthos, getCoords }