#!/bin/bash
# Danger! Unsantised input!
HTTP_HOST="$(echo ${HTTP_HOST} | sed -e 's/[:].*//')"
echo "$0: Host: ${HTTP_HOST}" >&2
if [ -e lineup.json.${HTTP_HOST}.in ]; then
	sed -e 's/HOST/'"${HTTP_HOST}"'/g' < lineup.json.${HTTP_HOST}.in
elif [ -e lineup.json.in ]; then
	sed -e 's/HOST/'"${HTTP_HOST}"'/g' < lineup.json.in
else
	echo '[]'
fi
