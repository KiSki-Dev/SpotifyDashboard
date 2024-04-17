let accessToken;
let currentData = null;
let isMuted = false;
let savedVolume = 30; // Default volume

// Update UI
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
    document.getElementById('cover').src = '';
    document.getElementById('progress-bar').value = 0;
    return;
  }

  const songName = currentData.item.name;
  const artistName = currentData.item.artists.map(artist => artist.name).join(', ');
  const albumName = currentData.item.album.name;
  const coverUrl = currentData.item.album.images[0].url;
  const progressMs = currentData.progress_ms;
  const durationMs = currentData.item.duration_ms;

  document.getElementById('song-name').textContent = songName;
  document.getElementById('artist-name').textContent = artistName;
  document.getElementById('album-name').textContent = albumName;
  document.getElementById('cover').src = coverUrl;
  document.getElementById('progress-bar').value = (progressMs / durationMs) * 100;

  if (currentData && currentData.is_playing === false) {
    document.getElementById('pause-button').style.display = 'none';
    document.getElementById('play-button').style.display = 'block';
  } else {
    document.getElementById('pause-button').style.display = 'block';
    document.getElementById('play-button').style.display = 'none';
  }

  const volume = await getVolume();
  if (volume === 0) {
    isMuted = true;
    document.getElementById('mute-button').style.display = 'none';
    document.getElementById('unmute-button').style.display = 'block';
  } else {
    isMuted = false;
    document.getElementById('mute-button').style.display = 'block';
    document.getElementById('unmute-button').style.display = 'none';
  }

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
          document.getElementById('like-button').style.display = 'none';
          document.getElementById('unlike-button').style.display = 'block';
      } else {
          document.getElementById('like-button').style.display = 'block';
          document.getElementById('unlike-button').style.display = 'none';
      }
  } else {
      console.error('Unable to check like status:', likeResponse.status);
  }
}

// Like current Song
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

  document.getElementById('like-button').style.display = 'none';
  document.getElementById('unlike-button').style.display = 'block';
}

// Unlike current Song
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

  document.getElementById('like-button').style.display = 'block';
  document.getElementById('unlike-button').style.display = 'none';
}

// Pause playback
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

  document.getElementById('pause-button').style.display = 'none';
  document.getElementById('play-button').style.display = 'block';
}

// Resume playback
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

  document.getElementById('play-button').style.display = 'none';
  document.getElementById('pause-button').style.display = 'block';
}

// Skip to the next track
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

  getCurrentlyPlaying();
}

// Skip to the previous track
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

  getCurrentlyPlaying();
}

// Mute or unmute the volume
function toggleMute() {
  if (isMuted) {
    if (savedVolume === 0) {
      savedVolume = 30;
    }
    setVolume(savedVolume);
    isMuted = false;
    document.getElementById('mute-button').style.display = 'block';
    document.getElementById('unmute-button').style.display = 'none';
  } else {
    getVolume().then(volume => {
      savedVolume = volume;
      setVolume(0);
      isMuted = true;
      document.getElementById('mute-button').style.display = 'none';
      document.getElementById('unmute-button').style.display = 'block';
    });
  }
}

// Get the current volume
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

// Set the volume
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

window.onload = function() {
  checkAccesToken(); // Check if Token is still valid
  setInterval(checkAccesToken, 1000); // Check every second
};

document.getElementById('pause-button').addEventListener('click', pausePlayback);
document.getElementById('play-button').addEventListener('click', resumePlayback);
document.getElementById('next-button').addEventListener('click', nextTrack);
document.getElementById('previous-button').addEventListener('click', previousTrack);
document.getElementById('mute-button').addEventListener('click', toggleMute);
document.getElementById('unmute-button').addEventListener('click', toggleMute);
document.getElementById('like-button').addEventListener('click', likeCurrentSong);
document.getElementById('unlike-button').addEventListener('click', unlikeCurrentSong);
document.body.style.cursor = 'none'; // Hide cursor

// Check if Token is still valid
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

// Get a fresh Token
async function getToken() {
  const response = await fetch('http://localhost:8888/');
  const data = await response.json();
  const token = data.token;

  if (token === undefined) {
    window.location.replace("http://localhost:8888/login"); // Redirect to login page if Login is requiered
  }
  else {
    // Check if existing Token is Valid
    const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: {
        'Authorization': 'Bearer ' + token,
      }
    });
  
    if (!response.ok) {
      window.location.replace("http://localhost:8888/login"); // Redirect to login page
    }
    else {
      accessToken = token;
    }
  }
}