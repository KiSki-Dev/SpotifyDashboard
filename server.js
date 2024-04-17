const express = require('express');
const session = require('express-session');
const crypto = require('crypto');

const app = express();
const port = 8888; // Port to listen on, make sure this matches to script.js

let accessToken;

app.use(session({
  secret: '30b38f4babdd4201bda86bf577435be7',
  resave: false,
  saveUninitialized: true
}));

// Permissions the Webpage needs
const allScopes = [
  'user-read-recently-played',
  'user-read-playback-position',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'app-remote-control',
  'user-library-modify',
  'user-library-read',
  'streaming',
];

const generateRandomString = (length) => {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from(crypto.randomFillSync(new Uint8Array(length)))
    .map((x) => possible[x % possible.length])
    .join('');
};

const sha256 = (plain) => {
  return crypto.createHash('sha256').update(plain).digest();
};

const base64encode = (input) => {
  return Buffer.from(input).toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
};

app.get('/', function(req, resp) {
  resp.header('Access-Control-Allow-Origin', '*');

  resp.json({token : accessToken});
});

app.get('/login', (req, res) => {
  const codeVerifier = generateRandomString(64);
  const codeChallenge = base64encode(sha256(codeVerifier));

  req.session.codeVerifier = codeVerifier;

  const clientId = '56045678e77a4c199b7ed3d25a399d67'; // Replace with your Client ID
  const redirectUri = 'http://localhost:8888/callback';
  const scope = allScopes.join(' ');

  const authUrl = new URL('https://accounts.spotify.com/authorize');
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('client_id', clientId);
  authUrl.searchParams.append('scope', scope);
  authUrl.searchParams.append('code_challenge_method', 'S256');
  authUrl.searchParams.append('code_challenge', codeChallenge);
  authUrl.searchParams.append('redirect_uri', redirectUri);

  res.redirect(authUrl.toString());
});

app.get('/callback', async (req, res) => {
  const { code } = req.query;
  const codeVerifier = req.session.codeVerifier;

  const clientId = '56045678e77a4c199b7ed3d25a399d67'; // Replace with your Client ID
  const clientSecret = '30b38f4babdd4201bda86bf577435be7'; // Replace with your Client Secret
  const redirectUri = 'http://localhost:8888/callback';

  const tokenUrl = 'https://accounts.spotify.com/api/token';
  const payload = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64'),
    },
    body: new URLSearchParams({
      'grant_type': 'authorization_code',
      'code': code,
      'redirect_uri': redirectUri,
      'code_verifier': codeVerifier,
    }),
  };

  try {
    const response = await fetch(tokenUrl, payload);
    const data = await response.json();
    accessToken = data.access_token;
    console.log('Received new One-Hour Access Token');

    res.redirect('http://localhost:8080/');
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error occurred');
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
