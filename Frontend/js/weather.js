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
