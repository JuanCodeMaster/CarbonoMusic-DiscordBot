const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { useQueue } = require('discord-player');
const Genius = require('genius-lyrics');

const genius = new Genius.Client();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lyrics')
    .setDescription('Muestra la letra de la cancion actual o una especifica')
    .addStringOption(option =>
      option.setName('cancion')
        .setDescription('Nombre de la cancion (deja vacio para la cancion actual)')
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    let query = interaction.options.getString('cancion');

    if (!query) {
      const queue = useQueue(interaction.guild.id);
      if (!queue || !queue.isPlaying()) {
        return interaction.followUp({ content: 'No hay musica reproduciendose. Escribe el nombre de una cancion.', flags: MessageFlags.Ephemeral });
      }
      query = queue.currentTrack.title;
    }

    try {
      const searches = await genius.songs.search(query);

      if (!searches.length) {
        return interaction.followUp({ content: `No encontre letra para **${query}**.` });
      }

      const song = searches[0];
      const lyrics = await song.lyrics();

      if (!lyrics) {
        return interaction.followUp({ content: `No hay letra disponible para **${song.title}**.` });
      }

      // Discord permite max 4096 chars en descripcion del embed
      const maxLength = 4000;
      const lyricsText = lyrics.length > maxLength
        ? lyrics.substring(0, maxLength) + '\n\n*(letra truncada)*'
        : lyrics;

      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle(`${song.title} — ${song.artist.name}`)
        .setDescription(lyricsText)
        .setThumbnail(song.image)
        .setFooter({ text: 'Letra via Genius' });

      return interaction.followUp({ embeds: [embed] });
    } catch (err) {
      return interaction.followUp({ content: `No pude obtener la letra: ${err.message}` });
    }
  },
};
