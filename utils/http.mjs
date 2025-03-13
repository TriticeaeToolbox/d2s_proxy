import config from './config.mjs';
import * as https from 'https';
import * as http from 'http';

const net = config.d2s.proto === 'http' ? http : https;

const AUTH = {};
const MAX_AUTH_AGE = 5*86400000; // 5 days


const get = async (path) => {
  try {
    const data = await request('GET', path);
    return { data };
  }
  catch (error) {
    return { error };
  }
}

const login = async () => {
  try {
    await request('POST', '/auth/access-token', { username: config.d2s.user, password: config.d2s.pass });
  }
  catch (error) {
    console.log(`LOGIN ERROR: ${error}`);
  }
}


const request = async (method, path, body = {}) => {
  return new Promise(async (resolve, reject) => {

    // Login first if we don't have an auth token
    if ( !AUTH.cookie || AUTH.cookie === '' || !AUTH.expires || !AUTH.expires === '' || AUTH.expires < new Date().getTime() ) {
      if ( path !== '/auth/access-token' ) {
        await login();
      }
    }

    console.log(`PROXY: [${method}] ${path}`);

    // Set Request options
    const options = {
      method,
      hostname: config.d2s.host,
      path: `${config.d2s.base}${path}`,
      headers: {
        'Cookie': AUTH.cookie || '',
        'User-Agent': 'T3 D2S Proxy Server'
      }
    }

    // Add post data, if making a POST request
    let postData;
    if ( method === 'POST' ) {
      postData = new URLSearchParams(body).toString();
      options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    // Make the HTTP Request
    const request = net.request(options, (res) => {

      // Catch all of the chunks of data
      let data = ''
      res.on('data', (chunk) => {
        data += chunk;
      });

      // Handle and parse the response
      res.on('end', () => {
        try {
          let resp = JSON.parse(data);
          resolve(resp);
        }
        catch (err) {
          reject(`Could not parse response [${err}]`);
        }
      });

    }).on("error", (err) => {
      reject(`Could not make HTTP request [${err}]`);
    }).on("response", (response) => {
      if ( response?.headers && response.headers.hasOwnProperty('set-cookie') ) {
        AUTH.cookie = response.headers['set-cookie'];
        AUTH.expires = new Date().getTime() + MAX_AUTH_AGE;
      }
    });
    
    // Write the data to the request object
    if ( method === 'POST' ) {
      request.write(postData);
    } 

    // End the request object
    request.end();

  });
}

export { get }
