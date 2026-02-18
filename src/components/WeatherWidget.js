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

function getTheme(condition, isDay) {
  if (condition === 'clear' && isDay) {
    return {
      background: 'linear-gradient(180deg, #4a90d9 0%, #87CEEB 40%, #f0c27f 100%)',
      atmosphere:
        'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.55) 0%, transparent 28%), radial-gradient(circle at 82% 88%, rgba(255,188,116,0.34) 0%, transparent 45%)',
      glow: 'rgba(255, 196, 126, 0.48)',
      stars: false,
      fog: false,
    };
  }

  if (condition === 'clear' && !isDay) {
    return {
      background: 'linear-gradient(180deg, #0a0e27 0%, #1a1a3e 50%, #2d1b4e 100%)',
      atmosphere:
        'radial-gradient(circle at 16% 12%, rgba(183,205,255,0.2) 0%, transparent 35%), radial-gradient(circle at 84% 8%, rgba(129,100,176,0.2) 0%, transparent 38%)',
      glow: 'rgba(144, 169, 255, 0.28)',
      stars: true,
      fog: false,
    };
  }

  if (condition === 'cloudy' && isDay) {
    return {
      background: 'linear-gradient(180deg, #60748d 0%, #8fa4b8 45%, #c7d0d8 100%)',
      atmosphere:
        'radial-gradient(circle at 18% 18%, rgba(255,255,255,0.22) 0%, transparent 34%), radial-gradient(circle at 82% 82%, rgba(100,125,154,0.32) 0%, transparent 42%)',
      glow: 'rgba(179, 197, 220, 0.24)',
      stars: false,
      fog: false,
    };
  }

  if (condition === 'cloudy' && !isDay) {
    return {
      background: 'linear-gradient(180deg, #1a202e 0%, #2a2e45 52%, #3a3152 100%)',
      atmosphere:
        'radial-gradient(circle at 20% 16%, rgba(181,192,234,0.14) 0%, transparent 36%), radial-gradient(circle at 86% 90%, rgba(92,77,122,0.24) 0%, transparent 45%)',
      glow: 'rgba(130, 118, 177, 0.22)',
      stars: false,
      fog: false,
    };
  }

  if (condition === 'rain' || condition === 'drizzle') {
    return {
      background: 'linear-gradient(180deg, #2b3b4b 0%, #36506a 52%, #4d5d74 100%)',
      atmosphere:
        'radial-gradient(circle at 10% 14%, rgba(156,207,255,0.15) 0%, transparent 36%), radial-gradient(circle at 84% 88%, rgba(103,135,171,0.24) 0%, transparent 44%)',
      glow: 'rgba(139, 181, 226, 0.24)',
      stars: false,
      fog: false,
    };
  }

  if (condition === 'snow') {
    return {
      background: 'linear-gradient(180deg, #c4d1de 0%, #d7e1ea 45%, #edf3f7 100%)',
      atmosphere:
        'radial-gradient(circle at 15% 16%, rgba(255,255,255,0.62) 0%, transparent 32%), radial-gradient(circle at 88% 86%, rgba(176,194,212,0.3) 0%, transparent 42%)',
      glow: 'rgba(242, 248, 255, 0.36)',
      stars: false,
      fog: false,
    };
  }

  if (condition === 'storm') {
    return {
      background: 'linear-gradient(180deg, #161522 0%, #2a2738 54%, #3b3346 100%)',
      atmosphere:
        'radial-gradient(circle at 15% 14%, rgba(154,161,209,0.12) 0%, transparent 34%), radial-gradient(circle at 84% 84%, rgba(97,84,124,0.32) 0%, transparent 44%)',
      glow: 'rgba(121, 109, 156, 0.24)',
      stars: false,
      fog: false,
    };
  }

  if (condition === 'fog') {
    return {
      background: 'linear-gradient(180deg, #8a919d 0%, #a4acb5 52%, #bcc4cc 100%)',
      atmosphere:
        'radial-gradient(circle at 14% 20%, rgba(245,249,255,0.28) 0%, transparent 38%), radial-gradient(circle at 85% 84%, rgba(146,155,166,0.26) 0%, transparent 42%)',
      glow: 'rgba(223, 230, 238, 0.24)',
      stars: false,
      fog: true,
    };
  }

  return isDay ? getTheme('clear', true) : getTheme('clear', false);
}

const STAR_FIELD =
  'radial-gradient(circle at 8% 14%, rgba(255,255,255,0.92) 0 1px, transparent 2px), radial-gradient(circle at 18% 38%, rgba(255,255,255,0.8) 0 1px, transparent 2px), radial-gradient(circle at 28% 22%, rgba(255,255,255,0.85) 0 1px, transparent 2px), radial-gradient(circle at 42% 10%, rgba(255,255,255,0.7) 0 1px, transparent 2px), radial-gradient(circle at 56% 28%, rgba(255,255,255,0.85) 0 1px, transparent 2px), radial-gradient(circle at 66% 16%, rgba(255,255,255,0.85) 0 1px, transparent 2px), radial-gradient(circle at 77% 35%, rgba(255,255,255,0.9) 0 1px, transparent 2px), radial-gradient(circle at 90% 20%, rgba(255,255,255,0.8) 0 1px, transparent 2px), radial-gradient(circle at 12% 62%, rgba(255,255,255,0.8) 0 1px, transparent 2px), radial-gradient(circle at 24% 80%, rgba(255,255,255,0.9) 0 1px, transparent 2px), radial-gradient(circle at 40% 70%, rgba(255,255,255,0.75) 0 1px, transparent 2px), radial-gradient(circle at 52% 88%, rgba(255,255,255,0.85) 0 1px, transparent 2px), radial-gradient(circle at 65% 74%, rgba(255,255,255,0.86) 0 1px, transparent 2px), radial-gradient(circle at 78% 84%, rgba(255,255,255,0.8) 0 1px, transparent 2px), radial-gradient(circle at 91% 68%, rgba(255,255,255,0.9) 0 1px, transparent 2px)';

export default function WeatherWidget({ weather }) {
  const condition = weather?.condition || 'clear';
  const isDay = weather?.isDay ?? true;
  const theme = getTheme(condition, isDay);

  const temperature = toNumber(weather?.temperature);
  const feelsLike = toNumber(weather?.feelsLike);
  const humidity = toNumber(weather?.humidity);
  const windspeed = toNumber(weather?.windspeed);
  const windDirection = toCardinal(weather?.windDirection);

  const windMph = windspeed === null ? null : Math.round(windspeed * 0.621371);
  const windText = windMph === null ? 'Wind --' : `Wind ${windMph} mph${windDirection ? ` ${windDirection}` : ''}`;
  const humidityText = humidity === null ? 'Humidity --' : `Humidity ${Math.round(humidity)}%`;

  return (
    <div className="relative h-40 w-[min(280px,72vw)] overflow-hidden rounded-xl border border-white/10 font-mono text-white shadow-[0_16px_45px_rgba(0,0,0,0.32)]">
      <div className="absolute inset-0" style={{ background: theme.background }} />
      <div className="absolute inset-0" style={{ backgroundImage: theme.atmosphere }} />
      {theme.stars && (
        <div
          className="absolute inset-0 opacity-90"
          style={{ backgroundImage: STAR_FIELD }}
        />
      )}
      {theme.fog && (
        <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]" />
      )}
      <div
        className="absolute -right-8 -top-8 h-28 w-28 rounded-full blur-3xl"
        style={{ backgroundColor: theme.glow }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.16] via-transparent to-black/[0.3]" />

      <div className="relative flex h-full flex-col justify-between p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold tracking-wide text-white/95">Boston</p>
            <p className="mt-0.5 text-[11px] uppercase tracking-[0.2em] text-white/75">
              {weather?.description || 'Live weather'}
            </p>
          </div>
          <span className="text-2xl leading-none drop-shadow-sm">{weather?.icon || '🌡️'}</span>
        </div>

        <div>
          <p className="text-[46px] font-semibold leading-none tracking-tight">
            {temperature === null ? '--°' : `${Math.round(temperature)}°`}
          </p>
          <p className="mt-1 text-xs text-white/85">
            Feels like {feelsLike === null ? '--°' : `${Math.round(feelsLike)}°`}
          </p>
        </div>

        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.12em] text-white/88">
          <p>{windText}</p>
          <p>{humidityText}</p>
        </div>
      </div>
    </div>
  );
}
