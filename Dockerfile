FROM node:24-trixie

COPY --from=mwader/static-ffmpeg:8.1.1 /ffmpeg /usr/local/bin/

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev
COPY libs ./libs
COPY node-ffmpeg-mpegts-proxy.js .

EXPOSE 9128
VOLUME [ "/data" ]
USER node

ENTRYPOINT ["node", "node-ffmpeg-mpegts-proxy.js"]

CMD ["-p", "9128", "-a", "/usr/local/bin/ffmpeg", "-s", "/data/sources.json"]
