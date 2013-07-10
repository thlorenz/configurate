'use strict';

var path        =  require('path')
  , fs          =  require('fs')
  , rmrf        =  require('rimraf')
  , configurate =  require('..')
  , log         =  require('npmlog')
  ;

var edit = function (config) {
  config.hello = 'world';
  config.hallo = 'welt';
  config.hola  = 'mundo';
  return config;
}

var defaultConfig =  path.join(__dirname, 'defaults', 'cjs-partial.js')
  , configDir     =  path.join(__dirname, 'config')
  , configFile    =  'configurate.js'
  ;

// clean up from previous example runs
try { rmrf.sync(configDir); } catch (err) { console.error(err); }

configurate(
    { configDir     :  configDir 
    , configFile    :  configFile
    , defaultConfig :  defaultConfig
    , edit          :  edit
    }
  , function (err) {
      if (err) return console.error(err);
      var conf = require(configDir + '/' + configFile);
      console.log(conf);
  }
)
.on('created-configdir', function (dir) { 
  log.info('configurator', 'created config dir at: ', dir); 
})
.on('copied-default', function (defaultConfig, conf) { 
  log.info('configurator', 'copied default config (%s) to (%s)', defaultConfig, conf); 
})
.on('loaded-config', function (conf) { 
  log.info('configurator', 'loaded config: ', conf); 
})
.on('notfound-config', function (conf) { 
  log.info('configurator', 'no config found'); 
})
.on('edited-config', function (conf) { 
  log.info('configurator', 'edited config: ', conf); 
})
.on('serialized-config', function (conf) { 
  log.info('configurator', 'serialized config: ', conf); 
})
.on('wrote-config', function (conf) { 
  log.info('configurator', 'wrote config: ', conf); 
})
