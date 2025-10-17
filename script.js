document.addEventListener('DOMContentLoaded', () => {
    const apiKey = 'fb66fe43361cd5009ce684e3da688b04';

    // Element selectors
    const appWrapper = document.getElementById('app-wrapper');
    const weatherContainer = document.getElementById('weather-container');
    const loadingIndicator = document.getElementById('loading');
    const searchForm = document.getElementById('search-form');
    const cityInput = document.getElementById('city-input');
    const errorMessage = document.getElementById('error-message');
    const cityNameEl = document.getElementById('city-name');
    const currentDateEl = document.getElementById('current-date');
    const weatherIconEl = document.getElementById('weather-icon'); // Corrected a typo here
    const temperatureEl = document.getElementById('temperature');
    const weatherDescriptionEl = document.getElementById('weather-description');
    const humidityEl = document.getElementById('humidity');
    const windSpeedEl = document.getElementById('wind-speed');
    const pressureEl = document.getElementById('pressure');
    const visibilityEl = document.getElementById('visibility');
    const forecastContainer = document.getElementById('forecast-container');
    const funFactTextEl = document.getElementById('fun-fact-text');
    const funFactContainerEl = document.getElementById('fun-fact-container');

    // This will hold our facts once fetched from the JSON file
    let flowerFacts = [];

    // --- NEW: Function to load facts from JSON ---
    const loadFunFacts = async () => {
        try {
            const response = await fetch('flower-facts.json');
            if (!response.ok) {
                throw new Error('Could not load flower facts.');
            }
            const data = await response.json();
            flowerFacts = data.facts;
        } catch (error) {
            console.error(error);
            funFactTextEl.textContent = 'Could not load a fun fact right now.';
        }
    };

    // --- MODIFIED: Display function now checks if facts are loaded ---
    const displayFunFact = () => {
        if (flowerFacts.length === 0) {
            funFactTextEl.textContent = 'Loading fun fact...';
            return;
        }
        const randomIndex = Math.floor(Math.random() * flowerFacts.length);
        funFactTextEl.textContent = flowerFacts[randomIndex];
    };

    const fetchWeatherData = async (city) => {
        if (!apiKey) {
            errorMessage.textContent = 'API Key is missing.';
            loadingIndicator.classList.add('hidden');
            appWrapper.classList.remove('hidden');
            weatherContainer.classList.add('hidden');
            return;
        }
        
        errorMessage.textContent = '';
        if (appWrapper.classList.contains('hidden')) {
            loadingIndicator.classList.remove('hidden');
        } else {
             weatherContainer.classList.add('hidden');
        }

        try {
            const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
            const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;
            const [weatherResponse, forecastResponse] = await Promise.all([fetch(apiUrl), fetch(forecastUrl)]);

            if (weatherResponse.status === 401) throw new Error('API key is invalid. Please check it.');
            if (weatherResponse.status === 404) throw new Error(`City '${city}' not found.`);
            if (!weatherResponse.ok) throw new Error('Could not fetch weather data.');

            const weatherData = await weatherResponse.json();
            const forecastData = await forecastResponse.json();
            updateUI(weatherData, forecastData);
        } catch (error) {
            console.error("Error fetching weather data:", error);
            errorMessage.textContent = error.message;
            appWrapper.classList.remove('hidden'); 
            weatherContainer.classList.add('hidden');
        } finally {
            loadingIndicator.classList.add('hidden');
        }
    };

    const fetchWeatherByCoords = async (lat, lon) => {
        try {
            const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
            const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
            const [weatherResponse, forecastResponse] = await Promise.all([fetch(apiUrl), fetch(forecastUrl)]);
            if (!weatherResponse.ok) throw new Error('Could not fetch local weather.');
            
            const weatherData = await weatherResponse.json();
            const forecastData = await forecastResponse.json();
            updateUI(weatherData, forecastData);
        } catch (error) {
            console.warn("Could not fetch by coords, defaulting to Paarl.", error);
            errorMessage.textContent = "Could not get your location. Showing weather for Paarl.";
            await fetchWeatherData('Paarl');
        }
    };

    const updateUI = (weather, forecast) => {
        cityNameEl.textContent = `${weather.name}, ${weather.sys.country}`;
        currentDateEl.textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        temperatureEl.textContent = `${Math.round(weather.main.temp)}°C`;
        weatherDescriptionEl.textContent = weather.weather[0].description;
        weatherIconEl.innerHTML = getWeatherIcon(weather.weather[0].icon);

        humidityEl.textContent = `${weather.main.humidity}%`;
        windSpeedEl.textContent = `${(weather.wind.speed * 3.6).toFixed(1)} km/h`;
        pressureEl.textContent = `${weather.main.pressure} hPa`;
        visibilityEl.textContent = `${(weather.visibility / 1000).toFixed(1)} km`;

        forecastContainer.innerHTML = '';
        const dailyForecasts = forecast.list.filter(item => item.dt_txt.includes("12:00:00"));

        dailyForecasts.slice(0, 5).forEach(day => {
            const dayName = new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' });
            const temp = `${Math.round(day.main.temp_min)}° / ${Math.round(day.main.temp_max)}°`;
            const icon = getWeatherIcon(day.weather[0].icon);

            const forecastCard = `
                <div class="p-4 rounded-2xl forecast-card flex flex-col items-center">
                    <p class="font-semibold">${dayName}</p>
                    <div class="text-4xl my-2">${icon}</div>
                    <p class="text-sm">${temp}</p>
                </div>
            `;
            forecastContainer.innerHTML += forecastCard;
        });
        
        displayFunFact(); // This will now display a random fact from the JSON file
        
        loadingIndicator.classList.add('hidden');
        appWrapper.classList.remove('hidden');
        weatherContainer.classList.remove('hidden');
        funFactContainerEl.classList.remove('hidden');
    };

    const getWeatherIcon = (iconCode) => {
        const iconMap = {
            '01d': '<i class="fas fa-sun"></i>', '01n': '<i class="fas fa-moon"></i>',
            '02d': '<i class="fas fa-cloud-sun"></i>', '02n': '<i class="fas fa-cloud-moon"></i>',
            '03d': '<i class="fas fa-cloud"></i>', '03n': '<i class="fas fa-cloud"></i>',
            '04d': '<i class="fas fa-cloud"></i>', '04n': '<i class="fas fa-cloud"></i>',
            '09d': '<i class="fas fa-cloud-showers-heavy"></i>', '09n': '<i class="fas fa-cloud-showers-heavy"></i>',
            '10d': '<i class="fas fa-cloud-sun-rain"></i>', '10n': '<i class="fas fa-cloud-moon-rain"></i>',
            '11d': '<i class="fas fa-bolt"></i>', '11n': '<i class="fas fa-bolt"></i>',
            '13d': '<i class="fas fa-snowflake"></i>', '13n': '<i class="fas fa-snowflake"></i>',
            '50d': '<i class="fas fa-smog"></i>', '50n': '<i class="fas fa-smog"></i>'
        };
        return iconMap[iconCode] || '<i class="fas fa-question-circle"></i>';
    };

    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const city = cityInput.value.trim();
        if (city) {
            fetchWeatherData(city);
            cityInput.value = '';
        }
    });

    const getInitialWeather = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    fetchWeatherByCoords(latitude, longitude);
                },
                () => {
                    errorMessage.textContent = "Location access denied. Showing weather for Paarl.";
                    fetchWeatherData('Paarl');
                }
            );
        } else {
            errorMessage.textContent = "Geolocation is not supported by your browser.";
            fetchWeatherData('Paarl');
        }
    };
    
    // --- NEW: App initialization function ---
    const initializeApp = async () => {
        // First, load the fun facts from the JSON file
        await loadFunFacts();
        // Then, get the initial weather data
        getInitialWeather();
    };

    // Start the application
    initializeApp();
});

