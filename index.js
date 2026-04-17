require('dotenv').config();
const { Client, GatewayIntentBits, Collection, MessageFlags, ActivityType, EmbedBuilder } = require('discord.js');
const { get } = require('./src/utils/guildConfig');
const { Player } = require('discord-player');
const { PlayDLExtractor } = require('./src/extractors/PlayDLExtractor');
const fs = require('fs');
const path = require('path');

// ─── Validar variables de entorno ────────────────────────────────────────────
if (!process.env.TOKEN || !process.env.CLIENT_ID) {
  console.error('[ERROR] Faltan variables de entorno. Revisa tu archivo .env');
  process.exit(1);
}

// ─── Cliente de Discord ───────────────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
  ],
});

// ─── Player ───────────────────────────────────────────────────────────────────
const player = new Player(client);

player.extractors.register(PlayDLExtractor, {}).then(() => {
  console.log('[Player] Extractor cargado.');
}).catch(err => {
  console.error('[Player] Error al cargar extractor:', err.message);
  process.exit(1);
});

// Eventos del player
player.events.on('playerStart', (queue, track) => {
  queue.metadata.channel
    .send(`Reproduciendo: **${track.title}**`)
    .catch(() => {});
});

player.events.on('emptyQueue', (queue) => {
  queue.metadata.channel
    .send('La cola termino. Hasta luego!')
    .catch(() => {});
});

player.events.on('error', (queue, err) => {
  console.error('[Player] Error en cola:', err.message);
});

player.events.on('playerError', (queue, err) => {
  console.error('[Player] Error de reproduccion:', err.message);
});

// ─── Cargar comandos ──────────────────────────────────────────────────────────
client.commands = new Collection();

function loadCommands(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      loadCommands(fullPath);
    } else if (entry.name.endsWith('.js')) {
      try {
        const command = require(fullPath);
        if (command.data && command.execute) {
          client.commands.set(command.data.name, command);
        } else {
          console.warn(`[Comandos] ${entry.name} no tiene data o execute.`);
        }
      } catch (err) {
        console.error(`[Comandos] Error al cargar ${entry.name}:`, err.message);
      }
    }
  }
}

loadCommands(path.join(__dirname, 'src/commands'));
console.log(`[Comandos] ${client.commands.size} comandos cargados.`);

// ─── Interacciones ────────────────────────────────────────────────────────────
client.on('interactionCreate', async interaction => {
  // Autocomplete
  if (interaction.isAutocomplete()) {
    const command = client.commands.get(interaction.commandName);
    if (command?.autocomplete) {
      try {
        await command.autocomplete(interaction);
      } catch (err) {
        console.error('[Autocomplete] Error:', err.message);
      }
    }
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(`[Comando /${interaction.commandName}] Error:`, err.message);
    const msg = {
      content: 'Ocurrio un error al ejecutar el comando. Intentalo de nuevo.',
      flags: MessageFlags.Ephemeral,
    };
    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(msg);
      } else {
        await interaction.reply(msg);
      }
    } catch {
      // interaccion expirada, ignorar
    }
  }
});

// ─── Bienvenida y auto-rol ────────────────────────────────────────────────────
client.on('guildMemberAdd', async member => {
  const cfg = get(member.guild.id);

  // Auto-rol
  if (cfg.autoRole) {
    const role = member.guild.roles.cache.get(cfg.autoRole);
    if (role) member.roles.add(role).catch(() => {});
  }

  // Mensaje de bienvenida
  if (cfg.welcomeChannel) {
    const channel = member.guild.channels.cache.get(cfg.welcomeChannel);
    if (!channel) return;

    const mensaje = (cfg.welcomeMessage || 'Bienvenido {user} al servidor!')
      .replace('{user}', `<@${member.id}>`);

    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setDescription(mensaje)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: `Miembro #${member.guild.memberCount}` });

    channel.send({ embeds: [embed] }).catch(() => {});
  }
});

// ─── Eventos del cliente ──────────────────────────────────────────────────────
client.on('error', err => {
  console.error('[Cliente] Error de WebSocket:', err.message);
});

client.on('warn', info => {
  console.warn('[Cliente] Advertencia:', info);
});

client.once('clientReady', () => {
  console.log(`[Bot] Listo como ${client.user.tag}`);
  client.user.setActivity('musica', { type: ActivityType.Listening });
});

// ─── Errores globales (evitan crashes inesperados) ────────────────────────────
process.on('uncaughtException', err => {
  console.error('[Proceso] Error no capturado:', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Proceso] Promesa rechazada sin manejar:', reason);
});

// ─── Login ────────────────────────────────────────────────────────────────────
client.login(process.env.TOKEN).catch(err => {
  console.error('[Bot] Error al iniciar sesion:', err.message);
  process.exit(1);
});
