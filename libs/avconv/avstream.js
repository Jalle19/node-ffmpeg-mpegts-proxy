"use strict";

var util   = require('util'),
    Stream = require('stream');

function AvStream(options) {
    // Allow use without new operator
    if (!(this instanceof AvStream)) {
        return new AvStream(options);
    }

    Stream.Duplex.call(this, options);
}

// AvStream inherits the Duplex stream prototype
util.inherits(AvStream, Stream.Duplex);

AvStream.prototype._read = function _read(n) {};

AvStream.prototype._write = function _write(chunk, encoding, callback) {
    // Data written to the stream should be emitted back as 'inputData'
    this.emit('inputData', chunk);

    callback();
};

module.exports = AvStream;
