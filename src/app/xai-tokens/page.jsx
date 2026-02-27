'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowLeft, Clock3, ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

const REFRESH_INTERVAL_MS = 30000;
const DEFAULT_BREAKDOWN = [
  { name: 'TikTok Research', tokens: 0, percentage: 0, estimated: false },
  { name: 'Script', tokens: 0, percentage: 0, estimated: false },
  { name: 'Thumbnail', tokens: 0, percentage: 0, estimated: false },
];

function formatTokens(value) {
  return Number(value || 0).toLocaleString('en-US');
}

function formatTimestamp(value) {
  if (!value) return 'never';
  try {
    return new Date(value).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return 'never';
  }
}

function getGaugeTone(percentage) {
  if (percentage < 25) {
    return {
      stroke: '#f43f5e',
      text: 'text-rose-300',
      ring: 'ring-rose-500/40',
      chip: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
    };
  }

  if (percentage <= 50) {
    return {
      stroke: '#f59e0b',
      text: 'text-amber-300',
      ring: 'ring-amber-500/40',
      chip: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    };
  }

  return {
    stroke: '#22c55e',
    text: 'text-emerald-300',
    ring: 'ring-emerald-500/40',
    chip: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  };
}

function CircularGauge({ percentage }) {
  const safe = Number.isFinite(percentage) ? Math.min(100, Math.max(0, percentage)) : 0;
  const radius = 92;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safe / 100) * circumference;
  const tone = getGaugeTone(safe);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg viewBox="0 0 220 220" className="h-[220px] w-[220px]">
        <circle
          cx="110"
          cy="110"
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.12)"
          strokeWidth="14"
        />
        <circle
          cx="110"
          cy="110"
          r={radius}
          fill="none"
          stroke={tone.stroke}
          strokeLinecap="round"
          strokeWidth="14"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 110 110)"
          style={{ transition: 'stroke-dashoffset 400ms ease, stroke 400ms ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Remaining</p>
        <p className={`mt-2 text-4xl font-semibold ${tone.text}`}>{safe.toFixed(1)}%</p>
      </div>
    </div>
  );
}

export default function XaiTokensPage() {
  const [usage, setUsage] = useState({
    total_tokens: 0,
    used_tokens: 0,
    remaining_tokens: 0,
    percentage: 0,
    alert: false,
    cron_breakdown: DEFAULT_BREAKDOWN,
    updated_at: '',
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchUsage = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);

    try {
      const response = await fetch('/api/xai-usage', { cache: 'no-store' });
      const payload = await response.json();

      const nextUsage = {
        total_tokens: Number(payload?.total_tokens || 0),
        used_tokens: Number(payload?.used_tokens || 0),
        remaining_tokens: Number(payload?.remaining_tokens || 0),
        percentage: Number(payload?.percentage || 0),
        alert: Boolean(payload?.alert),
        cron_breakdown: Array.isArray(payload?.cron_breakdown) && payload.cron_breakdown.length > 0
          ? payload.cron_breakdown
          : DEFAULT_BREAKDOWN,
        updated_at: payload?.updated_at || new Date().toISOString(),
      };

      setUsage(nextUsage);
      setError(payload?.error || (!response.ok ? 'Unable to load xAI usage' : ''));
    } catch {
      setError('Unable to load xAI usage');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchUsage(false);
    const timer = setInterval(() => fetchUsage(false), REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [fetchUsage]);

  const tone = useMemo(() => getGaugeTone(usage.percentage), [usage.percentage]);

  return (
    <main className="min-h-screen bg-transparent px-6 py-6 text-zinc-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <section className="rounded-2xl border border-white/10 bg-zinc-950/80 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-white/5"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Mission Control
              </Link>
              <h1 className="mt-3 text-2xl font-semibold text-zinc-100">XAI Token Timer</h1>
              <p className="mt-1 text-sm text-zinc-400">Auto-refresh every 30 seconds</p>
            </div>
            <button
              type="button"
              onClick={() => fetchUsage(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/5"
            >
              {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh
            </button>
          </div>
        </section>

        {usage.alert && (
          <section className="rounded-xl border border-rose-500/35 bg-rose-500/10 p-4">
            <div className="flex items-center gap-2 text-rose-300">
              <AlertTriangle className="h-4 w-4" />
              <p className="text-sm font-semibold">Low Token Balance - Purchase More Credits</p>
            </div>
          </section>
        )}

        <section className="grid gap-5 lg:grid-cols-[360px_1fr]">
          <article className={`rounded-2xl border border-white/10 bg-zinc-950/80 p-5 text-center ring-1 ${tone.ring}`}>
            {loading ? (
              <div className="flex h-[220px] items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
              </div>
            ) : (
              <CircularGauge percentage={usage.percentage} />
            )}
            <a
              href="https://console.x.ai/billing"
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300 transition hover:bg-emerald-500/20"
            >
              Purchase More
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </article>

          <article className="rounded-2xl border border-white/10 bg-zinc-950/80 p-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-black/25 p-4">
                <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Total Tokens</p>
                <p className="mt-2 text-2xl font-semibold text-zinc-100">{formatTokens(usage.total_tokens)}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/25 p-4">
                <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Used Tokens</p>
                <p className="mt-2 text-2xl font-semibold text-zinc-100">{formatTokens(usage.used_tokens)}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/25 p-4">
                <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Remaining</p>
                <p className="mt-2 text-2xl font-semibold text-zinc-100">{formatTokens(usage.remaining_tokens)}</p>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-300">Cron Job Breakdown</h2>
                <span className={`rounded-full border px-2 py-1 text-[11px] ${tone.chip}`}>
                  {usage.percentage.toFixed(1)}% remaining
                </span>
              </div>

              <div className="space-y-2">
                {usage.cron_breakdown.map((job) => (
                  <div key={job.name} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/25 px-3 py-2">
                    <div>
                      <p className="text-sm text-zinc-200">{job.name}</p>
                      <p className="text-[11px] text-zinc-500">
                        {Number(job.percentage || 0).toFixed(1)}% of used tokens
                        {job.estimated ? ' (estimated)' : ''}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-zinc-100">{formatTokens(job.tokens)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
              <Clock3 className="h-3.5 w-3.5" />
              <span>Last updated: {formatTimestamp(usage.updated_at)}</span>
            </div>

            {error && (
              <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
                {error}
              </p>
            )}
          </article>
        </section>
      </div>
    </main>
  );
}
