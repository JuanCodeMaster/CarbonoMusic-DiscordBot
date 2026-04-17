const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { useQueue } = require('discord-player');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Salta la cancion actual'),

  async execute(interaction) {
    const queue = useQueue(interaction.guild.id);

    if (!queue || !queue.isPlaying()) {
      return interaction.reply({ content: 'No hay musica reproduciendose.', flags: MessageFlags.Ephemeral });
    }

    const track = queue.currentTrack;
    queue.node.skip();

    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setDescription(`Saltada: **${track.title}**`);

    return interaction.reply({ embeds: [embed] });
  },
};
