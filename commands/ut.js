const rp = require("request-promise");

exports.run = async(client, msg, args) => {
    const options = createSearchable(client.config, args);

    if (!options) return msg.channel.send("Not a valid searchable item.");

    const m = await msg.channel.send(":dvd: Searching now...");
    msg.channel.startTyping();
    
    try {
        const info = await rp(options);
        if(info.length === 0) {
            msg.channel.stopTyping();
            return m.edit("Nothing came up.");
        }
        
        const results = displayResults(info, args[0]);
        msg.channel.stopTyping();
        m.edit(results);
        
        if(["cdf/labs", "transportation/parking", "buildings"].includes(args[0])) return;
        
        // Wait for response and react appropriately - currently only doable for courses. -TODO: expand this.
        let response = await awaitReply(msg, "Please use a number to pick which one you would like to hear about.");
        if (response && /\d/.test(response)) response = parseInt(response) - 1;
        else msg.channel.send("That is not a valid reply. Closing~");
        
        if(0 <= response && response < info.length) { //TODO: stuff
            msg.channel.send(courseDescription(info[response]));
            
            
        } else msg.channel.send("Invalid number.");
        
    } catch (e) {
        if(client.user.typingIn(msg.channel)) msg.channel.stopTyping();
        
        msg.channel.send("There was an error, oh no!");
        console.log(e);
    }

};

exports.help = {
    name: "ut",
    description: "Grabs info from the Cobalt API",
    usage: "ut [subject] [search/filter] [query]"
};

// Functions
function createSearchable(config, args) {
    let searchable = {
        method: "GET",
        headers: {
            "Authorization": config.cobalt_key
        },
        json:true
    };
    
    // uri properties
    if (workingList.includes(args[0])) searchable.uri = config.cobalt + args[0];
    else return false;
    
    if (args[1] && args[1] === "search") searchable.uri += "/" + args[1]; //TODO: get it to work with filter as well.

    //qs properties
    if (args.length >= 2) {
        if(["cdf/labs"].includes(args[0])) return false;
        
        searchable.qs = {};
        searchable.qs.q = args.slice(2).join(" ");
        searchable.qs.limit = 5;
    }

    return searchable;
}

async function awaitReply(msg, question, limit = 60000) {
    const filter = m => m.author.id = msg.author.id;
    await msg.channel.send(question);
    await wait(1000); // eslint-disable-line
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
}
// Function that formats text about courses.
function courseDescription(info){
    let prereqs = info.prequisities ? info.prequisities : "None";
    return `**${info.code}** - ${info.name} \n\n${info.description} \nPrerequisites: ${prereqs} \nDone in ${info.term}`;
}

// Function that formats text to display to the user information obtained from the API
function displayResults(info, query){
    let results = "";
    if(query === "courses") for(let i = 0; i < info.length; i++) results += "`" + (i + 1) + "` " + info[i].code + ": " + info[i].name + "\n";
    else if (query === "buildings") for(let i = 0; i < info.length; i++) results += "`" + (i + 1) + "` " + info[i].code + ": " + info[i].name + ", Address: " + info[i].address.street + "\n";
    else if (query === "textbooks") for(let i = 0; i < info.length; i++) results += "`" + (i + 1) + "` " + info[i].title + " - Price: $" + info[i].price + "\n";
    else if (query === "food") for(let i = 0; i < info.length; i++) results += "`" + (i + 1) + "` " + info[i].name + " - " + info[i].address + "\n";
    else if (query === "transportation/parking") {
        for(let i = 0; i < info.length; i++) {
            const adr = info[i].address ? `Address: ${info[i].address}` : info[i].address;
            results += "`" + (i + 1) + "` " + info[i].title + " - " + info[i].description + " " + adr + "\n";
        }
    } else if (query === "cdf/labs") {
        results += `As of: ${info.timestamp}\n`;
        for(let i = 0; i < info.labs.length; i++) results += "`" + (i + 1) + "` " + info.labs[i].name + ": Available:" + info.labs[i].available + "\n";
    }
    
    return results;
}

const workingList = ["courses", "buildings", "textbooks", "food", "athletics", "exams", "transportation/parking", "cdf/labs"];
const pList = ["courses", "buildings", "textbooks", "food", "athletics", "exams", "transportation/parking", "transportation/shuttles", "cdf/labs", "cdf/printers"]; // eslint-disable-line

// I want this bot to function as: user searches a course code, can get a list to choose from (or if list returned is only one), then edit the message to whatever the user choose with more info.
// start time of exams is in seconds
