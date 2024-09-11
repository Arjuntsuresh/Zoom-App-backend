const jwt = require("jsonwebtoken");
const axios = require('axios');
const querystring = require('querystring');

const clientId = process.env.ZOOM_CLIENT_ID;
const clientSecret = process.env.ZOOM_CLIENT_SECRET;
const redirectUri = process.env.REDIRECT_URL;
const authorizationCode = process.env.ZOOM_ACCESS_CODE;
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

async function getAccessToken() {
  try {
    const tokenResponse = await axios.post(
      'https://zoom.us/oauth/token',
      querystring.stringify({
        grant_type: 'authorization_code',
        code: authorizationCode,   
        redirect_uri: redirectUri,
      }),
      {
        headers: {
          Authorization:
            'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    const { access_token } = tokenResponse.data;
    process.env.ZOOM_ACCESS_TOKEN = access_token;
    return access_token;
  } catch (error) {
    console.error('Error getting access token:', error.response ? error.response.data : error.message);
  }
}

module.exports = { tokenGenerator,
  getAccessToken,
 };
