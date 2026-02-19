//getting mongoose functions
const mongoose = require("mongoose");

const connect = async () => { //using async function to be able to use await
    try {
        //using await to stop it from implemeneting the rest of the code until this code is finished
        await mongoose.connect(process.env.MongoUrl)
        console.log("MongoDB Connected");
    }
    catch (err) {
        console.log("Failed TO Connect: ",err);
    }
}
module.exports = connect; // exporting the function to be able to call it and use it