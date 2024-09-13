const axios = require("axios");
require("dotenv").config();
const studentModel = require('../models/studentModel');
const mongoose = require('mongoose');
const dataModel = require("../models/dataModel");
const durationToSeconds = (duration) => {
  const [hours, minutes] = duration.split(':').map(Number);
  return (hours * 3600) + (minutes * 60);
};

const createZoomMeeting = async (accessToken, meetingDate, meetingTime,topic,duration) => {
  try {
    const durationInSeconds = durationToSeconds(duration);
    const url = "https://api.zoom.us/v2/users/me/meetings";
    const meetingDateTime = new Date(
      `${meetingDate}T${meetingTime}:00Z`
    ).toISOString();
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };
    const meetingDetails = {
      topic: topic,
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
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(meetingDetails),
    });
    const responseText = await response.text();
    const data = JSON.parse(responseText);    
    return data;
  } catch (error) {
    console.error("Error creating Zoom meeting:", error.message);
    res.status(500).send({ error: "Failed to create Zoom meeting" });
  }
};
function convertToGoogleCalendarDate(dateObj, timeZone) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(dateObj).replace(/-|:|\s/g, '').replace(',', 'T'); 
}

function calculateEndTime(startTime, duration, timeZone) {
  const [hours, minutes] = duration.split(':').map(Number);
  const endTime = new Date(startTime);
  endTime.setHours(endTime.getHours() + hours);
  endTime.setMinutes(endTime.getMinutes() + minutes);
  return convertToGoogleCalendarDate(endTime, timeZone); 
}

function generateGoogleCalendarLink(meeting) {
  const baseUrl = 'https://calendar.google.com/calendar/event?action=TEMPLATE';

  const startDateTime = convertToGoogleCalendarDate(new Date(`${meeting.date}T${meeting.time}`), meeting.timeZone);
 const endDateTime = calculateEndTime(new Date(`${meeting.date}T${meeting.time}`), meeting.duration, meeting.timeZone);
 // Prepare URL parameters
  const params = new URLSearchParams({
    text: meeting.title,
    dates: `${startDateTime}/${endDateTime}`, 
    details: `${meeting.description}\nJoin the meeting here: ${meeting.zoomLink}`, 
    location: meeting.location, 
    tmsrc: meeting.organizerEmail, 
    ctz: meeting.timeZone || 'Asia/Kolkata',
  });
  return `${baseUrl}&${params.toString()}`;
}

function parseDuration(durationStr) {
  const [hours, minutes] = durationStr.split(':').map(Number);
  return hours * 60 + minutes;
}

const findStudent = async (email) => {
  try {
    const response = await studentModel.findOne({ email: email });
    return response;
  } catch (error) {
    console.log(error);
  }
};
const findStudentDataFromDataModel = async (email) =>{
  try {
    const results = await dataModel.find({ email: email });
    const studentData = results.find(result => result.email.includes(email));
    // console.log(studentData);
    
    if (studentData) {
      return studentData;
    } else {
      throw new Error('No student data found for the provided email.');
    }
  }catch (error) {
    console.log(error);
  }
}
module.exports = {
  createZoomMeeting,
  generateGoogleCalendarLink,
  parseDuration,
  findStudent,
  findStudentDataFromDataModel,
};
