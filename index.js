'use strict';

var path    =  require('path')
  , fs      =  require('fs')
  , mkdirp  =  require('mkdirp')
  , runnel  =  require('runnel')
  , sinless =  require('sinless')
  , Emitter =  require('events').EventEmitter
  , format  =  require('util').format
  , inspect =  require('util').inspect
  , HOME    =  process.env.HOME
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
 * Supports several workflows to 'load existing or default or no configs/edit/save configuations'.
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
 * 
 * @name configurate
 * @function
 * @param opts {Object} allows overriding template functions and other options
 * each function may take a second parameter (a callback) in order to process asynchronously
 *  - configDir {String}     :  directory in which the config file resides (default $HOME) if it is relative, it is created relative to $HOME
 *  - configFile {String}    :  name of the config file which is combined with the configDir to build full config file path
 *  - defaultConfig {String} :  path to default config to load in case the config is not found at the config path
 *  - load {Function}        :  overrides config load function, default is `require('..')`
 *  - serialize {Function}   :  overrides serialization function, default creates `module.exports = { ... }`
 *  - edit {Function}        :  overrides edit function, be default config is not edited
 *
 * @param cb {Function} function (err) err is set if something went wront
 * @return {EventEmitter} which emits the following events:
 *  - created-configdir with the path to the created dir
 *  - copied-default    with the path to the default config that was copied and the path to which it was copied to
 *  - loaded-config     with the loaded config
 *  - notfound-config   with the object used to configure from scratch
 *  - edited-config     with the edited config object
 *  - serialized-config with the serialized config
 *  - wrote-config      with the path that the config was written to
 */
var go = module.exports = function configurate (opts, cb) {
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
