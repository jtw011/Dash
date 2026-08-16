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
- Displays up to three events per day
- Shows a "+X more" indicator for additional events

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
- Spotify OAuth authentication using PKCE

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

~~~text
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
~~~

## Getting Started

### Requirements

- Node.js
- A modern web browser
- Google API credentials for Calendar and Tasks
- Spotify Developer credentials for Spotify features

### Installation

Clone the repository and install the dependencies:

~~~bash
npm install
~~~

### Running Dash

Start the backend server:

~~~bash
node Backend/server.js
~~~

Then open `Frontend/dash.html` using a local development server such as VS Code Live Server.

## Authentication

Dash uses OAuth authentication for services that require access to personal data.

### Google

Google authentication is used for:

- Google Calendar
- Google Tasks

### Spotify

Spotify authentication is used for:

- Currently playing information
- Playback controls

Spotify uses OAuth with PKCE for authentication.

## Roadmap

- [x] Core dashboard
- [x] Clock and date
- [x] Weather
- [x] Google Calendar
- [x] Google Tasks
- [x] System statistics
- [x] GitHub integration
- [x] Spotify integration
- [ ] Modern/tech-focused UI redesign
- [ ] Improved dashboard customization
- [ ] Additional widgets
- [ ] AI assistant
- [ ] Voice interaction
- [ ] Local AI integration
- [ ] Smart home integrations

## Version

**v1.0.0**

Dash v1.0.0 is the first functional release of the project and establishes the core dashboard and its initial integrations.

## License

ISC
