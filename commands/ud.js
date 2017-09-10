const rp = require("request-promise");
const wordRegex = /^[A-Za-z]+$/;

exports.run = async(client, msg, args) => {
    if(args.length < 1 || !wordRegex.test(args[0])) return;
    
    try{
        const word = await rp({
            method: "GET",
            uri: "http://api.urbandictionary.com/v0/define?term=" + args[0],
            json: true
        });
        if (!word.list) return;
        
        const embedOpt = {
            "title": "Urban Dictionary Says...",
            "description": `*${word.list[0].definition}*`,
            "color": 16777215,
            "timestamp": new Date()
        };
        
        msg.channel.send({embed: embedOpt});
    }catch (e){
        msg.channel.send("There was an error, oh no! :dizzy_face:");
        console.log(e);
    }
};

exports.help = {
    name: "ud",
    permission: 5,
    description: "Look up a word on urban dictionary",
    usage: "ud [word]"
};