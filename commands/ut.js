// I want this bot to function as: user searches a course code, can get a list to choose from (or if list returned is only one), then edit the message to whatever the user choose with more info.
// start time of exams is in seconds

//Does not do UTSC course codes.
//If more than 3 results, DM the person to avoid spam.

const rp = require("request-promise");

const courseCodeRegex = /[A-Z]{3}\d{3}/;
const shuttleRegex = /(shuttle)/;
const examRegex = /(exam)/;
const year = "2017";
const numbers = "①②③④⑤⑥⑦⑧⑨";
const pList = ["buildings", "textbooks", "food", "athletics", "exams", "transportation/parking", "transportation/shuttles", "cdf/labs", "cdf/printers"]; // eslint-disable-line

exports.run = async(client, msg, args) => {
    const options = createSearchable(client.config, args);

    if (!options) return msg.channel.send("Cannot search that.");

    const m = await msg.channel.send(":dvd: Searching now...");
    msg.channel.startTyping();
    
    try {
        const info = await rp(options);
        if(info.length === 0) {
            msg.channel.stopTyping();
            return m.edit(":slight_frown: **||** Nothing came up.");
        }
        
        //const results = displayResults(info, args[0]);
        
        // Courses
        if(courseCodeRegex.test(args[0])){
            const results = displayCourses(info);
            
            m.edit(":package: **||** Here are the result(s).");
            results.forEach( (e, index) => {
                msg.channel.send({embed: createEmbed(e, index)});
            });
        }else if(shuttleRegex.test(args[0])){ // Shuttle Times
            msg.channel.send("Shuttle goes here.");
        }else if(examRegex.test(args[0])){
            msg.channel.send("Exams go here.");
        }
        msg.channel.stopTyping();
        return;
        
        // Wait for response and react appropriately - currently only doable for courses. -TODO: expand this.
        let response = await awaitReply(msg, "Please use a number to pick which one you would like to hear about.");
        if (response && /\d/.test(response)) response = parseInt(response) - 1;
        else return msg.channel.send("That is not a valid reply. Closing~");
        
        if(0 <= response && response < info.length) { //TODO: stuff
            //msg.channel.send(courseDescription(info[response]));
            
            
            
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

//----------------------Functions-----------------------

/**
  * Function that creates the correct filter options to use with the Request-Promise API.
  * @param {} config - 
  * @param {list} args -
  */
function createSearchable(config, args) {
    if(args.length == 0) return false;
    
    let searchable = {
        method: "GET",
        headers: {
            "Authorization": config.cobalt_key
        },
        qs: {
            limit: 9
        },
        json:true
    };
    
    let searchMethod;
    if(courseCodeRegex.test(args[0])){
        searchable.uri = config.cobalt + 'courses/filter';
        if(args.length > 1){
            searchable.qs.q = filterQueryFormat(args[0], args[1])
        }else {
            searchable.qs.q = filterQueryFormat(args[0]);
        }
    }else return false;

    return searchable;
}

/** 
  * Function that grabs a reply from the user who started this command
  *
  * @param {Message}    msg        - Message Object to know which channel to listen for a reply from
  * @param {string}     question   - String prompt to display to the user
  * @param {int}        limit      - Integer representing how many milliseconds to wait for a reply
  */
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

/**
  * Function that formats text to display to the user information obtained from the API
  * @param {} info
  * @param {} query
  */
function displayResults(info, query){
    let results = "";
    if (query === "buildings") for(let i = 0; i < info.length; i++) results += "`" + (i + 1) + "` " + info[i].code + ": " + info[i].name + ", Address: " + info[i].address.street + "\n";
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


function filterQueryFormat(code, campus=''){
    code = code.toUpperCase();
    campus = campus.toUpperCase();
    
    if(campus) return 'code:"' + code + '" AND campus:"' + campus + '" AND term:"' + year + '"';
    else return 'code:"' + code + '" AND term:"' + year + '"';
}

/**
  * Creates the option for embed.
  *
  */
function createEmbed(msg, index){
    return {
        "title": numbers[index] + ' ' + msg.code,
        "description": msg.description,
        "color": 16777215,
        "timestamp": new Date(),
        "footer": {
            "text": "Brought to you by ROSI"
        },
        "fields": [
            {
                "name": "Term",
                "value": msg.term,
                "inline": true
            },
            {
                "name": "Prerequisite",
                "value": msg.prerequisites ? msg.prerequisites : "None",
                "inline": true
            }
            
        ]
    };
}
/**
  * Function that concatenates courses with the same code into one object in the list.
  * @param {list} info - 
  */
function displayCourses(info){
    // Parse the info
    let courses = [info[0]];
    courses[0].code = courses[0].code.slice(0,9);
    
    info.slice(1).forEach(course => {
        let check = courses.filter(e => e.code.includes(course.code.slice(0, 8)));
        if(check.length > 0){
            check[0].term += '\n' + course.term;
        } else {
            courses.push(course);
            courses[courses.length - 1].code = course.code.slice(0,9);
        }
    });
    
    return courses;
}