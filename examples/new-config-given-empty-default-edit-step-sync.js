'use strict';

var path        =  require('path')
  , fs          =  require('fs')
  , rmrf        =  require('rimraf')
  , log         =  require('npmlog')
  , configurate =  require('..')
  ;

var edit = function (config) {
  config.hello = 'world';
  config.hallo = 'welt';
  config.hola  = 'mundo';
  return config;
}

var defaultConfig =  path.join(__dirname, 'defaults', 'cjs-empty.js')
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
  , function (err, config, configPath) {
      if (err) return console.error(err);

      log.info('done', 'config:\n', config);
      log.info('done', 'stored at:', configPath);

      fs.readFile(configPath, 'utf8', function (err, text) {
        if (err) return console.error(err);
        log.info('done', 'as:\n', text);
      });
  }
);



