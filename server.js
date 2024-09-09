const express = require("express");
const app = express();
require("dotenv").config();
require ('./config/databaseConnection').connectToDatabase();
const PORT = process.env.PORT || 3000;
const cors = require("cors");
// middleware for requests
app.use(cors());
app.use(express.json());
app.use(
  express.urlencoded({
    extended: false,
  })
);
//Router configuration
const userRouter = require("./Routers/userRouter");
const adminRouter = require("./Routers/adminRouter");
// middleware for routes
app.use("/",userRouter);
app.use("/admin",adminRouter);
//connect to server
app.listen(PORT, () => {
  try {
    console.log(`Server is running on port ${PORT}`);
  } catch (err) {
    console.error(err);
  }
});
