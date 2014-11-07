node-ffmpeg-mpegts-proxy
========================

Simple proxy for leveraging ffmpeg to convert any source URL into MPEG-TS and serve it on demand over HTTP. It has been designed for proxying HLS streams for use as IPTV input in tvheadend. Currently it simply remuxes the source stream into MPEG-TS and adds a service name (for automatic detection in tvheadend); if the source uses codecs other than what is used in standard DVB you can add transcoding to the mix by changing the avconv parameters.

Since HLS input can be a bit unreliable, the converter process will be restarted automatically (without the HTTP response ending) until the client closes the connection (in which case the process is killed).

## Requirements

* nodejs
* avconv

## Usage

* install the required libraries by running `npm install` in the project directory
* copy `data/sources.json` someplace and modify it
* run the program using `nodejs node-ffmpeg-mpegts-proxy.js`

```
Usage: nodejs ./node-ffmpeg-mpegts-proxy.js -p <port> [-a <avconv>] [-q | -v] [-s <sources>]

Options:
  -p, --port     The port the HTTP server should be listening on            [required]
  -a, --avconv   The path to avconv, defaults to just "avconv"              [default: "avconv"]
  -s, --sources  The path to sources.json, defaults to "data/sources.json"  [default: "data/sources.json"]
  -q, --quiet    Disable all logging to stdout
  -v, --verbose  Enable verbose logging (shows the output from avconv)
```

Once the proxy is running, streams are available on the e.g. `http://localhost:9128/channel1`, assuming port 9128 is used and a source with the URL `/channel1` exists.

### Configuring sources

Sources are read from `data/sources.json` by default. The location to the source definitions can be changed with the `-s` switch. The `url` attribute determines through which URL the stream is accessible. It has to begin with a forward slash (`/`). The `name` and `provider` values are injected into the stream as the service name and provider. The `source` value can be anything that ffmpeg can use as input.

### Running as a service

To turn the proxy into a proper daemon that can be started and stopped like other services, copy the init script from the `debian` folder to `/etc/init.d/` and run the following commands:

```
sudo chmod +x /etc/init.d/node-ffmpeg-mpegts-proxy
sudo update-rc.d node-ffmpeg-mpegts-proxy defaults
```
