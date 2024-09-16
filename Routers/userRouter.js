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
const bcrypt = require("bcryptjs");
const authHelper = require("../Helpers/authHelper");
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
        email:recipients
      });
      await meetingData.save(); 
      // Calculate end time
      const googleCalendarLink = userHelper.generateGoogleCalendarLink({
        date,
        time,
        duration,
        title: meetingUrl.topic,
        zoomLink: meetingUrl.join_url,
        location: "Zoom, Online",
        description: "Zoom Meeting Link",
        organizerEmail: process.env.EMAIL_ID,
        timeZone: 'Asia/Kolkata'
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

userRouter.post('/student-login',async (req,res)=>{
  try {
    const {email,password} = req.body;
    if(!email || !password){
      return res.status(400).json({ message: "Please enter all fields" });
    }
    const response = await userHelper.findStudent(email);
    console.log(response);
    
    if(response){
      const validatePassword = await bcrypt.compare(
        password,
        response.password
      )
    
    if(!validatePassword){
      return res.status(401).json({ message: "Invalid credentials" });
    }
    let jwtSecretKey = process.env.JWT_SECRET_KEY_STUDENT;
    const token = await authHelper.tokenGenerator(jwtSecretKey,response._id);
    if(!token){
      return res.status(500).json({ message: "Failed to generate token" });
    }
    return res.status(200).json({ message: "Logged in successfully", token,status:'success',response });
  }else{
    return res.status(404).json({ message: "User not found" });
  }
  } catch (error) {
    console.error("Error logging in student:", error.message);
    return res.status(500).send({ error: "Failed to log in student" });
  }
})
userRouter.get('/get-all-data/:email', async (req, res) => {
  try {
    const email = req.params.email;
    const response = await userHelper.findStudentDataFromDataModel(email);
    console.log(response);
    
    // Ensure the response is always an array of objects
    const data = Array.isArray(response) ? response : [response];

    if (response) {
      return res.status(200).json({
        message: "Data fetched successfully",
        data: data,  // Wrap single object in an array
        status: "success",
      });
    } else {
      return res.status(404).json({
        message: "No data found",
        data: [],
        status: "error",
      });
    }
  } catch (error) {
    log.error(error.message);
    return res.status(500).json({
      message: "Server Error",
      error: error.message,
      status: "error",
    });
  }
});

module.exports = userRouter;
