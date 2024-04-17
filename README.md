# **Spotify Dashboard Webpage**
## Webpage to show your Spotify Playback and control it

## **Features:**
- **See your current Spotify Playback**
- **See the Progress, Artist and Album of the Song**
- **Pause and Resume the Song**
- **Skip to the next or precious Song**
- **Mute and Unmute the current Song**
- **Like or Unlike your current Song**
- **Full customizable**
- **Support for Raspberry Pi and other Devices**

------------

[![Preview](https://i.imgur.com/tRAQ8zN.png "Preview")](https://i.imgur.com/tRAQ8zN.png "Preview")

## **Informations:**
**I run it on my Raspberry Pi with a attatched Display, to control Spotify while playing Games or else.**

**If you want to contact me, feel free to join my [Discord-Server](https://discord.gg/cYqpx7dqsn "Discord-Server")!**

### [![](https://dcbadge.vercel.app/api/server/mCJwUAcXFs?style=flat)](https://discord.gg/mCJwUAcXFs)  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## **How to Setup:**
**1. Install dependencies**
- **Install Files**
- **Install [NodeJS](https://nodejs.org/ "NodeJS")**
- **Install NPM Packages: `npm install express express-session crypto`**
- **Install HTTP-Server globally: `npm install -g http-server`**

**2. Setup Spotify App**
- **Create a App on the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard "Spotify Developer Dashboard")**
- **In Redirect URI insert `http://localhost:8888/callback`**
- **Tick the Box at `Web API`**
- **Click Save, then Edit**
- **Copy Client ID and Client Secret**
- **Insert both in server.js**

**3. A) Setup for No-Autostart**
- **Open new Terminal in the Directory and run: `http-server`**
- **Open another Terminal in the Directory and run: `node server.js`**
- **Open `http://localhost:8080` in the Browser and Log into Spotify**

**3. B) Setup for Autostart (Linux Only)**
- **Install dependencies: `apt-get install gnome-terminal`**
- **Create new Bash Script:**
```bash
#!/bin/bash
sleep 3
sudo gnome-terminal --working-directory=/home/pi/SpotifyDashboard/ -- http-server
sudo gnome-terminal --working-directory=/home/pi/SpotifyDashboard/ --- node /home/pi/SpotifyDashboard/server.js
sleep 3
chromium-browser --kiosk 'http://localhost:8080'
```
- **Give the Script Permissions: `chmod +x script.sh`**
- **Autorun this Script on Startup ([See this Article](https://www.tutorialspoint.com/run-a-script-on-startup-in-linux "See this Article"))**

------------
