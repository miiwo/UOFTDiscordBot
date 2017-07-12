const rp = require("request-promise");

exports.run = async (client, msg, args) => {
    const options = createSearchable(client.config, args);
    
    if(!options) return msg.channel.send("Not a valid searchable item.");
    
    const m = await msg.channel.send(":dvd: Searching now...");
    msg.channel.startTyping();
    
    rp(options).then(info => { 
        let results = "";
        for(var i = 0; i < info.length; i++){
            results += "`" + (i+1) + "` " + info[i].code + ": " + info[i].name + "\n";
        }
        msg.channel.stopTyping();
        
        if(results === "") return m.edit("Nothing came up.");
        
        m.edit(results);
        
    }).catch(e => {
        if(client.user.typingIn(msg.channel)) msg.channel.stopTyping();
        console.log(e);
    });
    
};

exports.help = {
    name: "ut",
    description: "Grabs info from the Cobalt API",
    usage: "ut [subject] [search/filter] [query]"
};

function createSearchable(config, args){
    let endpoint, query;
    if(workingList.includes(args[0])) endpoint = config.cobalt + args[0];
    else return false;
    
    if(args[1] && args[1] === "search") endpoint += "/" + args[1];
    
    if(args.length < 2) return false;
    else query = args[2];
    
    return {
        method: "GET",
        uri: endpoint,
        qs: {
            q: query,
            limit: 5
        },
        headers: {
            "Authorization": config.cobalt_key
        },
        json: true
    };
}

const workingList = ["courses"];
const pList = ["courses", "buildings", "textbooks", "food", "athletics", "exams", "transportation/parking", "transportation/shuttles", "cdf/labs", "cdf/printers"]; // eslint-disable-line
    
// I want this bot to function as: user searches a course code, can get a list to choose from (or if list returned is only one), then edit the message to whatever the user choose with more info.
// start time of exams is in seconds