const express = require('express');
const axios = require('axios');
const crypto = require('crypto'); // Node.js built-in module for cryptographic functionality

require('dotenv').config();

const app = express();
const port = 3000;

// Variables for storing client credentials and the generated state
const clientId = process.env.FIGMA_CLIENT_ID;
const clientSecret = process.env.FIGMA_CLIENT_SECRET;
const redirectUri = process.env.REDIRECT_URI;
let state; // Placeholder for the state value

app.get('/', (req, res) => {
  res.send('Hello, Figma OAuth!');
});


app.get('/auth', (req, res) => {
  // Generate a random state value
  state = crypto.randomBytes(16).toString('hex');

  // Redirect users to the Figma OAuth authorization URL, including the state parameter
  const url = `https://www.figma.com/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=file_read&state=${state}&response_type=code`;
  console.log(clientId);
  res.redirect(url);
});

app.get('/callback', async (req, res) => {
  const { code, state: returnedState } = req.query;
  if (!code || !returnedState || returnedState !== state) {
    return res.status(400).send('Invalid state or code');
  }

  try {
    // Exchange the authorization code for an access token
    const response = await axios.post('https://www.figma.com/api/oauth/token', {
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code: code,
      grant_type: 'authorization_code',
    });

    const accessToken = response.data.access_token;
    // Reset the stored state after successful validation
    state = null;
    // Use the access token to make authenticated requests to Figma's API
    res.send(`Access Token: ${accessToken}`);
  } catch (error) {
    console.error('Failed to exchange code for token', error);
    res.status(500).send('Failed to exchange code for token');
  }
});

app.listen(port, () => {
  console.log(`Figma OAuth app listening at http://localhost:${port}`);
});
