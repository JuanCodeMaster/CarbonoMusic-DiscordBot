const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { useQueue } = require('discord-player');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pausa o reanuda la reproduccion'),

  async execute(interaction) {
    const queue = useQueue(interaction.guild.id);

    if (!queue || !queue.isPlaying()) {
      return interaction.reply({ content: 'No hay musica reproduciendose.', flags: MessageFlags.Ephemeral });
    }

    if (queue.node.isPaused()) {
      queue.node.resume();
      const embed = new EmbedBuilder().setColor('#FFD700').setDescription('Reproduccion reanudada.');
      return interaction.reply({ embeds: [embed] });
    } else {
      queue.node.pause();
      const embed = new EmbedBuilder().setColor('#FFD700').setDescription('Reproduccion pausada.');
      return interaction.reply({ embeds: [embed] });
    }
  },
};
