document.addEventListener('DOMContentLoaded', () => {
    const weatherApiKey = 'fb66fe43361cd5009ce684e3da688b04';
    const newsApiKey = '5cf77a69e5104908af19f82cb3aa44ac';

    // --- ELEMENT SELECTORS ---
    const appWrapper = document.getElementById('app-wrapper');
    const weatherContainer = document.getElementById('weather-container');
    const loadingIndicator = document.getElementById('loading');
    const searchForm = document.getElementById('search-form');
    const cityInput = document.getElementById('city-input');
    const errorMessage = document.getElementById('error-message');
    
    // Main content selectors
    const mainContent = document.getElementById('main-content');
    const cityNameEl = document.getElementById('city-name');
    const currentDateEl = document.getElementById('current-date');
    const weatherIconEl = document.getElementById('weather-icon');
    const temperatureEl = document.getElementById('temperature');
    const weatherDescriptionEl = document.getElementById('weather-description');
    const humidityEl = document.getElementById('humidity');
    const windSpeedEl = document.getElementById('wind-speed');
    const pressureEl = document.getElementById('pressure');
    const visibilityEl = document.getElementById('visibility');
    const forecastContainer = document.getElementById('forecast-container');
    
    // Sidebar & Widgets
    const sidebarContent = document.getElementById('sidebar-content');
    const funFactContainer = document.getElementById('fun-fact-container');
    const newsCardContainer = document.getElementById('news-card-container');
    const plantingContainerMain = document.getElementById('planting-container-main');
    const funFactTextEl = document.getElementById('fun-fact-text');
    const newsContainerEl = document.getElementById('news-container');
    const plantingTextMainEl = document.getElementById('planting-text-main');

    // NEW Settings Dropdown
    const settingsButton = document.getElementById('settings-button');
    const settingsDropdown = document.getElementById('settings-dropdown');
    const locationToggle = document.getElementById('location-toggle');
    const funFactToggle = document.getElementById('fun-fact-toggle');
    const newsToggle = document.getElementById('news-toggle');
    const plantingToggle = document.getElementById('planting-toggle');

    // Modal
    const locationModal = document.getElementById('location-modal');
    const modalSearchForm = document.getElementById('modal-search-form');
    const modalCityInput = document.getElementById('modal-city-input');

    let allData = {
        facts: [],
        planting: {}
    };

    // --- MODAL & WIDGET LOGIC ---
    const showLocationModal = () => locationModal.classList.remove('hidden');
    const hideLocationModal = () => locationModal.classList.add('hidden');
    
    const updateGridLayout = () => {
        const funFactsVisible = !funFactContainer.classList.contains('hidden');
        const newsVisible = !newsCardContainer.classList.contains('hidden');

        if (!funFactsVisible && !newsVisible) {
            // If both sidebar items are hidden, expand main content
            mainContent.classList.remove('lg:col-span-3');
            mainContent.classList.add('lg:col-span-4');
            sidebarContent.classList.add('hidden');
        } else {
            // Otherwise, show sidebar and set normal layout
            mainContent.classList.remove('lg:col-span-4');
            mainContent.classList.add('lg:col-span-3');
            sidebarContent.classList.remove('hidden');
        }
    };

    const setupToggle = (toggle, container, storageKey) => {
        // Default to 'true' for desktop, check storage for mobile decision
        const isEnabled = localStorage.getItem(storageKey) !== 'false';
        toggle.checked = isEnabled;
        container.classList.toggle('hidden', !isEnabled);

        toggle.addEventListener('change', () => {
            const isChecked = toggle.checked;
            localStorage.setItem(storageKey, isChecked);
            container.classList.toggle('hidden', !isChecked);
            updateGridLayout(); // Update grid on any toggle change
        });
    };

    // --- DATA FETCHING ---
    const loadJsonData = async () => {
        try {
            const [factsResponse, plantingResponse] = await Promise.all([
                fetch('flower-facts.json'),
                fetch('planting-guide.json')
            ]);
            if (!factsResponse.ok) throw new Error('Could not load flower facts.');
            if (!plantingResponse.ok) throw new Error('Could not load planting guide.');

            allData.facts = (await factsResponse.json()).facts;
            allData.planting = await plantingResponse.json();

        } catch (error) {
            console.error("Error loading JSON data:", error);
            // This ensures parts of the app don't fail if one file is missing
        }
    };

    const displayFunFact = () => {
        if (!allData.facts || allData.facts.length === 0) return;
        const randomIndex = Math.floor(Math.random() * allData.facts.length);
        funFactTextEl.textContent = allData.facts[randomIndex];
    };
    
    const displayPlantingAdvice = (lat) => {
        if (!allData.planting.months) {
            plantingTextMainEl.textContent = "Planting advice is currently unavailable.";
            return;
        }
        const hemisphere = lat >= 0 ? 'northern' : 'southern';
        const monthIndex = new Date().getMonth();
        const month = allData.planting.months[monthIndex];
        const advice = allData.planting.guides[hemisphere][month];
        plantingTextMainEl.textContent = advice || "No specific advice for this month.";
    };

    const fetchNewsData = async () => {
        if (!newsApiKey || newsApiKey.includes('YOUR')) {
            newsContainerEl.innerHTML = '<p class="text-sm italic">News API key needed.</p>';
            return;
        }
        const url = `https://newsapi.org/v2/top-headlines?category=general&language=en&pageSize=5&apiKey=${newsApiKey}`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Could not fetch news headlines.');
            const data = await response.json();
            newsContainerEl.innerHTML = '';
            if (data.articles && data.articles.length > 0) {
                const articleList = document.createElement('ul');
                articleList.className = 'space-y-3';
                data.articles.forEach(article => {
                    const listItem = document.createElement('li');
                    listItem.innerHTML = `<a href="${article.url}" target="_blank" rel="noopener noreferrer" class="hover:text-pink-500 transition-colors duration-200 text-sm">${article.title}</a>`;
                    articleList.appendChild(listItem);
                });
                newsContainerEl.appendChild(articleList);
            } else {
                newsContainerEl.innerHTML = '<p class="text-sm">No news headlines found.</p>';
            }
        } catch (error) {
            console.error("Error fetching news:", error);
            newsContainerEl.innerHTML = `<p class="text-sm italic">${error.message}</p>`;
        }
    };

    const fetchWeatherData = async (city) => {
        errorMessage.textContent = '';
        try {
            const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${weatherApiKey}&units=metric`;
            const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${weatherApiKey}&units=metric`;
            const [weatherResponse, forecastResponse] = await Promise.all([fetch(apiUrl), fetch(forecastUrl)]);
            if (weatherResponse.status === 404) throw new Error(`City '${city}' not found.`);
            if (!weatherResponse.ok) throw new Error('Could not fetch weather data.');
            const weatherData = await weatherResponse.json();
            const forecastData = await forecastResponse.json();
            updateUI(weatherData, forecastData);
        } catch (error) {
            console.error("Error fetching weather data:", error);
            errorMessage.textContent = error.message;
        } finally {
            loadingIndicator.classList.add('hidden');
            appWrapper.classList.remove('hidden');
        }
    };

    const fetchWeatherByCoords = async (lat, lon) => {
        try {
            const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${weatherApiKey}&units=metric`;
            const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${weatherApiKey}&units=metric`;
            const [weatherResponse, forecastResponse] = await Promise.all([fetch(apiUrl), fetch(forecastUrl)]);
            if (!weatherResponse.ok) throw new Error('Could not fetch local weather.');
            const weatherData = await weatherResponse.json();
            const forecastData = await forecastResponse.json();
            updateUI(weatherData, forecastData);
        } catch (error) {
            console.error("Could not fetch by coords:", error);
            errorMessage.textContent = 'Could not get weather for your location.';
            showLocationModal();
        } finally {
            loadingIndicator.classList.add('hidden');
            appWrapper.classList.remove('hidden');
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
            const forecastCard = `<div class="p-4 rounded-2xl forecast-card flex flex-col items-center"><p class="font-semibold">${dayName}</p><div class="text-4xl my-2">${icon}</div><p class="text-sm">${temp}</p></div>`;
            forecastContainer.innerHTML += forecastCard;
        });
        displayFunFact();
        displayPlantingAdvice(weather.coord.lat);
        weatherContainer.classList.remove('hidden');
        updateGridLayout(); // Check layout after UI is updated
    };

    const getWeatherIcon = (iconCode) => {
        const iconMap = {
            '01d': '<i class="fas fa-sun"></i>', '01n': '<i class="fas fa-moon"></i>', '02d': '<i class="fas fa-cloud-sun"></i>', '02n': '<i class="fas fa-cloud-moon"></i>', '03d': '<i class="fas fa-cloud"></i>', '03n': '<i class="fas fa-cloud"></i>', '04d': '<i class="fas fa-cloud"></i>', '04n': '<i class="fas fa-cloud"></i>', '09d': '<i class="fas fa-cloud-showers-heavy"></i>', '09n': '<i class="fas fa-cloud-showers-heavy"></i>', '10d': '<i class="fas fa-cloud-sun-rain"></i>', '10n': '<i class="fas fa-cloud-moon-rain"></i>', '11d': '<i class="fas fa-bolt"></i>', '11n': '<i class="fas fa-bolt"></i>', '13d': '<i class="fas fa-snowflake"></i>', '13n': '<i class="fas fa-snowflake"></i>', '50d': '<i class="fas fa-smog"></i>', '50n': '<i class="fas fa-smog"></i>'
        };
        return iconMap[iconCode] || '<i class="fas fa-question-circle"></i>';
    };

    // --- EVENT LISTENERS ---
    settingsButton.addEventListener('click', (e) => {
        e.stopPropagation();
        settingsDropdown.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
        if (!settingsDropdown.contains(e.target) && !settingsButton.contains(e.target)) {
            settingsDropdown.classList.add('hidden');
        }
    });

    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const city = cityInput.value.trim();
        if (city) {
            loadingIndicator.classList.remove('hidden');
            appWrapper.classList.add('hidden');
            await fetchWeatherData(city);
            cityInput.value = '';
        }
    });

    modalSearchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const city = modalCityInput.value.trim();
        if (city) {
            hideLocationModal();
            loadingIndicator.classList.remove('hidden');
            appWrapper.classList.add('hidden');
            await fetchWeatherData(city);
            modalCityInput.value = '';
        }
    });

    locationToggle.addEventListener('change', () => {
        if (locationToggle.checked) {
            loadingIndicator.classList.remove('hidden');
            appWrapper.classList.add('hidden');
            getInitialWeather(); 
        } else {
            localStorage.setItem('locationPermission', 'denied');
            showLocationModal();
        }
    });

    // --- INITIALIZATION LOGIC ---
    const getInitialWeather = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => { // Success
                    localStorage.setItem('locationPermission', 'granted');
                    locationToggle.checked = true;
                    const { latitude, longitude } = position.coords;
                    fetchWeatherByCoords(latitude, longitude);
                },
                () => { // Error (permission denied)
                    localStorage.setItem('locationPermission', 'denied');
                    locationToggle.checked = false;
                    loadingIndicator.classList.add('hidden');
                    showLocationModal();
                }
            );
        } else { // Geolocation not supported by browser
            localStorage.setItem('locationPermission', 'denied');
            locationToggle.checked = false;
            loadingIndicator.classList.add('hidden');
            showLocationModal();
        }
    };
    
    const initializeApp = async () => {
        await loadJsonData();
        fetchNewsData();

        // Setup all toggles
        setupToggle(funFactToggle, funFactContainer, 'funFactEnabled');
        setupToggle(newsToggle, newsCardContainer, 'newsEnabled');
        setupToggle(plantingToggle, plantingContainerMain, 'plantingEnabled');
        
        const permissionStatus = localStorage.getItem('locationPermission');
        if (permissionStatus === 'granted') {
            locationToggle.checked = true;
            getInitialWeather();
        } else {
            locationToggle.checked = false;
            // For first-time users or denied users, show modal immediately without waiting for geolocation timeout
            loadingIndicator.classList.add('hidden');
            appWrapper.classList.remove('hidden');
            showLocationModal();
        }
        updateGridLayout(); // Set initial layout
    };

    initializeApp();
});

