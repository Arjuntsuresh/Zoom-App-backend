require("dotenv").config();
const adminDB = require("../models/adminModel");
const dataDB = require("../models/dataModel");
const mongoose = require("mongoose");
const axios = require("axios");
const authHelper = require("../Helpers/authHelper");
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
    console.log("Zoom meeting deleted successfully:", success);
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
    console.log("db error", error);
  }
};

const getDataById = async (id) => {
  try {
    const response = await dataDB.findOne({ meetingId: id });
    return response;
  } catch (error) {
    console.log(error);
  }
};
const durationToSeconds = (duration) => {
  const [hours, minutes] = duration.split(":").map(Number);
  return hours * 3600 + minutes * 60;
};
const updateData = async (id, updatedData) => {
  try {
    const { date, time, topic, duration } = updatedData;
    const meetingDateTime = new Date(`${date}T${time}:00Z`).toISOString();
    const durationInSeconds = durationToSeconds(duration);
    // const tokenGenerator = await authHelper.getAccessToken();
    let accessToken = process.env.ZOOM_ACCESS_TOKEN;
    const url = `https://api.zoom.us/v2/meetings/${id}`;

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
    const response = await axios.patch(url, meetingDetails, {
      headers: headers,
    });
    if (response.status === 204) {
      console.log("Meeting updated successfully:", response);
      const updatedData = {
        date: date,
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
};
function convertToGoogleCalendarDate(dateObj, timeZone) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
    .format(dateObj)
    .replace(/-|:|\s/g, "")
    .replace(",", "T");
}

function calculateEndTime(startTime, duration, timeZone) {
  const [hours, minutes] = duration.split(":").map(Number);
  const endTime = new Date(startTime);
  endTime.setHours(endTime.getHours() + hours);
  endTime.setMinutes(endTime.getMinutes() + minutes);
  return convertToGoogleCalendarDate(endTime, timeZone);
}

function generateGoogleCalendarLink(meeting) {
  const baseUrl = "https://calendar.google.com/calendar/event?action=TEMPLATE";
  const startDateTime = convertToGoogleCalendarDate(
    new Date(`${meeting.date}T${meeting.time}`),
    meeting.timeZone
  );
  const endDateTime = calculateEndTime(
    new Date(`${meeting.date}T${meeting.time}`),
    meeting.duration,
    meeting.timeZone
  );
  const params = new URLSearchParams({
    text: meeting.title,
    dates: `${startDateTime}/${endDateTime}`,
    details: `${meeting.description}\nJoin the meeting here: ${meeting.zoomLink}`,
    location: meeting.location,
    tmsrc: process.env.EMAIL_ID,
    ctz: meeting.timeZone || "Asia/Kolkata",
  });

  return `${baseUrl}&${params.toString()}`;
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
