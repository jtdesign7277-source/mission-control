function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toCardinal(degrees) {
  const value = toNumber(degrees);
  if (value === null) return '';
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return directions[Math.round(value / 45) % 8];
}

export function getWeatherTheme(condition, isDay) {
  if (condition === 'clear' && isDay) {
    return {
      background: 'linear-gradient(135deg, #1a3a5c 0%, #2a5f8f 30%, #4a90d9 60%, #87CEEB 100%)',
      atmosphere: 'radial-gradient(circle at 85% 15%, rgba(255,220,130,0.25) 0%, transparent 45%), radial-gradient(circle at 15% 85%, rgba(100,160,220,0.15) 0%, transparent 40%)',
      glow: 'rgba(255, 196, 126, 0.35)',
      stars: false,
      fog: false,
    };
  }
  if (condition === 'clear' && !isDay) {
    return {
      background: 'linear-gradient(135deg, #0a0e27 0%, #121838 30%, #1a1a3e 60%, #2d1b4e 100%)',
      atmosphere: 'radial-gradient(circle at 80% 20%, rgba(183,205,255,0.15) 0%, transparent 40%), radial-gradient(circle at 20% 80%, rgba(129,100,176,0.12) 0%, transparent 35%)',
      glow: 'rgba(144, 169, 255, 0.2)',
      stars: true,
      fog: false,
    };
  }
  if (condition === 'cloudy' && isDay) {
    return {
      background: 'linear-gradient(135deg, #3d5068 0%, #60748d 35%, #8fa4b8 70%, #a8b8c8 100%)',
      atmosphere: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.12) 0%, transparent 40%), radial-gradient(circle at 20% 80%, rgba(100,125,154,0.18) 0%, transparent 35%)',
      glow: 'rgba(179, 197, 220, 0.18)',
      stars: false,
      fog: false,
    };
  }
  if (condition === 'cloudy' && !isDay) {
    return {
      background: 'linear-gradient(135deg, #12162a 0%, #1a202e 30%, #2a2e45 65%, #3a3152 100%)',
      atmosphere: 'radial-gradient(circle at 80% 20%, rgba(181,192,234,0.1) 0%, transparent 35%), radial-gradient(circle at 20% 80%, rgba(92,77,122,0.14) 0%, transparent 35%)',
      glow: 'rgba(130, 118, 177, 0.16)',
      stars: false,
      fog: false,
    };
  }
  if (condition === 'rain' || condition === 'drizzle') {
    return {
      background: 'linear-gradient(135deg, #1a2a3a 0%, #2b3b4b 35%, #36506a 70%, #4d5d74 100%)',
      atmosphere: 'radial-gradient(circle at 80% 20%, rgba(156,207,255,0.1) 0%, transparent 35%), radial-gradient(circle at 20% 80%, rgba(103,135,171,0.14) 0%, transparent 35%)',
      glow: 'rgba(139, 181, 226, 0.16)',
      stars: false,
      fog: false,
    };
  }
  if (condition === 'snow') {
    return {
      background: 'linear-gradient(135deg, #8a9aae 0%, #a4b4c4 30%, #c4d1de 65%, #d7e1ea 100%)',
      atmosphere: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.3) 0%, transparent 35%), radial-gradient(circle at 20% 80%, rgba(176,194,212,0.18) 0%, transparent 35%)',
      glow: 'rgba(242, 248, 255, 0.24)',
      stars: false,
      fog: false,
    };
  }
  if (condition === 'storm') {
    return {
      background: 'linear-gradient(135deg, #0e0d1a 0%, #161522 30%, #2a2738 65%, #3b3346 100%)',
      atmosphere: 'radial-gradient(circle at 80% 20%, rgba(154,161,209,0.08) 0%, transparent 35%), radial-gradient(circle at 20% 80%, rgba(97,84,124,0.18) 0%, transparent 35%)',
      glow: 'rgba(121, 109, 156, 0.16)',
      stars: false,
      fog: false,
    };
  }
  if (condition === 'fog') {
    return {
      background: 'linear-gradient(135deg, #5a6370 0%, #7a838e 30%, #8a919d 65%, #a4acb5 100%)',
      atmosphere: 'radial-gradient(circle at 80% 20%, rgba(245,249,255,0.16) 0%, transparent 35%), radial-gradient(circle at 20% 80%, rgba(146,155,166,0.14) 0%, transparent 35%)',
      glow: 'rgba(223, 230, 238, 0.18)',
      stars: false,
      fog: true,
    };
  }
  return isDay ? getWeatherTheme('clear', true) : getWeatherTheme('clear', false);
}

const STAR_FIELD =
  'radial-gradient(circle at 5% 8%, rgba(255,255,255,0.9) 0 1px, transparent 2px), radial-gradient(circle at 12% 35%, rgba(255,255,255,0.7) 0 1px, transparent 2px), radial-gradient(circle at 22% 18%, rgba(255,255,255,0.8) 0 1px, transparent 2px), radial-gradient(circle at 35% 6%, rgba(255,255,255,0.65) 0 1px, transparent 2px), radial-gradient(circle at 48% 25%, rgba(255,255,255,0.8) 0 1px, transparent 2px), radial-gradient(circle at 58% 12%, rgba(255,255,255,0.75) 0 1px, transparent 2px), radial-gradient(circle at 68% 32%, rgba(255,255,255,0.85) 0 1px, transparent 2px), radial-gradient(circle at 82% 15%, rgba(255,255,255,0.7) 0 1px, transparent 2px), radial-gradient(circle at 92% 28%, rgba(255,255,255,0.8) 0 1px, transparent 2px), radial-gradient(circle at 8% 55%, rgba(255,255,255,0.7) 0 1px, transparent 2px), radial-gradient(circle at 18% 72%, rgba(255,255,255,0.85) 0 1px, transparent 2px), radial-gradient(circle at 32% 62%, rgba(255,255,255,0.65) 0 1px, transparent 2px), radial-gradient(circle at 45% 78%, rgba(255,255,255,0.8) 0 1px, transparent 2px), radial-gradient(circle at 58% 68%, rgba(255,255,255,0.75) 0 1px, transparent 2px), radial-gradient(circle at 72% 82%, rgba(255,255,255,0.7) 0 1px, transparent 2px), radial-gradient(circle at 88% 58%, rgba(255,255,255,0.85) 0 1px, transparent 2px), radial-gradient(circle at 95% 72%, rgba(255,255,255,0.6) 0 1px, transparent 2px), radial-gradient(circle at 3% 88%, rgba(255,255,255,0.75) 0 1px, transparent 2px), radial-gradient(circle at 40% 45%, rgba(255,255,255,0.5) 0 0.5px, transparent 1px), radial-gradient(circle at 75% 48%, rgba(255,255,255,0.55) 0 0.5px, transparent 1px)';

export function WeatherHeaderBackground({ condition, isDay }) {
  const theme = getWeatherTheme(condition || 'clear', isDay ?? true);

  return (
    <>
      <div className="absolute inset-0 rounded-2xl" style={{ background: theme.background }} />
      <div className="absolute inset-0 rounded-2xl" style={{ backgroundImage: theme.atmosphere }} />
      {theme.stars && (
        <div className="absolute inset-0 rounded-2xl opacity-80" style={{ backgroundImage: STAR_FIELD }} />
      )}
      {theme.fog && (
        <div className="absolute inset-0 rounded-2xl bg-white/5 backdrop-blur-[1px]" />
      )}
      <div
        className="absolute -right-12 -top-12 h-40 w-40 rounded-full blur-3xl"
        style={{ backgroundColor: theme.glow }}
      />
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/[0.06] via-transparent to-black/[0.2]" />
    </>
  );
}

export function WeatherInfo({ weather }) {
  if (!weather) return null;

  const temperature = toNumber(weather.temperature);
  const feelsLike = toNumber(weather.feelsLike);
  const humidity = toNumber(weather.humidity);
  const windspeed = toNumber(weather.windspeed);
  const windDir = toCardinal(weather.windDirection);
  const windMph = windspeed === null ? null : Math.round(windspeed * 0.621371);

  return (
    <div className="text-right font-mono">
      <div className="flex items-baseline justify-end gap-2">
        <span className="text-3xl font-semibold leading-none text-white drop-shadow-sm">
          {temperature === null ? '--' : Math.round(temperature)}°
        </span>
        <span className="text-xl leading-none drop-shadow-sm">{weather.icon || '🌡️'}</span>
      </div>
      <p className="mt-1 text-xs text-white/80">
        Feels like {feelsLike === null ? '--°' : `${Math.round(feelsLike)}°`}
      </p>
      <p className="mt-0.5 text-[11px] text-white/60">
        {weather.description}
        {windMph !== null ? ` · ${windMph}mph${windDir ? ` ${windDir}` : ''}` : ''}
        {humidity !== null ? ` · ${Math.round(humidity)}%` : ''}
      </p>
    </div>
  );
}

export default function WeatherWidget({ weather }) {
  return <WeatherInfo weather={weather} />;
}
