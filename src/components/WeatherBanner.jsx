"use client";
import { useState, useEffect, useMemo } from "react";

const WEATHER_API = "https://api.open-meteo.com/v1/forecast";
const LAT = 42.36;
const LON = -71.06;

const WMO_CODES = {
  0: { label: "Clear", type: "clear", icon: "☀️" },
  1: { label: "Mostly Clear", type: "clear", icon: "🌤️" },
  2: { label: "Partly Cloudy", type: "cloudy", icon: "⛅" },
  3: { label: "Overcast", type: "overcast", icon: "☁️" },
  45: { label: "Foggy", type: "fog", icon: "🌫️" },
  48: { label: "Icy Fog", type: "fog", icon: "🌫️" },
  51: { label: "Light Drizzle", type: "drizzle", icon: "🌦️" },
  53: { label: "Drizzle", type: "drizzle", icon: "🌦️" },
  55: { label: "Heavy Drizzle", type: "rain", icon: "🌧️" },
  61: { label: "Light Rain", type: "rain", icon: "🌧️" },
  63: { label: "Rain", type: "rain", icon: "🌧️" },
  65: { label: "Heavy Rain", type: "heavyrain", icon: "🌧️" },
  66: { label: "Freezing Rain", type: "rain", icon: "🌧️" },
  67: { label: "Heavy Freezing Rain", type: "heavyrain", icon: "🌧️" },
  71: { label: "Light Snow", type: "snow", icon: "🌨️" },
  73: { label: "Snow", type: "snow", icon: "❄️" },
  75: { label: "Heavy Snow", type: "heavysnow", icon: "❄️" },
  77: { label: "Snow Grains", type: "snow", icon: "🌨️" },
  80: { label: "Light Showers", type: "rain", icon: "🌦️" },
  81: { label: "Showers", type: "rain", icon: "🌧️" },
  82: { label: "Heavy Showers", type: "heavyrain", icon: "🌧️" },
  85: { label: "Snow Showers", type: "snow", icon: "🌨️" },
  86: { label: "Heavy Snow Showers", type: "heavysnow", icon: "❄️" },
  95: { label: "Thunderstorm", type: "thunder", icon: "⛈️" },
  96: { label: "Thunderstorm", type: "thunder", icon: "⛈️" },
  99: { label: "Severe Storm", type: "thunder", icon: "⛈️" },
};

function getWeatherInfo(code) {
  return WMO_CODES[code] || { label: "Unknown", type: "clear", icon: "🌡️" };
}

const BACKGROUNDS = {
  clear: "linear-gradient(135deg, #0a1628 0%, #0f2847 50%, #1a3a5c 100%)",
  cloudy: "linear-gradient(135deg, #0a1220 0%, #151e30 50%, #1c2a40 100%)",
  overcast: "linear-gradient(135deg, #0a0f18 0%, #141820 50%, #1a1f2a 100%)",
  fog: "linear-gradient(135deg, #0f1520 0%, #1a2030 50%, #252d3a 100%)",
  drizzle: "linear-gradient(135deg, #080e18 0%, #101828 50%, #141e30 100%)",
  rain: "linear-gradient(135deg, #060a14 0%, #0c1422 50%, #101a2a 100%)",
  heavyrain: "linear-gradient(135deg, #04080f 0%, #080d16 50%, #0c1220 100%)",
  snow: "linear-gradient(135deg, #0e1320 0%, #182030 50%, #1e283a 100%)",
  heavysnow: "linear-gradient(135deg, #10151f 0%, #1a2230 50%, #222a3a 100%)",
  thunder: "linear-gradient(135deg, #040610 0%, #080c18 50%, #0c1020 100%)",
};

function Raindrops({ count, heavy }) {
  const drops = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      dur: 0.3 + Math.random() * 0.35,
      opacity: 0.2 + Math.random() * 0.5,
      h: heavy ? 16 + Math.random() * 14 : 8 + Math.random() * 10,
    })), [count, heavy]);

  return drops.map((d) => (
    <div key={d.id} style={{
      position: "absolute", left: `${d.left}%`, top: -20, width: heavy ? 2 : 1.5, height: d.h,
      background: `linear-gradient(transparent, rgba(174,200,255,${d.opacity}))`,
      borderRadius: "0 0 2px 2px",
      animation: `wbRainFall ${d.dur}s linear ${d.delay}s infinite`,
      pointerEvents: "none",
    }} />
  ));
}

function RainSplash({ count }) {
  const splashes = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i, left: Math.random() * 100,
      delay: Math.random() * 2, dur: 0.4 + Math.random() * 0.3,
    })), [count]);

  return splashes.map((s) => (
    <div key={s.id} style={{
      position: "absolute", bottom: 0, left: `${s.left}%`,
      width: 4, height: 2, background: "rgba(174,200,255,0.3)", borderRadius: "50%",
      animation: `wbSplash ${s.dur}s ease-out ${s.delay}s infinite`,
      pointerEvents: "none",
    }} />
  ));
}

function Snowflakes({ count, heavy }) {
  const flakes = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i, left: Math.random() * 100,
      delay: Math.random() * 5, dur: 2.5 + Math.random() * 4,
      size: heavy ? 3 + Math.random() * 5 : 2 + Math.random() * 3,
      opacity: 0.4 + Math.random() * 0.6,
      drift: -15 + Math.random() * 30,
    })), [count, heavy]);

  return flakes.map((f) => (
    <div key={f.id} style={{
      position: "absolute", left: `${f.left}%`, top: -8,
      width: f.size, height: f.size,
      background: `rgba(255,255,255,${f.opacity})`, borderRadius: "50%",
      boxShadow: `0 0 ${f.size * 2}px rgba(255,255,255,0.2)`,
      animation: `wbSnowFall ${f.dur}s ease-in ${f.delay}s infinite`,
      "--drift": `${f.drift}px`,
      pointerEvents: "none",
    }} />
  ));
}

function CloudLayer({ dark }) {
  const clouds = useMemo(() =>
    Array.from({ length: 6 }, (_, i) => ({
      id: i, top: 5 + Math.random() * 50,
      delay: i * 5 + Math.random() * 4, dur: 20 + Math.random() * 20,
      w: 80 + Math.random() * 120,
      opacity: dark ? 0.35 + Math.random() * 0.25 : 0.15 + Math.random() * 0.2,
    })), [dark]);

  return clouds.map((c) => (
    <div key={c.id} style={{
      position: "absolute", top: `${c.top}%`, left: "-25%",
      width: c.w, height: c.w * 0.35,
      background: dark
        ? `radial-gradient(ellipse, rgba(60,70,90,${c.opacity}), transparent 70%)`
        : `radial-gradient(ellipse, rgba(180,195,220,${c.opacity}), transparent 70%)`,
      borderRadius: "50%",
      animation: `wbCloudDrift ${c.dur}s linear ${c.delay}s infinite`,
      pointerEvents: "none",
    }} />
  ));
}

function Lightning() {
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    const iv = setInterval(() => {
      if (Math.random() > 0.65) {
        setFlash(true);
        setTimeout(() => setFlash(false), 120);
        setTimeout(() => { setFlash(true); setTimeout(() => setFlash(false), 60); }, 180);
      }
    }, 3500);
    return () => clearInterval(iv);
  }, []);
  if (!flash) return null;
  return <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.12)", pointerEvents: "none", zIndex: 5 }} />;
}

function SunGlow() {
  return <div style={{
    position: "absolute", top: -20, right: 40,
    width: 70, height: 70, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(255,215,80,0.5), rgba(255,180,50,0.15) 45%, transparent 70%)",
    boxShadow: "0 0 50px rgba(255,200,60,0.3), 0 0 100px rgba(255,180,50,0.1)",
    animation: "wbSunPulse 4s ease-in-out infinite",
    pointerEvents: "none",
  }} />;
}

function FogLayer() {
  return <>
    <div style={{
      position: "absolute", inset: 0,
      background: "linear-gradient(90deg, transparent, rgba(160,175,200,0.2) 30%, rgba(160,175,200,0.12) 70%, transparent)",
      animation: "wbFogDrift 14s ease-in-out infinite alternate",
      pointerEvents: "none",
    }} />
    <div style={{
      position: "absolute", inset: 0,
      background: "linear-gradient(90deg, transparent 20%, rgba(140,155,180,0.15) 50%, transparent 80%)",
      animation: "wbFogDrift 20s ease-in-out 4s infinite alternate-reverse",
      pointerEvents: "none",
    }} />
  </>;
}

export default function WeatherBanner() {
  const [weather, setWeather] = useState(null);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch(
          `${WEATHER_API}?latitude=${LAT}&longitude=${LON}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,apparent_temperature,precipitation&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America/New_York`
        );
        const data = await res.json();
        setWeather(data.current);
      } catch (err) {
        console.error("Weather fetch failed:", err);
      }
    };
    fetchWeather();
    const iv = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const iv = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  const info = weather ? getWeatherInfo(weather.weather_code) : { label: "Loading", type: "clear", icon: "⏳" };
  const wType = info.type;
  const bg = BACKGROUNDS[wType] || BACKGROUNDS.clear;
  const temp = weather ? Math.round(weather.temperature_2m) : "--";
  const feelsLike = weather ? Math.round(weather.apparent_temperature) : "--";
  const wind = weather ? Math.round(weather.wind_speed_10m) : "--";
  const precip = weather ? weather.precipitation : 0;
  const humidity = weather ? weather.relative_humidity_2m : "--";

  const windDir = weather ? (() => {
    const d = weather.wind_direction_10m;
    const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    return dirs[Math.round(d / 45) % 8];
  })() : "--";

  const timeStr = time.toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", second: "2-digit",
    hour12: true, timeZone: "America/New_York",
  });
  const dateStr = time.toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    timeZone: "America/New_York",
  });

  const showRain = ["drizzle", "rain", "heavyrain", "thunder"].includes(wType);
  const showSnow = ["snow", "heavysnow"].includes(wType);
  const showClouds = ["cloudy", "overcast", "rain", "heavyrain", "drizzle", "thunder", "snow", "heavysnow"].includes(wType);
  const showSun = wType === "clear";
  const showFog = wType === "fog";
  const showLightning = wType === "thunder";
  const isHeavy = ["heavyrain", "heavysnow"].includes(wType);

  return (
    <div style={{
      position: "relative", width: "100%", height: 100,
      background: bg,
      borderBottom: "1px solid rgba(255,255,255,0.05)",
      overflow: "hidden",
      fontFamily: "'SF Mono', 'JetBrains Mono', 'Fira Code', monospace",
    }}>
      <style>{`
        @keyframes wbRainFall {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translateY(120px); opacity: 0.3; }
        }
        @keyframes wbSnowFall {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translateY(120px) translateX(var(--drift)); opacity: 0; }
        }
        @keyframes wbCloudDrift {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(100vw + 200px)); }
        }
        @keyframes wbSunPulse {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.15); opacity: 1; }
        }
        @keyframes wbFogDrift {
          0% { transform: translateX(-5%); }
          100% { transform: translateX(5%); }
        }
        @keyframes wbSplash {
          0% { transform: scale(0); opacity: 0.6; }
          50% { transform: scale(2.5); opacity: 0.3; }
          100% { transform: scale(4); opacity: 0; }
        }
      `}</style>

      {/* Effects Layer */}
      <div style={{ position: "absolute", inset: 0, zIndex: 1 }}>
        {showClouds && <CloudLayer dark={["heavyrain", "thunder", "overcast"].includes(wType)} />}
        {showRain && <Raindrops count={isHeavy ? 80 : wType === "drizzle" ? 25 : 50} heavy={isHeavy} />}
        {showRain && <RainSplash count={isHeavy ? 20 : 10} />}
        {showSnow && <Snowflakes count={isHeavy ? 50 : 30} heavy={isHeavy} />}
        {showSun && <SunGlow />}
        {showFog && <FogLayer />}
        {showLightning && <Lightning />}
      </div>

      {/* Content */}
      <div style={{
        position: "relative", zIndex: 10, height: "100%", padding: "0 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        {/* Left */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{
            fontSize: 11, fontWeight: 500, letterSpacing: "0.15em",
            color: "rgba(255,255,255,0.4)", textTransform: "uppercase",
          }}>Mission Control</div>
          <div style={{
            fontSize: 20, fontWeight: 700, color: "rgba(255,255,255,0.92)",
            fontFamily: "'SF Pro Display', -apple-system, sans-serif",
          }}>Automation Command Center</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
            Unified operations for activity streams, deployments, inbox automation, and secure API vault.
          </div>
        </div>

        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: 28, flexShrink: 0 }}>
          {/* Weather */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 32, lineHeight: 1 }}>{info.icon}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <span style={{
                fontSize: 28, fontWeight: 700, color: "rgba(255,255,255,0.9)",
                fontFamily: "'SF Pro Display', -apple-system, sans-serif",
              }}>{temp}°</span>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)" }}>Feels like {feelsLike}°</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>
                {info.label} · {wind}mph {windDir} · {humidity}%
              </div>
            </div>
          </div>

          <div style={{ width: 1, height: 45, background: "rgba(255,255,255,0.08)" }} />

          {/* Clock */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{dateStr}</div>
            <div style={{ fontSize: 22, fontWeight: 600, color: "rgba(255,255,255,0.85)", letterSpacing: "0.02em" }}>
              {timeStr} <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>EST</span>
            </div>
            {precip > 0 && (
              <div style={{ fontSize: 10, color: "rgba(120,180,255,0.7)" }}>💧 {precip}mm precip</div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 20,
        background: "linear-gradient(transparent, rgba(6,13,24,0.5))",
        pointerEvents: "none", zIndex: 8,
      }} />
    </div>
  );
}
