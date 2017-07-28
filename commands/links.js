exports.run = (client, msg, args) => {
    const shortcuts = {
        "UTMcutoff": "The CGPA requirement for both the May and August 2017 POSt admissions periods is 2.70 for the CSC major and all CSC specialists.",
        "SGcutoff": "The CGPA is",
        "help": "**FAQ**\n PoST/Program Enrollment UTSG: http://www.artsci.utoronto.ca/current/program/enrolment-instructions/index_html \n" +
          "PoST/Program Enrollment UTM: https://www.utm.utoronto.ca/registrar/office-registrar-publications/program-selection-guide-2017 \n" +
          "PoST/Program Enrollment UTSC: http://www.utsc.utoronto.ca/aacc/enrolling-subject-posts \n" +
          "UTM Program Requirements: http://www.utm.utoronto.ca/programs-departments \n" +
          "UTM CGPA Calculator: https://student.utm.utoronto.ca/cgpa/ \n" +
          "UTSC GPA Calculator: http://www.utsc.utoronto.ca/webapps/aacc-tools/GPA_calculator/index.cgi"
    };
    
    if(args.length == 0) return;
    if(shortcuts[args[0]]) msg.channel.send(shortcuts[args[0]]);
};

exports.help = {
    name: "links",
    description: "Put in a description",
    usage: "links"
};