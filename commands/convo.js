const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('convo')
    .setDescription('Registers a new Conversation Option')
    .addStringOption(option =>
      option
        .setName('trigger')
        .setDescription('Regular expression pattern for the trigger')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('replies')
        .setDescription('Comma-separated list of replies')
        .setRequired(true)
    ),
  async execute(interaction) {
    const rawTrigger = interaction.options.getString('trigger');
    const trigger = rawTrigger.substring(1, rawTrigger.length - 1);
    const replies = interaction.options.getString('replies').split(':');

    const conversation = {
      trigger,
      replies: replies.map(reply => reply.trim())
    };

    const conversationsFilePath = path.join(__dirname, '..', 'conversations.json');

    // Read the existing conversations from the file
    let conversations = [];
    try {
      const data = fs.readFileSync(conversationsFilePath);
      conversations = JSON.parse(data);
    } catch (error) {
      console.error('Error reading conversations file:', error);
    }

    // Add the new conversation to the existing list
    conversations.push(conversation);

    // Write the updated conversations back to the file
    try {
      fs.writeFileSync(conversationsFilePath, JSON.stringify(conversations, null, 2));
      console.log('Conversation added successfully.');
    } catch (error) {
      console.error('Error writing conversations file:', error);
    }

    await interaction.reply('Conversation added successfully.');
  },
};
