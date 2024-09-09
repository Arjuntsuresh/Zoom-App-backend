require("dotenv").config();
const adminDB = require("../models/adminModel");
const dataDB = require("../models/dataModel");
const mongoose = require("mongoose");
//find the admin from database.
const findAdmin = async (email) => {
  try {
    const response = await adminDB.findOne({email: email});
    return response;
  } catch (error) {
    console.log(error);
  }
};

const getAllData = async ()=>{
  try {
    const response = await dataDB.find();
    return response;
  } catch (error) {
    console.log(error);
  }
}
module.exports = {
    findAdmin,
    getAllData
}