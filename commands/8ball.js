exports.run = async(client, msg, args) => {
    if(args.length == 0) return;
    
    msg.reply(":8ball:|| " + eightball_responses[Math.floor(Math.random() * eightball_responses.length)]);
};

exports.help = {
    name: "8ball",
    permission: 5,
    description: "Get a response to all of your dying questions",
    usage: "8ball <your question>"
};

let eightball_responses = [
    "It is certain",
    "It is decidely so",
    "Without a doubt",
    "Reply hazy, try again",
    "Very Doubtful",
    "Outlook not so good",
    "Concentrate and ask again.",
    "Ask again later.",
    "You may rely on it.", 
    "Cannot predict now.",
    "Better not tell you now",
    "My sources say no", 
    "As I see it, yes",
    "Most likely",
    "Don't count on it.",
    "Yes definitely",
    "Outlook good",
    "Yes",
    "Signs point to yes.",
    "Don't count on it.",
    "My reply is no"
];