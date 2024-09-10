require("dotenv").config();
const adminDB = require("../models/adminModel");
const dataDB = require("../models/dataModel");
const mongoose = require("mongoose");
const axios = require('axios');
//find the admin from database.
const findAdmin = async (email) => {
  try {
    const response = await adminDB.findOne({ email: email });
    return response;
  } catch (error) {
    console.log(error);
  }
};

const getAllData = async () => {
  try {
    const response = await dataDB.find();
    return response;
  } catch (error) {
    console.log(error);
  }
};

const deleteZoomMeeting = async (id) => {
  try {
    const success = true;
    let accessToken = process.env.ZOOM_ACCESS_TOKEN;
    const url = `https://api.zoom.us/v2/meetings/${id}`;

    const response = await axios.delete(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
    console.log("Zoom meeting deleted successfully:",success);
    return success;
  } catch (error) {
    console.log(error);
  }
};
const deleteZoomMeetingFromDB = async (meetingId) => {
  try {
    const response = await dataDB.findOneAndDelete({ meetingId });
    console.log("Zoom meeting deleted from database successfully:", response);
    return response;
  } catch (error) {
    console.log("db error",error);
    
  }
}

const getDataById = async (id) =>{
  try {
    const response = await dataDB.findOne({meetingId:id});
    console.log("hi",response);
    
    return response;
  } catch (error) {
    console.log(error);
  }
}
module.exports = {
  findAdmin,
  getAllData,
  deleteZoomMeeting,
  deleteZoomMeetingFromDB,
  getDataById,
};
