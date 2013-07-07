'use strict';

var path   =  require('path')
  , fs     =  require('fs')
  , mkdirp =  require('mkdirp')
  , runnel =  require('runnel')
  , HOME   =  path.join(__dirname, 'test', 'fixtures', 'home') // process.env.HOME
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

function defaultLoad (p, cb) {
  process.nextTick(function () {
    try {
      cb(null, require(p));
    } catch (err) {
      cb(err);
    }
  });
}

function defaultSerialize (config, cb) {
  process.nextTick(function () {
    try {
      var s = 'module.exports = ' + JSON.stringify(config)
      cb(null, s);
    } catch (err) {
      cb(err);
    }
  });
}


function noConfig (configFile, cb) {
  process.nextTick(cb.bind(null, null, null));
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

var go = module.exports = function (opts, cb) {
  opts = opts || {};

  var defaultConfig =  opts.defaultConfig || null
    , configDir     =  resolvePath(opts.configDir)
    , configFile    =  path.join(configDir, opts.configFile)
    , serialize     =  opts.serialize || defaultSerialize
    , edit          =  opts.edit


  var loadConfig = opts.loadConfig || defaultLoad;
  
  var tasks = [ runnel.seed(configFile), mkconfigDir ];

  fs.exists(configFile, function (exists) {
    if (!exists) { 
      if (defaultConfig) {
        tasks.push(copyDefaultConfig.bind(null, defaultConfig));
        tasks.push(loadConfig);
      } else {
        tasks.push(noConfig);
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

var edit = function (config, cb) {
  console.log('filling in', config);
  process.nextTick(function () {
    config.added = 'hello';
    cb(null, config);
  });
}

// -- emit events

var defaultConfig = path.join(__dirname, 'test', 'fixtures', 'defaults', 'cjs-empty.js');

try { fs.unlinkSync(path.join(HOME, '.config')); } catch (_) {}

go(
    { configDir     :  '.config'
    , configFile    :  'testlingify.js'
    , defaultConfig :  defaultConfig
    , edit          :  edit
    }
  , function (err, conf) {
    if (err) return console.error(err);
    console.log(conf);
});



