// ====================
// Spotify
// ====================

let spotifyProgress = 0;
let spotifyDuration = 0;
let spotifyIsPlaying = false;


// ====================
// Spotify Authentication
// ====================

function loginToSpotify() {

    window.location.href =
        "http://localhost:3000/auth/spotify";
}


const spotifyLoginButton =
    document.getElementById("spotify-login");

if (spotifyLoginButton) {

    spotifyLoginButton.addEventListener(
        "click",
        loginToSpotify
    );
}


// ====================
// Spotify Now Playing
// ====================

async function loadSpotifyNowPlaying() {

    try {

        const response =
            await fetch(
                "http://localhost:3000/api/spotify/now-playing"
            );

        if (!response.ok) {

            throw new Error(
                `Spotify request failed: ${response.status}`
            );
        }

        const data =
            await response.json();


        // Nothing playing
if (!data.title) {
    spotifyIsPlaying = false;
    spotifyProgress = 0;
    spotifyDuration = 0;

    const spotifyElement =
        document.getElementById(
            "spotify-content"
        );

    if (spotifyElement) {
        spotifyElement.innerHTML = `
            <p>
                Nothing is currently playing.
            </p>
        `;
    }

    return;
}


        // Sync local progress with Spotify
        spotifyProgress =
            data.progress || 0;

        spotifyDuration =
            data.duration || 0;

        spotifyIsPlaying =
            data.playing;


        const progressPercent =
            spotifyDuration > 0
                ? (spotifyProgress / spotifyDuration) * 100
                : 0;


        const spotifyElement =
            document.getElementById(
                "spotify-content"
            );

        if (!spotifyElement) return;


        spotifyElement.innerHTML = `

            <img
                src="${data.albumArt}"
                class="spotify-album-art"
            >

            <div class="spotify-track">

                <strong>
                    ${data.title}
                </strong>

                <span>
                    ${data.artist}
                </span>

            </div>


            <div class="spotify-progress">

                <div
                    class="spotify-progress-bar"
                    style="
                        width: ${progressPercent}%;
                    ">
                </div>

            </div>


            <div class="spotify-time">

                <span>
                    ${formatSpotifyTime(
                        spotifyProgress
                    )}
                </span>

                <span>
                    ${formatSpotifyTime(
                        spotifyDuration
                    )}
                </span>

            </div>


            <div class="spotify-status">

                ${
                    spotifyIsPlaying
                        ? "▶ Playing"
                        : "⏸ Paused"
                }

            </div>


            <div class="spotify-controls">

                <button
                    onclick="spotifyPrevious()">
                    ⏮
                </button>

                <button
                    onclick="spotifyPlayPause()"
                    id="spotify-play-pause">

                    ${
                        spotifyIsPlaying
                            ? "❚❚"
                            : "▶"
                    }

                </button>

                <button
                    onclick="spotifyNext()">
                    ⏭
                </button>

            </div>
        `;

    } catch (error) {

        console.error(
            "Spotify playback error:",
            error
        );
    }
}


// ====================
// Spotify Local Progress
// ====================

setInterval(() => {

    if (
        !spotifyIsPlaying ||
        !spotifyDuration
    ) {
        return;
    }


    spotifyProgress += 1000;


    if (
        spotifyProgress >=
        spotifyDuration
    ) {

        spotifyProgress =
            spotifyDuration;

        return;
    }


    const progressBar =
        document.querySelector(
            ".spotify-progress-bar"
        );

    const currentTime =
        document.querySelector(
            ".spotify-time span:first-child"
        );


    if (progressBar) {

        progressBar.style.width =
            `${(
                spotifyProgress /
                spotifyDuration
            ) * 100}%`;
    }


    if (currentTime) {

        currentTime.textContent =
            formatSpotifyTime(
                spotifyProgress
            );
    }

}, 1000);


// ====================
// Spotify Play / Pause
// ====================

async function spotifyPlayPause() {
    try {
        const endpoint =
            spotifyIsPlaying
                ? "pause"
                : "play";

        const response =
            await fetch(
                `http://localhost:3000/api/spotify/${endpoint}`,
                {
                    method: "PUT"
                }
            );

        if (!response.ok) {
            throw new Error(
                `Spotify ${endpoint} failed: ${response.status}`
            );
        }

        // Refresh once Spotify has accepted the command
        await loadSpotifyNowPlaying();

    } catch (error) {
        console.error(
            "Spotify play/pause error:",
            error
        );
    }
}

// ====================
// Spotify Next
// ====================

async function spotifyNext() {

    try {

        const response =
            await fetch(
                "http://localhost:3000/api/spotify/next",
                {
                    method: "POST"
                }
            );


        if (!response.ok) {

            throw new Error(
                `Spotify next failed: ${response.status}`
            );
        }


        await loadSpotifyNowPlaying();

    } catch (error) {

        console.error(
            "Spotify next error:",
            error
        );
    }
}


// ====================
// Spotify Previous
// ====================

async function spotifyPrevious() {

    try {

        const response =
            await fetch(
                "http://localhost:3000/api/spotify/previous",
                {
                    method: "POST"
                }
            );


        if (!response.ok) {

            throw new Error(
                `Spotify previous failed: ${response.status}`
            );
        }


        await loadSpotifyNowPlaying();

    } catch (error) {

        console.error(
            "Spotify previous error:",
            error
        );
    }
}


// ====================
// Spotify Time Formatting
// ====================

function formatSpotifyTime(milliseconds) {

    const totalSeconds =
        Math.floor(
            milliseconds / 1000
        );


    const minutes =
        Math.floor(
            totalSeconds / 60
        );


    const seconds =
        totalSeconds % 60;


    return `${minutes}:${seconds
        .toString()
        .padStart(2, "0")}`;
}


// ====================
// Start Spotify
// ====================

loadSpotifyNowPlaying();

setInterval(
    loadSpotifyNowPlaying,
    1000
);


console.log(
    "Dash Spotify JS loaded"
);