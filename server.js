const express = require('express');
const session = require('express-session');
const crypto = require('crypto');

const app = express();
const port = 8888;

let accessToken;

// Use session middleware
app.use(session({
  secret: '30b38f4babdd4201bda86bf577435be7',
  resave: false,
  saveUninitialized: true
}));

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

// Generate a random string for code verifier
const generateRandomString = (length) => {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from(crypto.randomFillSync(new Uint8Array(length)))
    .map((x) => possible[x % possible.length])
    .join('');
};

// Generate code challenge from code verifier
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

  // Save code verifier for later use
  req.session.codeVerifier = codeVerifier;

  const clientId = '56045678e77a4c199b7ed3d25a399d67';
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

  const clientId = '56045678e77a4c199b7ed3d25a399d67';
  const clientSecret = '30b38f4babdd4201bda86bf577435be7';
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
    console.log('Access Token:', data.access_token);
    console.log('Token Type:', data.token_type);
    console.log('Scope:', data.scope);
    console.log('Expires In:', data.expires_in);
    console.log('Refresh Token:', data.refresh_token);

    res.redirect('http://localhost:8080/');
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error occurred');
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
