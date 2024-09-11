require("dotenv").config();
const express = require("express");
const userRouter = express.Router();
const userHelper = require("../Helpers/userHelper");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const apiKey = process.env.ZOOM_CLIENT_ID;
const apiSecret = process.env.ZOOM_CLIENT_SECRET;
const nodeMailer = require("nodemailer");
const dataModel = require("../models/dataModel");
const recipients = ["arjuntsuresh2006@gmail.com"];

const transporter = nodeMailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_ID,
    pass: process.env.EMAIL_PASSWORD,
  },
});
let tokens = null;
//This is the route for creating a token.
userRouter.get("/:token", async (req, res) => {
  const code = req.params.token;
  try {
    const response = await axios.post("https://zoom.us/oauth/token", null, {
      params: {
        code: code,
        grant_type: "authorization_code",
        redirect_url: process.env.REDIRECT_URL,
      },
      headers: {
        Authorization: `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString(
          "base64"
        )}`,
      },
    });
    tokens = response.data.access_token;
    process.env.ZOOM_ACCESS_TOKEN = tokens;
    process.env.ZOOM_ACCESS_CODE = code;
    res.status(200).send({ tokens });
  } catch (error) {
    console.error("Error fetching access token:", error.message);
    res.status(500).send({ error: "Failed to retrieve access token" });
  }
});
//This is the route for creating the meeting room
userRouter.post("/create-zoom-meeting", async (req, res) => {
  const { date, time, topic, duration } = req.body;
  if (!date || !time) {
    console.error("Missing date or time in request body");
    return res.status(400).send({ error: "Date and time are required" });
  }
  try {
    const meetingUrl = await userHelper.createZoomMeeting(
      tokens,
      date,
      time,
      topic,
      duration
    );

    if (meetingUrl) {
      console.log("Meeting created successfully:", meetingUrl.join_url);
      const meetingData = new dataModel({
        date,
        time,
        meetingUrl: meetingUrl.join_url,
        title: meetingUrl.topic,
        duration: meetingUrl.duration,
        meetingId: meetingUrl.id,
      });
      await meetingData.save();
      const parsedDuration = userHelper.parseDuration(duration);
      // Generate Google Calendar link
      const endTime = new Date(
        new Date(`${date}T${time}`).getTime() + parsedDuration * 60000
      ); // Calculate end time
      const googleCalendarLink = userHelper.generateGoogleCalendarLink({
        date,
        time,
        endTime,
        title: meetingUrl.topic,
        zoomLink: meetingUrl.join_url,
        location: "Zoom, Online",
        description: "Zoom Meeting Link",
        organizerEmail: process.env.EMAIL_ID,
      });

      const emailPromises = recipients.map((recipientEmail) => {
        const mailOptions = {
          from: process.env.EMAIL_ID,
          to: recipientEmail,
          subject: "Your Zoom Meeting Link",
          text: `Your Zoom meeting has been scheduled successfully.\n
                 Meeting Details:\n
                 Date: ${date}\n
                 Time: ${time}\n
                 Topic: ${topic}\n
                 Duration: ${duration}\n
                 You can join the meeting using the following link: ${meetingUrl.join_url}\n\n
                 Add this meeting to your Google Calendar: ${googleCalendarLink}`,
        };
        transporter.sendMail(mailOptions);
      });
      return res
        .status(200)
        .send({ message: "Meeting created successfully", meetingUrl });
    } else {
      console.error("Meeting creation failed");
      return res.status(500).send({ error: "Meeting creation failed" });
    }
  } catch (error) {
    console.error("Error creating Zoom meeting:", error.message);
    return res
      .status(500)
      .send({ error: "An error occurred while creating the Zoom meeting" });
  }
});

module.exports = userRouter;
