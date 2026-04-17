const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { useQueue } = require('discord-player');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Muestra la cancion que se esta reproduciendo'),

  async execute(interaction) {
    const queue = useQueue(interaction.guild.id);

    if (!queue || !queue.isPlaying()) {
      return interaction.reply({ content: 'No hay musica reproduciendose.', flags: MessageFlags.Ephemeral });
    }

    const track = queue.currentTrack;
    const progress = queue.node.createProgressBar();

    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('Reproduciendo ahora')
      .setDescription(`**[${track.title}](${track.url})**`)
      .addFields(
        { name: 'Duracion', value: track.duration, inline: true },
        { name: 'Solicitado por', value: `${track.requestedBy}`, inline: true },
        { name: 'Progreso', value: progress || 'No disponible' }
      )
      .setThumbnail(track.thumbnail);

    return interaction.reply({ embeds: [embed] });
  },
};
