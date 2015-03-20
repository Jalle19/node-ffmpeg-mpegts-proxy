var fs = require('fs');
var chokidar = require('chokidar');

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
 * Callbacks
 * @type type
 */
var onSourceChange;
var onSyntaxError;
var onLoad ;

/**
 * Loads source definitions from the specified file and attach the callbacks
 * @param {type} _filename
 * @param callback
 * @param callback
 * @param callback
 * @returns {undefined}
 */
var load = function(_filename, cbonSourceChange, cbonSyntaxError, cbonLoad) {
	filename = _filename;
	onSourceChange = cbonSourceChange;
	onSyntaxError = cbonSyntaxError;
	onLoad = cbonLoad;
	
	_load();

	// Watch the file for changes and reload when changed
	var watch = chokidar.watch(filename);
	watch.on('change', function() {
		onSourceChange();
		_load();
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
		onSyntaxError();
		return;
	}

	// Replace sources with the new ones
	onLoad(newSources.length);
	sources = newSources;
};

// Export functions
var exports = module.exports = {};
exports.getByUrl = getByUrl;
exports.load = load;
