FROM node:20-slim

# Instalar ffmpeg y dependencias necesarias
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    wget \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar package files e instalar dependencias
COPY package*.json ./
RUN npm ci --omit=dev

# Dar permisos al binario de yt-dlp (Linux)
RUN chmod +x node_modules/yt-dlp-exec/bin/yt-dlp || true

# Copiar el resto del codigo
COPY . .

CMD ["node", "index.js"]
