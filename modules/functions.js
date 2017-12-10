module.exports = (client, Discord) => {
    /**
    * Function to grab User's permission levels.
    *
    *@param {Message}   msg         - Message to grab Permission Level from
    */
    client.permlevel = msg => {
        const ExecRole = global.execRole;
        if(ExecRole && msg.member.roles.has(ExecRole.id)) return 10;
        return 5;
    };
    
    /** 
    * Function that grabs a reply from the user who started this command
    *
    * @param {Message}    msg        - Message Object to know which channel to listen for a reply from
    * @param {string}     question   - String prompt to display to the user
    * @param {int}        limit      - Integer representing how many milliseconds to wait for a reply
    */
    client.awaitReply = async (msg, question, limit = 60000) => {
        const filter = m => m.author.id === msg.author.id;
        await msg.channel.send(question);
        await wait(1000); //eslint-disable-line
        try {
            const collected = await msg.channel.awaitMessages(filter, {
                max: 1,
                time: limit,
                errors: ["time"]
            });
            return collected.first().content;
        } catch (e) {
            msg.channel.send("Time limit reached.");
            return false;
        }
    };
    
    client.createRichEmbed = () => {
        return new Discord.RichEmbed();
    }
    
    
};
