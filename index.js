require('dotenv').config();
const { Client, GatewayIntentBits, Collection, MessageFlags } = require('discord.js');
const { Player } = require('discord-player');
const { PlayDLExtractor } = require('./src/extractors/PlayDLExtractor');
const fs = require('fs');
const path = require('path');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
  ],
});

// Inicializar el player
const player = new Player(client);

player.extractors.register(PlayDLExtractor, {}).then(() => {
  console.log('Extractor play-dl cargado.');
});

// Eventos del player
player.events.on('playerStart', (queue, track) => {
  queue.metadata.channel.send(`Reproduciendo: **${track.title}**`);
});

player.events.on('error', (queue, err) => {
  console.error('Error en la cola:', err.message);
});

player.events.on('playerError', (queue, err) => {
  console.error('Error del player:', err.message);
});

// Cargar comandos
client.commands = new Collection();

function loadCommands(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      loadCommands(fullPath);
    } else if (entry.name.endsWith('.js')) {
      const command = require(fullPath);
      if (command.data && command.execute) {
        client.commands.set(command.data.name, command);
      }
    }
  }
}

loadCommands(path.join(__dirname, 'src/commands'));

// Manejar interacciones
client.on('interactionCreate', async interaction => {
  // Autocomplete
  if (interaction.isAutocomplete()) {
    const command = client.commands.get(interaction.commandName);
    if (command?.autocomplete) {
      try {
        await command.autocomplete(interaction);
      } catch (err) {
        console.error('Error en autocomplete:', err.message);
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
    console.error('Error en comando:', err.message);
    const msg = { content: 'Ocurrio un error al ejecutar el comando.', flags: MessageFlags.Ephemeral };
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

// Evitar crash por errores no capturados del cliente
client.on('error', err => {
  console.error('Error del cliente:', err.message);
});

client.once('clientReady', () => {
  console.log(`Bot listo como ${client.user.tag}`);
  client.user.setActivity('musica', { type: 2 });
});

client.login(process.env.TOKEN);
