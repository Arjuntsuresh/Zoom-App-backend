require("dotenv").config();
const mongoose = require("mongoose");
const URL = process.env.MONGO_URL;

const connectToDatabase = async () => {
  try {
    await mongoose.connect(URL);
    console.log("Connected to database");
  } catch (error) {
    console.log("Error connecting to database");
  }
};

module.exports = {connectToDatabase};
