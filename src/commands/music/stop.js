const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { useQueue } = require('discord-player');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Detiene la musica y vacia la cola'),

  async execute(interaction) {
    const queue = useQueue(interaction.guild.id);

    if (!queue || !queue.isPlaying()) {
      return interaction.reply({ content: 'No hay musica reproduciendose.', flags: MessageFlags.Ephemeral });
    }

    queue.delete();

    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setDescription('Musica detenida y cola vaciada.');

    return interaction.reply({ embeds: [embed] });
  },
};
