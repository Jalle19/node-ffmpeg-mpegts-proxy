node-ffmpeg-mpegts-proxy
========================

Simple proxy for leveraging ffmpeg to convert any source URL into MPEG-TS over HTTP. It has been designed for proxying HLS streams for use as IPTV input in tvheadend. Currently it simply remuxes the source stream into MPEG-TS and adds a service name (for automatic detection in tvheadend); if the source uses codecs other than what is used in standard DVB you can add transcoding to the mix by changing the avconv parameters.

## Requirements

* nodejs
* avconv

## Usage

* install the required libraries by running `npm install` in the project directory
* modify `data/sources.json`
* run the program using `nodejs node-ffmpeg-mpegts-proxy.js`. Run the command without any parameters to see what's available.
