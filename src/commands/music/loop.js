const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { useQueue, QueueRepeatMode } = require('discord-player');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Cambia el modo de repeticion')
    .addStringOption(option =>
      option.setName('modo')
        .setDescription('Modo de repeticion')
        .setRequired(true)
        .addChoices(
          { name: 'Desactivado', value: 'off' },
          { name: 'Cancion actual', value: 'track' },
          { name: 'Cola completa', value: 'queue' },
        )
    ),

  async execute(interaction) {
    const queue = useQueue(interaction.guild.id);

    if (!queue || !queue.isPlaying()) {
      return interaction.reply({ content: 'No hay musica reproduciendose.', ephemeral: true });
    }

    const modo = interaction.options.getString('modo');
    const modos = {
      off:   { value: QueueRepeatMode.OFF,   label: 'Desactivado' },
      track: { value: QueueRepeatMode.TRACK, label: 'Cancion actual' },
      queue: { value: QueueRepeatMode.QUEUE, label: 'Cola completa' },
    };

    queue.setRepeatMode(modos[modo].value);

    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setDescription(`Repeticion: **${modos[modo].label}**`);

    return interaction.reply({ embeds: [embed] });
  },
};
