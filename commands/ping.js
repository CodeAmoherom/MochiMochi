const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with something!'),
  async execute(interaction) {
    await interaction.reply('Hii, MochiMochi Here!');
  },
};