const SPOTIFY_CLIENT_ID = "3a5780e56b5a4bbd96472d2a54bfe9d9";

const SPOTIFY_REDIRECT_URI =
    "http://127.0.0.1:5500/Frontend/dash.html";

const SPOTIFY_SCOPES = [
    "user-read-currently-playing",
    "user-read-playback-state",
    "user-modify-playback-state"
];

// ====================
// Spotify
// ====================

let spotifyProgress = 0;
let spotifyDuration = 0;
let spotifyIsPlaying = false;


// ====================
// Spotify Authentication
// ====================

function generateRandomString(length) {

    const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    let result = "";

    for (let i = 0; i < length; i++) {

        result += characters.charAt(
            Math.floor(
                Math.random() * characters.length
            )
        );
    }

    return result;
}


async function generateCodeChallenge(verifier) {

    const data =
        new TextEncoder().encode(verifier);

    const digest =
        await crypto.subtle.digest(
            "SHA-256",
            data
        );

    return btoa(
        String.fromCharCode(
            ...new Uint8Array(digest)
        )
    )
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}


async function loginToSpotify() {

    const verifier =
        generateRandomString(64);

    const challenge =
        await generateCodeChallenge(verifier);

    localStorage.setItem(
        "spotify_verifier",
        verifier
    );

    const params =
        new URLSearchParams({

            client_id:
                SPOTIFY_CLIENT_ID,

            response_type:
                "code",

            redirect_uri:
                SPOTIFY_REDIRECT_URI,

            code_challenge_method:
                "S256",

            code_challenge:
                challenge,

            scope:
                SPOTIFY_SCOPES.join(" ")
        });

    window.location.href =
        `https://accounts.spotify.com/authorize?${params.toString()}`;
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
// Spotify Token Exchange
// ====================

async function handleSpotifyCallback() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const code =
        params.get("code");

    if (!code) {
        return;
    }

    const verifier =
        localStorage.getItem(
            "spotify_verifier"
        );

    if (!verifier) {

        console.error(
            "Spotify verifier not found."
        );

        return;
    }

    try {

        const response =
            await fetch(
                "https://accounts.spotify.com/api/token",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/x-www-form-urlencoded"
                    },

                    body: new URLSearchParams({

                        client_id:
                            SPOTIFY_CLIENT_ID,

                        grant_type:
                            "authorization_code",

                        code:
                            code,

                        redirect_uri:
                            SPOTIFY_REDIRECT_URI,

                        code_verifier:
                            verifier
                    })
                }
            );

        if (!response.ok) {

            throw new Error(
                `Spotify token request failed: ${response.status}`
            );
        }

        const data =
            await response.json();

        localStorage.setItem(
            "spotify_access_token",
            data.access_token
        );

        if (data.refresh_token) {

            localStorage.setItem(
                "spotify_refresh_token",
                data.refresh_token
            );
        }

        localStorage.removeItem(
            "spotify_verifier"
        );

        // Remove ?code=... from URL
        window.history.replaceState(
            {},
            document.title,
            SPOTIFY_REDIRECT_URI
        );

        console.log(
            "Spotify authentication successful!"
        );

        await loadSpotifyNowPlaying();

    } catch (error) {

        console.error(
            "Spotify authentication error:",
            error
        );
    }
}


// ====================
// Spotify Now Playing
// ====================

async function loadSpotifyNowPlaying() {

    const token =
        localStorage.getItem(
            "spotify_access_token"
        );

    if (!token) {

        console.log(
            "No Spotify access token."
        );

        return;
    }

    try {

        const response =
            await fetch(
                "https://api.spotify.com/v1/me/player/currently-playing",
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

        // Nothing playing
        if (response.status === 204) {

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

        if (!response.ok) {

            throw new Error(
                `Spotify API request failed: ${response.status}`
            );
        }

        const data =
            await response.json();

        if (!data.item) {

            spotifyIsPlaying = false;
            spotifyProgress = 0;
            spotifyDuration = 0;

            return;
        }

        const track =
            data.item;

        // Sync local progress with Spotify
        spotifyProgress =
            data.progress_ms || 0;

        spotifyDuration =
            track.duration_ms || 0;

        spotifyIsPlaying =
            data.is_playing;

        const progressPercent =
            spotifyDuration > 0
                ? (spotifyProgress / spotifyDuration) * 100
                : 0;

        const albumArt =
            track.album?.images?.[0]?.url || "";

        const artists =
            track.artists
                .map(artist => artist.name)
                .join(", ");

        const spotifyElement =
            document.getElementById(
                "spotify-content"
            );

        if (!spotifyElement) return;

        spotifyElement.innerHTML = `

            <img
                src="${albumArt}"
                class="spotify-album-art"
            >

            <div class="spotify-track">

                <strong>
                    ${track.name}
                </strong>

                <span>
                    ${artists}
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

    const token =
        localStorage.getItem(
            "spotify_access_token"
        );

    if (!token) return;

    try {

        const endpoint =
            spotifyIsPlaying
                ? "pause"
                : "play";

        const response =
            await fetch(
                `https://api.spotify.com/v1/me/player/${endpoint}`,
                {
                    method: "PUT",

                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

        if (!response.ok) {

            throw new Error(
                `Spotify ${endpoint} failed: ${response.status}`
            );
        }

        spotifyIsPlaying =
            !spotifyIsPlaying;

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

    const token =
        localStorage.getItem(
            "spotify_access_token"
        );

    if (!token) return;

    try {

        const response =
            await fetch(
                "https://api.spotify.com/v1/me/player/next",
                {
                    method: "POST",

                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
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

    const token =
        localStorage.getItem(
            "spotify_access_token"
        );

    if (!token) return;

    try {

        const response =
            await fetch(
                "https://api.spotify.com/v1/me/player/previous",
                {
                    method: "POST",

                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
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

handleSpotifyCallback();

setInterval(
    loadSpotifyNowPlaying,
    5000
);

console.log(
    "Dash Calendar JS loaded"
);