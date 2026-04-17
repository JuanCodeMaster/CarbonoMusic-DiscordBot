const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { useMainPlayer } = require('discord-player');
const https = require('https');

function youtubeSuggest(query) {
  return new Promise((resolve) => {
    // client=firefox devuelve JSON puro
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(query)}`;
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      let data = '';
      res.on('data', d => (data += d));
      res.on('end', () => {
        try {
          const json = JSON.parse(data); // [query, [sugerencia1, sugerencia2, ...]]
          resolve((json[1] || []).slice(0, 10));
        } catch {
          resolve([]);
        }
      });
    }).on('error', () => resolve([]));
  });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Reproduce una cancion o playlist')
    .addStringOption(option =>
      option.setName('cancion')
        .setDescription('Nombre o URL de la cancion')
        .setRequired(true)
        .setAutocomplete(true)   // <-- activa el autocompletado
    ),

  // Se llama mientras el usuario escribe
  async autocomplete(interaction) {
    const query = interaction.options.getFocused();
    if (!query || query.length < 2) return interaction.respond([]);

    const suggestions = await youtubeSuggest(query);
    const choices = suggestions.map(s => ({
      name: s.substring(0, 100),
      value: s,
    }));

    return interaction.respond(choices);
  },

  async execute(interaction) {
    const player = useMainPlayer();
    const channel = interaction.member?.voice?.channel;

    if (!channel) {
      return interaction.reply({ content: 'Debes estar en un canal de voz.', flags: MessageFlags.Ephemeral });
    }

    const query = interaction.options.getString('cancion');
    await interaction.deferReply();

    try {
      const { track } = await player.play(channel, query, {
        nodeOptions: {
          metadata: { channel: interaction.channel },
          selfDeaf: true,
          volume: 80,
          leaveOnEmpty: true,
          leaveOnEmptyCooldown: 30000,
          leaveOnEnd: true,
          leaveOnEndCooldown: 30000,
        },
      });

      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('Agregado a la cola')
        .setDescription(`**[${track.title}](${track.url})**`)
        .addFields(
          { name: 'Duracion', value: track.duration, inline: true },
          { name: 'Solicitado por', value: `${interaction.user}`, inline: true },
        )
        .setThumbnail(track.thumbnail)
        .setFooter({ text: `Fuente: ${track.source}` });

      return interaction.followUp({ embeds: [embed] });
    } catch (err) {
      return interaction.followUp({ content: 'No se pudo reproducir la cancion. Intentalo de nuevo.', flags: MessageFlags.Ephemeral });
    }
  },
};
