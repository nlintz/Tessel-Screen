var tessel = require('tessel');
var lcd = require('../').use(tessel.port['A']);

lcd.on('ready', function(){
  console.log('ready')
  // lcd.fillScreen("red");
})