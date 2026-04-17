const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { get, set } = require('../../utils/guildConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('Configura el bot para este servidor')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName('bienvenida-canal')
        .setDescription('Canal donde se envian los mensajes de bienvenida')
        .addChannelOption(o =>
          o.setName('canal').setDescription('Canal de texto').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('bienvenida-mensaje')
        .setDescription('Mensaje de bienvenida ({user} = menciona al usuario)')
        .addStringOption(o =>
          o.setName('mensaje').setDescription('Texto del mensaje').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('bienvenida-off')
        .setDescription('Desactiva los mensajes de bienvenida')
    )
    .addSubcommand(sub =>
      sub.setName('autorole')
        .setDescription('Rol que se da automaticamente a nuevos miembros')
        .addRoleOption(o =>
          o.setName('rol').setDescription('Rol a asignar').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('autorole-off')
        .setDescription('Desactiva el rol automatico')
    )
    .addSubcommand(sub =>
      sub.setName('ver')
        .setDescription('Ver la configuracion actual')
    ),

  async execute(interaction) {
    const sub     = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    const cfg     = get(guildId);

    if (sub === 'bienvenida-canal') {
      const canal = interaction.options.getChannel('canal');
      set(guildId, 'welcomeChannel', canal.id);
      return interaction.reply({ embeds: [ok(`Canal de bienvenida: ${canal}`)] });
    }

    if (sub === 'bienvenida-mensaje') {
      const msg = interaction.options.getString('mensaje');
      set(guildId, 'welcomeMessage', msg);
      return interaction.reply({ embeds: [ok(`Mensaje guardado: ${msg}`)] });
    }

    if (sub === 'bienvenida-off') {
      set(guildId, 'welcomeChannel', null);
      return interaction.reply({ embeds: [ok('Mensajes de bienvenida desactivados.')] });
    }

    if (sub === 'autorole') {
      const rol = interaction.options.getRole('rol');
      set(guildId, 'autoRole', rol.id);
      return interaction.reply({ embeds: [ok(`Auto-rol: ${rol}`)] });
    }

    if (sub === 'autorole-off') {
      set(guildId, 'autoRole', null);
      return interaction.reply({ embeds: [ok('Auto-rol desactivado.')] });
    }

    if (sub === 'ver') {
      const canal   = cfg.welcomeChannel ? `<#${cfg.welcomeChannel}>` : 'No configurado';
      const mensaje = cfg.welcomeMessage || 'Bienvenido {user} al servidor!';
      const rol     = cfg.autoRole       ? `<@&${cfg.autoRole}>`      : 'No configurado';

      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('Configuracion del servidor')
        .addFields(
          { name: 'Canal de bienvenida', value: canal,   inline: true },
          { name: 'Auto-rol',            value: rol,     inline: true },
          { name: 'Mensaje',             value: mensaje },
        );
      return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
  },
};

function ok(text) {
  return new EmbedBuilder().setColor('#FFD700').setDescription(`${text}`);
}
