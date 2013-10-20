var events      = require('events')
  , https       = require('https')
  , querystring = require('querystring')
  , url         = require('url')
  , util        = require('util')
  ;

var DEFAULT_CONFIG = { client_id    : ''
                     , access_token : ''
                     };

var DEFAULT_LOGGER = { error   : function(msg, props) { console.log(msg); if (!!props) console.trace(props.exception); }
                     , warning : function(msg, props) { console.log(msg); if (!!props) console.log(props);             }
                     , notice  : function(msg, props) { console.log(msg); if (!!props) console.log(props);             }
                     , info    : function(msg, props) { console.log(msg); if (!!props) console.log(props);             }
                     , debug   : function(msg, props) { console.log(msg); if (!!props) console.log(props);             }
                     };

var Lockitron = function() {
    var k;

    if (!(this instanceof Lockitron)) return new Lockitron();

    this.devices = null;
    this.config = {};
    for (k in DEFAULT_CONFIG) if (DEFAULT_CONFIG.hasOwnProperty(k)) this.config[k] = DEFAULT_CONFIG[k];
    this.logger = DEFAULT_LOGGER;
};
util.inherits(Lockitron, events.EventEmitter);

Lockitron.prototype.setConfig = function(clientID, accessToken) {
  this.config.client_id = clientID;
  this.config.access_token = accessToken;

  return this;
};

Lockitron.prototype.getDevices = function(callback) {
  var self = this;

  return this.invoke('v1/locks', self.config, null, callback);
};

Lockitron.prototype.setDevice = function(deviceID, properties, callback) {
  var self = this;

  if (typeof properties === 'function') {
    callback = properties;
    properties = null;
  }

  if (!properties) properties = { status: 'lock' };
  if (!callback) callback = function(err, results) { if (err) self.logger.error(err.message); else self.logger.info(results); };

  return this.invoke('v1/locks/' + deviceID + '/' + (properties.status || 'lock'), null, 
                     querystring.stringify({ access_token: self.config.access_token }), callback);
};

Lockitron.prototype.invoke = function(path, get, post, callback) {
  var options, self;

  self = this;

  if (!callback) callback = function(err, results) { if (err) self.logger.error(err.message); else self.logger.info(results); };

  options = url.parse('https://api.lockitron.com/' + path + ((!!get) ? ('?' + querystring.stringify(get)) : ''));
  options.method = (!!post) ? 'POST' : 'GET';
  options.headers = { Accept: 'application/json' };
console.log('>>> options=' + JSON.stringify(options));
console.log('>>> post=' + JSON.stringify(post));
  https.request(options, function(response) {
    var content = '', err = null;

    if (response.statusCode != 200) {
      err = new Error('server returned HTTP status code ' + response.statusCode);
      self.logger.error('https', { exception: err });
      return callback(err, null);
    }

    response.setEncoding('utf8');
    response.on('data', function(chunk) {
      content += chunk.toString();
    }).on('end', function() {
      var results;

      try { results = JSON.parse(content); } catch(ex) {
        self.logger.error('json', { exception: ex });
        return callback(ex, null);
      }
      callback(null, results);
    }).on('close', function() {
    self.logger.error('https', { exception: new Error('premature EOF') });
    });
  }).on('error', function(err) {
    self.logger.error('https', { exception: err });
  }).end(post);

  return this;
};

exports.Lockitron = Lockitron;
