const rp = require("request-promise");

const courseCodeRegex = /^[a-zA-Z]{3}([a-zA-Z]|\d)\d{2}$/;
const shuttleRegex = /^(shuttle)$/;
const examRegex = /^(exam)$/;

const YEAR = "2017";
const PERIOD = "DEC17";
const LIMITSEARCH = 9;
const DM_USER = 3;
const TIMEZONEOFFSET = 300;
const ASCIINUMBERS = "①②③④⑤⑥⑦⑧⑨";
const CAMPUSSHORTCUTS = ["UTSG", "UTM", "UTSC"];

exports.run = async(client, msg, args) => {
    const options = createSearchable(client.config, args);

    if (!options){
        msg.channel.send(":x: **||** Not a valid search format.");
        return;
    }

    let m = await msg.channel.send(":dvd: Searching now...");
    m.channel.startTyping();

    try {
        const info = await rp(options); //change var name to "results"/cobalt
        if (info.length == 0) {
            m.channel.stopTyping();
            m.edit(":slight_frown: **||** Nothing came up.");
            return;
        }

        // Courses
        if (courseCodeRegex.test(args[0])) {
            const results = displayCourses(info);

            if (results.length > DM_USER) m = await msg.member.createDM();

            m.edit(":package: **||** Here are the result(s).");
            results.forEach((e, index) => m.channel.send({
                embed: createCourseEmbed(e, index)
            }));

        // Shuttle
        } else if (shuttleRegex.test(args[0])) {
            displayShuttles(info).forEach(e => m.channel.send({
                embed: e
            }));
            m.delete();

        // Exams
        } else if (examRegex.test(args[0])) {
            if (args.length > 1 && courseCodeRegex.test(args[1].toUpperCase())) {
                msg.channel.send({
                    embed: displayExam(info)
                });
                m.edit(":floppy_disk: **||** This data was last updated for the `2016 YEAR`.");
            }
        }
        m.channel.stopTyping();

    } catch (e) {
        if (client.user.typingIn(m.channel)) m.channel.stopTyping();

        m.channel.send("There was an error, oh no! :dizzy_face:");
        console.log(e);
    }
};

exports.help = {
    name: "ut",
    permission: 0,
    description: "Grabs info about the University from the Cobalt API. Students can find out: exam times, shuttle times, and course descriptions.",
    usage: "ut [subject] [search/filter] [query]"
};

//----------------------Functions-----------------------

/**
 * Function that creates the correct filter options to use with the Request-Promise API.
 * @param {} config - config file
 * @param {list} args - arguments from the command
 */
function createSearchable(config, args) {
    if (args.length == 0) return false;

    const searchable = {
        method: "GET",
        headers: {
            "Authorization": config.cobalt_key
        },
        qs: {
            limit: LIMITSEARCH
        },
        json: true
    };

    if (courseCodeRegex.test(args[0])) {
        searchable.uri = `${config.cobalt}courses/filter`;
        if (args.length > 1) {
            args[0] = args[0].toUpperCase();
            args[1] = args[1].toLowerCase() === "sg" ? "UTSG" : args[1].toUpperCase();

            if (CAMPUSSHORTCUTS.includes(args[1]))
                searchable.qs.q = `code:"${args[0]}" AND campus:"${args[1]}" AND term:"${YEAR}"`;
            else
                return false;

        } else searchable.qs.q = `code:"${args[0].toUpperCase()}" AND term:"${YEAR}"`;

    } else if (examRegex.test(args[0])) { // exam[0] sta256[1] utsg[2]
        searchable.uri = `${config.cobalt}exams/filter`;
        if (args.length > 1) {
            if (courseCodeRegex.test(args[1]))
                searchable.qs.q = `code:"${args[1]}"`;
            if (args.length > 2) {
                args[2] = args[2].toLowerCase() === 'sg' ? 'UTSG' : args[2].toUpperCase();
                if (CAMPUSSHORTCUTS.includes(args[1]))
                    searchable.qs.q += ` AND campus:"${args[2]}"`; //Provide period here once exam data gets updated.
            }

        } else 
            return false;

    } else if (shuttleRegex.test(args[0])) {
        const now = new Date().toISOString().substr(0, 10);
        searchable.uri = `${config.cobalt}transportation/shuttles/${now}`;
        delete searchable.qs;
    } else
        return false;

    return searchable;
}

/**
 * Function that concatenates courses with the same code into one object in the list.
 * @param {list} info - List of Objects that contain the information retrieved from the request
 */
function displayCourses(info) {
    const courses = [info[0]];
    courses[0].code = courses[0].code.slice(0, 9);

    info.slice(1).forEach(course => {
        const check = courses.filter(e => e.code.includes(course.code.slice(0, 8)));
        if (check.length > 0) {
            check[0].term += `\n${course.term}`;
        } else {
            courses.push(course);
            courses[courses.length - 1].code = course.code.slice(0, 9);
        }
    });

    return courses;
}
/**
 * Creates a list of JSObjects to be used as EmbedOptions for Message.channel.send
 *
 */
function displayShuttles(info) {
    let timing = '';
    let routeEmbed = [];

    info.routes.forEach(route => {
        const embedRoute = embedTemplate();
        embedRoute["title"] = `Shuttle Times for ${new Date(info.date).toDateString()} ${route.name} :oncoming_bus:`;
        embedRoute["description"] = "`**` indicates rush hour.\n The regular one-way ticket fare is $6.00.";
        embedRoute["fields"] = [];
        routeEmbed.push(embedRoute);
        route.stops.forEach(stop => {
            stop.times.forEach(t => {
                timing += secondsToTimeFormat(t.time) + ` ${t.rush_hour ? '`**`' : ''}\n`;
            });

            routeEmbed[routeEmbed.length - 1].fields.push({
                "name": ':busstop: ' + stop.location,
                "value": timing,
                "inline": true
            });
            timing = '';
        });
    });

    return routeEmbed;
}

/**
 * Turns *time* seconds into a String representing the current time in EST.
 * @param {int} time - integer representing seconds
 * @param {boolean} showTimeZone - Determines if 'EST' is shown at the end
 */
function secondsToTimeFormat(time, showTimeZone = false) {
    const options = {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    };
    if (showTimeZone) options.timeZoneName = 'short';

    return new Date(time * 1000 + TIMEZONEOFFSET * 60000).toLocaleTimeString("en-ca", options);
}

function displayExam(info) {
    const startTime = secondsToTimeFormat(info[0].start_time);
    const endTime = secondsToTimeFormat(info[0].end_time, true);
    
    let exam = embedTemplate();
    exam["title"] = `${info[0].course_code} Exam Time :clock:`;
    exam["fields"] = [
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
            "value": concatenateSections(info[0].sections)
        }];

    return exam;
}
/**
 * Concatenates all the sections for an exam into a single String
 * @param {list} sections - sections to concatenate
 */
function concatenateSections(sections) {
    let displayString = "",
        lectureCode = "";

    sections.forEach(section => {
        if (lectureCode !== section.lecture_code) {
            displayString += `**${section.lecture_code}** \n`;
            lectureCode = section.lecture_code;
        }
        displayString += `${section.exam_section ? section.exam_section : section.location}    ${section.exam_section ? section.location.trim : section.exam_section} \n`;
    });

    return displayString;
}

function createCourseEmbed(msg, index) {
    let course = embedTemplate();
    course["title"] = `${ASCIINUMBERS[index]} ${msg.code.slice(0, -1)}`;
    course["description"] = msg.description;
    course["fields"] = [
        {
            "name": "Term",
            "value": msg.term,
            "inline": true
        },
        {
            "name": "Prerequisite",
            "value": msg.prerequisites ? msg.prerequisites : "None",
            "inline": true
        }];
    return course;
}

function embedTemplate() {
    return {
        "color": 16777215,
        "timestamp": new Date(),
        "footer": {
            "text": "Brought to you by the Cobalt API"
        }
    };
    
}


