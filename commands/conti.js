const { SlashCommandBuilder } = require('discord.js');
const { toggleContinuous, getContinuousStatus } = require('../globals');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('conti')
    .setDescription('Toggles Continous Mode'),
  async execute(interaction) {

    if (interaction.user.id === '617690320276160512') {

      toggleContinuous();
      const isContinuous = getContinuousStatus();
      if (!isContinuous) {
        await interaction.reply('Continuous Mode Disabled');
      } else {
        await interaction.reply('Continuous Mode Enabled');
      }
    }
    else {
      await interaction.reply('Who are you?');
    }
  },
};