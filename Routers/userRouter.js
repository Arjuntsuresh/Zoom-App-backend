require("dotenv").config();
const express = require("express");
const userRouter = express.Router();
const userHelper = require("../Helpers/userHelper");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const apiKey = process.env.ZOOM_CLIENT_ID;
const apiSecret = process.env.ZOOM_CLIENT_SECRET;
const nodeMailer = require("nodemailer");

const recipients = ["anupamasanthosh730@gmail.com", "arjuntsuresh2006@gmail.com"];

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
    res.status(200).send({ tokens });
  } catch (error) {
    console.error("Error fetching access token:", error.message);
    res.status(500).send({ error: "Failed to retrieve access token" });
  }
});
//This is the route for creating the meeting room
userRouter.post("/create-zoom-meeting", async (req, res) => {
  const { date, time } = req.body;
  if (!date || !time) {
    console.error("Missing date or time in request body");
    return res.status(400).send({ error: "Date and time are required" });
  }
  try {
    const meetingUrl = await userHelper.createZoomMeeting(tokens, date, time);

    if (meetingUrl) {
      console.log("Meeting created successfully:", meetingUrl.join_url);
      const emailPromises = recipients.map(recipientEmail => {
        const mailOptions = {
          from: process.env.EMAIL_ID,
          to: recipientEmail,
          subject: 'Your Zoom Meeting Link',
          text: `Your Zoom meeting has been scheduled successfully. You can join the meeting using the following link: ${meetingUrl.join_url}`
        };
         transporter.sendMail(mailOptions);
      });
     // console.log("Emails sent successfully to:", recipients.join(', '));

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
