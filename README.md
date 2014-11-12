node-ffmpeg-mpegts-proxy
========================

Simple proxy for leveraging ffmpeg to convert any source URL into MPEG-TS and serve it on demand over HTTP. It has been designed for proxying HLS streams for use as IPTV input in tvheadend. Currently it simply remuxes the source stream into MPEG-TS and adds a service name (for automatic detection in tvheadend); if the source uses codecs other than what is used in standard DVB you can add transcoding to the mix by changing the avconv parameters.

Since HLS input can be a bit unreliable, the converter process will be restarted automatically (without the HTTP response ending) until the client closes the connection (in which case the process is killed).

## Requirements

* nodejs
* avconv

## Usage

* install the required libraries by running `npm install` in the project directory
* copy `examples/sources.json` someplace and modify it
* run the program using `nodejs node-ffmpeg-mpegts-proxy.js`

```
Usage: nodejs ./node-ffmpeg-mpegts-proxy.js -p <port> [-a <avconv>] [-q | -v] [-s <sources>]

Options:
  -p, --port     The port the HTTP server should be listening on            [required]
  -a, --avconv   The path to avconv, defaults to just "avconv"              [default: "avconv"]
  -s, --sources  The path to sources.json                                   [required]
  -q, --quiet    Disable all logging to stdout
  -v, --verbose  Enable verbose logging (shows the output from avconv)
```

Once the proxy is running, streams are available on the e.g. `http://localhost:9128/channel1`, assuming port 9128 is used and a source with the URL `/channel1` exists.

### Configuring sources

Sources are read from the file specified when starting the program (use `example/sources.json` as a starting point). The file contains an array of JSON objects with the following definition:

* `name`: the service name
* `provider`: the name of the service provider
* `url`: the relative URL the stream will be available on when served
* `source`: the source URL

The program listens to changes made to the source file and reloads it automatically whenever it is changed. The main idea behind this is to support source URLs that contain parameter that change frequently and need to be adapted for (e.g. session IDs).

#### Example 

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

### Running as a service

To turn the proxy into a proper daemon that can be started and stopped like other services, copy the init script from the `support` folder to `/etc/init.d/` (only tested on Debian) and run the following commands:

```
sudo chmod +x /etc/init.d/node-ffmpeg-mpegts-proxy
sudo update-rc.d node-ffmpeg-mpegts-proxy defaults
```
