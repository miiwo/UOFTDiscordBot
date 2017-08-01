//Does not do UTSC course codes.

const rp = require("request-promise");

const courseCodeRegex = /^[A-Z]{3}\d{3}$/;
const shuttleRegex = /^(shuttle)$/;
const examRegex = /(exam)/;
const year = "2017";
const period = "DEC17";
const lim = 9;
const DMTime = 3;
const offset = 300;
const numbers = "①②③④⑤⑥⑦⑧⑨";

exports.run = async(client, msg, args) => {
    const options = createSearchable(client.config, args);

    if (!options) return msg.channel.send(":x: **||** Not a valid search format.");

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
            
        // Shuttle
        }else if(shuttleRegex.test(args[0])){ 
            displayShuttles(info).forEach(e => m.channel.send({embed: e}));
            m.delete();
            
        // Exams
        }else if(examRegex.test(args[0])){
            if(args.length > 1 && courseCodeRegex.test(args[1].toUpperCase())) {
                msg.channel.send({embed: displayExam(info)});
                m.edit(":floppy_disk: **||** This data was last updated for the `2016 YEAR`.");
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
  * @param {} config - config file
  * @param {list} args - arguments from the command
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
            args[1] = args[1].toLowerCase() === 'sg' ? 'UTSG' : args[1].toUpperCase();
            
            if (['UTSG', 'UTM'].includes(args[1])) searchable.qs.q = `code:"${args[0]}" AND campus:"${args[1]}" AND term:"${year}"`;
            else return false;
            
        } else searchable.qs.q = `code:"${args[0].toUpperCase()}" AND term:"${year}"`;
        
    }else if (examRegex.test(args[0])) {
        searchable.uri = `${config.cobalt}exams/filter`;
        if(args.length > 2){
            args[2] = args[2].toLowerCase() === 'sg' ? 'UTSG' : args[2].toUpperCase();
            if (['UTSG', 'UTM'].includes(args[1])) searchable.qs.q = `code:"${args[1]}" AND period:"${period}"`;
            
        }else if(args.length > 1 && courseCodeRegex.test(args[1])) searchable.qs.q = `code:"${args[1]}"`; //Provide period here once exam data gets updated.
        else return false;
    
    }else if (shuttleRegex.test(args[0])) {
        const now = new Date().toISOString().substr(0, 10);
        searchable.uri = `${config.cobalt}transportation/shuttles/${now}`;     
        delete searchable.qs;
    }else return false;

    return searchable;
}

/**
  * Function that concatenates courses with the same code into one object in the list.
  * @param {list} info - List of Objects that contain the information retrieved from the request
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
/**
  * Creates a list of JSObjects to be used as EmbedOptions for Message.channel.send
  *
  */
function displayShuttles(info){
    let timing='';
    let routeEmbed = [];
    
    info.routes.forEach(route => {
        routeEmbed.push({
            "title": `Shuttle Times for ${new Date(info.date).toDateString()} ${route.name} :oncoming_bus:`,
            "color": 16777215,
            "description": "`**` indicates rush hour.\n The regular one-way ticket fare is $6.00.",
            "timestamp": new Date(),
            "footer": {
                "text": "Brought to you by the Cobalt API"
            },
            "fields": []
        });
        route.stops.forEach(stop =>{
            stop.times.forEach(t => {
                timing += secondsToTimeFormat(t.time) + ` ${t.rush_hour ? '`**`' : ''}\n`;
            });
            
            routeEmbed[routeEmbed.length - 1].fields.push({"name": ':busstop: ' + stop.location, "value": timing, "inline": true});
            timing = '';
        });
    });
    
    return routeEmbed;
}

/**
  * Function that turns seconds into a time String in EST time.
  * @param {int} time - integer representing seconds
  * @param {boolean} showTimeZone - Determines if 'EST' is shown at the end
  */
function secondsToTimeFormat(time, showTimeZone=false){
    const options = { hour: 'numeric',minute:'numeric', hour12: true};
    if(showTimeZone) options.timeZoneName = 'short';
    
    return new Date(time * 1000 + offset*60000).toLocaleTimeString("en-ca", options);
}

//Grabs first result only
function displayExam(info){
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
                "value": `${startTime} - ${endTime}`,
                "inline": true
            },
            {
                "name": "Exam Locations",
                "value": displaySections(info[0].sections)
            }
            
        ]
    };
}
/**
  * Function that puts all the sections for an exam into a single String
  * @param {list} sections - sections to concatenate
  */
function displaySections(sections){
    let displayString = "", lectureCode = "";
    
    sections.forEach(section => {
        if(lectureCode !== section.lecture_code){
            displayString += `**${section.lecture_code}** \n`;
            lectureCode = section.lecture_code;
        }
        displayString += `${section.exam_section ? section.exam_section : section.location}    ${section.exam_section ? section.location.trim : section.exam_section} \n`;
    });
    return displayString;
    
}

/**
  * Creates the options for a "Course" embed.
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
