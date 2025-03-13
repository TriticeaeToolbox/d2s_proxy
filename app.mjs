import express from 'express'
import config from './utils/config.mjs'
import { getOrthos, getCoords } from './utils/d2s.mjs'


const app = express();


app.get('/', (req, res) => {
  res.send(`
    <h1>D2S Proxy Server</h1>
    <p><strong>D2S API: </strong>${config.d2s.host}</p>  
  `);
});

app.get('/orthos/:project', async (req, res) => {
  const { project } = req.params;
  console.log(`[GET] /orthos/${project}`);
  try {
    const orthos = await getOrthos(project);
    res.send(orthos);
  }
  catch (error) {
    res.send({ success: false, error: `ERROR: Could not get project orthos [${error}]` });
  }
});

app.get('/coords/:project', async (req, res) => {
  const { project } = req.params;
  console.log(`[GET] /coords/${project}`);
  try {
    const orthos = await getCoords(project);
    res.send(orthos);
  }
  catch (error) {
    res.send({ success: false, error: `ERROR: Could not get project geo coordinates [${error}]` });
  }
});


// Start the server on the configured port
app.listen(config.port, () => {
  console.log(`D2S Proxy Server listening on port ${config.port}`);
});