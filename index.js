//TODO: Implement a Scoreboard System on the Bot
//TODO: Implement people adding their own Roles???? Still iffy about people abusing it buttt

if (process.version.slice(1).split(".")[0] < 8) throw new Error("Node 8.0.0 or higher is required. Update Node on your system.");
//-----------Initialization---------------
const Discord = require("discord.js");

const { promisify } = require("util");
const readdir = promisify(require("fs").readdir);

const client = new Discord.Client();
require("./modules/functions.js")(client, Discord);
client.config = require("./config.json");
client.commands = new Discord.Collection();

//-------------Function----------------------

global.wait = promisify(setTimeout);

async function start() {
    await wait(5000);
    const fcommand = await readdir("./commands/");
    fcommand.forEach(file => {
        try {
            let command = require(`./commands/${file}`);
            client.commands.set(command.help.name, command);

        } catch (e) {
            console.log(`Error: ${e} \n ${e.stack}`);
        }
    });

    const files = await readdir("./events/");
    files.forEach(file => {
        const eventName = file.split(".")[0];
        const event = require(`./events/${file}`);
        client.on(eventName, event.bind(null, client));
        delete require.cache[require.resolve(`./events/${file}`)];
    });

    client.login(client.config.token);
};

start();
