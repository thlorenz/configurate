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
  , configFile =  'load-edit-serialize-custom-edit.js'
  , configPath =  path.join(configDir, configFile)

function edit (config) {
  config.hello = 'world';
  return config;
}

test('\nload an existing config, edit and serialize it. custom: edit', function (t) {
  t.plan(6)
  
  var origConf                =  { orig: { id: 1, existed: true } };
  var expectedConf            =  { orig: { id: 1, existed: true }, hello: 'world' };
  var expectedSerializedConf  =  'module.exports = { orig: { id: 1, existed: true }, hello: \'world\' }'

  // clean up from previous example runs
  try { rmrf.sync(configDir); } catch (err) { console.error(err); }

  // pretend a config existed there already
  mkdirp.sync(configDir);
  fs.writeFileSync(configPath, 'module.exports = { orig: { id: 1, existed: true } }', 'utf8');

  configurate(
      { configDir     :  configDir 
      , configFile    :  configFile
      , edit          :  edit
      }
    , function (err) {
        if (err) return console.error(err);
        var conf = require(configPath);
        t.deepEqual(conf, expectedConf, 'calls back when done writing config with edits')
    }
  )
  .on('created-configdir', function (dir) { 
    t.equal(configDir, dir, 'emits created-configdir')
  })
  .on('copied-default', function (defaultConfig, conf) { 
    t.fail('should not emit copied-default')
  })
  .on('loaded-config', function (conf) { 
    t.deepEqual(conf, origConf, 'emits loaded-config with original config')
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
