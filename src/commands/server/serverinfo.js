const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Muestra informacion del servidor'),

  async execute(interaction) {
    const guild = interaction.guild;
    await guild.fetch();

    const owner = await guild.fetchOwner();
    const channels = guild.channels.cache;
    const textChannels  = channels.filter(c => c.type === 0).size;
    const voiceChannels = channels.filter(c => c.type === 2).size;
    const roles = guild.roles.cache.size - 1; // excluir @everyone

    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle(guild.name)
      .setThumbnail(guild.iconURL({ dynamic: true }))
      .addFields(
        { name: 'Propietario',       value: owner.user.tag,                    inline: true },
        { name: 'Miembros',          value: `${guild.memberCount}`,            inline: true },
        { name: 'Roles',             value: `${roles}`,                        inline: true },
        { name: 'Canales de texto',  value: `${textChannels}`,                 inline: true },
        { name: 'Canales de voz',    value: `${voiceChannels}`,                inline: true },
        { name: 'Creado el',         value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: true },
      )
      .setFooter({ text: `ID: ${guild.id}` });

    return interaction.reply({ embeds: [embed] });
  },
};
