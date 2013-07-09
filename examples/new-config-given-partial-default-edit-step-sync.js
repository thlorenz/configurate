'use strict';

var path        =  require('path')
  , fs          =  require('fs')
  , rmrf        =  require('rimraf')
  , configurate =  require('..')
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
.on('any', console.error);
