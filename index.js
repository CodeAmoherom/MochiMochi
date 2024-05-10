// Requre the dotenv for Secrets
require('dotenv').config();

const fs = require('node:fs');
const path = require('node:path');

const { REST, Routes, Client, Collection, Events, GatewayIntentBits, SlashCommanhttps: dBuilder } = require('discord.js');
const { joinVoiceChannel, VoiceConnectionStatus, entersState } = require('@discordjs/voice');

const express = require('express');

const CharacterAI = require("node_characterai");
const { channel } = require('node:diagnostics_channel');
const characterAI = new CharacterAI();

// Place your character's id here
const characterId = "R3Z7Z0uVBTcaDcpffuJUlS_cAAOmDg9PXsubvD0nURo";

(async () => {
	await characterAI.authenticateWithToken(process.env['CHAR_TOKEN']);
})();




const clientId = process.env['CLIENT_ID'];
const token = process.env['TOKEN'];
const dev_channel = process.env['DEV_CHANNEL'];
const message_stack_size = 8;

const app = express();
const port = 3000;

// Middleware to serve static files
app.use(express.static('public'));
// kanishla
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
	GatewayIntentBits.GuildMembers,
	GatewayIntentBits.GuildVoiceStates]
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


client.on("messageCreate", async (message) => {

	try {
		if (message.author.bot) return; // Ignore messages from other bots
		if (!message.mentions.users.has(client.user.id)) return;

		let isAmoeher = false

		if (message.author.id === '617690320276160512') {
			isAmoeher = true;
		}
		else {
			isAmoeher = false;
		}

		if (message.content.toLowerCase() === "join") {
			// Check if the author is in a voice channel
			if (message.member.voice.channel) {
				try {
					let channel = message.member.voice.channel;
					// Join the voice channel
					const connection = getVoiceConnection(channel, message);
					console.log(`Joined ${channel.name}`);
				} catch (error) {
					console.error(`Error joining voice channel: ${error.message}`);
				}
			} else {
				message.reply('Please join a voice channel first!');
			}
		}

		if (message.content.toLowerCase() === "leave") {
			// Check if the author is in a voice channel
			if (message.member.voice.channel) {
				try {
					let channel = message.member.voice.channel;
					// Join the voice channel
					const connection = getVoiceConnection(channel);
					console.log(`Joined ${channel.name}`);
					connection.destroy();
				} catch (error) {
					console.error(`Error joining voice channel: ${error.message}`);
				}
			} else {
				message.reply('Please join a voice channel first!');
			}
		}


		GetReply(JSON.stringify(generateMessageObject(message, isAmoeher))).then((reply) => {
			if (!reply) return;
			if (reply.length == 0) return;
			markMentions(message);
			message.reply(mentionAmoeher(reply));
			var anoUser = anonymizeQuestion(message);
			var anoReply = anonymizeReply(reply, message);
			SaveConversation(anoUser, anoReply);
		});

		return; // Exit the function after sending the reply
	}
	catch (error) {
		console.log(error);
		return;
	}
});

function getVoiceConnection(channel, message) {

	console.log("/!\ Voice Connection initializing.");
	var connection = joinVoiceChannel({
		channelId: channel.id,
		guildId: channel.guild.id,
		adapterCreator: channel.guild.voiceAdapterCreator,
		selfDeaf: false,
	});


	connection.on(VoiceConnectionStatus.Ready, () => {
		console.log('The connection has entered the Ready state - ready to play audio!');

		const audio = connection.receiver.subscribe(message.author.id);
		audio.pipe(fs.createWriteStream('user_audio'));
		const recorded = fs.ReadStream('user_audio');
		connection.playOpusPacket(recorded);
	});

	connection.on(VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
		try {
			await Promise.race([
				entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
				entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
			]);
			// Seems to be reconnecting to a new channel - ignore disconnect
		} catch (error) {
			// Seems to be a real disconnect which SHOULDN'T be recovered from
			connection.destroy();
		}
	});

	return connection;
}

function mentionAmoeher(message) {
	try {
		let updatedMessage = message.replace('@[Amoeher]', ' <@617690320276160512> ');
		let rew2 = updatedMessage.replace('@Amoeher', ' <@617690320276160512> ');
		return rew2.replace('@amoeher', ' <@617690320276160512> ');
	}
	catch (error) {
		console.log(error);
	}
}

function generateMessageObject(messageResponce, isAmoeher) {
	let message = {};
	message = {
		"MessageFrom": "Discord",
		"Sender": messageResponce.author.username,
		"Message": markMentions(messageResponce),
		"Group": messageResponce.guild.name,
		"UsersTime": convertToGMT530(messageResponce.createdAt),
		"More instrauctions": "if you think the message is not for you, reply with '_'. Remember to check the sender",
	}
	console.log(message);
	return message;
}

function removeLeadingSpaces(str) {
	return str.replace(/^\s+/, '');
}

function anonymizeReply(reply, message) {
	try {
		let mentonedUsers = message.mentions.users;
		let users = [];
		for (const user of mentonedUsers) {
			let username = "";
			if (user[1].username === "amoeher") {
				username = "creators_name";
			}
			else if (user[1].username === "MochiMochi") {
				username = "ai_name"
			}
			else {
				username = "username";
			}
			users.push(
				{
					"id": user[1].id,
					"name": username
				});

		}
		const regex = /<@.*?>/g;
		const updatedMessage = reply.replace(regex, matchedId => {
			const matchedUser = users.find(user => user.id === matchedId.substring(2, matchedId.length - 1));
			return matchedUser ? matchedUser.name : matchedId;
		});

		return updatedMessage;
	}
	catch (error) {
		console.log(error);
		return reply;
	}
}

function anonymizeQuestion(message) {
	let mentonedUsers = message.mentions.users;
	let users = [];
	for (const user of mentonedUsers) {
		let username = "";
		if (user[1].username === "amoeher") {
			username = "creators_name";
		}
		else if (user[1].username === "MochiMochi") {
			username = "ai_name"
		}
		else {
			username = "username";
		}
		users.push(
			{
				"id": user[1].id,
				"name": username
			});

	}
	const regex = /<@.*?>/g;
	const updatedMessage = message.content.replace(regex, matchedId => {
		const matchedUser = users.find(user => user.id === matchedId.substring(2, matchedId.length - 1));
		return matchedUser ? matchedUser.name : matchedId;
	});

	return updatedMessage.replace('Mochi', 'ai_name');
}

function markMentions(message) {
	let mentonedUsers = message.mentions.users;
	let users = [];
	for (const user of mentonedUsers) {
		users.push(
			{
				"id": user[1].id,
				"name": user[1].username
			});

	}
	const regex = /<@.*?>/g;
	const updatedMessage = message.content.replace(regex, matchedId => {
		const matchedUser = users.find(user => user.id === matchedId.substring(2, matchedId.length - 1));
		return matchedUser ? matchedUser.name : matchedId;
	});

	return updatedMessage;
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

	}
}

async function GetReply(message) {

	try {
		// instructions = process.env['INSTRUCTION'];

		// pushMessage("system", instructions); // Add a system message
		pushMessage("user", message);
		console.log(messages);
		// const response = await openai.createChatCompletion({
		//   model: "gpt-3.5-turbo",
		//   messages: messages
		// });

		// Send a message

		const chat = await characterAI.createOrContinueChat(characterId);
		// await chat.saveAndStartNewChat();
		const response = await chat.sendAndAwaitResponse(message, true);

		var reply = response.text;
		pushMessage("assistant", reply); // Add an assistant message
		return reply;
	}
	catch (error) {
		console.log("bla bla bla " + error);
	}

	//return "bla bla bla";
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

		//console.log('New Count: ', numberOfCharactors);
		const currentCount = parseInt(data) || 0;
		//console.log('Old Count: ', currentCount);

		const totalCount = currentCount + numberOfCharactors;

		fs.writeFile(filePath, totalCount.toString(), (error) => {
			if (error) {
				console.error('Failed to update character count file:', error);
			} else {
				//console.log('Character count updated:', totalCount);
			}
		});
	});
}

///Saves the Conversation to a file
/// trigger - 
/// reply - 
function SaveConversation(trigger, reply) {
	console.log("Saving Conversation");

	let conversation = `user: ${trigger}\nai: ${reply}\n`;
	//console.log(conversation);
	const conversationsFilePath = path.join(__dirname, 'conversations.txt');

	// Read the existing conversations from the file
	let conversations = "";

	try {
		conversations = fs.readFileSync(conversationsFilePath);
	}
	catch (error) {
		console.error('Error reading conversations file:', error);
	}

	conversations = conversations + conversation;
	console.log('New conversation added.');
	// }

	// Write the updated conversations back to the file
	try {
		fs.writeFileSync(conversationsFilePath, conversations);
		console.log('Conversations saved successfully.');
	}
	catch (error) {
		console.error('Error writing conversations file:', error);
	}
}

function sendMessage(message) {
	const channel = client.channels.cache.get(dev_channel);
	channel.send(`${message}`);
}

function convertToGMT530(datetime) {
	const gmtTimezoneOffset = 5.5 * 60 * 60; // GMT+5:30 in milliseconds
	const serverUtcTime = new Date();
	const desiredTime = new Date(serverUtcTime.getTime() + (gmtTimezoneOffset * 1000));
	return desiredTime;
}

function scheduleMessage(hour, minute, message) {
	const serverUtcTime = new Date().getTime();

	// Calculate the desired GMT+5:30 time
	const gmtTimezoneOffset = 5.5 * 60 * 60 * 1000; // GMT+5:30 in milliseconds
	const desiredTime = new Date(serverUtcTime + gmtTimezoneOffset);
	desiredTime.setUTCHours(hour, minute, 0, 0);

	const timeDifference = desiredTime - new Date();
	console.log(timeDifference)
	setTimeout(() => {
		sendMessage(message);
	}, timeDifference);
}

// Example usage: Schedule a message to be sent at GMT+5:30 11:12 PM
scheduleMessage(23, 17, 'Hello, world!');
client.login(token);