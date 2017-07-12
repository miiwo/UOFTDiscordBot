module.exports = async client => {
    await wait(1000); // eslint-disable-line
    
    console.log("Bot online..");
    client.user.setGame("ACORN"); 
};