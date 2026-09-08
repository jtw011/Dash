let currentWeekOffset = 0;


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

        monday.setDate(
            monday.getDate() +
            difference +
            currentWeekOffset * 7
        );

        monday.setHours(0, 0, 0, 0);

        // Find the following Monday
        const sunday = new Date(monday);
        sunday.setDate(sunday.getDate() + 7);
        sunday.setHours(0, 0, 0, 0);

        // Ask the Dash backend for Calendar events
        const response = await fetch(
            `http://localhost:3000/api/calendar?start=${encodeURIComponent(monday.toISOString())}&end=${encodeURIComponent(sunday.toISOString())}`
        );

        if (!response.ok) {
            throw new Error("Calendar request failed");
        }

        const events = await response.json();

        console.log("Calendar events from backend:", events);

        displayCalendar(events, monday);

    } catch (error) {
        console.error("Calendar error:", error);
    }
}

function updateCalendarTitle(monday) {

    const title =
        document.getElementById(
            "calendar-title"
        );

    if (!title) return;

    if (currentWeekOffset === 0) {

        title.textContent = "This Week";

        return;

    }

    const sunday = new Date(monday);

    sunday.setDate(
        monday.getDate() + 6
    );

    const startMonth =
        monday.toLocaleDateString(
            undefined,
            {
                month: "short"
            }
        );

    const endMonth =
        sunday.toLocaleDateString(
            undefined,
            {
                month: "short"
            }
        );

    if (startMonth === endMonth) {

        title.textContent =
            `${startMonth} ${monday.getDate()} – ${sunday.getDate()}`;

    } else {

        title.textContent =
            `${startMonth} ${monday.getDate()} – ` +
            `${endMonth} ${sunday.getDate()}`;

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

const prevWeekButton =
    document.getElementById(
        "prev-week"
    );

const nextWeekButton =
    document.getElementById(
        "next-week"
    );


if (prevWeekButton) {
    prevWeekButton.addEventListener(
        "click",
        () => {
            currentWeekOffset--;
            loadCalendar();
        }
    );
}

if (nextWeekButton) {
    nextWeekButton.addEventListener(
        "click",
        () => {
            currentWeekOffset++;
            loadCalendar();
        }
    );
}

const todayButton =
    document.getElementById("today-button");
if (todayButton) {
    todayButton.addEventListener(
        "click",
        () => {
            currentWeekOffset = 0;
            loadCalendar();
        }
    );
}

// ====================
// Google Tasks
// ====================

async function loadTaskLists() {
    console.log("Loading Google Tasks...");

    await loadTasks();
}

async function loadTasks() {
    try {
        console.log("Requesting Google Tasks from backend...");

        const response = await fetch(
            "http://localhost:3000/api/tasks"
        );

        if (!response.ok) {
            throw new Error("Tasks request failed");
        }

        const tasks = await response.json();

        console.log("Tasks from backend:", tasks);

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
// Automatically load Google data from the Dash backend
window.addEventListener("load", () => {
    loadCalendar();
    loadTaskLists();
});