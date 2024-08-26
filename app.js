const clientId = '4a8d194929474408a57a9e0343dbcfb0';
const redirectUri = 'http://127.0.0.1:5501/index.html';
const scopes = 'user-read-private user-read-email playlist-read-private';
let accessToken = null;

document.getElementById('login-btn').addEventListener('click', () => {
    const authUrl = `https://accounts.spotify.com/authorize?response_type=token&client_id=${clientId}&scope=${scopes}&redirect_uri=${redirectUri}`;
    window.location.href = authUrl;
});

window.onload = () => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    accessToken = params.get('access_token');

    if (accessToken) {
        fetchUserProfile();
        fetchPlaylists();
    }
};

function fetchUserProfile() {
    fetch('https://api.spotify.com/v1/me', {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('user-name').textContent = data.display_name;
        document.getElementById('user-image').src = data.images[0]?.url || 'default-image.png';
        document.getElementById('login-btn').style.display = 'none';
    })
    .catch(error => console.error('Error fetching user profile:', error));
}

function fetchPlaylists() {
    fetch('https://api.spotify.com/v1/me/playlists', {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    })
    .then(response => response.json())
    .then(data => {
        const playlistsContainer = document.getElementById('playlists-container');
        playlistsContainer.innerHTML = ''; // Clear previous content
        data.items.forEach(playlist => {
            const playlistItem = document.createElement('div');
            playlistItem.classList.add('playlist-item');
            playlistItem.innerHTML = `
                <img src="${playlist.images[0]?.url}" alt="${playlist.name}">
                <h3>${playlist.name}</h3>
            `;
            playlistsContainer.appendChild(playlistItem);
        });
    })
    .catch(error => console.error('Error fetching playlists:', error));
}

// Search functionality
document.getElementById('search-btn').addEventListener('click', () => {
    const query = document.getElementById('search-input').value;
    searchSpotify(query);
});

function searchSpotify(query) {
    if (!accessToken) {
        console.error('Access token is not available');
        return;
    }

    fetch(`https://api.spotify.com/v1/search?q=${query}&type=track,artist,album`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    })
    .then(response => response.json())
    .then(data => {
        const resultsContainer = document.getElementById('results-container');
        resultsContainer.innerHTML = '';

        data.tracks.items.forEach(track => {
            const trackElement = createTrackElement(track);
            resultsContainer.appendChild(trackElement);
        });

        document.querySelectorAll('.play-btn').forEach(button => {
            button.addEventListener('click', event => {
                const previewUrl = event.target.getAttribute('data-preview-url');
                if (previewUrl) {
                    playTrack(previewUrl);
                } else {
                    alert('No preview available for this track.');
                }
            });
        });
        let currentAudio = null; // Variable to store the currently playing audio

        function playTrack(url) {
            // Pause and reset the current audio if it exists
            if (currentAudio) {
                currentAudio.pause();
                currentAudio.currentTime = 0;
            }
        
            // Create a new audio object and play it
            currentAudio = new Audio(url);
            currentAudio.play();
        }
    })
    .catch(error => console.error('Error fetching search results:', error));
}

function createTrackElement(track) {
    const trackElement = document.createElement('div');
    trackElement.classList.add('result-item');
    trackElement.innerHTML = `
        <img src="${track.album.images[0]?.url}" alt="${track.name}">
        <h3>${track.name}</h3>
        <p>${track.artists[0].name}</p>
        <button class="play-btn" data-preview-url="${track.preview_url}">Play</button>`;
    return trackElement;
}

function playTrack(url) {
    const audio = new Audio(url);
    audio.play();
}

function createPlaylist(name, description) {
    fetch('https://api.spotify.com/v1/me/playlists', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: name,
            description: description,
            public: false
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Playlist created:', data);
        fetchPlaylists();  // Refresh the playlists after creation
    })
    .catch(error => console.error('Error creating playlist:', error));
}

document.getElementById('create-playlist-btn').addEventListener('click', () => {
    const playlistName = prompt('Enter playlist name:');
    const playlistDescription = prompt('Enter playlist description:');
    if (playlistName) {
        createPlaylist(playlistName, playlistDescription);
    }
});
