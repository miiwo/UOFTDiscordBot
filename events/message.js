module.exports = (client, msg) => {
    if(msg.author.bot || msg.content.indexOf(client.config.prefix) !== 0) return;
    
    const args = msg.content.split(/\s+/);
    const commandName = args.shift().slice(client.config.prefix.length).toLowerCase();
    
    if(responseList[commandName])
        return msg.channel.send(responseList[commandName]);
    
    let command = client.commands.get(commandName);
    if(command){
        if(client.permlevel(msg) < command.help.permission)
            return msg.channel.send("Insufficient Perms");
        
        if(args[0] === "h"){
            msg.channel.send(`Command: ${command.help.name} \nDescription: ${command.help.description} \n\n\` Ex. ${command.help.usage}\``);
            return;
        }
        
        console.log("LOG CMD", `USER ${msg.author.username} RAN command | ${commandName} | from \n  GUILD:  | ${msg.guild.name} \n  CHANNEL:| #${msg.channel.name}\nusing ARGS {${args}}`);
        
        command.run(client, msg, args);
    }
    
};

let responseList = {
    "help": "Come see me complete in October", 
    "ping": "pong",
    "tableflip": "(╯°□°）╯︵ ┻━┻)",
    "lenny": "( ͡° ͜ʖ ͡°)",
    "shrug": "¯\_(ツ)_/¯",
    "utmcutoff": "The CGPA requirement for both the May and August 2017 POSt admissions periods is 2.70 for the CSC major and all CSC specialists.",
    "sgcutoff": "The CGPA is",
    "faq": "**FAQ**\n POSt/Program Enrollment UTSG: http://www.artsci.utoronto.ca/current/program/enrolment-instructions/index_html \n" +
          "POSt/Program Enrollment UTM: https://www.utm.utoronto.ca/registrar/office-registrar-publications/program-selection-guide-2017 \n" +
          "POSt/Program Enrollment UTSC: http://www.utsc.utoronto.ca/aacc/enrolling-subject-posts \n" +
          "UTM Program Requirements: http://www.utm.utoronto.ca/programs-departments \n" +
          "UTM CGPA Calculator: https://student.utm.utoronto.ca/cgpa/ \n" +
          "UTSC GPA Calculator: http://www.utsc.utoronto.ca/webapps/aacc-tools/GPA_calculator/index.cgi \n" +
          "Coursegraphy: https://courseography.cdf.toronto.edu/graph"
};