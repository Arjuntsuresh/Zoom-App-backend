require("dotenv").config();
const adminDB = require("../models/adminModel");
const dataDB = require("../models/dataModel");
const mongoose = require("mongoose");
const axios = require('axios');
const authHelper = require('../Helpers/authHelper');
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
    return response;
  } catch (error) {
    console.log(error);
  }
}
const durationToSeconds = (duration) => {
  const [hours, minutes] = duration.split(':').map(Number);
  return (hours * 3600) + (minutes * 60);
};
const updateData= async (id, updatedData) =>{
  try {
    const {date,time,topic,duration} = updatedData;
    const meetingDateTime = new Date(
      `${date}T${time}:00Z`
    ).toISOString();
    const durationInSeconds = durationToSeconds(duration);
    // const tokenGenerator = await authHelper.getAccessToken();
    let accessToken = process.env.ZOOM_ACCESS_TOKEN;
    const url = `https://api.zoom.us/v2/meetings/${id}`;

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };
    const meetingDetails = {
      topic:topic,
      type: 2,
      start_time: meetingDateTime,
      duration: durationInSeconds,
      timezone: "Asia/Kolkata",
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: false,
        mute_upon_entry: true,
        approval_type: 1,
      },
    };
    const response = await axios.patch(url, meetingDetails, {
      headers: headers,
    });
    if(response.status === 204) {
      console.log('Meeting updated successfully:', response);
      const updatedData = {
        date:date,
        time: time,
        title: topic,
        duration: durationInSeconds,
      };
      const result = await dataDB.findOneAndUpdate(
        { meetingId: id }, 
        updatedData,              
        { new: true }            
      );
    }
    return response;
  } catch (error) {
     console.log(error);
     return false;
  }
}
function convertToGoogleCalendarDate(dateObj) {
  // Convert the Date object to ISO string and format for Google Calendar
  return dateObj.toISOString().replace(/-|:|\.\d\d\d/g, ""); // Convert to 'YYYYMMDDTHHmmssZ' format
}

function generateGoogleCalendarLink(meeting) {
  const baseUrl = 'https://calendar.google.com/calendar/event?action=TEMPLATE';

  // Convert start and end times to Google Calendar format
  const startDateTime = convertToGoogleCalendarDate(new Date(`${meeting.date}T${meeting.time}:00Z`));
  const endDateTime = convertToGoogleCalendarDate(meeting.endTime);

  // Prepare URL parameters
  const params = new URLSearchParams({
    text: meeting.title, // Event title
    dates: `${startDateTime}/${endDateTime}`, // Event start and end times
    details: `${meeting.description}\nJoin the meeting here: ${meeting.zoomLink}`, // Event description
    location: meeting.location, // Event location (Zoom)
    tmsrc: process.env.EMAIL_ID // Organizer's email
  });

  return `${baseUrl}&${params.toString()}`; // Generate the complete Google Calendar link
}


module.exports = {
  findAdmin,
  getAllData,
  deleteZoomMeeting,
  deleteZoomMeetingFromDB,
  getDataById,
  updateData,
  generateGoogleCalendarLink,
};
