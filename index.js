var request = require('request');
var PythonShell = require('python-shell');
var Relayr = require('relayr');

//relayr information
var app_id = process.env.APP_ID;
var token = process.env.TOKEN;
var dev_id = process.env.DEVICE_ID;
var topic = process.env.TOPIC;

// Global variable for current state (ex: On/Off)
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
      pythonCommand('off');
      state = "off";
    }
  }
});

//adafruit information
var aioKey = process.env.AIO_KEY;
var options = {
  url: 'https://io.adafruit.com/api/feeds/586533',
  headers: {
    'X-AIO-KEY' : aioKey
  }
};

function callAdafruit() {
  request(options, function (err, res, body) {

    if (err) {
      console.log("error");
    }

    if (res.statusCode != 200) {
      // TODO: write a function to handle different statusCodes
      console.log("WARNING: API Rate limit reached.  Waiting 15 seconds before retrying.");
      setTimeout(function() {
        callAdafruit();
      }, 15000);
    } else {
      var data = JSON.parse(body);
      console.log(data.last_value);

      if (state === "off") {
        // Emergency shut off, wait 20 seconds before allowing user input again.
        setTimeout(function() {
          state = "0";
          callAdafruit();
        }, 20000);
      } else if (state === data.last_value) {
        console.log("value hasn't changed");
      } else {
        switch(data.last_value) {
          case "0":
            pythonCommand('off');
            state = data.last_value;
            console.log("value changed to " + state);
            break;
          case "50":
            pythonCommand('low');
            state = data.last_value;
            console.log("value changed to " + state);
            break;
          case "100":
            pythonCommand('on');
            state = data.last_value;
            console.log("value changed to " + state);
            break;
          default:
            pythonCommand('off');
        }
      }

      setTimeout(function() {
        callAdafruit();
      }, 5000);
    }
  });
}

function pythonCommand(command) {
  var pyOptions = {
    "args": command
  };

  PythonShell.run('servo2.py', pyOptions, function(err, results) {
    if (err) console.log(err);
    console.log(results);
  });
}
