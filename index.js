var request = require('request');
var PythonShell = require('python-shell');
var Relayr = require('relayr');

//adafruit aioKey
var aioKey = process.env.AIO_KEY;

//relayr information
var app_id = process.env.APP_ID;
var token = process.env.TOKEN;
var dev_id = process.env.DEVICE_ID;
var topic = process.env.TOPIC;

var options = {
  url: 'https://io.adafruit.com/api/feeds/586533',
  headers: {
    'X-AIO-KEY' : aioKey
  }
};

var pyOptions = {};
var state = "0";

var relayr = new Relayr(app_id);
relayr.connect(token, dev_id);

relayr.on('connect', function() {
  callAdafruit();
});

relayr.on('data', function(topic, msg) {
  if (msg.readings[0].meaning == "temperature") {
    console.log(msg.readings[0].value);
    if (msg.readings[0].value >= 30.3 && state != "off") {
      pyOptions.args = ['off'];
      PythonShell.run('servo2.py', pyOptions, function(err, results) {
        if (err) console.log(err);
        console.log(results);
      });
      state = "off";
    }
  }
});


function callAdafruit() {
  request(options, function (err, res, body) {
    if (err) {
      console.log("error");
    } else {
      var data = JSON.parse(body);
      console.log(data.last_value);

      if (state === "off") {
        setTimeout(function() {
          state = "0";
          callAdafruit();
        }, 20000);
      } else if (state === data.last_value) {
        console.log("value hasn't changed");
      } else {
        switch(data.last_value) {
          case "0":
            pyOptions.args = ['off'];
            PythonShell.run('servo2.py', pyOptions, function(err, results){
              if (err) console.log(err);
              console.log(results);
            });
            state = data.last_value;
            console.log("value changed to " + state);
            break;
          case "50":
            pyOptions.args = ['low'];
            PythonShell.run('servo2.py', pyOptions, function(err, results){
              if (err) console.log(err);
              console.log(results);
            });
            state = data.last_value;
            console.log("value changed to " + state);
            break;
          case "100":
            pyOptions.args = ['on'];
            PythonShell.run('servo2.py', pyOptions, function(err, results){
              if (err) console.log(err);
              console.log(results);
            });
            state = data.last_value;
            console.log("value changed to " + state);
            break;
          default:
            pyOptions.args = ['off'];
            PythonShell.run('servo2.py', pyOptions, function(err, results){
              if (err) console.log(err);
              console.log(results);
            });
        }
      }

      setTimeout(function() {
        callAdafruit();
      }, 5000);
    }
  });
}
