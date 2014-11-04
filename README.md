node-ffmpeg-mpegts-proxy
========================

Simple proxy for leveraging ffmpeg to convert any source URL into MPEG-TS and serve it on demand over HTTP. It has been designed for proxying HLS streams for use as IPTV input in tvheadend. Currently it simply remuxes the source stream into MPEG-TS and adds a service name (for automatic detection in tvheadend); if the source uses codecs other than what is used in standard DVB you can add transcoding to the mix by changing the avconv parameters.

## Requirements

* nodejs
* avconv

## Usage

* install the required libraries by running `npm install` in the project directory
* modify `data/sources.json`
* run the program using `nodejs node-ffmpeg-mpegts-proxy.js`. Run the command without any parameters to see what's available.

Once the proxy is running, streams are available on the e.g. `http://localhost:9128/channel1`, assuming port 9128 is used and a source with the URL `/channel1` exists.

### Configuring sources

Sources are read from `data/sources.json`. The "url" attribute determines through which URL the stream is accessible. It has to begin with a forward slash ("/"). The "name" and "provider" values are injected into the stream as the service name and provider. The "source" value can be anything that ffmpeg can use as input.

### Running as a service

To turn the proxy into a proper daemon that can be started and stopped like other services, copy the init script from the `debian` folder to `/etc/init.d/` and run the following commands:

```
sudo chmod +x /etc/init.d/node-ffmpeg-mpegts-proxy
sudo update-rc.d node-ffmpeg-mpegts-proxy defaults
```
