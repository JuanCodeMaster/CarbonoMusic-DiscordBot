const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '../data/config.json');

function load() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function save(data) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2));
}

function get(guildId) {
  const data = load();
  return data[guildId] || {};
}

function set(guildId, key, value) {
  const data = load();
  if (!data[guildId]) data[guildId] = {};
  data[guildId][key] = value;
  save(data);
}

module.exports = { get, set };
