'use strict';

var path        =  require('path')
  , fs          =  require('fs')
  , rmrf        =  require('rimraf')
  , configurate =  require('..')
  , mkdirp      =  require('mkdirp')
  , log         =  require('npmlog')
  ;

var edit = function (config) {
  config.hello = 'world';
  config.hallo = 'welt';
  config.hola  = 'mundo';
  return config;
}

function serialize (config) {
  return JSON.stringify(config, null, 2);
}

var configDir  =  path.join(__dirname, 'config')
  , configFile =  'configurate.json'
  ;

// clean up from previous example runs
try { rmrf.sync(configDir); } catch (err) { console.error(err); }

// pretend a config existed there already
mkdirp.sync(configDir);
fs.writeFileSync(path.join(configDir, configFile), '{ "id": 1, "existed": true }', 'utf8');

configurate(
    { configDir     :  configDir 
    , configFile    :  configFile
    , edit          :  edit
    , serialize     :  serialize
    }
  , function (err) {
      if (err) return console.error(err);
      var conf = require(configDir + '/' + configFile);
      console.log(conf);
  }
)
.on('loaded-config', function (conf) { 
  log.info('configurator', 'loaded config: ', conf); 
})
.on('serialized-config', function (conf) { 
  log.info('configurator', 'serialized config (json): ', conf); 
})
