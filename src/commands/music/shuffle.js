const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { useQueue } = require('discord-player');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shuffle')
    .setDescription('Mezcla aleatoriamente la cola'),

  async execute(interaction) {
    const queue = useQueue(interaction.guild.id);

    if (!queue || !queue.isPlaying()) {
      return interaction.reply({ content: 'No hay musica reproduciendose.', ephemeral: true });
    }

    if (queue.tracks.size < 2) {
      return interaction.reply({ content: 'Necesitas al menos 2 canciones en la cola para mezclar.', ephemeral: true });
    }

    queue.tracks.shuffle();

    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setDescription(`Cola mezclada. **${queue.tracks.size}** canciones en nuevo orden.`);

    return interaction.reply({ embeds: [embed] });
  },
};
