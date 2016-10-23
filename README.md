node-ffmpeg-mpegts-proxy
========================

Simple proxy for leveraging ffmpeg to convert any source URL into MPEG-TS and serve it on demand over HTTP. It has been designed for proxying HLS streams for use as IPTV input in tvheadend, but it can be used with any source that can be handled by the `avconv` utility. Currently it simply remuxes the source stream into MPEG-TS and adds a service name (for automatic detection in tvheadend), no transcoding is performed.

Since HLS input can be a bit unreliable, the converter process will be restarted automatically (without the HTTP response ending) until the client closes the connection (in which case the process is killed).

## Requirements

* nodejs >= 0.12
* avconv or ffmpeg

## Usage

* install the required libraries by running `npm install` in the project directory
* copy `examples/sources.json` someplace and modify it
* run the program using `nodejs node-ffmpeg-mpegts-proxy.js`

```
Usage: nodejs ./node-ffmpeg-mpegts-proxy.js -p <port> [-a <avconv>] [-q | -v] [-s <sources>]

Options:
  -p, --port     The port the HTTP server should be listening on            [required]
  -l, --listen   The address to listen on                                   [default: "::"]
  -a, --avconv   The path to avconv, defaults to just "avconv"              [default: "avconv"]
  -s, --sources  The path to sources.json                                   [required]
  -q, --quiet    Disable all logging to stdout
  -v, --verbose  Enable verbose logging (shows the output from avconv)
```

Once the proxy is running, streams are available on the e.g. `http://localhost:9128/channel1`, assuming port 9128 is used and a source with the URL `/channel1` exists.

### Configuring sources

Sources are read from the file specified when starting the program (use `examples/sources.json` as a starting point). The file contains an array of JSON objects with the following definition:

* `name`: the service name
* `provider`: the name of the service provider
* `url`: the relative URL the stream will be available on when served
* `source`: the source URL
* `avconvOptions`: (optional) special avconv parameters for this source. This is an object containing two arrays, `input`and `output`.
* `prescript`: (optional) script to run before transcoding starts. Useful if you need to bring up temporary VPN interfaces etc. The first argument to the script is the source URL.
* `postscript`: (optional) same as `prescript` except it's run when streaming is stopped.
* `http_proxy`: (optional) the HTTP proxy to use for the source (e.g. `http://proxy.example.com:8080`)
* `avconv`: (optional) source-specific override of the avconv binary to use. This can be useful if you for some reason need to use a special version off ffmpeg just to play a specific source.

The program listens to changes made to the source file and reloads it automatically whenever it is changed. The main idea behind this is to support source URLs that contain parameter that change frequently and need to be adapted for (e.g. session IDs). If the changes you make result in the file being unreadable (malformed JSON) it will complain about that and continue using the previous source definitions (if any). Below is an excerpt from the example source file.

```
[
        {
                "name": "Channel One",
                "provider": "Provider One",
                "url": "/channel1",
                "source": "http://iptv.example.com/channel1.m3u8"
        },
        ...
]
```

#### Custom avconv parameters

If your sources require additional parameters to work correctly (most commonly because the source uses MP4 as container) you can append to the default ones by using the `avconvOptions` source parameter. Here is a complete example:

```
[
        {
                "name": "Channel One",
                "provider": "Provider One",
                "url": "/channel1",
                "source": "rtmp://example.com:1935/live playpath=test live=1 pageUrl=http://example.com/foo token=bar timeout=10",
                "avconvOptions": {
                        "input": [
                                "fflags", "+genpts"
                        ],
                        "output": [
                                "-bsf", "h264_mp4toannexb"
                        ]
                }
        }
]
```

In the example above, the options `fflags +genpts` will be injected before the input source is specified (which means those options apply to the input, and `-bsf h264_mp4toannexb` will be injected before the output destination is specified (which means those options apply to the output).

If you only need to specify output parameters you can omit the `input` key completely.

#### Commonly needed parameters

In most cases you don't need any extra parameters, although one often needed one is the `-bsf h264_mp4toannexb` putput option (as in the example above). If you enable silly debugging mode (`-v`) and get an `H.264 bitstream malformed, no startcode found, use the h264_mp4toannexb bitstream filter (-bsf h264_mp4toannexb)` error message, this is what you need.

### Running as a service

To turn the proxy into a proper daemon that can be started and stopped like other services, copy the init script from the `support` folder to `/etc/init.d/` (only tested on Debian) and run the following commands:

```
sudo chmod +x /etc/init.d/node-ffmpeg-mpegts-proxy
sudo update-rc.d node-ffmpeg-mpegts-proxy defaults
```
