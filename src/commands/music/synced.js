const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { useQueue } = require('discord-player');
const https = require('https');

// Mapa global de intervalos activos por servidor
const activeSynced = new Map();

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'DiscordMusicBot/1.0' } }, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function parseLrc(lrc) {
  const lines = [];
  for (const line of lrc.split('\n')) {
    const match = line.match(/^\[(\d+):(\d+\.\d+)\](.*)/);
    if (match) {
      const ms = (parseInt(match[1]) * 60 + parseFloat(match[2])) * 1000;
      const text = match[3].trim();
      if (text) lines.push({ ms, text });
    }
  }
  return lines.sort((a, b) => a.ms - b.ms);
}

function getCurrentLine(lines, currentMs) {
  let idx = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].ms <= currentMs) idx = i;
    else break;
  }
  return idx;
}

function buildEmbed(lines, idx, trackTitle) {
  const prev = idx > 0 ? lines[idx - 1].text : '';
  const curr = lines[idx] ? lines[idx].text : '';
  const next1 = lines[idx + 1] ? lines[idx + 1].text : '';
  const next2 = lines[idx + 2] ? lines[idx + 2].text : '';

  const display = [
    prev   ? `┊ *${prev}*` : '',
    curr   ? `\n**▶ ${curr}**\n` : '',
    next1  ? `┊ ${next1}` : '',
    next2  ? `┊ *${next2}*` : '',
  ].filter(Boolean).join('\n');

  return new EmbedBuilder()
    .setColor('#FFD700')
    .setTitle(`🎵 ${trackTitle}`)
    .setDescription(display || '*...*')
    .setFooter({ text: 'Letra sincronizada • usa /synced stop para detener' });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('synced')
    .setDescription('Muestra la letra sincronizada con la cancion')
    .addStringOption(o =>
      o.setName('accion')
        .setDescription('Iniciar o detener')
        .addChoices(
          { name: 'Iniciar', value: 'start' },
          { name: 'Detener', value: 'stop' },
        )
    ),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const accion = interaction.options.getString('accion') ?? 'start';

    // Detener
    if (accion === 'stop') {
      if (activeSynced.has(guildId)) {
        clearInterval(activeSynced.get(guildId));
        activeSynced.delete(guildId);
        return interaction.reply({ content: 'Letra sincronizada detenida.', flags: MessageFlags.Ephemeral });
      }
      return interaction.reply({ content: 'No hay letra sincronizada activa.', flags: MessageFlags.Ephemeral });
    }

    const queue = useQueue(guildId);
    if (!queue || !queue.isPlaying()) {
      return interaction.reply({ content: 'No hay musica reproduciendose.', flags: MessageFlags.Ephemeral });
    }

    if (activeSynced.has(guildId)) {
      clearInterval(activeSynced.get(guildId));
      activeSynced.delete(guildId);
    }

    await interaction.deferReply();

    const track = queue.currentTrack;

    // Buscar letra en lrclib.net
    let lines = [];
    try {
      const query = encodeURIComponent(track.title);
      const results = await fetchJson(`https://lrclib.net/api/search?q=${query}`);

      if (results?.length && results[0].syncedLyrics) {
        lines = parseLrc(results[0].syncedLyrics);
      }
    } catch (err) {
      console.error('[synced] Error al buscar letra:', err.message);
    }

    if (!lines.length) {
      return interaction.followUp({ content: `No encontre letra sincronizada para **${track.title}**.` });
    }

    // Primer render
    const ts = queue.node.getTimestamp();
    const currentMs = ts?.current?.value ?? 0;
    const idx = getCurrentLine(lines, currentMs);
    const msg = await interaction.followUp({ embeds: [buildEmbed(lines, idx, track.title)] });

    // Actualizar cada segundo
    const interval = setInterval(async () => {
      try {
        const q = useQueue(guildId);
        if (!q || !q.isPlaying()) {
          clearInterval(interval);
          activeSynced.delete(guildId);
          return;
        }

        const t = q.node.getTimestamp();
        const ms = t?.current?.value ?? 0;
        const i = getCurrentLine(lines, ms);

        await msg.edit({ embeds: [buildEmbed(lines, i, q.currentTrack.title)] });
      } catch {
        clearInterval(interval);
        activeSynced.delete(guildId);
      }
    }, 1500);

    activeSynced.set(guildId, interval);
  },
};
