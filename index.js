'use strict';

var path =  require('path')
  , fs   =  require('fs')
  , HOME =  process.env.HOME
  ;

function resolvePath(p) {
  if (!p) return HOME;

  var isFullPath = p === path.resolve(p);

  // by default place the config dir inside the user's home
  return isFullPath ? p : path.join(HOME, p);
}

var go = module.exports = function (opts) {
  var defaultConfig =  opts.defaultConfig || null
    , configDir     =  resolvePath(opts.configDir)
    , configFile    =  path.join(configDir, opts.configFile);

  console.error('configFile: ', configFile);
};

go({ configFile: 'testlingify.js' });
