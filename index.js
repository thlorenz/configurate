'use strict';

var path =  require('path')
  , fs   =  require('fs')
  , HOME =  process.env.HOME
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

function resolvePath (p) {
  if (!p) return HOME;

  var isFullPath = p === path.resolve(p);

  // by default place the config dir inside the user's home
  return isFullPath ? p : path.join(HOME, p);
}

function defaultLoad (p, cb) {
  setTimeout(function () {
    try {
      cb(null, require(p));
    } catch (err) {
      cb(err);
    }
  }, 0);
}

var go = module.exports = function (opts, cb) {
  opts = opts || {};

  var defaultConfig =  opts.defaultConfig || null
    , configDir     =  resolvePath(opts.configDir)
    , configFile    =  path.join(configDir, opts.configFile);

  var loadConfig = opts.loadConfig || defaultLoad;
  
  fs.exists(configFile, function (exists) {
    if (exists) return loadConfig(configFile, cb);
    if (defaultConfig) console.error('TODO: copy default config and load it');
  });
};

var config = function (conf, cb) {
  console.log('filling in', conf);

}

go({ configDir: '.config', configFile: 'testlingify.js' }, function (err, conf) {
  if (err) return console.error(err);
  console.log(conf);
});
