const express = require("express");
const app = express();
require("dotenv").config();
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
// middleware for routes
app.use("/",userRouter);
//connect to server
app.listen(PORT, () => {
  try {
    console.log(`Server is running on port ${PORT}`);
  } catch (err) {
    console.error(err);
  }
});
