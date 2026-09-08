const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

require("dotenv").config({
    path: path.join(__dirname, "..", ".env")
});

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

const REDIRECT_URI =
    "http://localhost:3000/oauth2callback";

const SCOPES = [
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/tasks.readonly"
];

const TOKEN_PATH =
    path.join(__dirname, "google-token.json");

const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);


// ====================
// Google Authorization
// ====================

function getAuthUrl() {

    return oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: SCOPES,
        prompt: "consent"
    });

}


// ====================
// Handle Google Callback
// ====================

async function handleCallback(code) {

    const { tokens } =
        await oauth2Client.getToken(code);

    oauth2Client.setCredentials(tokens);

    fs.writeFileSync(
        TOKEN_PATH,
        JSON.stringify(tokens, null, 2)
    );

    console.log("Google authorization saved.");

    return tokens;
}


// ====================
// Load Saved Token
// ====================

function loadSavedToken() {

    if (!fs.existsSync(TOKEN_PATH)) {
        return false;
    }

    try {

        const tokens =
            JSON.parse(
                fs.readFileSync(
                    TOKEN_PATH,
                    "utf8"
                )
            );

        oauth2Client.setCredentials(tokens);

        console.log("Saved Google authorization loaded.");

        return true;

    } catch (error) {

        console.error(
            "Unable to load Google token:",
            error
        );

        return false;
    }
}


// ====================
// Get Authenticated Client
// ====================

function getAuthClient() {

    return oauth2Client;

}


module.exports = {
    getAuthUrl,
    handleCallback,
    loadSavedToken,
    getAuthClient
};