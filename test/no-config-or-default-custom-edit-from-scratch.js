'use strict';
/*jshint asi: true */

var test = require('tap').test
var configurate = require('..')

var path   =  require('path')
  , fs     =  require('fs')
  , rmrf   =  require('rimraf')
  , mkdirp =  require('mkdirp')
  ;

var configDir  =  path.join(__dirname, 'fixtures', 'config')
  , configFile =  'no-config-or-default-custom-edit-from-scratch.js'
  , configPath =  path.join(configDir, configFile)

function edit (config) {
  config.hello = 'world';
  return config;
}

test('\nload an existing config, edit and serialize it. custom: edit', function (t) {
  t.plan(8)
  
  var expectedConf            =  { hello: 'world' };
  var expectedSerializedConf  =  'module.exports = { hello: \'world\' }'

  // clean up from previous example runs
  try { rmrf.sync(configDir); } catch (err) { console.error(err); }

  // pretend config doesn't exist 

  configurate(
      { configDir     :  configDir 
      , configFile    :  configFile
      , edit          :  edit
      }
    , function (err, conf_, configPath_) {
        if (err) return console.error(err);
        var conf = require(configPath);
        t.deepEqual(conf, expectedConf, 'calls back when done writing config with edits')
        t.deepEqual(conf_, expectedConf, 'and includes updated config object')
        t.equal(configPath_, configPath, 'and includes full config path')
      }
  )
  .on('created-configdir', function (dir) { 
    t.equal(configDir, dir, 'emits created-configdir')
  })
  .on('copied-default', function (defaultConfig, conf) { 
    t.fail('should not emit copied-default')
  })
  .on('loaded-config', function (conf) { 
    t.fail('should not emit loaded-config')
  })
  .on('notfound-config', function (conf) { 
    t.deepEqual(conf, {}, 'emits notfound-config with empty config')
  })
  .on('edited-config', function (conf) { 
    t.deepEqual(conf, expectedConf, 'emits edited-config with edited config')
  })
  .on('serialized-config', function (conf) { 
    t.deepEqual(conf, expectedSerializedConf, 'emits serialized-config with serialized config')
  })
  .on('wrote-config', function (p) { 
    t.equal(p, configPath, 'emits wrote-config with full config path')
  })
})
