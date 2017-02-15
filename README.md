node-ffmpeg-mpegts-proxy
========================

Simple proxy for leveraging ffmpeg to convert any source URL into MPEG-TS and serve it on demand over HTTP. It has been 
designed for proxying HLS streams for use as IPTV input in tvheadend, but it can be used with any source that can be 
handled by the `avconv` utility. Currently it simply remuxes the source stream into MPEG-TS and adds a service name 
(for automatic detection in tvheadend), no transcoding is performed.

Since HLS input can be a bit unreliable, the converter process will be restarted automatically (without the HTTP 
response ending) until the client closes the connection (in which case the process is killed).

This version has been modified to support being a HDHomeRun interface directly into Plex DVR (Beta).

You can use the examples/sources.json file and the included scripts to satisfy the endpoints that Plex exercises
on a HDHomeRun device. THe sources.json syntax has been extended to make this function, and you can use the proxy
in multiple DVRs. This is inspired (read: ported) from https://github.com/jkaberg/tvhProxy .

## Requirements

* nodejs >= 0.12
* avconv or ffmpeg

## Usage

* Install the required libraries by running `npm install` in the project directory. You will have to run this command 
again if you update to a newer version.
* Copy `examples/sources.json` someplace and modify it
* Run the program using `nodejs node-ffmpeg-mpegts-proxy.js`

```
Usage: nodejs ./node-ffmpeg-mpegts-proxy.js [-a <avconv>] [-q | -v] [-s <sources>]

Options:
  -l, --listen   The address to listen on                                   [default: "::"]
  -a, --avconv   The path to avconv, defaults to just "avconv"              [default: "avconv"]
  -s, --sources  The path to sources.json                                   [required]
  -q, --quiet    Disable all logging to stdout
  -v, --verbose  Enable verbose logging (shows the output from avconv)
```

Once the proxy is running, streams are available on the e.g. `http://localhost/channel1`, because the ports 80 and 5004 are 
used to match the HDHomeRun and a source with the URL `/channel1` exists. The port argument is not available because Plex will
only look on the expected ports.

### Configuring sources

Sources are read from the file specified when starting the program (use `examples/sources.json` as a starting point). 
The file contains an array of JSON objects with the following definition:

* `name`: the service name
* `provider`: the name of the service provider
* `url`: the relative URL the stream will be available on when served
* `source`: the source URL
* `avconvOptions`: (optional) special avconv parameters for this source. This is an object containing two arrays, 
`input`and `output`.
* `prescript`: (optional) script to run before transcoding starts. Useful if you need to bring up temporary VPN 
interfaces etc. Four arguments are passed to the script; the source URL, the relative stream URL, the provider name 
and the channel name.
* `postscript`: (optional) same as `prescript` except it's run when streaming is stopped.
* `http_proxy`: (optional) the HTTP proxy to use for the source (e.g. `http://proxy.example.com:8080`)
* `avconv`: (optional) source-specific override of the avconv binary to use. This can be useful if you for some reason 
need to use a special version off ffmpeg just to play a specific source.

The program listens to changes made to the source file and reloads it automatically whenever it is changed. The main 
idea behind this is to support source URLs that contain parameter that change frequently and need to be adapted for 
(e.g. session IDs). If the changes you make result in the file being unreadable (malformed JSON) it will complain 
about that and continue using the previous source definitions (if any). Below is an excerpt from the example source 
file.

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

If your sources require additional parameters to work correctly (most commonly because the source uses MP4 as 
container) you can append to the default ones by using the `avconvOptions` source parameter. Here is a complete 
example:

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

In the example above, the options `fflags +genpts` will be injected before the input source is specified (which means 
those options apply to the input, and `-bsf h264_mp4toannexb` will be injected before the output destination is 
specified (which means those options apply to the output).

If you only need to specify output parameters you can omit the `input` key completely.

#### Commonly needed parameters

In most cases you don't need any extra parameters, although one often needed one is the `-bsf h264_mp4toannexb` output 
option (as in the example above). If you enable silly debugging mode (`-v`) and get an 
`H.264 bitstream malformed, no startcode found, use the h264_mp4toannexb bitstream filter (-bsf h264_mp4toannexb)` 
error message, this is what you need.

#### HDHomeRun additions

The sources.json format has been expanded to add further scripting capability and support for a sort of Server Name Identification
(SNI) in order to have the proxy present different channel lists to different hostnames.

First, you can specify serving of a fixed local file. This is done by specifying "mime" with a mime-type for the file
and "file" for the relative path to the file on disk. The file is read synchronously so it must be small and not a stream. Tip: If you
just want to emulate a HTTP 200 OK response, set "file" to "/dev/null".

If a script must be triggered to generate the file, use "prescript" to run the script.

Second, you can specify running a script and directly sending the output to the HTTP client. Specify "mime" and "script" for this.

The script has been extended to support being run with "HTTP_HOST" environment variable provided which will be the "host:port" provided
by the client in the HTTP Host header (warning: not sanitised yet!).

We also strip URL parameters from the URL requests before matching them to sources. The "duration" argument is explicitly matched and applied
as an output avconv option, so that Plex stops streaming (and we do not treat this as an error state) after its desired time has expired.

### Running as a service

You can turn the proxy into a proper daemon that can be started and stopped like other services. Start by placing your 
source definitions in `/etc/node-ffmpeg-mpegts-proxy/sources.json`, then follow the instructions below for your 
startup system.

#### Systemd (Ubuntu >= 16.04, Debian >= Jessie)

* Copy `support/systemd/node-ffmpeg-mpegts-proxy.service` to `/lib/systemd/system` and modify it if necessary (e.g. 
to change the parameters passed to it or the user it should run as)
* Run `sudo systemctl enable node-ffmpeg-mpegts-proxy.service` to enable the service
* Run `sudo systemctl start node-ffmpeg-mpegts-proxy.service` to start the service

If you make any changes to `/lib/systemd/system/node-ffmpeg-mpegts-proxy.service` after you've enabled the service you 
will have to run `sudo systemctl daemon-reload` for the changes to take effect.

The output from the application is logged to `/var/log/node-ffmpeg-mpegts-proxy.log`

#### Upstart (Ubuntu 14.04)

* Copy `support/upstart/node-ffmpeg-mpegts-proxy.conf` to `/etc/init/` and modify it if necessary (e.g. to change the 
parameters passed to it or the user it should run as)
* Run `sudo service node-ffmpeg-mpegts-proxy start`

The output from the application is logged to `/var/log/upstart/node-ffmpeg-mpegts-proxy.log`

#### SysVinit (Debian Wheezy)

* Copy `sysvinit/node-ffmpeg-mpegts-proxy` to `/etc/init.d`, modify it if necessary (e.g. to change the parameters 
passed to it or the user it should run as)
* Run `sudo chmod +x /etc/init.d/node-ffmpeg-mpegts-proxy`
* Run `sudo update-rc.d node-ffmpeg-mpegts-proxy defaults` to enable the service on startup
* Run `sudo /etc/init.d/node-ffmpeg-mpegts-proxy start` to start the service

The output from the application is logged to `/var/log/node-ffmpeg-mpegts-proxy.log`

## Development environment

Install nodejs and ffmpeg locally, no virtual machines required.

In order to easily test the startup/service scripts there is a `Vagrantfile` which starts three separate virtual 
machines, one for each supported init system.
