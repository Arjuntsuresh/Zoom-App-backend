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
    console.log(data);
    
    return data;
  } catch (error) {
    console.error("Error creating Zoom meeting:", error.message);
    res.status(500).send({ error: "Failed to create Zoom meeting" });
  }
};


module.exports = {
  createZoomMeeting
};
