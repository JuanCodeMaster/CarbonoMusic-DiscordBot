const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { useQueue } = require('discord-player');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Ajusta el volumen (0-100)')
    .addIntegerOption(option =>
      option.setName('nivel')
        .setDescription('Nivel de volumen entre 0 y 100')
        .setMinValue(0)
        .setMaxValue(100)
        .setRequired(true)
    ),

  async execute(interaction) {
    const queue = useQueue(interaction.guild.id);

    if (!queue || !queue.isPlaying()) {
      return interaction.reply({ content: 'No hay musica reproduciendose.', flags: MessageFlags.Ephemeral });
    }

    const vol = interaction.options.getInteger('nivel');
    queue.node.setVolume(vol);

    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setDescription(`Volumen ajustado a **${vol}%**`);

    return interaction.reply({ embeds: [embed] });
  },
};
