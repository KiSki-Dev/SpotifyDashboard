let accessToken;
let currentData = null;
let isMuted = false; // Variable to track mute/unmute state
let savedVolume = 30; // Variable to store previous volume

// Function to fetch currently playing track from Spotify API
async function getCurrentPlaying() {
  const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + accessToken,
    }
  });

  if (!response.ok) {
    console.error('Unable to get currently playing track:', response.status);
    checkAccesToken();
  }

  currentData = await response.json();

  if (!currentData || !currentData.item) {
    document.getElementById('song-name').textContent = 'No track currently playing';
    document.getElementById('artist-name').textContent = '';
    document.getElementById('album-name').textContent = '';
    document.getElementById('cover').src = ''; // Clear cover image
    document.getElementById('progress-bar').value = 0; // Reset progress bar
    return;
  }

  const songName = currentData.item.name;
  const artistName = currentData.item.artists.map(artist => artist.name).join(', ');
  const albumName = currentData.item.album.name;
  const coverUrl = currentData.item.album.images[0].url; // Get cover image URL
  const progressMs = currentData.progress_ms; // Get progress in milliseconds
  const durationMs = currentData.item.duration_ms; // Get duration in milliseconds

  document.getElementById('song-name').textContent = songName;
  document.getElementById('artist-name').textContent = artistName;
  document.getElementById('album-name').textContent = albumName;
  document.getElementById('cover').src = coverUrl; // Set cover image
  document.getElementById('progress-bar').value = (progressMs / durationMs) * 100; // Set progress bar value

  // Check if playback is paused at the beginning
  if (currentData && currentData.is_playing === false) {
    // Song is paused
    document.getElementById('pause-button').style.display = 'none';
    document.getElementById('play-button').style.display = 'block';
  } else {
    // Song is playing
    document.getElementById('pause-button').style.display = 'block';
    document.getElementById('play-button').style.display = 'none';
  }

  // Check mute status at the beginning
  const volume = await getVolume();
  if (volume === 0) {
    // Muted
    isMuted = true;
    document.getElementById('mute-button').style.display = 'none';
    document.getElementById('unmute-button').style.display = 'block';
  } else {
    isMuted = false;
    document.getElementById('mute-button').style.display = 'block';
    document.getElementById('unmute-button').style.display = 'none';
  }

  // Check if the current song is liked
  const trackId = currentData.item.id;
  const likeResponse = await fetch(`https://api.spotify.com/v1/me/tracks/contains?ids=${trackId}`, {
      headers: {
          'Authorization': 'Bearer ' + accessToken,
      }
  });

  if (likeResponse.ok) {
      const likedStatus = await likeResponse.json();
      const isLiked = likedStatus[0];

      if (isLiked) {
          document.getElementById('like-button').style.display = 'none'; // Hide like button
          document.getElementById('unlike-button').style.display = 'block'; // Show unlike button
      } else {
          document.getElementById('like-button').style.display = 'block'; // Show like button
          document.getElementById('unlike-button').style.display = 'none'; // Hide unlike button
      }
  } else {
      console.error('Unable to check like status:', likeResponse.status);
  }
}

// Function to like the current song
async function likeCurrentSong() {
  if (!currentData) {
      return;
  }

  const trackId = currentData.item.id;

  const response = await fetch(`https://api.spotify.com/v1/me/tracks?ids=${trackId}`, {
      method: 'PUT',
      headers: {
          'Authorization': 'Bearer ' + accessToken,
          'Content-Type': 'application/json'
      }
  });

  if (!response.ok) {
      console.error('Unable to like the current song:', response.status);
      return;
  }

  // Update UI after liking the song
  document.getElementById('like-button').style.display = 'none'; // Hide like button
  document.getElementById('unlike-button').style.display = 'block'; // Show unlike button
}

// Function to unlike the current song
async function unlikeCurrentSong() {
  if (!currentData) {
      return;
  }

  const trackId = currentData.item.id;

  const response = await fetch(`https://api.spotify.com/v1/me/tracks?ids=${trackId}`, {
      method: 'DELETE',
      headers: {
          'Authorization': 'Bearer ' + accessToken,
          'Content-Type': 'application/json'
      }
  });

  if (!response.ok) {
      console.error('Unable to unlike the current song:', response.status);
      return;
  }

  // Update UI after unliking the song
  document.getElementById('like-button').style.display = 'block'; // Show like button
  document.getElementById('unlike-button').style.display = 'none'; // Hide unlike button
}

// Function to pause playback
async function pausePlayback() {
  const response = await fetch('https://api.spotify.com/v1/me/player/pause', {
    method: 'PUT',
    headers: {
      'Authorization': 'Bearer ' + accessToken,
    }
  });

  if (!response.ok) {
    console.error('Unable to pause playback:', response.status);
    return;
  }

  // Update UI after pausing playback
  document.getElementById('pause-button').style.display = 'none';
  document.getElementById('play-button').style.display = 'block';
}

// Function to resume playback
async function resumePlayback() {
  const response = await fetch('https://api.spotify.com/v1/me/player/play', {
    method: 'PUT',
    headers: {
      'Authorization': 'Bearer ' + accessToken,
    }
  });

  if (!response.ok) {
    console.error('Unable to resume playback:', response.status);
    return;
  }

  // Update UI after resuming playback
  document.getElementById('play-button').style.display = 'none';
  document.getElementById('pause-button').style.display = 'block';
}

// Function to skip to the next track
async function nextTrack() {
  const response = await fetch('https://api.spotify.com/v1/me/player/next', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + accessToken,
    }
  });

  if (!response.ok) {
    console.error('Unable to skip to the next track:', response.status);
    return;
  }

  // Update UI after skipping to the next track
  getCurrentlyPlaying();
}

// Function to skip to the previous track
async function previousTrack() {
  const response = await fetch('https://api.spotify.com/v1/me/player/previous', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + accessToken,
    }
  });

  if (!response.ok) {
    console.error('Unable to skip to the previous track:', response.status);
    return;
  }

  // Update UI after skipping to the previous track
  getCurrentlyPlaying();
}

// Function to toggle mute/unmute
function toggleMute() {
  if (isMuted) {
    // Unmute
    if (savedVolume === 0) {
      savedVolume = 30;
    }
    setVolume(savedVolume); // Restore previous volume
    isMuted = false;
    document.getElementById('mute-button').style.display = 'block';
    document.getElementById('unmute-button').style.display = 'none';
  } else {
    // Mute
    getVolume().then(volume => {
      savedVolume = volume; // Save current volume
      setVolume(0); // Set volume to 0 (mute)
      isMuted = true;
      document.getElementById('mute-button').style.display = 'none';
      document.getElementById('unmute-button').style.display = 'block';
    });
  }
}

// Function to retrieve current volume
async function getVolume() {
  const response = await fetch('https://api.spotify.com/v1/me/player', {
    headers: {
      'Authorization': 'Bearer ' + accessToken,
    }
  });

  if (!response.ok) {
    console.error('Unable to get current volume:', response.status);
    return;
  }

  const data = await response.json();
  return data.device.volume_percent;
}

// Function to set volume
async function setVolume(volume) {
  const response = await fetch('https://api.spotify.com/v1/me/player/volume?volume_percent=' + volume, {
    method: 'PUT',
    headers: {
      'Authorization': 'Bearer ' + accessToken,
    }
  });

  if (!response.ok) {
    console.error('Unable to set volume:', response.status);
    return;
  }
}

// Call the function to check and get currently playing track when the page loads
window.onload = function() {
  checkAccesToken();
  // Refresh every 1 second (1000 milliseconds)
  setInterval(checkAccesToken, 1000);
};

// Set event listeners for buttons and volume range input
document.getElementById('pause-button').addEventListener('click', pausePlayback);
document.getElementById('play-button').addEventListener('click', resumePlayback);
document.getElementById('next-button').addEventListener('click', nextTrack);
document.getElementById('previous-button').addEventListener('click', previousTrack);
document.getElementById('mute-button').addEventListener('click', toggleMute);
document.getElementById('unmute-button').addEventListener('click', toggleMute);
document.getElementById('like-button').addEventListener('click', likeCurrentSong);
document.getElementById('unlike-button').addEventListener('click', unlikeCurrentSong);
document.body.style.cursor = 'none';

async function checkAccesToken() {
  const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
    headers: {
      'Authorization': 'Bearer ' + accessToken,
    }
  });

  if (!response.ok) {
    getToken();
  }
  else {
    getCurrentPlaying();
  }
}

async function getToken() {
  const response = await fetch('http://localhost:8888/');
  const data = await response.json(); // Extract JSON content from response
  const token = data.token;

  if (token === undefined) {
    window.location.replace("http://localhost:8888/login");
  }
  else {
    accessToken = token;
  }
}

