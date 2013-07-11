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
  return Object.keys(config)
    .reduce(function (acc, k) {
      acc += k + '=' + config[k] + '\n';
      return acc
    }, '');
}

function deserialize (text) {
  var lines = text.split('\n');
  return lines
    .reduce(function (acc, l) {
      var parts = l.split('=');
      acc[parts[0]] = parts[1];
      return acc;
    }, {});
}

function load(fullPath, cb) {
  fs.readFile(fullPath, 'utf8', function (err, text) {
    if (err) return cb(err);
    cb(null, deserialize(text));
  });
}

var configDir  =  path.join(__dirname, 'config')
  , configFile =  'configurate.conf'
  ;

// clean up from previous example runs
try { rmrf.sync(configDir); } catch (err) { console.error(err); }

// pretend a config existed there already
mkdirp.sync(configDir);
fs.writeFileSync(path.join(configDir, configFile), 'name=Thorsten Lorenz\nlanguage=Javascript', 'utf8');

configurate(
    { configDir  :  configDir
    , configFile :  configFile
    , load       :  load
    , edit       :  edit
    , serialize  :  serialize
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
.on('loaded-config', function (conf) { 
  log.info('configurator', 'loaded config: ', conf); 
})
.on('serialized-config', function (conf) { 
  log.info('configurator', 'serialized config (text):\n', conf); 
})
.on('wrote-config', function (p) { 
  log.info('configurator', 'wrote config', p); 
})
