const express = require('express');
const axios = require('axios');
const crypto = require('crypto'); // Node.js built-in module for cryptographic functionality
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = 3000;

// Variables for storing client credentials and the generated state
const clientId = process.env.FIGMA_CLIENT_ID;
const clientSecret = process.env.FIGMA_CLIENT_SECRET;
const redirectUri = process.env.REDIRECT_URI;
let state; // Placeholder for the state value

// Serve the HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/auth', (req, res) => {
  // Generate a random state value
  state = crypto.randomBytes(16).toString('hex');

  // Redirect users to the Figma OAuth authorization URL, including the state parameter
  const url = `https://www.figma.com/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=file_read&state=${state}&response_type=code`;
  res.redirect(url);
});

app.get('/a', async (req, res) => {
  try {
      const { code, state: returnedState } = req.query;
  if (!code || !returnedState || returnedState !== state) {
    return res.status(400).send('Invalid state or code');
  }
  } catch (error) {
    console.log(error)
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
    // Send the access token to the client-side script
    res.send(`<script>
      window.opener.postMessage('${accessToken}', window.location.origin);
      window.close();
    </script>`);
  } catch (error) {
    console.error('Failed to exchange code for token', error);
    res.status(500).send('Failed to exchange code for token');
  }
});

app.listen(port, () => {
  console.log(`Figma OAuth app listening at http://localhost:${port}`);
});