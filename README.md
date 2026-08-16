# Dash

> AI-assisted all-in-one home dashboard

Dash is a personal home dashboard designed to bring useful information into one place. It currently combines calendar, tasks, weather, system information, GitHub activity, and Spotify playback into a single dashboard.

The long-term goal is to turn Dash into a customizable personal assistant and smart home display.

## Current Features

### Clock & Date
- Displays the current time
- Displays the current date

### Weather
- Current temperature
- Weather conditions
- Daily high and low
- Weather icons
- Powered by Open-Meteo

### Google Calendar
- Displays the current week's events
- Highlights the current day
- Shows event times
- Limits crowded days to the most important events and displays a "+X more" indicator

### Google Tasks
- Displays tasks from Google Tasks
- Hides completed tasks

### System Statistics
- CPU usage
- Memory usage
- Storage usage
- Updates automatically
- Powered by the `systeminformation` Node.js package

### GitHub
- Displays public repository count
- Shows recently pushed repositories
- Displays recent commit messages and dates

### Spotify
- Displays currently playing song
- Displays artist
- Displays album artwork
- Live playback progress
- Current and total track time
- Playing/paused status
- Previous, play/pause, and next controls
- Spotify OAuth authentication

## Tech Stack

- HTML
- CSS
- JavaScript
- Node.js
- Google Calendar API
- Google Tasks API
- Spotify Web API
- Open-Meteo API
- GitHub REST API
- `systeminformation`

## Project Structure

```text
Dash/
├── Frontend/
│   ├── dash.html
│   ├── script.js
│   └── style.css
│
├── Backend/
│   └── server.js
│
├── package.json
└── README.md
