FROM node:20-slim

RUN apt-get update && apt-get install -y \
    ffmpeg \
    wget \
    ca-certificates \
    libfontconfig1 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

# Instalar sin ejecutar scripts de postinstall que fallan en Linux
RUN npm install --omit=dev --ignore-scripts

# @napi-rs/canvas: instalar el binario correcto para Linux manualmente
RUN node -e "require('@napi-rs/canvas')" 2>/dev/null || \
    npm install --omit=dev --ignore-scripts @napi-rs/canvas-linux-x64-gnu 2>/dev/null || true

# Descargar yt-dlp para Linux
RUN mkdir -p node_modules/yt-dlp-exec/bin \
    && wget -q -O node_modules/yt-dlp-exec/bin/yt-dlp \
        https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
    && chmod +x node_modules/yt-dlp-exec/bin/yt-dlp

COPY . .

CMD ["node", "index.js"]
