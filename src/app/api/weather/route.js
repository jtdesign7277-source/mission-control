export const revalidate = 300; // cache 5 min

const WMO_MAP = {
  0: { condition: 'clear', description: 'Clear sky' },
  1: { condition: 'cloudy', description: 'Mainly clear' },
  2: { condition: 'cloudy', description: 'Partly cloudy' },
  3: { condition: 'cloudy', description: 'Overcast' },
  45: { condition: 'fog', description: 'Fog' },
  48: { condition: 'fog', description: 'Depositing rime fog' },
  51: { condition: 'drizzle', description: 'Light drizzle' },
  53: { condition: 'drizzle', description: 'Moderate drizzle' },
  55: { condition: 'drizzle', description: 'Dense drizzle' },
  56: { condition: 'drizzle', description: 'Freezing drizzle' },
  57: { condition: 'drizzle', description: 'Heavy freezing drizzle' },
  61: { condition: 'rain', description: 'Slight rain' },
  63: { condition: 'rain', description: 'Moderate rain' },
  65: { condition: 'rain', description: 'Heavy rain' },
  66: { condition: 'rain', description: 'Freezing rain' },
  67: { condition: 'rain', description: 'Heavy freezing rain' },
  71: { condition: 'snow', description: 'Slight snow' },
  73: { condition: 'snow', description: 'Moderate snow' },
  75: { condition: 'snow', description: 'Heavy snow' },
  77: { condition: 'snow', description: 'Snow grains' },
  80: { condition: 'rain', description: 'Slight rain showers' },
  81: { condition: 'rain', description: 'Moderate rain showers' },
  82: { condition: 'rain', description: 'Violent rain showers' },
  85: { condition: 'snow', description: 'Slight snow showers' },
  86: { condition: 'snow', description: 'Heavy snow showers' },
  95: { condition: 'storm', description: 'Thunderstorm' },
  96: { condition: 'storm', description: 'Thunderstorm with hail' },
  99: { condition: 'storm', description: 'Thunderstorm with heavy hail' },
};

function getIcon(condition, isDay) {
  if (condition === 'clear') return isDay ? '☀️' : '🌙';
  if (condition === 'cloudy') return isDay ? '⛅' : '☁️';
  if (condition === 'fog') return '🌫️';
  if (condition === 'drizzle' || condition === 'rain') return '🌧️';
  if (condition === 'snow') return '🌨️';
  if (condition === 'storm') return '⛈️';
  return '🌡️';
}

export async function GET() {
  try {
    const url =
      'https://api.open-meteo.com/v1/forecast?latitude=42.36&longitude=-71.06&current_weather=true&timezone=America/New_York';
    const res = await fetch(url, { next: { revalidate: 300 } });
    const data = await res.json();
    const cw = data.current_weather;

    const weathercode = cw.weathercode ?? 0;
    const mapped = WMO_MAP[weathercode] || { condition: 'clear', description: 'Unknown' };
    const isDay = cw.is_day === 1;
    const temperatureF = Math.round(cw.temperature * 9 / 5 + 32);

    return Response.json({
      temperature: temperatureF,
      condition: mapped.condition,
      isDay,
      weathercode,
      windspeed: cw.windspeed,
      icon: getIcon(mapped.condition, isDay),
      description: mapped.description,
    });
  } catch (err) {
    return Response.json(
      { error: err.message || 'Failed to fetch weather' },
      { status: 500 },
    );
  }
}
