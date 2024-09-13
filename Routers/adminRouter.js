require("dotenv").config();
const express = require("express");
const adminRouter = express.Router();
const adminHelper = require("../Helpers/adminHelper");
const authHelper = require("../Helpers/authHelper");
const bcrypt = require("bcryptjs");
const nodeMailer = require("nodemailer");
const recipients = ["arjuntsuresh2006@gmail.com"];
const transporter = nodeMailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_ID,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// admin page
adminRouter.get("/", (req, res) => {
  res.send("admin");
});
// admin login controller
adminRouter.post("/admin-login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Please enter all fields" });
    }
    const response = await adminHelper.findAdmin(email);
    if (response) {
      const validatePassword = await bcrypt.compare(
        password,
        response.password
      );

      if (!validatePassword) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
      let jwtSecretKey = process.env.JWT_SECRET_KEY_ADMIN;
      const token = await authHelper.tokenGenerator(jwtSecretKey, response._id);
      if (!token) {
        return res.status(500).json({ message: "Token generation failed" });
      }
      return res.status(200).json({
        message: "Token generated successfully",
        response,
        token,
        status: "success",
      });
    } else {
      // If admin is not found
      return res.status(400).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Server Error");
  }
});
adminRouter.get("/get-all-data", async (req, res) => {
  try {
    const response = await adminHelper.getAllData();
    if (response) {
      return res.status(200).json({
        message: "Data fetched successfully",
        data: response,
        status: "success",
      });
    }
  } catch (error) {
    log.error(error.message);
    res.status(500).send("Server Error");
  }
});

// delete zoom meetings from admin
adminRouter.delete("/delete-meeting/:meetingId", async (req, res) => {
  try {
    const meetingId = req.params.meetingId;
    const response = await adminHelper.deleteZoomMeeting(meetingId);
    if (response) {
      const dbResponse = await adminHelper.deleteZoomMeetingFromDB(meetingId);
      const emailPromises = recipients.map((recipientEmail) => {
        const mailOptions = {
          from: process.env.EMAIL_ID,
          to: recipientEmail,
          subject: "Your Zoom Meeting Cancellation",
          text: `Your Zoom meeting has been canceled. If you have any questions or need to reschedule, please contact us.`,
        };
        transporter.sendMail(mailOptions);
      });
      return res.status(200).json({
        message: "Zoom meeting deleted successfully",
        status: "success",
      });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Server Error");
  }
});

adminRouter.get("/get-data-by-id/:id", async (req, res) => {
  try {
    const meetingId = req.params.id;
    const response = await adminHelper.getDataById(meetingId);
    if (response) {
      return res.status(200).json({
        message: "Data fetched successfully",
        data: response,
        status: "success",
      });
    } else {
      return res.status(404).json({
        message: "Data not found",
        status: "error",
      });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Server Error");
  }
});
adminRouter.put("/update-meeting/:id", async (req, res) => {
  try {
    const meetingId = req.params.id;
    const updatedData = req.body;
    const response = await adminHelper.updateData(meetingId, updatedData);
    if (response) {
      const dataFromDb = await adminHelper.getDataById(meetingId);      
     const duration = updatedData.duration;
      const googleCalendarLink = adminHelper.generateGoogleCalendarLink({
        date: updatedData.date,
        time: updatedData.time,
        duration,
        title: updatedData.topic,
        zoomLink: dataFromDb.meetingUrl,
        location: 'Zoom, Online',
        description: 'Updated Zoom Meeting Link',
        organizerEmail: process.env.EMAIL_ID,
        timeZone: 'Asia/Kolkata'
      });

      const emailPromises = recipients.map((recipientEmail) => {
        const mailOptions = {
          from: process.env.EMAIL_ID,
          to: recipientEmail,
          subject: "Your Zoom Meeting Updated",
          text: `Your Zoom meeting has been updated.\n
            Updated meeting details:\n
            Date: ${updatedData.date}\n
            Time: ${updatedData.time}\n
            Topic: ${updatedData.topic}\n
            Duration: ${updatedData.duration}\n
            Join the meeting here: ${dataFromDb.meetingUrl}\n
            Add to Google Calendar: ${googleCalendarLink}`
        };
        transporter.sendMail(mailOptions);
      });
      return res.status(200).json({
        message: "Meeting updated successfully",
        status: "success",
      });
    } else {
      return res.status(404).json({
        message: "Meeting not found",
        status: "error",
      });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Server Error");
  }
});

module.exports = adminRouter;
