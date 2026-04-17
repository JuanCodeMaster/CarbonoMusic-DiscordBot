const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { useHistory } = require('discord-player');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('previous')
    .setDescription('Vuelve a la cancion anterior'),

  async execute(interaction) {
    const history = useHistory(interaction.guild.id);

    if (!history || history.isEmpty()) {
      return interaction.reply({ content: 'No hay canciones anteriores en el historial.', flags: MessageFlags.Ephemeral });
    }

    await history.previous();

    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setDescription('Volviendo a la cancion anterior.');

    return interaction.reply({ embeds: [embed] });
  },
};
