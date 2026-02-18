'use client';

import { useEffect, useState } from 'react';

function RainDrops({ count = 60 }) {
  return (
    <>
      {Array(count)
        .fill(0)
        .map((_, i) => (
          <div
            key={i}
            className="absolute w-[1px] rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${-10 - Math.random() * 20}%`,
              height: `${12 + Math.random() * 18}px`,
              background: `rgba(160, 200, 255, ${0.15 + Math.random() * 0.25})`,
              animation: `rainfall ${0.6 + Math.random() * 0.8}s linear ${Math.random() * 2}s infinite`,
            }}
          />
        ))}
    </>
  );
}

function SnowFlakes({ count = 70 }) {
  return (
    <>
      {Array(count)
        .fill(0)
        .map((_, i) => {
          const size = 2 + Math.random() * 4;
          return (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${-5 - Math.random() * 15}%`,
                width: `${size}px`,
                height: `${size}px`,
                background: `rgba(255, 255, 255, ${0.2 + Math.random() * 0.4})`,
                animation: `snowfall ${4 + Math.random() * 6}s linear ${Math.random() * 5}s infinite`,
              }}
            />
          );
        })}
    </>
  );
}

function Lightning() {
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    let timeout;
    const scheduleFlash = () => {
      const delay = 5000 + Math.random() * 10000;
      timeout = setTimeout(() => {
        setFlash(true);
        setTimeout(() => setFlash(false), 200);
        scheduleFlash();
      }, delay);
    };
    scheduleFlash();
    return () => clearTimeout(timeout);
  }, []);

  if (!flash) return null;

  return (
    <div
      className="absolute inset-0"
      style={{ animation: 'lightning 0.5s ease-out forwards' }}
    />
  );
}

function Clouds({ count = 4, dark = false }) {
  return (
    <>
      {Array(count)
        .fill(0)
        .map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              top: `${5 + Math.random() * 30}%`,
              left: `-20%`,
              width: `${200 + Math.random() * 200}px`,
              height: `${40 + Math.random() * 40}px`,
              background: dark
                ? `rgba(30, 30, 40, ${0.15 + Math.random() * 0.1})`
                : `rgba(180, 180, 200, ${0.06 + Math.random() * 0.06})`,
              filter: 'blur(30px)',
              animation: `cloud-drift ${40 + Math.random() * 40}s linear ${Math.random() * 20}s infinite`,
            }}
          />
        ))}
    </>
  );
}

function FogLayers() {
  return (
    <>
      {Array(5)
        .fill(0)
        .map((_, i) => (
          <div
            key={i}
            className="absolute w-[120%]"
            style={{
              top: `${15 + i * 15}%`,
              left: '-10%',
              height: `${60 + Math.random() * 40}px`,
              background: `rgba(200, 200, 210, ${0.04 + Math.random() * 0.04})`,
              filter: 'blur(40px)',
              animation: `fog-drift ${20 + Math.random() * 15}s ease-in-out ${Math.random() * 10}s infinite alternate`,
            }}
          />
        ))}
    </>
  );
}

function SunGlow() {
  return (
    <div
      className="absolute -top-[10%] -right-[10%] w-[50vw] h-[50vw] rounded-full"
      style={{
        background: 'radial-gradient(circle, rgba(255, 180, 50, 0.12) 0%, transparent 70%)',
        animation: 'sun-pulse 8s ease-in-out infinite',
      }}
    />
  );
}

function MoonGlow() {
  return (
    <div
      className="absolute -top-[5%] -right-[5%] w-[30vw] h-[30vw] rounded-full"
      style={{
        background: 'radial-gradient(circle, rgba(200, 210, 255, 0.08) 0%, transparent 70%)',
        animation: 'sun-pulse 10s ease-in-out infinite',
      }}
    />
  );
}

export default function WeatherEffects({ condition, isDay }) {
  if (!condition) return null;

  let tintClass = '';
  let content = null;

  switch (condition) {
    case 'rain':
    case 'drizzle':
      tintClass = 'bg-blue-900/5';
      content = <RainDrops count={condition === 'drizzle' ? 40 : 70} />;
      break;
    case 'snow':
      tintClass = 'bg-blue-200/5';
      content = <SnowFlakes />;
      break;
    case 'storm':
      tintClass = 'bg-purple-900/10';
      content = (
        <>
          <RainDrops count={110} />
          <Lightning />
        </>
      );
      break;
    case 'clear':
      if (isDay) {
        tintClass = 'bg-amber-500/[0.03]';
        content = <SunGlow />;
      } else {
        tintClass = 'bg-indigo-950/10';
        content = <MoonGlow />;
      }
      break;
    case 'cloudy':
      tintClass = isDay ? 'bg-zinc-500/5' : 'bg-zinc-800/10';
      content = <Clouds dark={!isDay} />;
      break;
    case 'fog':
      tintClass = 'bg-zinc-400/10';
      content = <FogLayers />;
      break;
    default:
      return null;
  }

  return (
    <div
      className={`fixed inset-0 pointer-events-none overflow-hidden ${tintClass}`}
      style={{ zIndex: 1 }}
    >
      {content}
    </div>
  );
}
