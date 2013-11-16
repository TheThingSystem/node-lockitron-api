var Lockitron = require('./lockitron')
  , lockitron = new Lockitron.Lockitron()
  ;

lockitron.on('error', function(err) {
  console.log('lockitron error');
  console.error (err);
}).setConfig('...'
             '...'
).getDevices(function(err, results) {
  var f, i;

  if (err) return console.log('getDevices: ' + err.message);

  f = function(deviceID) {
    return function(err, results) {
      if (err) return console.log('setDevice ' + deviceID + ': ' + err.message);

      console.log(results);
    };
  };

  for (i = 0; i < results.length; i++) {
    console.log('device #' + i + ' id=' + results[i].lock.id);
    console.log(JSON.stringify (results[i]));

    lockitron.setDevice(results[i].lock.id, { status: 'lock' } , f(results[i].lock.id));
  }
});
