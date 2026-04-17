FROM node:20-slim

# Instalar ffmpeg y dependencias del sistema
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    wget \
    ca-certificates \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias ignorando postinstall scripts que fallan en Linux
# (ffmpeg-static intenta verificar su binario de Windows aqui)
RUN npm install --omit=dev --ignore-scripts

# Descargar manualmente el binario de yt-dlp para Linux
RUN wget -q -O node_modules/yt-dlp-exec/bin/yt-dlp \
    https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
    && chmod +x node_modules/yt-dlp-exec/bin/yt-dlp

# Copiar el resto del codigo
COPY . .

CMD ["node", "index.js"]
