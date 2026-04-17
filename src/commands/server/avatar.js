const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Muestra el avatar de un usuario')
    .addUserOption(o =>
      o.setName('usuario')
        .setDescription('Usuario (deja vacio para el tuyo)')
    ),

  async execute(interaction) {
    const user = interaction.options.getUser('usuario') ?? interaction.user;

    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle(`Avatar de ${user.username}`)
      .setImage(user.displayAvatarURL({ dynamic: true, size: 512 }))
      .setFooter({ text: `ID: ${user.id}` });

    return interaction.reply({ embeds: [embed] });
  },
};
