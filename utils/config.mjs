import merger from 'json-merger';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync, existsSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const __config_base = `${__dirname}/../config.json`;
const __config_user = process.argv[2] ? `${__dirname}/../${process.argv[2]}` : `${__dirname}/../config.local.json`;
let config = {};

try {

  // Read base config file
  if ( existsSync(__config_base) ) {
    config = JSON.parse(readFileSync(__config_base));
  }

  // Merge with user config file, if exists
  if ( existsSync(__config_user) ) {
    let config_user = JSON.parse(readFileSync(__config_user));
    config = merger.mergeObjects([config, config_user]);
  }

}
catch (err) {
  console.log(`Error loading the config files [${__config_base}] [${__config_user}]`);
  console.log(err);
}

export default config;