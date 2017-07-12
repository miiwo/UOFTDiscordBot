//-----------Initialization---------------
const Discord = require("discord.js");
const rp = require("request-promise");
const { promisify } = require("util");
const readdir = promisify(require("fs").readdir);

const client = new Discord.Client();
client.config = require("./config.json");
client.commands = new Discord.Collection();

global.wait = promisify(setTimeout);

(async function () {
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
}());
