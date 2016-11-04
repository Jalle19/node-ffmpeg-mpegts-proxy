# Change log

## 0.7.0

* show an error if pre/post-scripts don't exist or are not executable 
* pass more parameters to pre/post-scripts
* log when streaming has started successfully
* throttle avconv restarts to once per 5 seconds
* remove some unused code
* add startup scripts for Upstart and Systemd in addition to SysVinit

## 0.6.0

* support specifying the HTTP proxy to use per stream
* don't log some good avconv exit codes as errors
* better error message when there's something wrong with the source definitions
* allow overridng the avconv path on a per-stream basis

## 0.5.0

* add ability to run pre/post scripts before and after streaming begins
* bump nodejs version requirements to >= 0.12

## 0.4.0

* bundle the "avconv" dependency so we can more easily fix things in it
* add an option to change the listen address

## 0.3.0

* don't crash when the source definitions contain malformed JSON
* allow specifying custom avconv options per source 

## 0.2.3

* reload the source definitions whenever the file changes

## 0.2.2

* more logging improvements
* handle leading slashes in source URL definitions

## 0.2.1

* minor logging improvements

## 0.2

First tagged release
