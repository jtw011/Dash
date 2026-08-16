const CLIENT_ID = '805508025196-svlk2lq57g80p2u11rtdm5grp9mo2nem.apps.googleusercontent.com';

const SPOTIFY_CLIENT_ID = "3a5780e56b5a4bbd96472d2a54bfe9d9";
const SPOTIFY_REDIRECT_URI = "http://127.0.0.1:5500/Frontend/dash.html";

const SPOTIFY_SCOPES = [
    "user-read-currently-playing",
    "user-read-playback-state",
    "user-modify-playback-state"
];

const SCOPES = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/tasks.readonly'
].join(' ');

let tokenClient;
let gapiInited = false;
let gisInited = false;


// ====================
// Google API
// ====================

function gapiLoaded() {
    gapi.load('client', initializeGapiClient);
}

async function initializeGapiClient() {
    await gapi.client.init({
        discoveryDocs: [
            'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
            'https://tasks.googleapis.com/$discovery/rest?version=v1'
        ]
    });

    gapiInited = true;
}

function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: ''
    });

    gisInited = true;
}


// ====================
// Google Authentication
// ====================

async function handleAuthClick() {
    tokenClient.callback = async (response) => {
        if (response.error !== undefined) {
            throw response;
        }

        console.log("Google authentication successful");

        await loadCalendar();

        console.log("Loading Google Tasks...");

        await loadTaskLists();

        console.log("Google Tasks finished");
    };

    tokenClient.requestAccessToken({
        prompt: 'consent'
    });
}


// ====================
// Calendar
// ====================

async function loadCalendar() {
    try {
        const now = new Date();

        // Find Monday of the current week
        const monday = new Date(now);
        const day = monday.getDay();

        const difference = day === 0 ? -6 : 1 - day;

        monday.setDate(monday.getDate() + difference);
        monday.setHours(0, 0, 0, 0);

        // Find Sunday
        const sunday = new Date(monday);
        sunday.setDate(sunday.getDate() + 7);
        sunday.setHours(0, 0, 0, 0);

        const response = await gapi.client.calendar.events.list({
            calendarId: 'primary',
            timeMin: monday.toISOString(),
            timeMax: sunday.toISOString(),
            showDeleted: false,
            singleEvents: true,
            orderBy: 'startTime'
        });

        const events = response.result.items || [];

        console.log("This week's events:", events);

        displayCalendar(events, monday);

    } catch (error) {
        console.error("Calendar error:", error);
    }
}


function displayCalendar(events, monday) {
    const calendar = document.getElementById("calendar");

    if (!calendar) return;

    calendar.innerHTML = "";

    const week = document.createElement("div");
    week.className = "calendar-week";

    const today = new Date();

    for (let i = 0; i < 7; i++) {

        const date = new Date(monday);
        date.setDate(monday.getDate() + i);

        const day = document.createElement("div");
        day.className = "calendar-day";

        // Highlight today
        if (
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
        ) {
            day.classList.add("today");
        }

        // Day name
        const dayName = document.createElement("div");
        dayName.className = "day-name";

        dayName.textContent = date.toLocaleDateString([], {
            weekday: "short"
        });

        // Day number
        const dayNumber = document.createElement("div");
        dayNumber.className = "day-number";

        dayNumber.textContent = date.getDate();

        day.appendChild(dayName);
        day.appendChild(dayNumber);

        // Find events for this day
        const dayEvents = events.filter(event => {

            const eventDate = new Date(
                event.start.dateTime || event.start.date
            );

            return (
                eventDate.getDate() === date.getDate() &&
                eventDate.getMonth() === date.getMonth() &&
                eventDate.getFullYear() === date.getFullYear()
            );
        });

        // Maximum number of events displayed
        const maxEvents = 3;

        const visibleEvents = dayEvents.slice(0, maxEvents);

        // Display visible events
        visibleEvents.forEach(event => {

            const eventElement = document.createElement("div");
            eventElement.className = "event";

            // Event title
            const title = document.createElement("div");
            title.className = "event-title";

            title.textContent = event.summary || "Untitled";

            // Event time
            const time = document.createElement("div");
            time.className = "event-time";

            if (event.start.dateTime) {

                time.textContent = new Date(
                    event.start.dateTime
                ).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit"
                });

            } else {

                time.textContent = "All day";
            }

            eventElement.appendChild(title);
            eventElement.appendChild(time);

            day.appendChild(eventElement);
        });

        // Show "+X more"
        if (dayEvents.length > maxEvents) {

            const moreElement = document.createElement("div");
            moreElement.className = "more-events";

            const remaining = dayEvents.length - maxEvents;

            moreElement.textContent = `+${remaining} more`;

            day.appendChild(moreElement);
        }

        // Add day to week
        week.appendChild(day);
    }

    calendar.appendChild(week);
}


// ====================
// Google Tasks
// ====================

async function loadTaskLists() {

    try {

        console.log("Requesting Google Task lists...");

        const response = await gapi.client.tasks.tasklists.list({
            maxResults: 100
        });

        const taskLists = response.result.items || [];

        console.log("Task lists:", taskLists);

        if (taskLists.length === 0) {

            console.log("No task lists found.");

            return;
        }

        // Use first task list for now
        const taskListId = taskLists[0].id;

        await loadTasks(taskListId);

    } catch (error) {

        console.error("Tasks error:", error);

    }
}


async function loadTasks(taskListId) {

    try {

        console.log("Requesting tasks...");

        const response = await gapi.client.tasks.tasks.list({
            tasklist: taskListId,
            maxResults: 100,
            showCompleted: false,
            showHidden: false
        });

        const tasks = response.result.items || [];

        console.log("Tasks:", tasks);

        displayTasks(tasks);

    } catch (error) {

        console.error("Task loading error:", error);

    }
}


function displayTasks(tasks) {

    const taskContainer = document.getElementById("tasks");

    if (!taskContainer) return;

    taskContainer.innerHTML = "";

    if (tasks.length === 0) {

        taskContainer.innerHTML = "<p>No tasks!</p>";

        return;
    }

    tasks.forEach(task => {

        const taskElement = document.createElement("div");

        taskElement.className = "task";

        taskElement.textContent = "☐ " + task.title;

        taskContainer.appendChild(taskElement);

    });
}


// ====================
// Weather
// ====================

async function getWeather() {

    try {

        const latitude = 40.5219;
        const longitude = -111.89;

        const url =
            `https://api.open-meteo.com/v1/forecast?` +
            `latitude=${latitude}` +
            `&longitude=${longitude}` +
            `&current=temperature_2m,apparent_temperature,weather_code` +
            `&daily=temperature_2m_max,temperature_2m_min` +
            `&temperature_unit=fahrenheit` +
            `&timezone=auto`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Weather request failed: ${response.status}`);
        }

        const data = await response.json();

        const temperature = data.current.temperature_2m;

        const high = data.daily.temperature_2m_max[0];
        const low = data.daily.temperature_2m_min[0];

        const weatherCode = data.current.weather_code;

        let weatherDescription;
        let weatherIcon;

        if (weatherCode === 0) {

            weatherDescription = "Clear Sky";
            weatherIcon = "☀️";

        } else if (weatherCode <= 3) {

            weatherDescription = "Cloudy";
            weatherIcon = "☁️";

        } else if (weatherCode <= 48) {

            weatherDescription = "Foggy";
            weatherIcon = "🌫️";

        } else if (weatherCode <= 67) {

            weatherDescription = "Rain";
            weatherIcon = "🌧️";

        } else if (weatherCode <= 77) {

            weatherDescription = "Snow";
            weatherIcon = "❄️";

        } else if (weatherCode <= 82) {

            weatherDescription = "Rain Showers";
            weatherIcon = "🌦️";

        } else {

            weatherDescription = "Thunderstorm";
            weatherIcon = "⛈️";
        }

        const weatherElement = document.getElementById("weather");

        if (!weatherElement) return;

        weatherElement.innerHTML = `
            <div class="weather-icon">${weatherIcon}</div>
            <div class="weather-temperature">
                ${Math.round(temperature)}°
            </div>
            <div class="weather-description">
                ${weatherDescription}
            </div>
            <div class="weather-high-low">
                H: ${Math.round(high)}° &nbsp;&nbsp;
                L: ${Math.round(low)}°
            </div>
        `;

    } catch (error) {

        console.error("Weather error:", error);
    }
}

getWeather();


// ====================
// System Stats
// ====================

async function loadSystemStats() {

    try {

        const response =
            await fetch("http://localhost:3000/api/system-stats");

        if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
        }

        const stats = await response.json();

        console.log("System stats:", stats);

        const statsElement =
            document.getElementById("system-stats");

        if (!statsElement) return;

        statsElement.innerHTML = `
            <div class="stat">

                <div class="stat-header">
                    <span>CPU</span>
                    <strong>${stats.cpu}%</strong>
                </div>

                <div class="stat-bar">
                    <div
                        class="stat-fill"
                        style="width: ${stats.cpu}%">
                    </div>
                </div>

            </div>

            <div class="stat">

                <div class="stat-header">
                    <span>Memory</span>
                    <strong>${stats.memory}%</strong>
                </div>

                <div class="stat-bar">
                    <div
                        class="stat-fill"
                        style="width: ${stats.memory}%">
                    </div>
                </div>

            </div>

            <div class="stat">

                <div class="stat-header">
                    <span>Storage</span>

                    <strong>
                        ${stats.storage} GB /
                        ${stats.storageTotal} GB
                    </strong>
                </div>

                <div class="stat-bar">
                    <div
                        class="stat-fill"
                        style="
                            width:
                            ${(stats.storage / stats.storageTotal) * 100}%;
                        ">
                    </div>
                </div>

            </div>
        `;

    } catch (error) {

        console.error("System stats error:", error);

        const statsElement =
            document.getElementById("system-stats");

        if (statsElement) {

            statsElement.innerHTML = `
                <p>System stats unavailable</p>
            `;
        }
    }
}

loadSystemStats();

setInterval(loadSystemStats, 5000);


// ====================
// GitHub
// ====================

async function loadGitHub() {

    const username = "jtw011";

    try {

        // Get profile
        const profileResponse =
            await fetch(
                `https://api.github.com/users/${username}`
            );

        if (!profileResponse.ok) {
            throw new Error(
                "GitHub profile request failed"
            );
        }

        const profile =
            await profileResponse.json();

        // Get recently pushed repositories
        const reposResponse =
            await fetch(
                `https://api.github.com/users/${username}/repos?sort=pushed&direction=desc&per_page=5`
            );

        if (!reposResponse.ok) {
            throw new Error(
                "GitHub repositories request failed"
            );
        }

        const repos =
            await reposResponse.json();

        // Get latest commit for each repository
        const commits = await Promise.all(

            repos.map(async repo => {

                const commitResponse =
                    await fetch(
                        `https://api.github.com/repos/${username}/${repo.name}/commits?per_page=1`
                    );

                if (!commitResponse.ok) {
                    return null;
                }

                const commitData =
                    await commitResponse.json();

                if (!commitData.length) {
                    return null;
                }

                return {
                    repo: repo.name,
                    message:
                        commitData[0].commit.message
                            .split("\n")[0],
                    date:
                        commitData[0].commit.author.date
                };
            })
        );

        const validCommits =
            commits.filter(
                commit => commit !== null
            );

        const githubElement =
            document.getElementById("github-content");

        if (!githubElement) return;

        githubElement.innerHTML = `
            <div class="github-layout">

                <div class="github-stat">

                    <strong>
                        ${profile.public_repos}
                    </strong>

                    <span>
                        Repositories
                    </span>

                </div>

                <div class="github-repos">

                    <h3>
                        Latest Pushes
                    </h3>

                    ${validCommits
                        .slice(0, 2)
                        .map(commit => `

                            <div class="github-repo">

                                <strong>
                                    ${commit.repo}
                                </strong>

                                <span>
                                    ${commit.message}
                                </span>

                                <small>
                                    ${formatGitHubDate(commit.date)}
                                </small>

                            </div>

                        `)
                        .join("")}

                </div>

            </div>
        `;

    } catch (error) {

        console.error("GitHub error:", error);

        const githubElement =
            document.getElementById("github-content");

        if (githubElement) {

            githubElement.textContent =
                "Unable to load GitHub data.";
        }
    }
}


function formatGitHubDate(dateString) {

    const date =
        new Date(dateString);

    return date.toLocaleDateString(
        undefined,
        {
            month: "short",
            day: "numeric"
        }
    );
}

loadGitHub();


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