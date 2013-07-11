'use strict';

var path        =  require('path')
  , rmrf        =  require('rimraf')
  , configurate =  require('..')
  , log         =  require('npmlog')
  , promfig     =  require('promfig')
  ;

var properties = { 
    user      :  'Please enter your username :  '
  , password  :  'Please enter your password :  '
  , '@secret' :  'password'
};

// for more info see: https://github.com/thlorenz/promfig
var edit = promfig.bind(null, properties);

var defaultConfig =  path.join(__dirname, 'defaults', 'cjs-partial.js')
  , configDir     =  path.join(__dirname, 'config')
  , configFile    =  'configurate.js'
  ;

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
    }
)
.on('created-configdir', function (dir) { 
  log.info('configurator', 'created config dir at: ', dir); 
})
.on('notfound-config', function (conf) { 
  log.info('configurator', 'no existing config found and no default supplied, starting from scratch'); 
})
;
