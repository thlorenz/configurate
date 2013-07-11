'use strict';

var path        =  require('path')
  , fs          =  require('fs')
  , rmrf        =  require('rimraf')
  , configurate =  require('..')
  , log         =  require('npmlog')
  , promfig     =  require('promfig')
  ;

var properties = { 
    user      :  'Please enter your username :  '
  , password  :  'Please enter your password :  '
  , id        :  'Please enter a config id : '
  , '@secret' :  'password'
};

// promfig is async since it has to obtain user input
// for more info see: https://github.com/thlorenz/promfig
var edit = promfig.bind(null, properties);

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
  , function (err, config, configPath) {
      if (err) return console.error(err);

      log.info('done', 'config:\n', config);
      log.info('done', 'stored at:', configPath);

      fs.readFile(configPath, 'utf8', function (err, text) {
        if (err) return console.error(err);
        log.info('done', 'as:\n', text);
      });
    }
)
.on('created-configdir', function (dir) { 
  log.info('configurator', 'created config dir at: ', dir); 
})
.on('loaded-config', function (conf) { 
  log.info('configurator', 'loaded config: ', conf); 
})
.on('notfound-config', function (conf) { 
  log.info('configurator', 'no existing config found and no default supplied, starting from scratch'); 
})
.on('serialized-config', function (conf) { 
  log.info('configurator', 'serialized config: ', conf); 
})
