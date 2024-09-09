const jwt = require("jsonwebtoken");

// Creating a jwt token

const tokenGenerator = async (secret, id) => {
  if (!secret || !id) {
    return false;
  } else {
    const token = {
      time: new Date(),
      id: id,
    };
    const options = { expiresIn: '1h' };
    return jwt.sign(token, secret,options);
  }
};

module.exports = { tokenGenerator };
