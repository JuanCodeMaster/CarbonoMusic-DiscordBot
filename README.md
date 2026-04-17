# Carbono Music Bot

Bot de Discord con reproducción de música desde YouTube, letras sincronizadas y herramientas de servidor. Construido con Discord.js v14 y discord-player v7.

---

## Requisitos

- [Node.js](https://nodejs.org) v20 o superior
- [ffmpeg](https://ffmpeg.org/download.html) instalado y en el PATH del sistema
- Una aplicación de Discord creada en el [Developer Portal](https://discord.com/developers/applications)

---

## Instalación

```bash
# 1. Clona el repositorio
git clone https://github.com/tu-usuario/discord-music-bot.git
cd discord-music-bot

# 2. Instala las dependencias
npm install

# 3. Copia el archivo de variables de entorno
cp .env.example .env
```

Abre el archivo `.env` y completa los valores:

```env
TOKEN=tu_token_del_bot
CLIENT_ID=tu_application_id
```

Puedes obtener estos valores desde el [Discord Developer Portal](https://discord.com/developers/applications):
- **TOKEN** → Bot → Reset Token
- **CLIENT_ID** → General Information → Application ID

---

## Configuración del Developer Portal

Antes de arrancar el bot, activa los siguientes **Privileged Gateway Intents** en el portal:

1. Ve a tu aplicación → **Bot**
2. Activa **Server Members Intent**
3. Guarda los cambios

---

## Uso

```bash
# Registrar los slash commands en Discord (solo la primera vez o cuando agregues comandos nuevos)
npm run deploy

# Iniciar el bot
npm start
```

---

## Comandos

### Música

| Comando | Descripción |
|---|---|
| `/play <cancion>` | Reproduce una canción por nombre o URL. Incluye autocompletado. |
| `/skip` | Salta la canción actual |
| `/queue` | Muestra la cola de reproducción |
| `/pause` | Pausa o reanuda la reproducción |
| `/stop` | Detiene la música y vacía la cola |
| `/volume <0-100>` | Ajusta el volumen |
| `/nowplaying` | Muestra la canción actual con barra de progreso |
| `/loop <off/cancion/cola>` | Activa el modo de repetición |
| `/shuffle` | Mezcla aleatoriamente la cola |
| `/seek <1:30>` | Salta a un momento específico de la canción |
| `/previous` | Vuelve a la canción anterior |
| `/lyrics [cancion]` | Muestra la letra de la canción actual o una específica |
| `/synced [start/stop]` | Letra sincronizada en tiempo real (modo karaoke) |

### Servidor

| Comando | Descripción |
|---|---|
| `/serverinfo` | Muestra estadísticas del servidor |
| `/userinfo [@usuario]` | Muestra información de un miembro |
| `/avatar [@usuario]` | Muestra el avatar de un usuario en tamaño completo |
| `/config ver` | Ver la configuración actual del servidor |
| `/config bienvenida-canal <#canal>` | Establece el canal de bienvenida |
| `/config bienvenida-mensaje <texto>` | Personaliza el mensaje de bienvenida. Usa `{user}` para mencionar al nuevo miembro |
| `/config bienvenida-off` | Desactiva los mensajes de bienvenida |
| `/config autorole <@rol>` | Asigna un rol automáticamente a nuevos miembros |
| `/config autorole-off` | Desactiva el auto-rol |

> Los comandos `/config` requieren permisos de **Administrador**.

---

## Despliegue con Docker

El proyecto incluye un `Dockerfile` listo para producción.

```bash
docker build -t carbono-music-bot .
docker run -d --env-file .env carbono-music-bot
```

---

## Despliegue en Railway

1. Sube el proyecto a GitHub
2. En [Railway](https://railway.app), crea un nuevo proyecto desde tu repositorio
3. Agrega las variables de entorno `TOKEN` y `CLIENT_ID` en el panel de Railway
4. Railway detecta el Dockerfile automáticamente y despliega el bot

---

## Estructura del proyecto

```
discord-music-bot/
├── index.js                        # Entrada principal
├── Dockerfile
├── .env.example
├── src/
│   ├── commands/
│   │   ├── music/                  # Comandos de música
│   │   └── server/                 # Comandos de servidor
│   ├── extractors/
│   │   └── PlayDLExtractor.js      # Extractor de audio con yt-dlp
│   ├── utils/
│   │   └── guildConfig.js          # Gestión de configuración por servidor
│   ├── data/
│   │   └── config.json             # Configuración persistente
│   └── deploy-commands.js          # Script de registro de comandos
```

---

## Variables de entorno

| Variable | Descripción |
|---|---|
| `TOKEN` | Token del bot de Discord |
| `CLIENT_ID` | Application ID de tu bot |
