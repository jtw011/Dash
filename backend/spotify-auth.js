const fs = require("fs");
const path = require("path");

require("dotenv").config({
    path: path.join(__dirname, "..", ".env")
});

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

const REDIRECT_URI =
    "http://127.0.0.1:3000/spotify-callback";

const SCOPES = [
    "user-read-currently-playing",
    "user-read-playback-state",
    "user-modify-playback-state"
];

const TOKEN_PATH =
    path.join(__dirname, "spotify-token.json");

let spotifyState = null;


// Create Spotify login URL
function getAuthUrl() {

    spotifyState =
        Math.random().toString(36).substring(2);

    const params = new URLSearchParams({
        client_id: CLIENT_ID,
        response_type: "code",
        redirect_uri: REDIRECT_URI,
        scope: SCOPES.join(" "),
        state: spotifyState
    });

    return (
        "https://accounts.spotify.com/authorize?" +
        params.toString()
    );
}


// Handle Spotify callback
async function handleCallback(code, state) {

    if (!state || state !== spotifyState) {
        throw new Error("Invalid Spotify authorization state.");
    }

    const credentials =
        Buffer.from(
            `${CLIENT_ID}:${CLIENT_SECRET}`
        ).toString("base64");

    const response = await fetch(
        "https://accounts.spotify.com/api/token",
        {
            method: "POST",

            headers: {
                "Content-Type":
                    "application/x-www-form-urlencoded",

                "Authorization":
                    `Basic ${credentials}`
            },

            body: new URLSearchParams({
                grant_type: "authorization_code",
                code: code,
                redirect_uri: REDIRECT_URI
            })
        }
    );

    if (!response.ok) {

        const errorText =
            await response.text();

        throw new Error(
            `Spotify token request failed: ${response.status} ${errorText}`
        );
    }

    const tokens =
        await response.json();

    tokens.expires_at =
        Date.now() + (tokens.expires_in * 1000);

    fs.writeFileSync(
        TOKEN_PATH,
        JSON.stringify(tokens, null, 2)
    );

    spotifyState = null;

    console.log("Spotify authorization saved.");

    return tokens;
}


// Load saved token
function loadSavedToken() {

    if (!fs.existsSync(TOKEN_PATH)) {
        return null;
    }

    try {

        return JSON.parse(
            fs.readFileSync(
                TOKEN_PATH,
                "utf8"
            )
        );

    } catch (error) {

        console.error(
            "Unable to load Spotify token:",
            error
        );

        return null;
    }
}


// Get a valid access token
async function getAccessToken() {

    let tokens = loadSavedToken();

    if (!tokens) {
        throw new Error("Spotify is not connected.");
    }

    // Still valid
    if (
        tokens.expires_at &&
        Date.now() < tokens.expires_at - 60000
    ) {
        return tokens.access_token;
    }

    console.log("Refreshing Spotify access token...");

    const credentials =
        Buffer.from(
            `${CLIENT_ID}:${CLIENT_SECRET}`
        ).toString("base64");

    const response = await fetch(
        "https://accounts.spotify.com/api/token",
        {
            method: "POST",

            headers: {
                "Content-Type":
                    "application/x-www-form-urlencoded",

                "Authorization":
                    `Basic ${credentials}`
            },

            body: new URLSearchParams({
                grant_type: "refresh_token",
                refresh_token: tokens.refresh_token
            })
        }
    );

    if (!response.ok) {

        const errorText =
            await response.text();

        throw new Error(
            `Spotify token refresh failed: ${response.status} ${errorText}`
        );
    }

    const refreshed =
        await response.json();

    tokens.access_token =
        refreshed.access_token;

    tokens.expires_in =
        refreshed.expires_in;

    tokens.expires_at =
        Date.now() + (refreshed.expires_in * 1000);

    // Spotify may not return a new refresh token.
    if (refreshed.refresh_token) {
        tokens.refresh_token =
            refreshed.refresh_token;
    }

    fs.writeFileSync(
        TOKEN_PATH,
        JSON.stringify(tokens, null, 2)
    );

    console.log("Spotify access token refreshed.");

    return tokens.access_token;
}


module.exports = {
    getAuthUrl,
    handleCallback,
    loadSavedToken,
    getAccessToken
};