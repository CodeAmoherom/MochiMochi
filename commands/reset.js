const { SlashCommandBuilder } = require('discord.js');
require('dotenv').config();
const CharacterAI = require("node_characterai");
const characterAI = new CharacterAI();
const characterId = "R3Z7Z0uVBTcaDcpffuJUlS_cAAOmDg9PXsubvD0nURo";

(async () => {
  await characterAI.authenticateWithToken(process.env['CHAR_TOKEN']);
})();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reset')
    .setDescription('Replies with something!'),
  async execute(interaction) {
    if (interaction.user.id === '617690320276160512') {
      const chat = await characterAI.createOrContinueChat(characterId);
      await chat.saveAndStartNewChat();
      await interaction.reply('Reset Success');
    }
    else {
      await interaction.reply('Who are you?');
    }
  }
  ,
};