// a node.js module to interface with the Lockitron cloud API
//   cf., https://api.lockitron.com/

var events      = require('events')
  , oauth       = require('oauth')
  , util        = require('util')
  ;


var DEFAULT_LOGGER = { error   : function(msg, props) { console.log(msg); if (!!props) console.log(props);             }
                     , warning : function(msg, props) { console.log(msg); if (!!props) console.log(props);             }
                     , notice  : function(msg, props) { console.log(msg); if (!!props) console.log(props);             }
                     , info    : function(msg, props) { console.log(msg); if (!!props) console.log(props);             }
                     , debug   : function(msg, props) { console.log(msg); if (!!props) console.log(props);             }
                     };


var LockitronAPI = function(options) {
  var k;

  var self = this;

  if (!(self instanceof LockitronAPI)) return new LockitronAPI(options);

  self.options = options;
  if ((!self.options.clientID) || (!self.options.clientSecret)) throw new Error('clientID and clientSecret required');

  self.logger = self.options.logger  || {};
  for (k in DEFAULT_LOGGER) {
    if ((DEFAULT_LOGGER.hasOwnProperty(k)) && (typeof self.logger[k] === 'undefined'))  self.logger[k] = DEFAULT_LOGGER[k];
  }

  self.oauth2 = new oauth.OAuth2(self.options.clientID, self.options.clientSecret, 'https://api.lockitron.com',
                                 '/v1/oauth/authorize', '/v1/oauth/token');
};
util.inherits(LockitronAPI, events.EventEmitter);


LockitronAPI.prototype.setState = function(state) {
  var self = this;

  self.state = state;

  return self;
};

LockitronAPI.prototype.authenticateURL = function(redirectURL) {
  var params;

  var self = this;

  self.redirectURL = redirectURL
  params = { response_type : 'code'
           , redirect_uri  : redirectURL
           };

  return self.oauth2.getAuthorizeUrl(params);
};


LockitronAPI.prototype.authorize = function(code, state, callback) {
  var self = this;

  if (typeof callback !== 'function') throw new Error('callback is mandatory for login');

  self.oauth2.getOAuthAccessToken(code, { grant_type: 'authorization_code', redirect_uri: self.redirectURL },
                                  function (err, accessToken, refreshToken, results) {
    var json;

    if (!!err) {
      if ((!err.message) && (!!err.data)) {
        try { json = JSON.parse(err.data); err = new Error(err.statusCode + ': ' + json.error_description); } catch(ex) {}
      }
      return callback(err);
    }

    if (!!results.expires_in) self.expiresAt = new Date().getTime() + (results.expires_in * 1000);

    self.state = { accessToken  : accessToken
                 , refreshToken : refreshToken
                 , expiresAt    : self.expiresAt
                 };

    callback(null, self.state);
  });

  return self;
};


LockitronAPI.prototype.roundtrip = function(method, path, json, callback) {
  var self = this;

  if ((!callback) && (typeof json === 'function')) {
    callback = json;
    json = null;
  }

  return self.invoke(method, path, json, function(err, code, results) {
    callback(err, results);
  });
};

LockitronAPI.prototype.invoke = function(method, path, json, callback) {
  var headers;

  var self = this;

  if ((!callback) && (typeof json === 'function')) {
    callback = json;
    json = null;
  }
  if (!callback) {
    callback = function(err, results) {
      if (!!err) self.logger.error('invoke', { exception: err }); else self.logger.info(path, { results: results });
    };
  }

  var f = function(oops, body, response) {
      var expected = { GET    : [ 200 ]
                     , PUT    : [ 200 ]
                     , POST   : [ 200, 201, 202 ]
                     , DELETE : [ 200 ]
                     }[method];

      var results = {};

      if (!!oops) return callback(new Error(oops.data), oops.statusCode);

      try { results = JSON.parse(body); } catch(ex) {
        self.logger.error(path, { event: 'json', diagnostic: ex.message, body: body });
        return callback(ex, response.statusCode);
      }

      if (expected.indexOf(response.statusCode) === -1) {
         self.logger.error(path, { event: 'https', code: response.statusCode, body: body });
         return callback(new Error('HTTP response ' + response.statusCode), response.statusCode, results);
      }

      callback(null, response.statusCode, results);

  };

  if (method !== 'GET') {
    headers = { Authorization: self.oauth2.buildAuthHeader(self.state.accessToken) };
    if (!!json) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = json.length;
    }

    self.oauth2._request(method, 'https://api.lockitron.com/v1' + path, headers, json, null, f);
  } else self.oauth2._request(method, 'https://api.lockitron.com/v1' + path, {}, '', self.state.accessToken, f);

  return self;
};


exports.LockitronAPI = LockitronAPI;
