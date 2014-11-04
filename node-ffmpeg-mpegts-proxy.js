/*
 * Require libraries
 */
var yargs = require('yargs');
var winston = require('winston');
var http = require("http");
var spawn = require('child_process').spawn;
var fs = require('fs');

/*
 * Read command line options
 */
var argv = yargs
		.usage('Usage: $0 -p <port> [-a <avconv>] [-q]')
		.alias('p', 'port')
		.alias('a', 'avconv')
		.alias('q', 'quiet')
		.demand(['p'])
		.default('a', 'avconv')
		.describe('p', 'The port the HTTP server should be listening on')
		.describe('a', 'The path to avconv, defaults to just "avconv"')
		.argv;

/*
 * Configure logger
 */
winston.remove(winston.transports.Console);

// Enable console logging unless the --quiet switch was passed
if (!argv.quiet)
{
	winston.add(winston.transports.Console, {
		timestamp: true,
		colorize: true,
		level: 'debug'
	});
}

/*
 * Read the source definitions
 */
var sources = JSON.parse(fs.readFileSync('data/sources.json', 'utf8'));
winston.debug('Loaded ' + sources.length + ' sources');

/**
 * The main HTTP server process
 * @type @exp;http@call;createServer
 */
var server = http.createServer(function (request, response) {
	winston.debug('Got request for "' + request.url + '" from ' + request.connection.remoteAddress);

	// Determine which source to serve based on the requested URL
	var source = null;

	for (var i = 0; i < sources.length; i++)
	{
		if (sources[i].url === request.url)
		{
			source = sources[i];
			break;
		}
	}

	if (source === null)
	{
		winston.info('Unknown source "' + request.url + '" requested');

		response.writeHead(404, {"Content-Type": "text/plain"});
		response.write("404 Not Found\n");
		response.end();

		return;
	}

	// Tell the client we're sending MPEG-TS data
	response.writeHead(200, {
		'Content-Type': 'video/mp2t',
		'Transfer-Encoding': 'chunked'
	});

	// Define options for the child process
	var avconvOptions = [
		'-re',
		'-i', source.source,
		'-vcodec', 'copy',
		'-acodec', 'copy',
		'-metadata', 'service_provider=' + source.provider,
		'-metadata', 'service_name=' + source.name,
		'-f', 'mpegts',
		'-' // Use stdout as output
	];

	var avconv = spawn(argv.avconv, avconvOptions);

	// Relay video output to the client
	avconv.stdout.pipe(response);

	// avconv exits with code 255 when closed because the client closes the 
	// connection, if it closes in any other way we need to know about it
	avconv.on('exit', function(code) {
		if (code !== 255)
			winston.error('avconv exited with code ' + code);
	});

    avconv.stderr.on('data', function (chunk) {
        winston.silly("stderr: " + chunk);
    });

    // Close the connection when avconv dies
    avconv.on('close', function (code) {
        if(code != 0) {
            winston.error('avconv exited with code ' + code);
            response.write("avconv quit unexpectedly\n");
        }
        response.end();
    });

    // Kill avconv when client closes the connection
	request.on('close', function () {
		winston.info('Client disconnected, stopping avconv');
		avconv.kill();
	});
});

// Start the server
server.listen(argv.port, '::'); // listen on both IPv4 and IPv6
winston.info('Server listening on port ' + argv.port);
