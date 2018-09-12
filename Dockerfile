FROM node:8

# Enable jessie-backports and install ffmpeg
RUN echo 'deb http://deb.debian.org/debian jessie-backports main' > /etc/apt/sources.list.d/backports.list && \
	apt-get -qy update && \
	apt-get -qy install ffmpeg && \
	rm -rf /var/lib/apt/lists/*

# Install the application
WORKDIR /home/node/node-ffmpeg-mpegts-proxy
COPY package*.json ./
RUN npm install --production
COPY . .

# Configure the run environment
EXPOSE 9128
USER node
CMD ["node", "node-ffmpeg-mpegts-proxy.js", "-p", "9128", "-a", "/usr/bin/ffmpeg", "-s", "/home/node/node-ffmpeg-mpegts-proxy/sources.json"]
