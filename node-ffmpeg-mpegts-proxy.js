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
		.usage('Usage: $0 -p <port> [-a <avconv>] [-q] [-s <sources>]')
		.alias('p', 'port')
		.alias('a', 'avconv')
		.alias('s', 'sources')
		.alias('q', 'quiet')
		.demand(['p'])
		.default('a', 'avconv')
		.default('s', 'data/sources.json')
		.describe('p', 'The port the HTTP server should be listening on')
		.describe('a', 'The path to avconv, defaults to just "avconv"')
		.describe('s', 'The path to sources.json, defaults to "data/sources.json"')
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
var sources = JSON.parse(fs.readFileSync(argv.sources, 'utf8'));
winston.debug('Loaded ' + sources.length + ' sources');

/**
 * The main HTTP server process
 * @type @exp;http@call;createServer
 */
var server = http.createServer(function (request, response) {
	var remoteAddress = request.connection.remoteAddress;
	winston.debug('Got request for "' + request.url + '" from ' + remoteAddress);

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
	
	// Indicates whether avconv should be restarted on failure
	var shouldRestart = true;
	
	/**
	 * Spawns an avconv process and pipes its output to the response input
	 * @returns {undefined}
	 */
	var startAvconv = function() {
		avconv = spawn(argv.avconv, avconvOptions);
		avconv.stdout.pipe(response, {end: false});
		
		// Handle avconv exits
		avconv.on('exit', function (code) {
			// Restart the process
			if (shouldRestart)
			{
				winston.error('avconv exited with code ' + code);
				winston.info(remoteAddress + ' still connected, restarting avconv ...');
				startAvconv();
			}
		});
	};
	
	// Start serving data
	var avconv;
	startAvconv();

	// Kill avconv when client closes the connection
	request.on('close', function () {
		winston.info(remoteAddress + ' disconnected, stopping avconv');
		
		shouldRestart = false;
		avconv.kill();
	});
});

// Start the server
server.listen(argv.port, '::'); // listen on both IPv4 and IPv6
winston.info('Server listening on port ' + argv.port);
