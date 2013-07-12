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
  , configFile =  'copy-load-edit-serialize-custom-edit.js'
  , configPath =  path.join(configDir, configFile)

function edit (config) {
  config.hello = 'world';
  return config;
}

test('\nconfig does not exist, load default, edit and serialize it. custom: edit', function (t) {
  t.plan(11)
  
  var defaultConfPath         =  require.resolve('./fixtures/defaults/exports');
  var expectedConf            =  { orig: { id: 1, existed: true }, hello: 'world' };
  var expectedSerializedConf  =  'module.exports = { orig: { id: 1, existed: true }, hello: \'world\' }'

  // clean up from previous example runs
  try { rmrf.sync(configDir); } catch (err) { console.error(err); }

  // pretend  config didn't exit yet

  configurate(
      { configDir     :  configDir 
      , configFile    :  configFile
      , defaultConfig :  defaultConfPath
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
    t.equal(defaultConfig, defaultConfPath, 'emits copied-default with default config path')
    t.equal(conf, configPath, 'and target config path')
  })
  .on('loaded-config', function (path, conf) { 
    t.equal(path, configPath, 'emits loaded-config with config file path')
    t.deepEqual(conf, require(defaultConfPath), 'and default config')
  })
  .on('notfound-config', function (conf) { 
    t.fail('should not emit notfound-config')
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
