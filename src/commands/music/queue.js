const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { useQueue } = require('discord-player');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Muestra la cola de reproduccion'),

  async execute(interaction) {
    const queue = useQueue(interaction.guild.id);

    if (!queue || !queue.isPlaying()) {
      return interaction.reply({ content: 'No hay musica reproduciendose.', flags: MessageFlags.Ephemeral });
    }

    const tracks = queue.tracks.toArray().slice(0, 10);
    const current = queue.currentTrack;

    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('Cola de reproduccion')
      .setDescription(
        `**Reproduciendo ahora:**\n[${current.title}](${current.url}) — ${current.duration}\n\n` +
        (tracks.length > 0
          ? tracks.map((t, i) => `**${i + 1}.** [${t.title}](${t.url}) — ${t.duration}`).join('\n')
          : '*La cola esta vacia*')
      )
      .setFooter({ text: `${queue.tracks.size} cancion(es) en la cola` });

    return interaction.reply({ embeds: [embed] });
  },
};
