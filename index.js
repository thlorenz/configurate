'use strict';

var path    =  require('path')
  , fs      =  require('fs')
  , mkdirp  =  require('mkdirp')
  , runnel  =  require('runnel')
  , sinless =  require('sinless')
  , Emitter =  require('events').EventEmitter
  , format  =  require('util').format
  , inspect =  require('util').inspect
  , HOME    =  path.join(__dirname, 'test', 'fixtures', 'home') // process.env.HOME
  ;

function copy(srcFile, tgtFile, cb) {
  var readStream = fs.createReadStream(srcFile)
    , writeStream = fs.createWriteStream(tgtFile); 

  writeStream
    .on('close', cb)
    .on('error', cb); 

  readStream
    .on('error', cb);

  readStream.pipe(writeStream);
}

function copyDefaultConfig(defaultConfig, configFile, cb) {
  copy(defaultConfig, configFile, function (err) {
    cb(err, configFile);  
  });
}

function mkconfigDir (configFile, cb) {
  // does nothing if dir already exists
  var dir = path.dirname(configFile);
  mkdirp(dir, function (err) {
    cb(err, configFile);
  });
}

function resolvePath (p) {
  if (!p) return HOME;

  var isFullPath = p === path.resolve(p);

  // by default place the config dir inside the user's home
  return isFullPath ? p : path.join(HOME, p);
}

function defaultLoad (p) {
  return require(p);
}

function defaultSerialize (config) {
  return 'module.exports = ' + inspect(config)
}

function noConfigFound (configFile) {
  return {};
}

function writeConfig (configFile, config, cb) { 
  fs.writeFile(configFile, config, 'utf8', function (err) {
    cb(err, configFile);  
  });
}

/**
 * 
 * Possible workflows:
 *
 *  config exists:
 *    - mkdir
 *    - load config
 *    - edit loaded config
 *    - serialize edited config
 *    - write config
 *
 *  config doesn't exist and default config is given:
 *    - mkdir
 *    - copy default config
 *    - load copied config
 *    - edit loaded config
 *    - serialize edited config
 *    - write config
 *
 *  config doesn't exist and no default config is given:
 *    - mkdir
 *    - edit config starting from scratch ( {} ) 
 *    - serialize edited config
 *    - write config
 *    
 * @name 
 * @function
 * @return void
 */
var go = module.exports = function (opts, cb) {
  opts = opts || {};

  var events = new Emitter();

  function emit (name, arg) { 
    return sinless(function (passthru) {
      if (!arg) arg = passthru;
      events.emit(name, arg, passthru);
      return passthru;
    });
  }

  var configDir     =  resolvePath(opts.configDir)
    , configFile    =  path.join(configDir, opts.configFile)
    ;
    
  var defaultConfig =  opts.defaultConfig     || null
    , serialize     =  sinless(opts.serialize || defaultSerialize)
    , edit          =  opts.edit ? sinless(opts.edit) : null
    , notfound      =  sinless(noConfigFound)
    ;

  var load = sinless(opts.load || defaultLoad);
  
  var tasks = [ 
      runnel.seed(configFile)
    , mkconfigDir 
    , emit('created-configdir', configDir) 
  ];

  fs.exists(configFile, function (exists) {
    if (!exists) { 
      if (defaultConfig) {
        // config didn't exist but we were supplied a default config
        tasks = tasks.concat(
          [ copyDefaultConfig.bind(null, defaultConfig)
          , emit('copied-default', defaultConfig) 
          , load
          , emit('loaded-config') 
          ]
        );
      } else {
        // config didn't exist and we were not given a default config
        tasks = tasks.concat(
          [ notfound
          , emit('notfound-config')
          ]
        );
      }
    } else {
      // config existed
      tasks = tasks.concat(
        [ load
        , emit('loaded-config') 
        ]
      );
    }

    if (edit) {
      tasks = tasks.concat(
        [ edit
        , emit('edited-config') 
        ]
      )
    }

    tasks = tasks.concat(
      [ serialize
      , emit('serialized-config') 
      , writeConfig.bind(null, configFile)
      , emit('wrote-config') 
      , cb 
      ]
    )

    runnel(tasks);
  });

  return events;
};
