"use strict";

var spawn    = require('child_process').spawn,
    util     = require('util'),

    AvStream = require('./avstream');

function toMilliSeconds(time) {
    var d  = time.split(/[:.]/),
        ms = 0;

    if (d.length === 4) {
        ms += parseInt(d[0], 10) * 3600 * 1000;
        ms += parseInt(d[1], 10) * 60 * 1000;
        ms += parseInt(d[2], 10) * 1000;
        ms += parseInt(d[3], 10);
    } else {
        ms += parseInt(d[0], 10) * 1000;
        ms += parseInt(d[1], 10);
    }

    return ms;
}

function findDuration(data) {
    var result = /duration: (\d+:\d+:\d+.\d+)/i.exec(data),
        duration;

    if (result && result[1]) {
        duration = toMilliSeconds(result[1]);
    }

    return duration;
}

function findTime(data) {
    var time;

    if (data.substring(0, 5) === 'frame') {
        var result = /time=(\d+.\d+)/i.exec(data);

        if (result && result[1]) {
            time = toMilliSeconds(result[1]);
        }
    }

    return time;
}

function findVideoMetaData(data) {
    var result = /Stream #([^:]+): Video: ([^,]+), ([^,]+), (\d+)x(\d+)/.exec(data),
        meta;

    if (result && result[1]) {
        meta = {
            video: {
                track:     result[1],
                codec:     result[2],
                format:    result[3],
                width:     parseInt(result[4]),
                height:    parseInt(result[5])
            }
        };
    }

    return meta;
}

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

        var output = '',
            duration,
            time,
            progress,
            meta;

        avconv.stderr.on('data', function(data) {

            time = null;

            // Keep the output so that we can parse stuff anytime,
            // i.E. duration or meta data
            output += data;

            if (!duration) {
                duration = findDuration(output);
            } else {
                time = findTime(data);
            }

            if (duration && time) {
                progress = time / duration;

                if (progress > 1) {
                    progress = 1; // Fix floating point error
                }

                // Tell the world that progress is made
                stream.emit('progress', progress);
            }

            if (!meta) {
                meta = findVideoMetaData(output);

                if (meta) {
                    // Share the meta data we found
                    stream.emit('meta', meta);
                }
            }

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

    // Pipe the stream to avconv standard input
    if (avconv.stdin) {

        // Reduce overhead when receiving a pipe
        stream.on('pipe', function(source) {

            // Unpipe the source (input) stream from AvStream
            source.unpipe(stream);

            // And pipe it to avconv's stdin instead
            source.pipe(avconv.stdin);
        });

        // When data is written to AvStream, send it to avconv's stdin
        stream.on('inputData', function(data) {
            avconv.stdin.write(data);
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
