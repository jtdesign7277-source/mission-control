'use client';

import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Loader2, RefreshCw, XCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

const REFRESH_INTERVAL_MS = 60000;
const X_JOB_ID = 'e7dea1ba';

const SCHEDULE = [
  '8:00 AM ET (weekdays)',
  '1:00 PM ET (weekdays)',
  '6:00 PM ET (weekdays)',
];

const CONTENT_PILLARS = [
  {
    title: '🚨 Breaking Market News',
    bullets: ['Earnings surprises, Fed moves, CPI data'],
    example: '🚨 CPI comes in hot at 3.4% - SPY dumping -1.2%',
  },
  {
    title: '🏛️ Political Trades',
    bullets: ['Nancy Pelosi, Congress stock trades'],
    example: '🏛️ Pelosi bought $K in calls. Again.',
  },
  {
    title: '📊 Trump/Policy Impact',
    bullets: ['Tariffs, executive orders, sector impacts'],
    example: '📊 Trump announces tariffs - Winners: X, Losers: Y',
  },
  {
    title: '💀 T Debt Crisis',
    bullets: ['National debt, treasury yields, market implications'],
    example: '💀 National debt: $36.2T - 10-year yield spiking',
  },
  {
    title: '🕯️ Chart Porn',
    bullets: ['TradingView candlestick charts, support/resistance'],
    example: '🕯️ SPY technical setup - Entry: 505, Target: 515',
  },
  {
    title: '🐋 Smart Money Signals',
    bullets: ['Dark pool activity, unusual options flow'],
    example: '🐋 $12M dropped on SPY puts - Smart money hedging',
  },
  {
    title: '⏰ Daily Watchlist',
    bullets: ['Pre-market movers, earnings calendar'],
    example: '⏰ Daily Watchlist - TSLA +2.1%, NVDA -1.4%',
  },
];

const VALIDATION_RULES = [
  {
    title: 'Price Accuracy (CRITICAL)',
    allowed: [
      'MUST call Twelve Data API first',
      'MUST verify price is real (not /bin/zsh.00 or fake)',
      'MUST match API response exactly',
    ],
    disallowed: [
      'NEVER use example prices ($500, $145, etc.)',
      'If API fails -> SKIP THE RUN',
    ],
  },
  {
    title: 'Chart Standards (TradingView Only)',
    allowed: [
      'Dark theme (#131722 or black)',
      'Green/red thick candles',
      'Volume bars below',
      '1-3 moving averages max (20/50/200 SMA)',
      'High-res (1200x675px minimum)',
      'Clean annotations (max 2-3)',
    ],
    disallowed: [
      'NO matplotlib/custom charts',
      'NO light backgrounds',
      'NO blurry/low-res images',
    ],
  },
  {
    title: 'Voice & Style',
    allowed: [
      'Bloomberg meets fintwit',
      'Sharp, data-driven, no fluff',
      'Emoji -> headline -> data -> take -> hashtags',
      '2-3 hashtags max',
    ],
    disallowed: [
      'NO hype ("TO THE MOON")',
      'NO generic commentary',
    ],
  },
];

const ROTATION_SCHEDULE = [
  'Monday AM: Breaking News or Daily Watchlist',
  'Monday PM: Political Trades or Chart Setup',
  'Tuesday AM: Trump/Policy or Smart Money',
  'Tuesday PM: Chart Porn or Daily Watchlist',
  'Wednesday AM: Debt Crisis or Breaking News',
  'Wednesday PM: Political Trades',
  'Thursday AM: Smart Money or Chart Setup',
  'Thursday PM: Breaking News or Daily Watchlist',
  'Friday PM: Chart Porn + "Going into next week"',
];

function formatTimestamp(value) {
  if (!value) return 'Not available';

  try {
    return new Date(value).toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'America/New_York',
      timeZoneName: 'short',
    });
  } catch {
    return 'Not available';
  }
}

function normalizeMetricValue(raw) {
  if (!raw) return '—';
  return raw.replace(/,/g, '');
}

function pickMetric(content, labels) {
  for (const label of labels) {
    const regex = new RegExp(`${label}\\s*[:=]\\s*([\\d,.]+(?:\\.\\d+)?[kKmM]?)`, 'i');
    const matched = content.match(regex);
    if (matched?.[1]) return normalizeMetricValue(matched[1]);
  }

  return '—';
}

function parseHeadline(run) {
  const title = String(run?.title || '').trim();
  if (title && title.toLowerCase() !== 'untitled') {
    return title.slice(0, 180);
  }

  const content = String(run?.content || '');
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*#>\d.)\s]+/, '').trim())
    .filter(Boolean);

  const picked = lines.find((line) => line.length >= 8) || 'Post body unavailable';
  return picked.slice(0, 180);
}

function mapRunToPost(run, index) {
  const content = String(run?.content || '');

  return {
    id: run?.id || `post-${index}`,
    headline: parseHeadline(run),
    likes: pickMetric(content, ['likes?', 'like_count']),
    reposts: pickMetric(content, ['reposts?', 'retweets?', 'repost_count']),
    replies: pickMetric(content, ['replies?', 'reply_count']),
    views: pickMetric(content, ['views?', 'impressions?']),
    createdAt: run?.createdAt || null,
  };
}

export default function XCronPage() {
  const [status, setStatus] = useState({
    enabled: null,
    lastRun: null,
    nextRun: null,
  });
  const [recentPosts, setRecentPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchDashboardData = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);

    try {
      const [statusResponse, runsResponse] = await Promise.all([
        fetch('/api/workflow', { cache: 'no-store' }),
        fetch(`/api/workflow/runs?jobId=${X_JOB_ID}`, { cache: 'no-store' }),
      ]);

      const statusPayload = await statusResponse.json().catch(() => ({}));
      const runsPayload = await runsResponse.json().catch(() => ({}));

      const jobs = Array.isArray(statusPayload?.jobs) ? statusPayload.jobs : [];
      const xJob = jobs.find((job) => job?.id === X_JOB_ID)
        || jobs.find((job) => String(job?.agent || '').toLowerCase().includes('xbot'))
        || jobs.find((job) => String(job?.name || '').toLowerCase().includes('x'));

      setStatus({
        enabled: typeof xJob?.enabled === 'boolean' ? xJob.enabled : null,
        lastRun: xJob?.last_run_at || null,
        nextRun: xJob?.nextRun || xJob?.next_run_at || null,
      });

      const runs = Array.isArray(runsPayload?.runs) ? runsPayload.runs : [];
      setRecentPosts(runs.slice(0, 5).map(mapRunToPost));

      const errors = [];
      if (!statusResponse.ok) errors.push(statusPayload?.error || 'Unable to load cron status');
      if (!runsResponse.ok) errors.push(runsPayload?.error || 'Unable to load recent posts');
      setError(errors.join(' · '));
    } catch {
      setError('Unable to load X cron data right now.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData(false);
    const timer = setInterval(() => fetchDashboardData(false), REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [fetchDashboardData]);

  const statusTone = status.enabled === true
    ? 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10'
    : status.enabled === false
      ? 'text-rose-300 border-rose-500/30 bg-rose-500/10'
      : 'text-zinc-300 border-white/10 bg-black/25';

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
              <h1 className="mt-3 text-2xl font-semibold text-zinc-100">X Post Cron Jobs - @stratify_hq</h1>
              <p className="mt-1 text-sm text-zinc-400">Auto-refresh every 60 seconds</p>
            </div>
            <button
              type="button"
              onClick={() => fetchDashboardData(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/5"
            >
              {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh
            </button>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <article className="rounded-2xl border border-white/10 bg-zinc-950/80 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-300">Schedule</h2>
            <ul className="mt-3 space-y-2 text-sm text-zinc-100">
              {SCHEDULE.map((slot) => (
                <li key={slot} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                  • {slot}
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-2xl border border-white/10 bg-zinc-950/80 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-300">Status</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className={`rounded-xl border p-3 ${statusTone}`}>
                <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Enabled</p>
                <p className="mt-2 text-sm font-semibold">
                  {loading ? 'Loading...' : status.enabled === true ? 'Enabled' : status.enabled === false ? 'Disabled' : 'Unknown'}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Last Run</p>
                <p className="mt-2 text-sm font-semibold text-zinc-200">{loading ? 'Loading...' : formatTimestamp(status.lastRun)}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Next Run</p>
                <p className="mt-2 text-sm font-semibold text-zinc-200">{loading ? 'Loading...' : formatTimestamp(status.nextRun)}</p>
              </div>
            </div>
          </article>
        </section>

        <section className="rounded-2xl border border-white/10 bg-zinc-950/80 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-300">Content Pillars (Rotate Daily)</h2>
          <div className="mt-4 space-y-3">
            {CONTENT_PILLARS.map((pillar, index) => (
              <article key={pillar.title} className="rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm font-semibold text-zinc-100">{index + 1}. {pillar.title}</p>
                <ul className="mt-2 space-y-1 text-sm text-zinc-300">
                  {pillar.bullets.map((bullet) => (
                    <li key={bullet}>- {bullet}</li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-zinc-500">
                  Example: <span className="text-zinc-400">{pillar.example}</span>
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-zinc-950/80 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-300">Validation Rules</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {VALIDATION_RULES.map((group) => (
              <article key={group.title} className="rounded-xl border border-white/10 bg-black/20 p-4">
                <h3 className="text-sm font-semibold text-zinc-100">{group.title}</h3>
                <div className="mt-3 space-y-2">
                  {group.allowed.map((rule) => (
                    <div key={rule} className="flex items-start gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-2">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" />
                      <p className="text-xs text-emerald-200">{rule}</p>
                    </div>
                  ))}
                  {group.disallowed.map((rule) => (
                    <div key={rule} className="flex items-start gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-2.5 py-2">
                      <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-300" />
                      <p className="text-xs text-rose-200">{rule}</p>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-zinc-950/80 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-300">Rotation Schedule</h2>
          <ul className="mt-3 grid gap-2 text-sm text-zinc-200 md:grid-cols-2">
            {ROTATION_SCHEDULE.map((item) => (
              <li key={item} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-white/10 bg-zinc-950/80 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-300">Recent Posts</h2>
          <p className="mt-1 text-xs text-zinc-500">Showing up to 5 latest runs with extracted engagement metrics.</p>

          <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
            <div className="grid min-w-[860px] grid-cols-[minmax(0,1fr)_80px_90px_90px_95px_180px] gap-2 bg-black/40 px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
              <span>Tweet</span>
              <span>Likes</span>
              <span>Reposts</span>
              <span>Replies</span>
              <span>Views</span>
              <span>Timestamp</span>
            </div>

            {loading && (
              <div className="flex items-center gap-2 px-3 py-4 text-sm text-zinc-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading recent posts...
              </div>
            )}

            {!loading && recentPosts.length === 0 && (
              <div className="px-3 py-5 text-sm text-zinc-500">No recent tweet runs found.</div>
            )}

            {!loading && recentPosts.map((post) => (
              <div
                key={post.id}
                className="grid min-w-[860px] grid-cols-[minmax(0,1fr)_80px_90px_90px_95px_180px] gap-2 border-t border-white/10 bg-black/20 px-3 py-3 text-sm"
              >
                <p className="truncate text-zinc-100">{post.headline}</p>
                <p className="text-zinc-300">{post.likes}</p>
                <p className="text-zinc-300">{post.reposts}</p>
                <p className="text-zinc-300">{post.replies}</p>
                <p className="text-zinc-300">{post.views}</p>
                <p className="text-xs text-zinc-500">{formatTimestamp(post.createdAt)}</p>
              </div>
            ))}
          </div>

          {error && (
            <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
              {error}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
