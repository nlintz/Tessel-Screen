/**
PORT OF Adafruit_GFX FOR Tessel

**/
var tessel = require('tessel');
var events = require('events');
var util = require('util');

function Screen (hardware, options, callback) {

  if (arguments.length == 2) {
    if (Object.prototype.toString.call(options) == "[object Function]") {
      callback = options;
      options = null;
    }
  }

  this.hardware = hardware;
  
  this.lib = options.lib;

  this.chipSelect = this.hardware.digital[0];
  this.reset = this.hardware.digital[1];
  this.dc = this.hardware.digital[2];

  this.spi = this.hardware.SPI({clockSpeed : options.clockSpeed, mode:options.mode, chipSelect:this.chipSelect});

  this._width = options.width;
  this._height = options.height;

  this._sendCommand('init', function (err, packet) {
    packet.readStream.on('data', function (data){
      this.spi.transferBatch(data, {start:0, chunking:options.commandSize}, function (err, data) {
      });
    }.bind(this))

    packet.readStream.on('end', function () {
      this.emit('ready');
    }.bind(this))
  }.bind(this));
}

util.inherits(Screen, events.EventEmitter);

Screen.prototype._sendCommand = function (apiCommand, args, callback) {
  
  if (typeof args === 'function') {
    callback = args;
    args = {};
  }
  if (!args) {
    args = {};
  }

  this.lib.getCommandPacket(apiCommand, args, function (err, packet) {
    if (err) {
      callback(new Error(err));
    } else {
      callback(null, packet);
    }
  });

}

// Uses the Batch SPI API to fill a window with color
Screen.prototype._writePixelsToWindow = function (color, nPixels) {
  this._sendCommand('setColor', {color: color}, function (err, packet) {
    this.spi.transferBatch(packet.buffer, {start:0, chunking:2, repeat:nPixels-1});
  }.bind(this))
}

Screen.prototype._getPixelData = function (x, y, color, callback) {
  this._sendCommand('setWindow', {x0:x, y0:y, x1:x+1, y1:y+1}, function (err, windowPacket) {
    this._sendCommand('setColor', {color: color}, function (err, colorPacket) {
      callback([windowPacket.buffer, colorPacket.buffer]);
    }.bind(this))
  }.bind(this))
}

Screen.prototype._setWindow = function (x0, y0, x1, y1, callback) {
  this._sendCommand('setWindow', {x0:x0, y0:y0, x1:x1, y1:y1}, function (err, packet) {
    this.spi.transferBatch(packet.buffer, {start:0, chunking:2}, function () {
      if (callback) {
        setImmediate(callback);
      }
    })
  }.bind(this))
}

// Public API
Screen.prototype.drawCircle = function (x0, y0, r, color, callback) {
  var f = 1 - r;
  var ddF_x = 1;
  var ddF_y = -2 * r;
  var x = 0;
  var y = r;
  var pixels = [];

  this._getPixelData(x0, y0 + r, color, function (buffer) {
    pixels.push(buffer);
  });
  this._getPixelData(x0, y0 - r, color, function (buffer) {
    pixels.push(buffer);
  });
  this._getPixelData(x0 + r, y0, color, function (buffer) {
    pixels.push(buffer);
  });
  this._getPixelData(x0 - r, y0, color, function (buffer) {
    pixels.push(buffer);
  });

  while (x<y) {
    if (f >= 0) {
      y--;
      ddF_y += 2;
      f += ddF_y;
    }
    x++;
    ddF_x += 2;
    f += ddF_x;

    this._getPixelData(x0 + x, y0 + y, color, function (buffer) {
      pixels.push(buffer);
    });

    this._getPixelData(x0 - x, y0 + y, color, function (buffer) {
      pixels.push(buffer);
    });

    this._getPixelData(x0 + x, y0 - y, color, function (buffer) {
      pixels.push(buffer);
    });

    this._getPixelData(x0 - x, y0 - y, color, function (buffer) {
      pixels.push(buffer);
    });

    this._getPixelData(x0 + y, y0 + x, color, function (buffer) {
      pixels.push(buffer);
    });

    this._getPixelData(x0 - y, y0 + x, color, function (buffer) {
      pixels.push(buffer);
    });

    this._getPixelData(x0 + y, y0 - x, color, function (buffer) {
      pixels.push(buffer);
    });

    this._getPixelData(x0 - y, y0 - x, color, function (buffer) {
      pixels.push(buffer);
    });
  }

  this.spi.transferBatch(Buffer.concat([].concat.apply([], pixels)), {start:0, chunking:2}, function () {
    if (callback) {
      setImmediate(callback);
    }
  });
}

Screen.prototype.drawCircleHelper = function (x0, y0, r, cornername, color, callback) {
  var f = 1 - r;
  var ddF_x = 1;
  var ddF_y = -2 * r;
  var x = 0;
  var y = r;
  var pixels = [];

  while (x<y) {
    if (f >= 0) {
      y--;
      ddF_y += 2;
      f     += ddF_y;
    }
    x++;
    ddF_x += 2;
    f     += ddF_x;
    if (cornername & 0x4) {
      this._getPixelData(x0 + x, y0 + y, color, function (buffer) {
        pixels.push(buffer);
      });
      this._getPixelData(x0 + y, y0 + x, color, function (buffer) {
        pixels.push(buffer);
      });
    } 
    if (cornername & 0x2) {
      this._getPixelData(x0 + x, y0 - y, color, function (buffer) {
        pixels.push(buffer);
      });
      this._getPixelData(x0 + y, y0 - x, color, function (buffer) {
        pixels.push(buffer);
      });

    }
    if (cornername & 0x8) {
      this._getPixelData(x0 - y, y0 + x, color, function (buffer) {
        pixels.push(buffer);
      });
      this._getPixelData(x0 - x, y0 + y, color, function (buffer) {
        pixels.push(buffer);
      });

    }
    if (cornername & 0x1) {
      this._getPixelData(x0 - y, y0 - x, color, function (buffer) {
        pixels.push(buffer);
      });
      this._getPixelData(x0 - x, y0 - y, color, function (buffer) {
        pixels.push(buffer);
      });

    }
  }

  this.spi.transferBatch(Buffer.concat([].concat.apply([], pixels)), {start:0, chunking:2}, function () {
    if (callback) {
      setImmediate(callback);
    }
  });
}


Screen.prototype.drawFastHLine = function (x, y, w, color, callback) {
  if ((y < 0) || (y > this._height) || (x > this._width)) {
    return;
  } 

  var x2 = (x + w - 1);
  if (x2 < 0) {
    return;
  }
  if (x2 >= this._width) {
    w = this._width - x;
  }

  if (x < 0) {
    w += y; 
    x = 0;
  } 

  this._setWindow(x, y, x+w-1, y);

  this._writePixelsToWindow(color, w);
}

Screen.prototype.drawFastVLine = function (x, y, h, color, callback) {
  if ((x < 0) || (x > this._width) || (y > this._height)) {
    return;
  } 

  var y2 = (y + h - 1);
  if (y2 < 0) {
    return;
  }
  if (y2 >= this._height) {
    h = this._height - y;
  }

  if (y < 0) {
    h += y; 
    y = 0;
  } 

  this._setWindow(x, y, x, y+h-1);

  this._writePixelsToWindow(color, h);
}

Screen.prototype.drawLine = function (x0, y0, x1, y1, color, callback) {

  var pixels = [];

  var steep = (Math.abs(y1 - y0) > Math.abs(x1 - x0));

  // Swap x and y
  if (steep) {
    x0 = [y0, y0 = x0][0];
    x1 = [y1, y1 = x1][0];
  }

  if (x0 > x1) {
    x0 = [x1, x1 = x0][0];
    y1 = [y0, y0 = y1][0];
  }

  var dx, dy;
  dx = x1 - x0;
  dy = Math.abs(y1 - y0);

  var err = dx / 2;
  var ystep;

  if (y0 < y1) {
    ystep = 1;
  } else {
    ystep = -1;
  }

  for (; x0<=x1; x0++) {
    if (steep) {
      this._getPixelData(y0, x0, color, function (buffer) {
        pixels.push(buffer);
      });
    } else {
      this._getPixelData(x0, y0, color, function (buffer) {
        pixels.push(buffer);
      });
    }
    err -= dy;
    if (err < 0) {
      y0 += ystep;
      err += dx;
    }
  }
  this.spi.transferBatch(Buffer.concat([].concat.apply([], pixels)), {start:0, chunking:2}, function () {
    if (callback) {
      setImmediate(callback);
    }
  });
}

Screen.prototype.drawPixel = function (x, y, color, callback) {
  this._setWindow(x, y, x, y);
  this.pushColor(color);
}

Screen.prototype.drawRect = function (x, y, w, h, color, callback) {
  this.drawFastHLine(x, y, w, color);
  this.drawFastHLine(x, y+h-1, w, color);
  this.drawFastVLine(x, y, h, color);
  this.drawFastVLine(x+w-1, y, h, color);
}

Screen.prototype.drawRoundedRect = function (x, y, w, h, r, color, callback) {
  this.drawFastHLine(x+r, y, w-2*r, color); 
  this.drawFastHLine(x+r, y+h-1, w-2*r, color); 
  this.drawFastVLine(x, y+r, h-2*r, color); 
  this.drawFastVLine(x+w-1, y+r, h-2*r, color); 

  this.drawCircleHelper(x+r, y+r, r, 1, color);
  this.drawCircleHelper(x+w-r-1, y+r, r, 2, color);
  this.drawCircleHelper(x+w-r-1, y+h-r-1, r, 4, color);
  this.drawCircleHelper(x+r, y+h-r-1, r, 8, color);

}

Screen.prototype.drawTriangle = function (x0, y0, x1, y1, x2, y2, color, callback) {
  this.drawLine(x0, y0, x1, y1, color);
  this.drawLine(x1, y1, x2, y2, color);
  this.drawLine(x2, y2, x0, y0, color);
}

Screen.prototype.fillCircle = function (x0, y0, r, color, callback) {
  this.drawFastVLine(x0, y0-r, 2*r+1, color);
  this.fillCircleHelper(x0, y0, r, 3, 0, color);
}

Screen.prototype.fillCircleHelper = function (x0, y0, r, cornername, delta, color, callback) {
  f = 1 - r;
  ddF_x = 1;
  ddF_y = -2 * r;
  x = 0;
  y = r;

  while (x<y) {
    if (f >= 0) {
      y--;
      ddF_y += 2;
      f += ddF_y;
    }
    x++;
    ddF_x += 2;
    f += ddF_x;

    if (cornername & 0x1) {
      this.drawFastVLine(x0+x, y0-y, 2*y+1+delta, color);
      this.drawFastVLine(x0+y, y0-x, 2*x+1+delta, color);
    }
    if (cornername & 0x2) {
      this.drawFastVLine(x0-x, y0-y, 2*y+1+delta, color);
      this.drawFastVLine(x0-y, y0-x, 2*x+1+delta, color);
    }
  }
}

Screen.prototype.fillRect = function (x, y, w, h, color, callback) {
  if((x >= this._width) || (y >= this._height)) return; 
  
  var x2
  var y2;

  if(((x2 = x + w - 1) < 0) ||
     ((y2 = y + h - 1) < 0)) return; 
  if(x2 >= this._width)  w = this._width  - x; 
  if(x < 0) { w += x; x = 0; }  
  if(y2 >= this._height) h = this._height - y; 
  if(y < 0) { h += y; y = 0; }

  this._setWindow(x, y, x+w-1, y+h-1);

  var i  = w * h;

  this._writePixelsToWindow(color, i);  
}

Screen.prototype.fillRoundedRect = function (x, y, w, h, r, color, callback) {

  this.fillRect(x+r, y, w-2*r, h, color);

  this.fillCircleHelper(x+w-r-1, y+r, r, 1, h-2*r-1, color);
  this.fillCircleHelper(x+r, y+r, r, 2, h-2*r-1, color);

}

Screen.prototype.fillScreen = function (color, callback) {
  this._setWindow(0, 0, this._width - 1, this._height - 1);
  this._writePixelsToWindow(color, this._width * this._height );
}

Screen.prototype.fillTriangle = function (x0, y0, x1, y1, x2, y2, color, callback) {
  var a, b, y, last;

  // Sort coordinates by Y order (y2 >= y1 >= y0)
  if (y0 > y1) {
    x0 = [x1, x1 = x0][0];
    y0 = [y1, y1 = y0][0];
  }

  if (y1 > y2) {
    swap(y2, y1); swap(x2, x1);
    x2 = [x1, x1 = x2][0];
    y2 = [y1, y1 = y2][0];
  }

  if (y0 > y1) {
    x0 = [x1, x1 = x0][0];
    y0 = [y1, y1 = y0][0];
  }

  if(y0 == y2) { 
    a = b = x0;
    if(x1 < a) a = x1;
    else if(x1 > b) b = x1;
    if(x2 < a) a = x2;
    else if(x2 > b) b = x2;
    drawFastHLine(a, y0, b-a+1, color);
    return;
  }


  var dx01 = x1 - x0;
  var dy01 = y1 - y0;
  var dx02 = x2 - x0;
  var dy02 = y2 - y0;
  var dx12 = x2 - x1;
  var dy12 = y2 - y1;
  var sa = 0;
  var sb = 0;

  if(y1 == y2) last = y1;   // Include y1 scanline
  else last = y1-1; // Skip it

  for(y=y0; y<=last; y++) {
    a   = x0 + sa / dy01;
    b   = x0 + sb / dy02;
    sa += dx01;
    sb += dx02;
    if(a > b) swap(a,b);
    this.drawFastHLine(a, y, b-a+1, color);
  }

  sa = dx12 * (y - y1);
  sb = dx02 * (y - y0);
  for(; y<=y2; y++) {
    a   = x1 + sa / dy12;
    b   = x0 + sb / dy02;
    sa += dx12;
    sb += dx02;
    if(a > b) a = [b, b = a][0];
    this.drawFastHLine(a, y, b-a+1, color);
  }
}

Screen.prototype.pushColor = function (color, callback) {
  this._writePixelsToWindow(color, 1);
}

function use(hardware, options, callback) {
  var screen = new Screen(hardware, options, callback);
  return screen;
}

module.exports.Screen = Screen;

module.exports.use = use;