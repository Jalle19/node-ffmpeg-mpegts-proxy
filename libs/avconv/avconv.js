"use strict";

var spawn    = require('child_process').spawn,
    AvStream = require('./avstream');

module.exports = function avconv(params, binaryPath, environment) {
	  binaryPath = binaryPath || "avconv";
    
    var stream = new AvStream(),
        // todo: use a queue to deal with the spawn EMFILE exception
        // see http://www.runtime-era.com/2012/10/quick-and-dirty-nodejs-exec-limit-queue.html
        // currently I have added a dirty workaround on the server by increasing
        // the file max descriptor with 'sudo sysctl -w fs.file-max=100000'
        avconv = spawn(binaryPath, params, environment);

    // General avconv output is always written into stderr
    if (avconv.stderr) {
        avconv.stderr.setEncoding('utf8');

        avconv.stderr.on('data', function(data) {
            // Emit conversion information as messages
            stream.emit('message', data);
        });
    }

    // When avconv outputs anything to stdout, it's probably converted data
    if (avconv.stdout) {
        avconv.stdout.on('data', function(data) {
            stream.push(data)
        });
    }

    avconv.on('error', function(data) {
        stream.emit('error', data);
    });

    // New stdio api introduced the exit event not waiting for open pipes
    var eventType = avconv.stdio ? 'close' : 'exit';

    avconv.on(eventType, function(exitCode, signal) {
        stream.end();
        stream.emit('exit', exitCode, signal);
    });

    stream.kill = function() {
        avconv.kill();
    };

    return stream;
};
