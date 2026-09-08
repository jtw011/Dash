const http = require("http");
const si = require("systeminformation");
const { google } = require("googleapis");

const {
    getAuthUrl,
    handleCallback,
    loadSavedToken,
    getAuthClient
} = require("./google-auth");

const {
    getAuthUrl: getSpotifyAuthUrl,
    handleCallback: handleSpotifyCallback,
    getAccessToken
} = require("./spotify-auth");

const PORT = 3000;

const server = http.createServer(async (req, res) => {

    // Allow requests from the Dash frontend
    res.setHeader("Access-Control-Allow-Origin", "*");

        // Start Google authorization
    if (req.url === "/auth/google") {

        const authUrl = getAuthUrl();

        res.writeHead(302, {
            Location: authUrl
        });

        res.end();

        return;
    }

    // Start Spotify authorization
if (req.url === "/auth/spotify") {

    const authUrl = getSpotifyAuthUrl();

    res.writeHead(302, {
        Location: authUrl
    });

    res.end();

    return;
}


    // Google OAuth callback
    if (req.url.startsWith("/oauth2callback")) {

        const url =
            new URL(
                req.url,
                `http://localhost:${PORT}`
            );

        const code =
            url.searchParams.get("code");

        if (!code) {

            res.writeHead(400, {
                "Content-Type": "text/plain"
            });

            res.end("Missing Google authorization code.");

            return;
        }

        try {

            await handleCallback(code);

            res.writeHead(302, {
                Location:
                    "http://127.0.0.1:5500/Frontend/dash.html"
            });

            res.end();

        } catch (error) {

            console.error(
                "Google authorization error:",
                error
            );

            res.writeHead(500, {
                "Content-Type": "text/plain"
            });

            res.end(
                "Google authorization failed."
            );
        }

        return;
    }

    // Spotify OAuth callback
if (req.url.startsWith("/spotify-callback")) {

    const url =
        new URL(
            req.url,
            `http://localhost:${PORT}`
        );

    const code =
        url.searchParams.get("code");

    const state =
        url.searchParams.get("state");

    if (!code) {

        res.writeHead(400, {
            "Content-Type": "text/plain"
        });

        res.end("Missing Spotify authorization code.");

        return;
    }

    try {

        await handleSpotifyCallback(code, state);

        res.writeHead(302, {
            Location:
                "http://127.0.0.1:5500/Frontend/dash.html"
        });

        res.end();

    } catch (error) {

        console.error(
            "Spotify authorization error:",
            error
        );

        res.writeHead(500, {
            "Content-Type": "text/plain"
        });

        res.end(
            "Spotify authorization failed."
        );
    }

    return;
}

    // Google Calendar
    if (req.url.startsWith("/api/calendar")) {

        try {
            const url = new URL(
                req.url,
                `http://localhost:${PORT}`
            );

            const start = url.searchParams.get("start");
            const end = url.searchParams.get("end");

            const auth = getAuthClient();

            const calendar = google.calendar({
                version: "v3",
                auth
            });

            const response = await calendar.events.list({
                calendarId: "primary",
                timeMin: start,
                timeMax: end,
                showDeleted: false,
                singleEvents: true,
                orderBy: "startTime"
            });

            res.writeHead(200, {
                "Content-Type": "application/json"
            });

            res.end(
                JSON.stringify(response.data.items || [])
            );

        } catch (error) {

            console.error("Calendar API error:", error);

            res.writeHead(500, {
                "Content-Type": "application/json"
            });

            res.end(JSON.stringify({
                error: "Unable to load Google Calendar"
            }));
        }

        return;
    }


    // Google Tasks
    if (req.url === "/api/tasks") {

        try {
            const auth = getAuthClient();

            const tasks = google.tasks({
                version: "v1",
                auth
            });

            const listsResponse =
                await tasks.tasklists.list({
                    maxResults: 100
                });

            const taskLists =
                listsResponse.data.items || [];

            if (taskLists.length === 0) {

                res.writeHead(200, {
                    "Content-Type": "application/json"
                });

                res.end("[]");

                return;
            }

            const taskListId = taskLists[0].id;

            const tasksResponse =
                await tasks.tasks.list({
                    tasklist: taskListId,
                    maxResults: 100,
                    showCompleted: false,
                    showHidden: false
                });

            res.writeHead(200, {
                "Content-Type": "application/json"
            });

            res.end(
                JSON.stringify(
                    tasksResponse.data.items || []
                )
            );

        } catch (error) {

            console.error("Tasks API error:", error);

            res.writeHead(500, {
                "Content-Type": "application/json"
            });

            res.end(JSON.stringify({
                error: "Unable to load Google Tasks"
            }));
        }

        return;
    }

// Spotify Now Playing
if (req.url === "/api/spotify/now-playing") {

    try {

        const accessToken =
            await getAccessToken();

        const response = await fetch(
            "https://api.spotify.com/v1/me/player/currently-playing",
            {
                headers: {
                    Authorization:
                        `Bearer ${accessToken}`
                }
            }
        );

        // Nothing is currently playing
        if (response.status === 204) {

            res.writeHead(200, {
                "Content-Type": "application/json"
            });

            res.end(
                JSON.stringify({
                    playing: false
                })
            );

            return;
        }

        if (!response.ok) {
            throw new Error(
                `Spotify API error: ${response.status}`
            );
        }

        const data =
            await response.json();

        const track =
            data.item;

        const spotifyData = {
            playing: data.is_playing,
            title: track?.name || "",
            artist:
                track?.artists
                    ?.map(artist => artist.name)
                    .join(", ") || "",
            album:
                track?.album?.name || "",
            albumArt:
                track?.album?.images?.[0]?.url || "",
            progress:
                data.progress_ms || 0,
            duration:
                track?.duration_ms || 0
        };

        res.writeHead(200, {
            "Content-Type": "application/json"
        });

        res.end(
            JSON.stringify(spotifyData)
        );

    } catch (error) {

        console.error(
            "Spotify Now Playing error:",
            error
        );

        res.writeHead(500, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify({
            error: "Unable to get Spotify playback"
        }));
    }

    return;
}

// Spotify Play / Pause
if (
    req.url === "/api/spotify/play" ||
    req.url === "/api/spotify/pause"
) {

    try {

        const accessToken =
            await getAccessToken();

        const action =
            req.url.endsWith("/play")
                ? "play"
                : "pause";

        const response =
            await fetch(
                `https://api.spotify.com/v1/me/player/${action}`,
                {
                    method: "PUT",
                    headers: {
                        Authorization:
                            `Bearer ${accessToken}`
                    }
                }
            );

        if (!response.ok) {

            const errorText =
                await response.text();

            throw new Error(
                `Spotify ${action} failed: ${response.status} ${errorText}`
            );
        }

        res.writeHead(200, {
            "Content-Type": "application/json"
        });

        res.end(
            JSON.stringify({
                success: true
            })
        );

    } catch (error) {

        console.error(
            "Spotify play/pause error:",
            error
        );

        res.writeHead(500, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify({
            error: "Unable to control Spotify playback"
        }));
    }

    return;
}

    // System stats endpoint
    if (req.url === "/api/system-stats") {

        try {
            const cpu = await si.currentLoad();
            const memory = await si.mem();
            const disk = await si.fsSize();

    const stats = {
        cpu: Math.round(cpu.currentLoad),
        memory: Math.round((memory.used / memory.total) * 100),
        storage: Math.round(disk[0].used / 1024 / 1024 / 1024),
        storageTotal: Math.round(disk[0].size / 1024 / 1024 / 1024)
};

            res.writeHead(200, {
                "Content-Type": "application/json"
            });

            res.end(JSON.stringify(stats));

        } catch (error) {
            console.error(error);

            res.writeHead(500, {
                "Content-Type": "application/json"
            });

            res.end(JSON.stringify({
                error: "Unable to get system stats"
            }));
        }

        return;
    }

    res.writeHead(404, {
        "Content-Type": "text/plain"
    });

    res.end("Not Found");
});
loadSavedToken();

server.listen(PORT, () => {
    console.log(`Dash backend running at http://localhost:${PORT}`);
});
