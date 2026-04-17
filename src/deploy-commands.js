require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');

function loadCommands(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      loadCommands(fullPath);
    } else if (entry.name.endsWith('.js')) {
      const command = require(fullPath);
      if (command.data) commands.push(command.data.toJSON());
    }
  }
}

loadCommands(commandsPath);

const rest = new REST().setToken(process.env.TOKEN);

(async () => {
  try {
    console.log(`Registrando ${commands.length} comandos...`);
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
    console.log('Comandos registrados correctamente.');
  } catch (err) {
    console.error(err);
  }
})();
