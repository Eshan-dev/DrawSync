require('dotenv').config();
const mongoose = require('mongoose');

const connectToDB = async () => {
    try {
        const dbUri = process.env.MONGO_URI;
        if (!dbUri) {
            throw new Error("Database connection URL not found in environment variables (URLDB or MONGO_URI)");
        }
        await mongoose.connect(dbUri);
        console.log("Connected to MongoDB");
    }
    catch (error) {
        console.log("Error connecting to MongoDB: " + error.message);
    }
}
module.exports = connectToDB;