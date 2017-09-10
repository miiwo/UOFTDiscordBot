exports.run = async(client, msg, args) => {
    if (!args || args.size < 1) return msg.reply("Must provide a command to reload.");

    let command;
    if ((command = client.commands.get(args[0]))) command = command.help.name;
    else return msg.reply(`The command \`${args[0]}\` doesn't seem to exist. Try again!`);
    
    delete require.cache[require.resolve(`./${command}.js`)];
    let cmd = require(`./${command}`);
    client.commands.delete(command);
    client.commands.set(command, cmd);

    msg.reply(`The command \`${command}\` has been reloaded!`);
};

exports.help = {
    name: "reload",
    description: "Reloads a command that's been modified. Use for development only.",
    permission: 10,
    usage: "reload [command]"
};
