var LockitronAPI = require('./lockitron-api')
  , http         = require('http')
  , moira        = require('moira')
  , url          = require('url')
  , util         = require('util')
  ;

var clientID     = '...'
  , clientSecret = '...'
  , portno       = { external: 8894, local: 8894 }
  , clientState
  ;


var client;



// this code assumes that your external IP address + portno.external is mapped to your your local IP's portno.local

moira.getIP(function(ipaddr, service) {/* jshint unused: false */
  http.createServer(function(request, response) {
    if (request.method !== 'GET') return webhook(request, response);

    request.on('data', function(chunk) {/* jshint unused: false */
    }).on('close', function() {
      console.log('http error: premature close');
    }).on('clientError', function(err, socket) {/* jshint unused: false */
      console.log('http error: ' + err.message);
    }).on('end', function() {
      var parts, requestURL;

      parts = url.parse(request.url, true);
      if (!!parts.query.code) {
        if (!parts.query.state) return console.log('invalid response from server');

        client = clients[parts.query.state];
        if (!client) return console.log('cross-site request forgery suspected');

        client.authorize(parts.query.code, parts.query.state, function(err, user, state) {
          if (!!err) return console.log('authorization error: ' + err.message);

          // remember state as clientState
         console.log(util.inspect(state, { depth: null }));

          getToWork(client);
        });

        response.writeHead(200, {'content-length' : 0 });
        return response.end();
      }

      client = new LockitronAPI.LockitronAPI({ clientID: clientID , clientSecret: clientSecret }).on('error', function(err) {
        console.log('background error: ' + err.message);
      });

      requestURL = client.authenticateURL(null, 'http://' + ipaddr + ':' + portno.external + '/');
      parts = url.parse(requestURL, true);
      clients[parts.query.state] = client;

      response.writeHead(307, { location: requestURL, 'content-length' : 0 });
      response.end();
    });
  }).listen(portno.local, function() {
    if (!clientState) return console.log('please connect to http://localhost:' + portno.local + ' to authorize application');

    console.log('listening on port ' + portno.local + ' for incoming connections to http://' + ipaddr + ':' + portno.external);
    client = new LockitronAPI.LockitronAPI({ clientID: clientID , clientSecret: clientSecret }).on('error', function(err) {
      console.log('background error: ' + err.message);
    }).setState(clientState);

    getToWork(client);
  });
});

var webhook = function (request, response) {
  var body = '';

  request.setEncoding('utf8');
  request.on('data', function(chunk) {
    body += chunk.toString();
  }).on('close', function() {
    console.log('http error: premature close');
  }).on('clientError', function(err, socket) {/* jshint unused: false */
    console.log('http error: ' + err.message);
  }).on('end', function() {
// TBD: webhook API not yet defined
  });
};

var getToWork = function(client) {
  client.roundtrip('GET', '/locks', null, function(err, results) {
    if (!!err) return console.log('/locks: ' + err.message);

    console.log('locks');
    console.log(util.inspect(results, { depth: null }));
  });
};
