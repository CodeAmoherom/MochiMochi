const { REST, Routes, Client, Collection, Events, GatewayIntentBits, SlashCommanhttps: dBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const { Configuration, OpenAIApi } = require("openai");

const clientId = process.env['CLIENT_ID'];
const token = process.env['TOKEN'];
const dev_channel = process.env['DEV_CHANNEL'];
const message_stack_size = 8;

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

  if (message.author.bot) return; // Ignore messages from other bots
  if (!message.mentions.users.has(client.user.id)) return;
  var user_name = "";
  try {
    if (message.author.id === '617690320276160512') {
      user_name = "Amoeher";
    }
    else {
      user_name = message.author.username;
    }

    GetReply(removeMentions(user_name.concat(":", message.content))).then((reply) => {
      message.channel.send(reply.replace('Mochi: ', ''));
      var trigger = `\\b${removeMentions(message.content)}\\b`;
      SaveConversation(trigger, reply);
    });
  }
  catch
  {
    console.log("Something wornmg happened");
  }

  return; // Exit the function after sending the reply
});


function removeLeadingSpaces(str) {
  return str.replace(/^\s+/, '');
}

function removeMentions(text) {
  const regex = /<@.*?>/g;
  return removeLeadingSpaces(text.replace(regex, ''));
}

var messages = [];

function pushMessage(role, content) {
  try {
    if (messages.length >= message_stack_size) {
      messages.shift(); // Remove the oldest message if the stack is full
    }
    messages.push({ "role": role, "content": content });
  }
  catch {
    console.log("Cannot Save the message");
    console.log(messages);
  }
}

async function GetReply(message) {
  instructions = process.env['INSTRUCTION'];

  pushMessage("system", instructions); // Add a system message
  pushMessage("user", message);

  const response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: messages
  });

  var reply = response.data.choices[0].message.content;
  pushMessage("assistant", reply); // Add an assistant message
  updateChrCount(countConversation(messages));
  return reply;

}

function countConversation(conve) {
  let characterCount = 0;

  conve.forEach((message) => {
    characterCount += message.content.length;
  });

  return characterCount;
}

function updateChrCount(numberOfCharactors) {
  const filePath = 'character_count.txt';
  fs.readFile(filePath, 'utf8', (error, data) => {
    if (error) {
      console.error('Failed to read character count file:', error);
      return;
    }

    console.log('New Count: ', numberOfCharactors);
    const currentCount = parseInt(data) || 0;
    console.log('Old Count: ', currentCount);

    const totalCount = currentCount + numberOfCharactors;

    fs.writeFile(filePath, totalCount.toString(), (error) => {
      if (error) {
        console.error('Failed to update character count file:', error);
      } else {
        console.log('Character count updated:', totalCount);
      }
    });
  });
}

function SaveConversation(trigger, reply) {
  console.log("Saving Conversation");
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
  }
  catch (error) {
    console.error('Error reading conversations file:', error);
  }

  /* // Check if there is an existing conversation with the same trigger
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
   } else {*/
  // Add a new conversation to the existing list
  conversations.push(conversation);
  console.log('New conversation added.');
  // }

  // Write the updated conversations back to the file
  try {
    fs.writeFileSync(conversationsFilePath, JSON.stringify(conversations, null, 2));
    console.log('Conversations saved successfully.');
  }
  catch (error) {
    console.error('Error writing conversations file:', error);
  }
}

client.login(token);