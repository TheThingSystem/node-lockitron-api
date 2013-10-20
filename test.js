var Lockitron = require('./lockitron')
  , lockitron = new Lockitron.Lockitron()
  ;

lockitron.on('error', function(err) {
  console.log('lockitron error');
  console.error (err);
}).setConfig('1ddd4eb12eaba16e38f79272fb07a48e7a6bb7f17ecbad4d4e14a1cd362dfc12',
             'e1614db3a27c9c893968d4d6ce5f01118b720fca5fa77c5066bef08471a2a02f'
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
if(i>0)break;
    console.log('device #' + i + ' id=' + results[i].lock.id);
    console.log(JSON.stringify (results[i]));

    lockitron.setDevice(results[i].lock.id, { status: 'lock' } , f(results[i].lock.id));
  }
});
