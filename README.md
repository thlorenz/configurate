# configurate [![build status](https://secure.travis-ci.org/thlorenz/configurate.png)](http://travis-ci.org/thlorenz/configurate)

Resolves a config with the given method or creates one from a given default or creation method.

**simple.js**

```js
var path        =  require('path')
  , rmrf        =  require('rimraf')
  , configurate =  require('configurate')
  , log         =  require('npmlog')
  , promfig     =  require('promfig')
  ;

var properties = { 
    user      :  'Please enter your username :  '
  , password  :  'Please enter your password :  '
  , '@secret' :  'password'
};

// see: https://github.com/thlorenz/promfig
var edit = promfig.bind(null, properties);

var defaultConfig =  path.join(__dirname, 'defaults', 'cjs-partial.js')
  , configDir     =  path.join(__dirname, 'config')
  , configFile    =  'configurate.js'
  ;

configurate(
    { configDir     :  configDir 
    , configFile    :  configFile
    , defaultConfig :  defaultConfig
    , edit          :  edit
    }
  , function (err) {
      if (err) return console.error(err);
    }
)
.on('created-configdir', function (dir) { 
  log.info('configurator', 'created config dir at: ', dir); 
})
.on('notfound-config', function (conf) { 
  log.info('configurator', 'no existing config found and no default supplied, starting from scratch'); 
})
.on('serialized-config', function (conf) { 
  log.info('configurator', 'serialized config: ', conf); 
})
```

**default config - `cjs-partial`**:

```js
module.exports = {
    default          :  true
  , id               :  1
  , numberOfDefaults :  2
};
```

**output**:

```
➝  node examples/simple.js
info configurator created config dir at:  /Users/thlorenz/dev/js/projects/configurate/examples/config
Please enter your username : thlorenz
Please enter your password :  *********************************
info configurator serialized config:  module.exports = { default: true,
info configurator   id: 1,
info configurator   numberOfDefaults: 2,
info configurator   user: 'thlorenz',
info configurator   password: 'supersecretpasswordiuseeverywhere' }
```
[Many more examples](https://github.com/thlorenz/configurate/tree/master/examples)

## Installation

    npm install configurate

## API

###*function configurate (opts:Object, cb:Function) -> EventEmitter*

- **opts** allows overriding invoked functions and other options
  - **paths**
      - `configDir {String}`       directory in which the config file resides (default `$HOME`) if it is relative, it is created relative to `$HOME`
      - `configFile {String}`      name of the config file which is combined with the configDir to build full config file path
      - `defaultConfig {String}`   full path to default config to load in case the config is not found at the config path
  - **functions**
      - each function may take a second parameter (a callback) in order to process asynchronously
      - `load {Function}`          called with full path to config, default is `require('..')`
      - `edit {Function}`          called with loaded config object, by default config is not edited
      - `serialize {Function}`     called with edited config object, default creates `'module.exports = { ... }'`
 
- **cb** function (err) err is set if something went wrong

- **EventEmitter** emits the following events:
  - `created-configdir` with the path to the created dir
  - `copied-default`    with the path to the default config that was copied and the path to which it was copied to
  - `loaded-config`     with the loaded config
  - `notfound-config`   with the object used to configure from scratch
  - `edited-config`     with the edited config object
  - `serialized-config` with the serialized config
  - `wrote-config`      with the path that the config was written to

## Possible configuration workflows

Workflows are demonstrated in the [provided examples](https://github.com/thlorenz/configurate/tree/master/examples) and
[tests](https://github.com/thlorenz/configurate/tree/master/test).

### config exists
  - mkdir
  - load config
  - edit loaded config
  - serialize edited config
  - write config

### config doesn't exist and default config is given
  - mkdir
  - copy default config
  - load copied config
  - edit loaded config
  - serialize edited config
  - write config

### config doesn't exist and no default config is given
  - mkdir
  - edit config starting from scratch ( {} ) 
  - serialize edited config
  - write config

## License

MIT
