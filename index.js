'use strict';

var path    =  require('path')
  , fs      =  require('fs')
  , mkdirp  =  require('mkdirp')
  , runnel  =  require('runnel')
  , sinless =  require('sinless')
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
  return 'module.exports = ' + JSON.stringify(config)
}

function noConfigFound (configFile, cb) {
  setImmediate(cb.bind(null, null, null));
}

function noop (config) {
  return config;
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
 *    - edit config starting from scratch (null) 
 *    - serialize edited config
 *    - write config
 *    
 * @name 
 * @function
 * @return void
 */
// -- emit events
var go = module.exports = function (opts, cb) {
  opts = opts || {};

  var configDir     =  resolvePath(opts.configDir)
    , configFile    =  path.join(configDir, opts.configFile)
    ;
    
  var defaultConfig =  opts.defaultConfig     || null
    , serialize     =  sinless(opts.serialize || defaultSerialize)
    , edit          =  sinless(opts.edit      || noop)
    ;


  var loadConfig = sinless(opts.loadConfig || defaultLoad);
  
  var tasks = [ runnel.seed(configFile), mkconfigDir ];

  fs.exists(configFile, function (exists) {
    if (!exists) { 
      if (defaultConfig) {
        tasks.push(copyDefaultConfig.bind(null, defaultConfig));
        tasks.push(loadConfig);
      } else {
        tasks.push(noConfigFound);
      }
    } else {
      tasks.push(loadConfig);
    }

    tasks = tasks.concat(
      [ edit
      , serialize
      , fs.writeFile.bind(fs, configFile)
      , cb
      ]
    )

    runnel(tasks);
  });
};
