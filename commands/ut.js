// start time of exams is in seconds

//Does not do UTSC course codes.
//Exam data has up to 2016 times.

const rp = require("request-promise");

const courseCodeRegex = /^[A-Z]{3}\d{3}$/;
const shuttleRegex = /^(shuttle)$/;
const examRegex = /(exam)/;
const year = "2017";
//const period = "DEC17";
const lim = 9;
const DMTime = 3;
const offset = 300;
const numbers = "①②③④⑤⑥⑦⑧⑨";

exports.run = async(client, msg, args) => {
    const options = createSearchable(client.config, args);

    if (!options) return msg.channel.send("Cannot search that.");

    let m = await msg.channel.send(":dvd: Searching now...");
    m.channel.startTyping();
    
    try {
        const info = await rp(options);
        if(info.length == 0) {
            m.channel.stopTyping();
            return m.edit(":slight_frown: **||** Nothing came up.");
        }
        
        // Courses
        if(courseCodeRegex.test(args[0])){
            const results = displayCourses(info);
            
            if(results.length > DMTime) m = await msg.member.createDM();
            
            m.edit(":package: **||** Here are the result(s).");
            results.forEach((e, index) => m.channel.send({embed: createCourseEmbed(e, index)}));
            
        // Shuttle Times
        }else if(shuttleRegex.test(args[0])){ 
            m.channel.send({embed: displayShuttles(info)});
            m.delete();
        // Exam Times
        }else if(examRegex.test(args[0])){
            if(args.length > 1 && courseCodeRegex.test(args[1].toUpperCase())) {
                msg.channel.send({embed: displayExam(info)});
                m.edit("This data was last updated for the `2016 year`.");
            }
        }
        m.channel.stopTyping();
        
    } catch (e) {
        if(client.user.typingIn(m.channel)) m.channel.stopTyping();
        
        m.channel.send("There was an error, oh no! :dizzy_face:");
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
    
    const searchable = {
        method: "GET",
        headers: {
            "Authorization": config.cobalt_key
        },
        qs: {
            limit: lim
        },
        json:true
    };
    
    if(courseCodeRegex.test(args[0])){
        searchable.uri = `${config.cobalt}courses/filter`;
        if(args.length > 1) {
            args[0] = args[0].toUpperCase();
            args[1] = args[1].toUpperCase();
            
            if (['UTSG', 'UTM'].includes(args[1])) searchable.qs.q = `code:"${args[0]}" AND campus:"${args[1]}" AND term:"${year}"`;
            else return false;
            
        } else searchable.qs.q = `code:"${args[0].toUpperCase()}" AND term:"${year}"`;
        
    }else if (examRegex.test(args[0])) {
        searchable.uri = `${config.cobalt}exams/filter`;
        //searchable.qs.q = `code:"${args[1].toUpperCase()}" AND period:"${period}"`;
        searchable.qs.q = `code:"${args[1].toUpperCase()}"`;
        
    }else if (shuttleRegex.test(args[0])) {
        const now = new Date().toISOString().substr(0, 10);
        searchable.uri = `${config.cobalt}transportation/shuttles/${now}`;     
        delete searchable.qs;
    }else return false;

    return searchable;
}

/**
  * Function that concatenates courses with the same code into one object in the list.
  * @param {list} info - 
  */
function displayCourses(info){
    const courses = [info[0]];
    courses[0].code = courses[0].code.slice(0,9);
    
    info.slice(1).forEach(course => {
        const check = courses.filter(e => e.code.includes(course.code.slice(0, 8)));
        if(check.length > 0){
            check[0].term += `\n${course.term}`;
        }else {
            courses.push(course);
            courses[courses.length - 1].code = course.code.slice(0,9);
        }
    });
    
    return courses;
}

function displayShuttles(info){
    let utmTimes='', sgTimes='';
    info.routes[0].stops[0].times.forEach((e, index) => {
        utmTimes += secondsToTimeFormat(e.time).toString().substring(-8) + ` ${e.rush_hour ? '`**`' : ''}\n`;
        sgTimes += secondsToTimeFormat(info.routes[0].stops[1].times[index].time) + ` ${info.routes[0].stops[1].times[index].rush_hour ? '`**`' : ''}\n`;
    });
    return {
        "title": `Shuttle Times for ${new Date(info.date).toDateString()} :oncoming_bus:`,
        "color": 16777215,
        "description": "`**` indicates rush hour.\n The regular one-way ticket fare is $6.00.",
        "timestamp": new Date(),
        "footer": {
            "text": "Brought to you by the Cobalt API"
        },
        "fields": [
            {
                "name": `IB Layby :busstop:`,
                "value": utmTimes,
                "inline": true
            },
            {
                "name": `Hart House :busstop:`,
                "value": sgTimes,
                "inline": true
            }
            
        ]
    };
}

function secondsToTimeFormat(time, showTimeZone=false){
    const options = { hour: 'numeric',minute:'numeric', hour12: true};
    if(showTimeZone) options.timeZoneName = 'short';
    
    return new Date(time * 1000 + offset*60000).toLocaleTimeString("en-ca", options);
}

//TODO: Fix this so it doesn't just grab the first result only.
function displayExam(info){
    /*const options = { hour: 'numeric',minute:'numeric', hour12: true};
    const startTime = new Date(info[0].start_time*1000 + offset*60000).toLocaleTimeString("en-ca", options);
    options.timeZoneName = 'short';
    const endTime = new Date(info[0].end_time*1000 + offset*60000).toLocaleTimeString("en-ca", options);*/
    const startTime = secondsToTimeFormat(info[0].start_time);
    const endTime = secondsToTimeFormat(info[0].end_time, true);
    
    return {
        "title":  info[0].course_code + ' Exam Time :clock:',
        "color": 16777215,
        "timestamp": new Date(),
        "footer": {
            "text": "Brought to you by the Cobalt API"
        },
        "fields": [
            {
                "name": "Date",
                "value": new Date(info[0].date).toDateString(),
                "inline": true
            },
            {
                "name": "Time",
                "value": `${startTime.toString().substring(-8)} - ${endTime.toString().substring(-8)}`,
                "inline": true
            },
            {
                "name": "Exam Locations",
                "value": displaySections(info[0].sections)
            }
            
        ]
    };
}

function displaySections(sections){
    let thing = "";
    let lectureCode = "";
    sections.forEach(section => {
        if(lectureCode !== section.lecture_code){
            thing += `**${section.lecture_code}** \n`;
            lectureCode = section.lecture_code;
        }
        thing += `${section.exam_section ? section.exam_section : section.location}    ${section.exam_section ? section.location.trim : section.exam_section} \n`;
    });
    return thing;
    
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

/**
  * Creates the option for embed.
  *
  */
function createCourseEmbed(msg, index){
    return {
        "title": `${numbers[index]} ${msg.code.slice(0, -1)}`,
        "description": msg.description,
        "color": 16777215,
        "timestamp": new Date(),
        "footer": {
            "text": "Brought to you by the Cobalt API"
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
  * Function that grabs a reply from the user who started this command
  *
  * @param {Message}    msg        - Message Object to know which channel to listen for a reply from
  * @param {string}     question   - String prompt to display to the user
  * @param {int}        limit      - Integer representing how many milliseconds to wait for a reply
  */
async function awaitReply(msg, question, limit = 60000) {
    const filter = m => m.author.id === msg.author.id;
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
