module.exports = async client => {
    await wait(1000); // eslint-disable-line
    
    client.user.setGame("ACORN"); 
    try {
        /* Both the .guilds and .roles properties are Snowflake -> Object
         * maps which is why we use values() on both. We don't care about
         * the keys. We use '.next().value' since there should only be one
         * guild (i.e. one server). This result is converted to an array so
         * that it can be queried.
         */
        var execRole = Array.from(client.guilds.values().next().value.roles.values()).find(r => r.name === "Executive");
        if (execRole == null) {
            throw "Role does NOT exist on the server";
        } else {
            global.execRole = execRole;
        }
    } catch (e) {
        console.log("An error occurred while trying to access the list of roles for this server" +
                    "or the role 'Executive' could not be found the exact error is as follows: ");
        console.log(e);
        process.exit(1);
    }

    console.log("Bot online..");
};
