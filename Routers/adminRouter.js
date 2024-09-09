require("dotenv").config();
const express = require("express");
const adminRouter = express.Router();
const adminHelper = require("../Helpers/adminHelper");
const authHelper = require("../Helpers/authHelper");
const bcrypt = require("bcryptjs");
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
adminRouter.get('/get-all-data',async (req,res)=>{
  try {
    const response = await adminHelper.getAllData();
    if(response){
      return res.status(200).json({message: "Data fetched successfully", data: response, status:'success'});
    }
  } catch (error) {
    log.error(error.message);
    res.status(500).send("Server Error");
  }
})

module.exports = adminRouter;
