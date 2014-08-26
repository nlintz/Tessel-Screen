var stream = require('stream');

function hxlib () {

}

hxlib.prototype.getCommandPacket = function(commandString, args, callback) {

  if (!args) {
    args = {};
  }
  else if (typeof args === 'function') {
    callback = args;
    args = {};
  }

  // Grab the appropriate command packet constructor
  var command = hxlib.api[commandString];
  // If it exists
  if (command) {
    // Create it with provided args
    var packet = new command.construct(args);
    // Return packet
    if (callback) callback(null, packet);

    return;
  }
  else {
    // Return error
    if (callback) callback(new Error("Invalid Command."));

    return;
  }
};

function initPacket (args) {
  var initCommands = [
    {command: hxlib.commands.HX8340B_N_SETEXTCMD, args:[0xFF, 0x83, 0x40]},
    {command: hxlib.commands.HX8340B_N_SPLOUT, args:[]},
    {command: 0xCA, args:[0x70, 0x00, 0xD9]},
    {command: 0xB0, args:[0x01, 0x11]},
    {command: 0xC9, args:[0x90, 0x49, 0x10, 0x28, 0x28, 0x10, 0x00, 0x06]},
    {command: hxlib.commands.HX8340B_N_SETGAMMAP, args:[0x60, 0x71, 0x01, 0x0E, 0x05, 0x02, 0x09, 0x31, 0x0A]},
    {command: hxlib.commands.HX8340B_N_SETGAMMAN, args:[0x67, 0x30, 0x61, 0x17, 0x48, 0x07, 0x05, 0x33]},
    {command: hxlib.commands.HX8340B_N_SETPWCTR5, args:[0x35, 0x20, 0x45]},
    {command: hxlib.commands.HX8340B_N_SETPWCTR4, args:[0x33, 0x25, 0x4c]},
    {command: hxlib.commands.HX8340B_N_COLMOD, args:[0x05]},
    {command: hxlib.commands.HX8340B_N_DISPON, args:[]},
    {command: hxlib.commands.HX8340B_N_CASET, args:[0x00, 0x00, 0x00, 0xaf]},
    {command: hxlib.commands.HX8340B_N_PASET, args:[0x00, 0x00, 0x00, 0xdb]},
    {command: hxlib.commands.HX8340B_N_RAMWR, args:[]},
  ];

  this.readStream = stream.Readable();
  this.readStream._read = function () {
  }

  for (var i = 0; i<initCommands.length; i++) {
    var command = initCommands[i];
    var commandData = command.command;
    var spiCommand = spiConverter(commandData, 0);

    this.readStream.push(new Buffer(spiCommand));
    if (command.args.length > 0) {
      var temp = [];
    }

    for (var j = 0; j<command.args.length; j++) {
      var data = command.args[j];
      var spiData = spiConverter(data, 1);
      temp.push(spiData[0]);
      temp.push(spiData[1]);
    }
    this.readStream.push(new Buffer(temp));
  }
  this.readStream.push(null);
}

function setWindowPacket (args) {
  var setWindowCommands = [
    {command: hxlib.commands.HX8340B_N_CASET, args:[0, args.x0, 0, args.x1]},
    {command: hxlib.commands.HX8340B_N_PASET, args:[0, args.y0, 0, args.y1]},
    {command: hxlib.commands.HX8340B_N_RAMWR, args:[]},
  ];

  var buff = [];
  for (var i = 0; i<setWindowCommands.length; i++) {
    var command = setWindowCommands[i];
    var commandData = command.command;
    var spiCommand = spiConverter(commandData, 0);
    buff.push(spiCommand);

    for (var j = 0; j<command.args.length; j++) {
      var data = command.args[j];
      var spiData = spiConverter(data, 1);
      buff.push(spiData);
    }
  }
  this.buffer = new Buffer([].concat.apply([], buff));
}

function colorPacket (args) {
  var colors = {
    black: 0x0000,
    blue: 0x001F,
    red: 0xF800,
    green: 0x07E0,
    cyan: 0x07FF,
    magenta: 0xF81F,
    yellow: 0xFFE0,
    white: 0xFFFF
  }

  if (typeof(args.color) == 'string')
  {
    var color = colors[args.color];
  }
  else if (typeof(args.color) == 'number') {
    var color = args.color;
  }

  var hi = spiConverter((color >> 8), 1);
  var lo = spiConverter((color & 0xFF), 1);

  this.buffer = new Buffer([hi[0], hi[1], lo[0], lo[1]]);
}

hxlib.api = {
  'init': {construct:initPacket},
  'setWindow': {construct:setWindowPacket},
  'setColor': {construct:colorPacket},
};

// Commands
hxlib.commands = {
  HX8340B_N_SETEXTCMD:0xC1,
  HX8340B_N_SPLOUT:0x11,
  HX8340B_N_SETGAMMAP:0xC2,
  HX8340B_N_SETGAMMAN:0xC3,
  HX8340B_N_SETPWCTR5:0xB5,
  HX8340B_N_SETPWCTR4:0xB4,
  HX8340B_N_COLMOD:0x3A,
  HX8340B_N_DISPON:0x29,
  HX8340B_N_CASET:0x2A,
  HX8340B_N_PASET:0x2B,
  HX8340B_N_RAMWR:0x2C
}

// Helpers
function spiConverter(data, msb) {
  if (data > 255) {
    data = 255;
  };
  var byte1 = (msb << 7) + (data >> 1);
  var byte2 = (data << 7) & (1 << 7);
  return [byte1, byte2];
}

module.exports = hxlib;