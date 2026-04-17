const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Muestra informacion de un usuario')
    .addUserOption(o =>
      o.setName('usuario')
        .setDescription('Usuario a consultar (deja vacio para verte a ti)')
    ),

  async execute(interaction) {
    const target = interaction.options.getMember('usuario') ?? interaction.member;
    const user   = target.user;

    const roles = target.roles.cache
      .filter(r => r.id !== interaction.guild.id)
      .sort((a, b) => b.position - a.position)
      .map(r => `<@&${r.id}>`)
      .slice(0, 10)
      .join(' ') || 'Ninguno';

    const embed = new EmbedBuilder()
      .setColor(target.displayHexColor || '#FFD700')
      .setTitle(user.tag)
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: 'En el servidor desde', value: `<t:${Math.floor(target.joinedTimestamp / 1000)}:D>`, inline: true },
        { name: 'Cuenta creada el',     value: `<t:${Math.floor(user.createdTimestamp / 1000)}:D>`,  inline: true },
        { name: `Roles (${target.roles.cache.size - 1})`, value: roles },
      )
      .setFooter({ text: `ID: ${user.id}` });

    return interaction.reply({ embeds: [embed] });
  },
};
