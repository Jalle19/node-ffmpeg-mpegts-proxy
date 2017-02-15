#!/bin/bash
# Danger! Unsantised input!
HTTP_HOST="$(echo ${HTTP_HOST} | sed -e 's/[:].*//')"
exec sed -e 's/HOST/'"${HTTP_HOST}"'/g' -e 's/HASH/'"$(echo ${HTTP_HOST} | md5sum - | cut -c 1-8)"'/g' < discover.json.in
