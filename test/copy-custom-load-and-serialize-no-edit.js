'use strict';
/*jshint asi: true */

var test = require('tap').test
var configurate = require('..')

var path   =  require('path')
  , fs     =  require('fs')
  , rmrf   =  require('rimraf')
  , mkdirp =  require('mkdirp')
  ;

function load (p, cb) {
  fs.readFile(p, 'utf8', function (err, txt) {
    if (err) return cb(err);
    var entries = txt.trim('\n').split(',')
    var result = entries.reduce(function (acc, e) {
      var parts = e.split(':')
      acc[parts[0]] = parts[1];
      return acc;
    }, {});
    cb(null, result);
  });  
}

function serialize (conf) {
  return 'serialized: ' + JSON.stringify(conf);
}

var configDir  =  path.join(__dirname, 'fixtures', 'config')
  , configFile =  'copy-load-no-edit-serialize.js'
  , configPath =  path.join(configDir, configFile)

test('\nconfig does not exist, custom load default, no edit and custom serialize it', function (t) {
  t.plan(10)
  
  var defaultConfPath         =  require.resolve('./fixtures/defaults/custom.txt');
  var expectedConf            =  { id: '1', existed: 'true' };
  var expectedSerializedConf  =  'serialized: {"id":"1","existed":"true"}'

  // clean up from previous example runs
  try { rmrf.sync(configDir); } catch (err) { console.error(err); }

  // pretend config didn't exist yet

  configurate(
      { configDir     :  configDir 
      , configFile    :  configFile
      , defaultConfig :  defaultConfPath
      , load          :  load
      , serialize     :  serialize
      }
    , function (err, conf_, configPath_) {
        if (err) return console.error(err);
        var conf = fs.readFileSync(configPath, 'utf8')
        t.deepEqual(conf, expectedSerializedConf, 'calls back when done writing config with edits')
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
    t.deepEqual(conf, expectedConf, 'and default config')
  })
  .on('notfound-config', function (conf) { 
    t.fail('should not emit notfound-config')
  })
  .on('edited-config', function (conf) { 
    t.fail('should not emit edited-config')
  })
  .on('serialized-config', function (conf) { 
    t.deepEqual(conf, expectedSerializedConf, 'emits serialized-config with serialized config')
  })
  .on('wrote-config', function (p) { 
    t.equal(p, configPath, 'emits wrote-config with full config path')
  })
})
