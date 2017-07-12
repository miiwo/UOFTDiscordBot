module.exports = (client, msg) => {
    if(msg.author.bot || msg.content.indexOf(client.config.prefix) !== 0) return;
    
    const args = msg.content.split(/\s+/);
    const commandName = args.shift().slice(client.config.prefix.length).toLowerCase();
    
    let command = client.commands.get(commandName);
    if(command){
        console.log("LOG CMD", `USER ${msg.author.username} RAN command | ${commandName} | from \n GUILD:  | ${msg.guild.name} \n CHANNEL:| #${msg.channel.name}`);
        
        command.run(client, msg, args);
    }
    
};