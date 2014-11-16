var fs = require('fs');

/**
 * The name of the file that contains the source definitions
 * @type _filename
 */
var filename;

/**
 * Holds the currently valid source definitions
 * @type newSources
 */
var sources;

/**
 * The current logger instance
 * @type type
 */
var logger;

/**
 * Sets the logger instance
 * @param {type} instance
 * @returns {undefined}
 */
var setLogger = function(instance) {
	logger = instance;
};

/**
 * Loads source definitions from the specified file
 * @param {type} _filename
 * @returns {undefined}
 */
var load = function(_filename) {
	filename = _filename;
	_load();

	// Watch the file for changes and reload when changed
	fs.watch(filename, function(event) {
		if (event === 'change')
		{
			logger.info('Source definitions have changed, reloading ...');
			_load();
		}
	});
};

/**
 * Returns the source that has the specified URL, or null if no such source 
 * exists
 * @param {type} url
 * @returns {newSources|sources}
 */
var getByUrl = function(url) {
	var source = null;

	for (var i = 0; i < sources.length; i++)
	{
		// Ensure there's a leading slash and no trailing slashes
		var sourceUrl = '/' + sources[i].url.replace(/^\/|\/$/g, '');

		if (sourceUrl === url)
		{
			source = sources[i];
			break;
		}
	}

	return source;
};

/**
 * Attempts to load the source file, replacing the source definitiosn on success
 * @returns {undefined}
 */
var _load = function() {
	// Try to parse the file
	try {
		var newSources = JSON.parse(fs.readFileSync(filename, 'utf8'));
	}
	catch (SyntaxError)
	{
		logger.error('Unable to read source definitions, JSON is malformed');
		return;
	}

	// Replace sources with the new ones
	logger.info('Loaded %d sources', newSources.length);
	sources = newSources;
};

// Export functions
var exports = module.exports = {};
exports.getByUrl = getByUrl;
exports.load = load;
exports.setLogger = setLogger;
