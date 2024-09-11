const axios = require("axios");
require("dotenv").config();

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
function convertToGoogleCalendarDate(dateObj) {
  // Convert the Date object to ISO string and format for Google Calendar
  return dateObj.toISOString().replace(/-|:|\.\d\d\d/g, ""); // Convert to 'YYYYMMDDTHHmmssZ' format
}
function generateGoogleCalendarLink(meeting) {
  const baseUrl = 'https://calendar.google.com/calendar/event?action=TEMPLATE';

  // Convert start and end times to Google Calendar format
  const startDateTime = convertToGoogleCalendarDate(new Date(`${meeting.date}T${meeting.time}:00Z`));
  const endDateTime = convertToGoogleCalendarDate(meeting.endTime); // Pass a Date object directly for endTime

  // Prepare URL parameters
  const params = new URLSearchParams({
    text: meeting.title, // Event title
    dates: `${startDateTime}/${endDateTime}`, // Event start and end times
    details: `${meeting.description}\nJoin the meeting here: ${meeting.zoomLink}`, // Event description
    location: meeting.location, // Event location (Zoom)
    tmsrc: meeting.organizerEmail // Organizer's email
  });

  return `${baseUrl}&${params.toString()}`; // Generate the complete Google Calendar link
}

function parseDuration(durationStr) {
  const [hours, minutes] = durationStr.split(':').map(Number);
  return hours * 60 + minutes;
}

module.exports = {
  createZoomMeeting,
  generateGoogleCalendarLink,
  parseDuration,
};
