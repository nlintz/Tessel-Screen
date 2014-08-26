var stream = require('stream');

function ili9341lib () {

}

ili9341lib.prototype.getCommandPacket = function(commandString, args, callback) {

  if (!args) {
    args = {};
  }
  else if (typeof args === 'function') {
    callback = args;
    args = {};
  }

  // Grab the appropriate command packet constructor
  var command = ili9341lib.api[commandString];
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
    {command: 0xEF, args:[0x03, 0x80, 0x02]},
    {command: 0xCF, args:[0x00, 0XC1, 0X30]},
    {command: 0xED, args:[0x64, 0x03, 0X12, 0X81]},
    {command: 0xE8, args:[0x85, 0x00, 0x78]},
    {command: 0xCB, args:[0x39, 0x2C, 0x00, 0x34, 0x02]},
    {command: 0xF7, args:[0x20]},
    {command: 0xEA, args:[0x00, 0x00]},
    {command: ili9341lib.commands.ILI9341_PWCTR1, args:[0x23]},
    {command: ili9341lib.commands.ILI9341_PWCTR2, args:[0x10]},
    {command: ili9341lib.commands.ILI9341_VMCTR1, args:[0x3e, 0x28]},
    {command: ili9341lib.commands.ILI9341_VMCTR2, args:[0x86]},
    {command: ili9341lib.commands.ILI9341_MADCTL, args:[0x48]},
    {command: ili9341lib.commands.ILI9341_PIXFMT, args:[0x55]},
    {command: ili9341lib.commands.ILI9341_FRMCTR1, args:[0x00, 0x18]},
    {command: ili9341lib.commands.ILI9341_DFUNCTR, args:[0x08, 0x82, 0x27]},
    {command: 0xF2, args:[0x00]},
    {command: ili9341lib.commands.ILI9341_GAMMASET, args:[0x01]},
    {command: ili9341lib.commands.ILI9341_GMCTRP1, args:[0x0F, 0x31, 0x2B, 0x0C, 0x0E, 0x08, 0x4E, 0xF1, 0x37, 0x07, 0x10, 0x03, 0x0E, 0x09, 0x00]},
    {command: ili9341lib.commands.ILI9341_GMCTRN1, args:[0x00, 0x0E, 0x14, 0x03, 0x11, 0x07, 0x31, 0xC1, 0x48, 0x08, 0x0F, 0x0C, 0x31, 0x36, 0x0F]},
    {command: ili9341lib.commands.ILI9341_SLPOUT, args:[]},
    {command: ili9341lib.commands.ILI9341_DISPON, args:[]},
  ];

  this.readStream = new stream.Readable({ objectMode: true });
  this.readStream._read = function () {
  }

  for (var i = 0; i<initCommands.length; i++) {
    this.readStream.push(initCommands[i]);
  }
  this.readStream.push(null);
}

ili9341lib.prototype.setWindowPacket = function () {
}

ili9341lib.api = {
  'init': {construct:initPacket},
  'setWindow': {construct:setWindowPacket},
  'pushColor': {construct:pushColorPacket},
  'drawPixel': {construct:drawPixelPacket},
  'drawFastVLine': {construct:drawFastVLinePacket},
  'drawFastHLine': {construct:drawFastHLinePacket},
  'fillScreen': {construct:fillScreenPacket},
  'fillRect': {construct:fillRectPacket},
  'setRotation': {construct:setRotationPacket},
  'invertDisplay': {construct:invertDisplayPacket},
};

ili9341lib.commands = {
  ILI9341_NOP: 0x00,
  ILI9341_SWRESET: 0x01,
  ILI9341_RDDID: 0x04,
  ILI9341_RDDST: 0x09,

  ILI9341_SLPIN: 0x10,
  ILI9341_SLPOUT: 0x11,
  ILI9341_PTLON: 0x12,
  ILI9341_NORON: 0x13,
  ILI9341_RDMODE: 0x0A,
  ILI9341_RDMADCTL: 0x0B,
  ILI9341_RDPIXFMT: 0x0C,
  ILI9341_RDIMGFMT: 0x0A,
  ILI9341_RDSELFDIAG: 0x0F,

  ILI9341_INVOFF: 0x20,
  ILI9341_INVON: 0x21,
  ILI9341_GAMMASET: 0x26,
  ILI9341_DISPOFF: 0x28,
  ILI9341_DISPON: 0x29,

  ILI9341_CASET: 0x2A,
  ILI9341_PASET: 0x2B,
  ILI9341_RAMWR: 0x2C,
  ILI9341_RAMRD: 0x2E,

  ILI9341_PTLAR: 0x30,
  ILI9341_MADCTL: 0x36,
  ILI9341_PIXFMT: 0x3A,

  ILI9341_FRMCTR1: 0xB1,
  ILI9341_FRMCTR2: 0xB2,
  ILI9341_FRMCTR3: 0xB3,
  ILI9341_INVCTR: 0xB4,
  ILI9341_DFUNCTR: 0xB6,

  ILI9341_PWCTR1: 0xC0,
  ILI9341_PWCTR2: 0xC1,
  ILI9341_PWCTR3: 0xC2,
  ILI9341_PWCTR4: 0xC3,
  ILI9341_PWCTR5: 0xC4,
  ILI9341_VMCTR1: 0xC5,
  ILI9341_VMCTR2: 0xC7,

  ILI9341_RDID1: 0xDA,
  ILI9341_RDID2: 0xDB,
  ILI9341_RDID3: 0xDC,
  ILI9341_RDID4: 0xDD,

  ILI9341_GMCTRP1: 0xE0,
  ILI9341_GMCTRN1: 0xE1
}

module.exports = ili9341lib;