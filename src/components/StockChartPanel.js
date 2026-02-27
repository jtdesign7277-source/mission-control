'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, RefreshCw, Wifi, WifiOff } from 'lucide-react';

const HighchartsReact = dynamic(() => import('highcharts-react-official'), { ssr: false });

const SYMBOL_OPTIONS = ['AAPL', 'NVDA', 'TSLA', 'SPY', 'QQQ', 'MSFT', 'GOOGL', 'AMZN', 'META', 'AMD'];
const DEFAULT_SYMBOL = 'AAPL';
const TWELVE_DATA_WS_URL = 'wss://ws.twelvedata.com/v1/quotes/price';
const TWELVE_DATA_HISTORY_URL = 'https://api.twelvedata.com/time_series';
const MAX_POINTS = 500;
const EMPTY_SERIES = { ohlc: [], volume: [] };

function toNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : NaN;
}

function parseTimestamp(value) {
  if (value === null || value === undefined || value === '') return NaN;

  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    return numeric > 1e12 ? numeric : numeric * 1000;
  }

  const raw = String(value).trim();
  if (!raw) return NaN;

  const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T');
  const utcCandidate = normalized.endsWith('Z') ? normalized : `${normalized}Z`;
  const utcParsed = Date.parse(utcCandidate);
  if (Number.isFinite(utcParsed)) return utcParsed;

  const localParsed = Date.parse(normalized);
  if (Number.isFinite(localParsed)) return localParsed;

  return NaN;
}

function toMinuteBucket(timestampMs) {
  return Math.floor(timestampMs / 60000) * 60000;
}

function formatCompactVolume(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '0';
  if (numeric >= 1_000_000_000) return `${(numeric / 1_000_000_000).toFixed(2)} B`;
  if (numeric >= 1_000_000) return `${(numeric / 1_000_000).toFixed(2)} M`;
  if (numeric >= 1_000) return `${(numeric / 1_000).toFixed(1)} K`;
  return numeric.toFixed(0);
}

function toPriceString(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '0.00';
  return numeric.toFixed(2);
}

function parseHistory(values) {
  if (!Array.isArray(values)) return EMPTY_SERIES;

  const points = values
    .map((entry) => {
      const timestamp = parseTimestamp(entry?.datetime);
      const open = toNumber(entry?.open);
      const high = toNumber(entry?.high);
      const low = toNumber(entry?.low);
      const close = toNumber(entry?.close);
      const volume = toNumber(entry?.volume);

      if (
        !Number.isFinite(timestamp) ||
        !Number.isFinite(open) ||
        !Number.isFinite(high) ||
        !Number.isFinite(low) ||
        !Number.isFinite(close)
      ) {
        return null;
      }

      return {
        timestamp,
        open,
        high,
        low,
        close,
        volume: Number.isFinite(volume) ? Math.max(volume, 0) : 0,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-MAX_POINTS);

  const ohlc = points.map((point) => [point.timestamp, point.open, point.high, point.low, point.close]);
  const volume = points.map((point) => [
    point.timestamp,
    point.volume,
    point.close >= point.open ? 'volume-up' : 'volume-down',
  ]);

  return { ohlc, volume };
}

function parseTick(payload) {
  if (!payload || typeof payload !== 'object') return null;

  const price = toNumber(payload.price ?? payload.close ?? payload.value);
  if (!Number.isFinite(price)) return null;

  return {
    symbol: String(payload.symbol || '').toUpperCase(),
    price,
    timestamp: payload.timestamp ?? payload.datetime ?? payload.time,
    dayVolume: toNumber(payload.day_volume),
    tradeVolume: toNumber(payload.volume ?? payload.size),
  };
}

function ConnectionStatus({ state }) {
  const isOnline = state === 'connected';
  const text = state === 'reconnecting' ? 'Reconnecting' : state.charAt(0).toUpperCase() + state.slice(1);

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] ${
        isOnline
          ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300'
          : 'border-amber-400/30 bg-amber-500/10 text-amber-300'
      }`}
    >
      {isOnline ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
      {text}
    </span>
  );
}

export default function StockChartPanel({ compact = false }) {
  const apiKey = process.env.NEXT_PUBLIC_TWELVE_DATA_API_KEY;

  const [symbol, setSymbol] = useState(DEFAULT_SYMBOL);
  const [highchartsLib, setHighchartsLib] = useState(null);
  const [seriesData, setSeriesData] = useState(EMPTY_SERIES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [connectionState, setConnectionState] = useState('idle');
  const [refreshNonce, setRefreshNonce] = useState(0);

  const previousDayVolumeRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const loadHighcharts = async () => {
      try {
        const highstockModule = await import('highcharts/highstock');
        const highcharts = highstockModule.default || highstockModule;
        const priceIndicatorModule = await import('highcharts/modules/price-indicator');
        const initPriceIndicator = priceIndicatorModule.default || priceIndicatorModule;

        if (typeof initPriceIndicator === 'function') {
          initPriceIndicator(highcharts);
        }

        if (!cancelled) {
          setHighchartsLib(highcharts);
        }
      } catch {
        if (!cancelled) {
          setError('Failed to load charting library.');
        }
      }
    };

    loadHighcharts();

    return () => {
      cancelled = true;
    };
  }, []);

  const fetchHistory = useCallback(
    async (nextSymbol) => {
      if (!apiKey) {
        setLoading(false);
        setSeriesData(EMPTY_SERIES);
        setError('Missing NEXT_PUBLIC_TWELVE_DATA_API_KEY in environment.');
        return false;
      }

      setLoading(true);
      setError('');
      previousDayVolumeRef.current = null;

      try {
        const url = new URL(TWELVE_DATA_HISTORY_URL);
        url.searchParams.set('symbol', nextSymbol);
        url.searchParams.set('interval', '1min');
        url.searchParams.set('outputsize', String(MAX_POINTS));
        url.searchParams.set('timezone', 'UTC');
        url.searchParams.set('apikey', apiKey);

        const response = await fetch(url.toString(), { cache: 'no-store' });
        const payload = await response.json();

        if (!response.ok || payload?.status === 'error') {
          throw new Error(payload?.message || 'Failed to fetch historical candles');
        }

        const nextSeriesData = parseHistory(payload?.values);
        if (!nextSeriesData.ohlc.length) {
          throw new Error('No historical candle data available for selected symbol.');
        }

        setSeriesData(nextSeriesData);
        return true;
      } catch (err) {
        setSeriesData(EMPTY_SERIES);
        setError(err?.message || 'Failed to fetch historical candles');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [apiKey]
  );

  const applyTick = useCallback((tick) => {
    const price = toNumber(tick?.price);
    if (!Number.isFinite(price)) return;

    const timestamp = parseTimestamp(tick?.timestamp);
    const minuteBucket = toMinuteBucket(Number.isFinite(timestamp) ? timestamp : Date.now());

    let minuteVolumeIncrement = 0;
    const dayVolume = toNumber(tick?.dayVolume);
    if (Number.isFinite(dayVolume)) {
      const previousDayVolume = previousDayVolumeRef.current;
      if (Number.isFinite(previousDayVolume) && dayVolume >= previousDayVolume) {
        minuteVolumeIncrement = dayVolume - previousDayVolume;
      }
      previousDayVolumeRef.current = dayVolume;
    } else {
      const tradeVolume = toNumber(tick?.tradeVolume);
      minuteVolumeIncrement = Number.isFinite(tradeVolume) ? Math.max(tradeVolume, 0) : 1;
    }

    setSeriesData((prev) => {
      if (!prev.ohlc.length) return prev;

      const nextOhlc = [...prev.ohlc];
      const nextVolume = [...prev.volume];
      const lastCandle = nextOhlc[nextOhlc.length - 1];
      const lastVolume = nextVolume[nextVolume.length - 1];
      const lastTimestamp = lastCandle?.[0];

      if (!Number.isFinite(lastTimestamp) || minuteBucket < lastTimestamp) {
        return prev;
      }

      if (minuteBucket === lastTimestamp) {
        const open = lastCandle[1];
        const high = Math.max(lastCandle[2], price);
        const low = Math.min(lastCandle[3], price);
        const close = price;

        nextOhlc[nextOhlc.length - 1] = [lastTimestamp, open, high, low, close];

        const priorVolume = Number(lastVolume?.[1]) || 0;
        const mergedVolume = priorVolume + Math.max(0, minuteVolumeIncrement);
        nextVolume[nextVolume.length - 1] = [
          lastTimestamp,
          mergedVolume,
          close >= open ? 'volume-up' : 'volume-down',
        ];

        return { ohlc: nextOhlc, volume: nextVolume };
      }

      const priorClose = lastCandle?.[4];
      nextOhlc.push([minuteBucket, price, price, price, price]);
      nextVolume.push([
        minuteBucket,
        Math.max(0, minuteVolumeIncrement),
        Number.isFinite(priorClose) && price < priorClose ? 'volume-down' : 'volume-up',
      ]);

      if (nextOhlc.length > MAX_POINTS) nextOhlc.shift();
      if (nextVolume.length > MAX_POINTS) nextVolume.shift();

      return { ohlc: nextOhlc, volume: nextVolume };
    });
  }, []);

  useEffect(() => {
    if (!apiKey) {
      setConnectionState('disconnected');
      return;
    }

    let cancelled = false;
    let socket = null;
    let reconnectTimer = null;
    let reconnectAttempt = 0;

    const clearReconnectTimer = () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };

    const scheduleReconnect = () => {
      if (cancelled) return;

      clearReconnectTimer();
      reconnectAttempt += 1;
      const delay = Math.min(1000 * 2 ** (reconnectAttempt - 1), 15000);
      setConnectionState('reconnecting');

      reconnectTimer = setTimeout(() => {
        if (!cancelled) {
          openSocket();
        }
      }, delay);
    };

    const openSocket = () => {
      if (cancelled) return;

      setConnectionState(reconnectAttempt > 0 ? 'reconnecting' : 'connecting');
      const wsUrl = `${TWELVE_DATA_WS_URL}?apikey=${encodeURIComponent(apiKey)}`;
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        if (cancelled) return;

        reconnectAttempt = 0;
        setConnectionState('connected');

        socket.send(
          JSON.stringify({
            action: 'subscribe',
            params: { symbols: symbol },
          })
        );
      };

      socket.onmessage = (event) => {
        if (cancelled) return;

        let payload;
        try {
          payload = JSON.parse(event.data);
        } catch {
          return;
        }

        if (payload?.event === 'heartbeat') {
          return;
        }

        if (payload?.event === 'error' || payload?.status === 'error') {
          setError(payload?.message || 'Live stream error from Twelve Data');
          return;
        }

        const tick = parseTick(payload);
        if (!tick) return;
        if (tick.symbol && tick.symbol !== symbol) return;

        applyTick(tick);
      };

      socket.onerror = () => {
        if (cancelled) return;
        socket?.close();
      };

      socket.onclose = () => {
        if (cancelled) return;
        setConnectionState('disconnected');
        scheduleReconnect();
      };
    };

    const start = async () => {
      const historyReady = await fetchHistory(symbol);
      if (!historyReady || cancelled) {
        if (!cancelled) setConnectionState('disconnected');
        return;
      }

      openSocket();
    };

    start();

    return () => {
      cancelled = true;
      clearReconnectTimer();

      if (socket) {
        socket.onopen = null;
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;

        if (socket.readyState === WebSocket.CONNECTING || socket.readyState === WebSocket.OPEN) {
          socket.close();
        }
      }
    };
  }, [apiKey, symbol, refreshNonce, fetchHistory, applyTick]);

  const chartOptions = useMemo(() => {
    const lastClose = seriesData.ohlc[seriesData.ohlc.length - 1]?.[4];

    return {
      chart: {
        styledMode: true,
        backgroundColor: '#0a0a0a',
        height: compact ? 340 : 560,
        spacing: [12, 12, 12, 12],
      },
      title: { text: undefined },
      credits: { enabled: false },
      legend: { enabled: false },
      accessibility: { enabled: false },
      time: { useUTC: true },
      xAxis: {
        crosshair: {
          className: 'highcharts-crosshair-custom',
          enabled: true,
        },
        lineColor: '#27272a',
        tickColor: '#27272a',
        labels: {
          style: {
            color: '#a1a1aa',
            fontSize: '11px',
            fontFamily:
              'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          },
        },
      },
      yAxis: [
        {
          title: { text: 'price (USD)' },
          crosshair: {
            snap: false,
            className: 'highcharts-crosshair-custom',
            enabled: true,
            label: {
              className: 'highcharts-crosshair-custom-label',
              enabled: true,
              format: '{value:.2f}',
            },
          },
          labels: {
            align: 'left',
            x: 4,
            style: {
              color: '#a1a1aa',
              fontSize: '11px',
              fontFamily:
                'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            },
          },
          height: '70%',
          lineWidth: 1,
          resize: { enabled: true },
        },
        {
          title: { text: 'volume' },
          crosshair: {
            className: 'highcharts-crosshair-custom',
            snap: false,
            enabled: true,
            label: {
              className: 'highcharts-crosshair-custom-label',
              enabled: true,
              formatter() {
                return formatCompactVolume(this.value);
              },
            },
          },
          labels: {
            align: 'left',
            x: 4,
            formatter() {
              return formatCompactVolume(this.value);
            },
            style: {
              color: '#a1a1aa',
              fontSize: '11px',
              fontFamily:
                'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            },
          },
          top: '70%',
          height: '30%',
          offset: 0,
          lineWidth: 1,
        },
      ],
      navigator: {
        xAxis: {
          labels: { enabled: false },
        },
      },
      scrollbar: { enabled: false },
      tooltip: {
        shape: 'square',
        split: false,
        shared: true,
        useHTML: true,
        fixed: true,
        headerShape: 'callout',
        formatter() {
          const points = this.points || [];
          const candlePoint = points.find((point) => point.series?.type === 'candlestick') || this.point;
          if (!candlePoint) return false;

          const volumePoint = points.find((point) => point.series?.type === 'column');

          const open = Number(candlePoint.open ?? candlePoint.point?.open);
          const high = Number(candlePoint.high ?? candlePoint.point?.high);
          const low = Number(candlePoint.low ?? candlePoint.point?.low);
          const close = Number(candlePoint.close ?? candlePoint.point?.close);
          const delta = close - open;
          const pct = close ? (delta / close) * 100 : 0;
          const color = delta >= 0 ? '#51af7b' : '#ff6e6e';
          const volumeLabel = formatCompactVolume(volumePoint?.y || 0);

          return `<span style="font-size:1.05em;color:#e4e4e7;">${symbol}</span> O<span style="color:${color};">${toPriceString(open)}</span> H<span style="color:${color};">${toPriceString(high)}</span> L<span style="color:${color};">${toPriceString(low)}</span> C<span style="color:${color};">${toPriceString(close)} ${delta.toFixed(2)} ${pct.toFixed(2)}%</span><br/>Volume <span style="color:${color};">${volumeLabel}</span>`;
        },
      },
      plotOptions: {
        series: {
          dataGrouping: {
            enabled: false,
          },
          animation: false,
        },
        candlestick: {
          color: '#ff6e6e',
          upColor: '#51af7b',
          lineColor: '#ff6e6e',
          upLineColor: '#51af7b',
        },
      },
      series: [
        {
          type: 'candlestick',
          id: `${symbol.toLowerCase()}-ohlc`,
          name: `${symbol} Stock Price`,
          lastPrice: {
            enabled: true,
            color: Number.isFinite(lastClose) ? (lastClose >= seriesData.ohlc[seriesData.ohlc.length - 1]?.[1] ? '#51af7b' : '#ff6e6e') : '#a1a1aa',
            label: {
              enabled: true,
              align: 'left',
              x: 8,
              className: 'highcharts-last-price-label',
            },
          },
          data: seriesData.ohlc,
        },
        {
          type: 'column',
          keys: ['x', 'y', 'className'],
          id: `${symbol.toLowerCase()}-volume`,
          name: `${symbol} Volume`,
          lastPrice: {
            enabled: true,
            label: {
              enabled: true,
              align: 'left',
              x: 8,
              className: 'highcharts-last-price-label',
              formatter() {
                return formatCompactVolume(this.value);
              },
            },
          },
          data: seriesData.volume,
          yAxis: 1,
        },
      ],
      rangeSelector: {
        verticalAlign: 'bottom',
        inputEnabled: false,
        selected: 3,
        buttons: [
          { type: 'minute', count: 15, text: '15m' },
          { type: 'hour', count: 1, text: '1h' },
          { type: 'hour', count: 4, text: '4h' },
          { type: 'day', count: 1, text: '1d' },
          { type: 'all', text: 'All' },
        ],
      },
      responsive: {
        rules: [
          {
            condition: { maxWidth: 900 },
            chartOptions: {
              chart: {
                height: compact ? 300 : 470,
              },
              rangeSelector: {
                buttons: [
                  { type: 'minute', count: 30, text: '30m' },
                  { type: 'hour', count: 1, text: '1h' },
                  { type: 'day', count: 1, text: '1d' },
                  { type: 'all', text: 'All' },
                ],
              },
            },
          },
          {
            condition: { maxWidth: 640 },
            chartOptions: {
              chart: {
                height: compact ? 260 : 360,
              },
              navigator: { enabled: false },
              yAxis: [
                {
                  labels: { align: 'right', x: -4 },
                },
                {
                  labels: { align: 'right', x: -4 },
                },
              ],
            },
          },
        ],
      },
    };
  }, [compact, seriesData.ohlc, seriesData.volume, symbol]);

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-800 bg-zinc-950 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="chart-symbol-select" className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
            Symbol
          </label>
          <select
            id="chart-symbol-select"
            value={symbol}
            onChange={(event) => setSymbol(event.target.value)}
            className="rounded-md border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-zinc-100 outline-none transition focus:border-emerald-500/40"
          >
            {SYMBOL_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <ConnectionStatus state={connectionState} />
          <button
            type="button"
            onClick={() => setRefreshNonce((prev) => prev + 1)}
            className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-[11px] text-zinc-300 transition hover:bg-white/5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reload
          </button>
        </div>
      </div>

      <div className="highcharts-dark-theme relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 p-2">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-950/75">
            <div className="inline-flex items-center gap-2 text-sm text-zinc-300">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading {symbol} candles...
            </div>
          </div>
        )}

        {!loading && !seriesData.ohlc.length && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-950/90 text-sm text-zinc-400">
            No chart data yet.
          </div>
        )}

        {highchartsLib ? (
          <HighchartsReact highcharts={highchartsLib} constructorType="stockChart" options={chartOptions} />
        ) : (
          <div className="flex h-[280px] items-center justify-center text-sm text-zinc-500">Loading chart library...</div>
        )}
      </div>

      {error ? (
        <p className="rounded-md border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">{error}</p>
      ) : null}
    </section>
  );
}
