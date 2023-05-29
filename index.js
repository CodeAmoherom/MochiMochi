const { REST, Routes, Client, Collection, Events, GatewayIntentBits, SlashCommanhttps: dBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const clientId = process.env['CLIENT_ID'];
const token = process.env['TOKEN'];
const dev_channel = process.env['DEV_CHANNEL'];
const express = require('express');
const app = express();
const port = 3000;

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

  // Define the tsundere replies
  const tsundereReplies = [
    "Hmph! Why are you bothering me?",
    "Yes, what is it now? I hope you're not getting too comfortable with me.",
    "Ugh, what is it now? Don't get too used to calling my name like that.",
    "Hmph, hello. What do you want?",
  ];

  // Check the message content for specific conversations
  for (const convo of conversations) {
    const msg = removeMentions(message.content.toLowerCase());
    const regex = new RegExp(convo.trigger, 'i');
    if (regex.test(msg)) {
      const randomReply = convo.replies[Math.floor(Math.random() * convo.replies.length)];
      message.channel.send(randomReply);
      return; // Exit the function after sending the reply
    }
  }

  // If no specific conversation is matched, send a random tsundere reply
  const randomReply = tsundereReplies[Math.floor(Math.random() * tsundereReplies.length)];
  message.channel.send(randomReply);

});

function removeLeadingSpaces(str) {
  return str.replace(/^\s+/, '');
}

function removeMentions(text) {
  const regex = /<@.*?>/g;
  return removeLeadingSpaces(text.replace(regex, ''));
}

client.login(token);