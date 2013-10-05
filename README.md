node-lockitron
==============

A node.js module to interface with the [Lockitron lock](https://lockitron.com).

First things first, go to your [Lockitron dashboard](https:/lockitron.com/dashboard) and sign up for API access.
This will take you to the API site where you can [create] a new _client ID_ and _access token_ which are tied to your account.


Install
-------

    npm install lockitron


API
---

Please consult the [Lockitron](http://locktron.com) API [documentation](https://api.lockitron.com)

### Load module

    var Lockitron = require('lockitron')
      , lockitron = new Lockitron.Lockitron()
      ;
    
### Login to cloud

    lockitron.on('error', function(err) {
      ...
    }).setConfig('$CLIENT_ID', '$ACCESS_TOKEN');

### Get list of locks

    lockitron.getDevices(function(err, results) {
      var devices, i;

      if (err) return console.log('getDevices: ' + err.message);

      devices = {};
      for (i = 0; i < results.length; i++) {       
        // useful properties in results[i].lock:
        //   { id: '...' , status: 'lock/unlock', name: '...', latitude: '???', longitude: '???' }

        devices[results[i].lock.id] = results[i];

        // inspect results[i]
      }
    }

### Lock or unlock

    lockitron.setDevice(deviceID, { status: 'lock' }, function(err, results) {
      if (err) return console.log('setDevice: ' + err.message);

      // inspect results
    });

Note that user management (inviting a user, editing their key, deleting access to a key) is not currently implemented.


Finally
-------

Enjoy!


License
-------

[MIT](http://en.wikipedia.org/wiki/MIT_License) license. Freely have you received, freely give.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
