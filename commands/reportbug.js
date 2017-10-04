const rp = require("request-promise");
const fs = require("fs");

exports.run = async(client, msg, args) => {
    if(args.length < 1) return;

    fs.appendFileSync("bug_reports.log",
                      `Username: ${msg.author.username}#${msg.author.discriminator}\n` +
                      `Id: ${msg.author.id}\n` +
                      `Message: ${args.join(" ")}\n` +
                      `-----------------------------------------------------\n`);
};

exports.help = {
    name: "reportbug",
    permission: 5,
    description: "Used to let the admins know of a bug.",
    usage: "reportbug [detailed description of bug]"
};
