const CLIENT_ID = '805508025196-svlk2lq57g80p2u11rtdm5grp9mo2nem.apps.googleusercontent.com';

const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly',     'https://www.googleapis.com/auth/tasks.readonly'
].join(' '); ;

let tokenClient;
let gapiInited = false;
let gisInited = false;

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

        const dayName = document.createElement("div");
        dayName.className = "day-name";
        dayName.textContent = date.toLocaleDateString([], {
            weekday: "short"
        });

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

        dayEvents.forEach(event => {
            const eventElement = document.createElement("div");
            eventElement.className = "event";

            const title = document.createElement("div");
            title.className = "event-title";
            title.textContent = event.summary || "Untitled";

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

        week.appendChild(day);
    }

    calendar.appendChild(week);
}

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

        // Use the first task list for now
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

console.log("Dash Calendar JS loaded");
