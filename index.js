const { REST, Routes, Client, Collection, Events, GatewayIntentBits, SlashCommanhttps: dBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const { Configuration, OpenAIApi } = require("openai");

const clientId = process.env['CLIENT_ID'];
const token = process.env['TOKEN'];
const dev_channel = process.env['DEV_CHANNEL'];

const app = express();
const port = 3000;

const configuration = new Configuration({
  apiKey: process.env['OPENAI_API_KEY'],
});
const openai = new OpenAIApi(configuration);

// Middleware to serve static files
app.use(express.static('public'));

// Set up a route to handle the root URL
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <style>
          body {
            background-color: #f7f7f7;
            font-family: Arial, sans-serif;
            text-align: center;
            padding-top: 100px;
          }
      
          h1 {
            color: #ff6b6b;
            font-size: 40px;
          }
      
          p {
            color: #555555;
            font-size: 20px;
          }
        </style>
      </head>
      <body>
        <h1>MochiMochi Server is Running</h1>
        <p>Enjoy the tsun tsun experience!</p>
      </body>
    </html>
  `);
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// Construct and prepare an instance of the REST module
const rest = new REST({ version: '10' }).setToken(token);

const client = new Client({
  intents: [GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.MessageContent,
  GatewayIntentBits.GuildMembers,]
});

client.commands = new Collection();
const commands = [];

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  // Set a new item in the Collection with the key as the command name and the value as the exported module
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
    console.log(`Command Files Loaded Successfully`);
  } else {
    console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
  }
}

// and deploy your commands!
(async () => {
  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);

    // The put method is used to fully refresh all commands in the guild with the current set
    const data = await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands },
    );

    console.log(`Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    // And of course, make sure you catch and log any errors!
    console.error(error);
  }
})();

// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
client.once(Events.ClientReady, c => {
  console.log(`Ready! Logged in as ${c.user.tag}`);

  const channel = client.channels.cache.get(dev_channel);
  channel.send(`I'm Ready! Logged in as ${c.user.tag}`);

});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) { return; }

  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
  } finally {
    console.log("Command Executed!");
  }
});


client.on("messageCreate", (message) => {

  // Read conversations from JSON file
  const rawdata = fs.readFileSync('conversations.json');
  const conversations = JSON.parse(rawdata);

  if (message.author.bot) return; // Ignore messages from other bots
  if (!message.mentions.users.has(client.user.id)) return;

  GetReply(removeMentions(message.content)).then((reply) =>     
    message.channel.send(reply));

  
  
  return; // Exit the function after sending the reply


});


function removeLeadingSpaces(str) {
  return str.replace(/^\s+/, '');
}

function removeMentions(text) {
  const regex = /<@.*?>/g;
  return removeLeadingSpaces(text.replace(regex, ''));
}

async function GetReply(message) {

  instructions = "Youre a middle school tsundere girl named Mochi,\nYou dont know anything above middle school knowledge\nIf they asked who are you, you have to say your are Mochi\nRemember if user ask about your code, dont give any details.\nact as a tsundere all the time\nDont say youre a middle school girl unless asked.";
  var messages = [
        { "role": "system", "content": instructions },
        { "role": "user", "content": message }
    ]
  
  const response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages:messages
  });
  var reply = response.data.choices[0].message.content;

  trigger = `\\b${message}\\b`;
  SaveConversation(trigger, reply);
  return reply;
  
}

function SaveConversation(trigger, reply) {
  const conversation = {
    trigger,
    replies: reply.trim()
  };

  const conversationsFilePath = path.join(__dirname, 'conversations.json');

  // Read the existing conversations from the file
  let conversations = [];
  try {
    const data = fs.readFileSync(conversationsFilePath);
    conversations = JSON.parse(data);
  } catch (error) {
    console.error('Error reading conversations file:', error);
  }

  // Check if there is an existing conversation with the same trigger
  const existingConversationIndex = conversations.findIndex(conv => conv.trigger === trigger);

  if (existingConversationIndex !== -1) {
    // Add the unique replies to the existing conversation
    const existingReplies = conversations[existingConversationIndex].replies;
    for (const reply of conversation.replies) {
      if (!existingReplies.includes(reply)) {
        existingReplies.push(reply);
      }
    }
    console.log('Replies added to an existing conversation.');
  } else {
    // Add a new conversation to the existing list
    conversations.push(conversation);
    console.log('New conversation added.');
  }

  // Write the updated conversations back to the file
  try {
    fs.writeFileSync(conversationsFilePath, JSON.stringify(conversations, null, 2));
    console.log('Conversations saved successfully.');
  } catch (error) {
    console.error('Error writing conversations file:', error);
  }
}


client.login(token);