const searchFormElement = document.getElementById('search-form')
const widgetListElement = document.getElementById('widget-list')
const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
let weatherList = []
let lastId = 0
let lastTimestamp = Date.now()

document.addEventListener('DOMContentLoaded', () => loadWeatherList())

searchFormElement.addEventListener('submit', (event) => handleFormSubmit(event))

const loadWeatherList = () => {
	const localData = getLocalData()

	if (localData.length) {
		weatherList = localData
		weatherList.forEach((weatherData) => {
			updateWeatherWidget(weatherData.id)
		})
		refreshWeatherList()
	}
}

const handleFormSubmit = (event) => {
	event.preventDefault()

	const searchInput = document.getElementById('search')
	const city = searchInput.value.trim()

	if (city) {
		addCity(city)
		searchInput.value = ''
	}
}

const addCity = async (city) => {
	const { current, forecast, location } = await fetchWeatherData(city)
	const weatherItem = createWeatherItem(current, forecast, location)
	weatherList.push(weatherItem)
	saveLocalData()
	refreshWeatherList()
}

const createWeatherItem = (current, forecast, location) => ({
	id: generateItemId(),
	city: location.name,
	info: {
		icon: current.condition.icon,
		minTemp: forecast.forecastday[0].day.mintemp_c,
		maxTemp: forecast.forecastday[0].day.maxtemp_c,
		wind: current.wind_kph,
		humidity: current.humidity,
	},
	nextDays: forecast.forecastday.slice(1).map((day) => ({
		day: weekDays[new Date(day.date).getDay()],
		temperature: day.day.avgtemp_c,
		icon: day.day.condition.icon,
	})),
})

const generateItemId = () => {
	const timestamp = Date.now()

	if (timestamp === lastTimestamp) {
		lastId++
	} else {
		lastId = 0
		lastTimestamp = timestamp
	}

	return `widget-${timestamp}-${lastId}`
}

const fetchWeatherData = async (cityName) => {
	const response = await fetch(
		`https://api.weatherapi.com/v1/forecast.json?key=758380207b0e4ad881b190036242604&q=${cityName}&days=6&aqi=no&alerts=no`,
		{
			method: 'GET',
			mode: 'cors',
			headers: {
				'Content-Type': 'application/json',
			},
		})

	return await response.json()
}

const refreshWeatherList = () => {
	clearWeatherList()

	weatherList.forEach((weatherData) => {
		const widgetElement = createWeatherWidget(weatherData)
		widgetListElement.append(widgetElement)
	})
}

const createWeatherWidget = (weatherData) => {
	const widgetElement = document.createElement('article')
	widgetElement.classList.add('weather-info')
	widgetElement.id = weatherData.id
	widgetElement.innerHTML = `
		<button id="delete-button-${weatherData.id}" type="button" class="delete-button"><i class="fa fa-trash"></i></button>
		<div class="current">
			<div class="title">
				<h2 class="city">${weatherData.city}</h2>
			</div>
			<div class="info">
				<img src="${weatherData.info.icon}" alt="icon">
				<div class="details">
					<p class="temp">H:${weatherData.info.maxTemp}º L:${weatherData.info.minTemp}º</p>
					<p class="wind">Wind: ${weatherData.info.wind}km/h</p>
					<p class="humidity">Humidity: ${weatherData.info.humidity}%</p>
				</div>
			</div>
		</div>
		<div class="next-days">
				${weatherData.nextDays.map(({ day, temperature, icon }) => `
					<div class="day">
						<h3 class="date">${day}</h3>
						<img src="${icon}" alt="icon">
						<p class="temp">${temperature}º</p>
					</div>
				`).join('')}
			</div>
	`

	widgetElement.querySelector(`#delete-button-${weatherData.id}`)
		.addEventListener('click', () => deleteWeatherItem(weatherData.id))

	return widgetElement
}

const clearWeatherList = () => {
	widgetListElement.innerHTML = ''
}

const saveLocalData = () => localStorage.setItem('weatherList', JSON.stringify(weatherList))

const getLocalData = () => JSON.parse(localStorage.getItem('weatherList')) || []

const deleteWeatherItem = (id) => {
	weatherList = weatherList.filter((weather) => weather.id !== id)
	saveLocalData()
	refreshWeatherList()
}

const updateWeatherWidget = async (id) => {
	const item = weatherList.find((weather) => weather.id === id)

	if (item) {
		const { current, forecast } = await fetchWeatherData(item.city)
		item['info'] = {
			icon: current.condition.icon,
			minTemp: forecast.forecastday[0].day.mintemp_c,
			maxTemp: forecast.forecastday[0].day.maxtemp_c,
			wind: current.wind_kph,
			humidity: current.humidity,
		}
		item['nextDays'] = forecast.forecastday.slice(1).map((day) => ({
			day: weekDays[new Date(day.date).getDay()],
			temperature: day.day.avgtemp_c,
			icon: day.day.condition.icon,
		}))
		saveLocalData()
		refreshWeatherList()
	}
}
