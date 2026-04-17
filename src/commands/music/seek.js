const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { useQueue } = require('discord-player');

function parseTime(str) {
  const parts = str.split(':').map(Number);
  if (parts.some(isNaN)) return null;
  if (parts.length === 2) return (parts[0] * 60 + parts[1]) * 1000;
  if (parts.length === 3) return (parts[0] * 3600 + parts[1] * 60 + parts[2]) * 1000;
  return null;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('seek')
    .setDescription('Salta a un momento especifico de la cancion')
    .addStringOption(option =>
      option.setName('tiempo')
        .setDescription('Tiempo en formato m:ss o h:mm:ss (ej: 1:30)')
        .setRequired(true)
    ),

  async execute(interaction) {
    const queue = useQueue(interaction.guild.id);

    if (!queue || !queue.isPlaying()) {
      return interaction.reply({ content: 'No hay musica reproduciendose.', flags: MessageFlags.Ephemeral });
    }

    const input = interaction.options.getString('tiempo');
    const ms = parseTime(input);

    if (ms === null) {
      return interaction.reply({ content: 'Formato invalido. Usa `1:30` o `1:20:00`.', flags: MessageFlags.Ephemeral });
    }

    await queue.node.seek(ms);

    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setDescription(`Saltado a **${input}**`);

    return interaction.reply({ embeds: [embed] });
  },
};
