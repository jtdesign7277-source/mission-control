'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  Bird,
  DollarSign,
  ExternalLink,
  Github,
  Globe,
  Loader2,
  Radio,
  RefreshCw,
  Rocket,
  Users,
  Zap,
} from 'lucide-react';

const REFRESH_MS = 60000;

const QUICK_ACTIONS = [
  { label: '📈 SPY Chart', href: 'https://www.tradingview.com/chart/?symbol=SPY' },
  { label: '🏈 Live Sports', href: 'https://www.espn.com/watch/' },
  { label: '🚀 Open Vercel Dashboard', href: 'https://vercel.com' },
  { label: '💳 Open Stripe Dashboard', href: 'https://dashboard.stripe.com' },
  { label: '📊 Open X Analytics', href: 'https://analytics.twitter.com' },
  { label: '🐙 View GitHub', href: 'https://github.com/jtdesign7277-source/stratify' },
  { label: '💬 Discord Server', href: 'https://discord.gg/6RPsREggYV' },
  { label: '📝 Open Reddit', href: 'https://www.reddit.com/user/Worry-Mountain' },
  { label: '🛡️ Sentry Errors', href: 'https://jeff-thompson-uy.sentry.io/issues/?project=4510920320811008' },
];

function isNil(value) {
  return value === null || value === undefined;
}

function formatNumber(value) {
  if (isNil(value)) return '—';
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '—';
  return numeric.toLocaleString();
}

function formatCurrency(value) {
  if (isNil(value)) return '—';
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '—';
  return `$${numeric.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function formatRelativeTime(timestamp) {
  if (!timestamp) return '—';

  const target = new Date(timestamp).getTime();
  if (!Number.isFinite(target)) return '—';

  const deltaSeconds = Math.floor((Date.now() - target) / 1000);
  if (deltaSeconds < 60) return 'just now';
  if (deltaSeconds < 3600) {
    const minutes = Math.floor(deltaSeconds / 60);
    return `${minutes}m ago`;
  }
  if (deltaSeconds < 86400) {
    const hours = Math.floor(deltaSeconds / 3600);
    return `${hours}h ago`;
  }
  const days = Math.floor(deltaSeconds / 86400);
  return `${days}d ago`;
}

function formatTimestamp(timestamp) {
  if (!timestamp) return '—';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  });
}

function MetricCard({ icon: Icon, accentClass, label, primaryValue, details }) {
  return (
    <article className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className={`text-xs uppercase tracking-widest text-zinc-500`}>{label}</p>
        <Icon className={`h-4 w-4 ${accentClass}`} />
      </div>
      <p className="mt-3 text-3xl font-bold text-zinc-100">{primaryValue}</p>
      <div className="mt-3 space-y-1">
        {details.map((detail) => (
          <p key={detail.label} className="text-xs text-zinc-400">
            <span className="uppercase tracking-wider text-zinc-500">{detail.label}:</span> {detail.value}
          </p>
        ))}
      </div>
    </article>
  );
}

function HealthCard({ title, href, detail, statusLabel, statusClass, icon: Icon }) {
  return (
    <article className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-medium text-zinc-100">
          {Icon ? <Icon className="h-3.5 w-3.5 text-zinc-400" /> : null}
          {title}
        </p>
        <span className="inline-flex items-center gap-2 text-xs text-zinc-400">
          <span className={`h-2 w-2 rounded-full ${statusClass}`} />
          {statusLabel}
        </span>
      </div>

      <p className="mt-2 text-xs text-zinc-500">{detail}</p>

      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-flex items-center gap-1 text-xs text-zinc-300 transition hover:text-white"
      >
        Open
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </article>
  );
}

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(60);

  const fetchAnalytics = useCallback(async ({ initial = false } = {}) => {
    if (initial) {
      setLoading(true);
    }

    setRefreshing(true);
    try {
      const res = await fetch('/api/analytics', { cache: 'no-store' });
      const payload = await res.json();

      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to load analytics');
      }

      setAnalytics(payload);
      setError('');
      setCountdown(60);
    } catch (err) {
      setError(err?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics({ initial: true });
    const refreshTimer = setInterval(() => {
      fetchAnalytics();
    }, REFRESH_MS);

    return () => clearInterval(refreshTimer);
  }, [fetchAnalytics]);

  useEffect(() => {
    const countdownTimer = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 60 : prev - 1));
    }, 1000);

    return () => clearInterval(countdownTimer);
  }, []);

  const twitter = analytics?.twitter || {};
  const discord = analytics?.discord || {};
  const stripe = analytics?.stripe || {};
  const github = analytics?.github || {};
  const vercel = analytics?.vercel || {};

  const health = useMemo(() => {
    const vercelLoaded = !isNil(vercel.deployments);
    const twitterLoaded = !isNil(twitter.followers) || !isNil(twitter.tweets);
    const apiAlive = Boolean(analytics?.timestamp);

    return {
      vercelLoaded,
      twitterLoaded,
      apiAlive,
    };
  }, [analytics?.timestamp, twitter.followers, twitter.tweets, vercel.deployments]);

  if (loading && !analytics) {
    return (
      <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-8">
        <div className="flex items-center justify-center gap-2 text-zinc-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading analytics...
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-100">
              <BarChart3 className="h-4 w-4 text-zinc-200" />
              Analytics Dashboard
            </h2>
            <p className="mt-1 text-xs uppercase tracking-widest text-zinc-500">Live platform metrics</p>
          </div>
          <button
            type="button"
            onClick={() => fetchAnalytics()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/70 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-900"
            disabled={refreshing}
          >
            {refreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Refresh
          </button>
        </div>

        {error ? <p className="mt-3 text-xs text-rose-300">{error}</p> : null}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          icon={Bird}
          accentClass="text-sky-400"
          label="Twitter / X"
          primaryValue={formatNumber(twitter.followers)}
          details={[
            { label: 'Following', value: formatNumber(twitter.following) },
            { label: 'Tweets', value: formatNumber(twitter.tweets) },
          ]}
        />

        <MetricCard
          icon={Users}
          accentClass="text-violet-400"
          label="Discord"
          primaryValue={formatNumber(discord.members)}
          details={[
            { label: 'Online', value: formatNumber(discord.online) },
            { label: 'Guild', value: discord.guildName || '—' },
          ]}
        />

        <MetricCard
          icon={DollarSign}
          accentClass="text-emerald-400"
          label="Stripe"
          primaryValue={formatNumber(stripe.subscribers)}
          details={[
            { label: 'MRR', value: formatCurrency(stripe.mrr) },
            { label: 'Customers', value: formatNumber(stripe.totalCustomers) },
          ]}
        />

        <MetricCard
          icon={Github}
          accentClass="text-zinc-300"
          label="GitHub"
          primaryValue={formatNumber(github.stars)}
          details={[
            { label: 'Forks', value: formatNumber(github.forks) },
            { label: 'Watchers', value: formatNumber(github.watchers) },
          ]}
        />

        <MetricCard
          icon={Rocket}
          accentClass="text-white"
          label="Vercel"
          primaryValue={formatNumber(vercel.deployments)}
          details={[
            { label: 'Latest Deploy', value: formatRelativeTime(vercel.latestDeploy) },
            { label: 'Status', value: health.vercelLoaded ? 'Connected' : 'Missing API key' },
          ]}
        />
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
          <Activity className="h-4 w-4 text-zinc-200" />
          Growth Tracker
        </h3>
        <p className="mt-2 text-sm text-zinc-300">Growth tracking starts now.</p>
        <p className="mt-1 text-xs text-zinc-500">Cron snapshots this data daily so trend charts can populate over time.</p>

        <div className="mt-4 rounded-xl border border-dashed border-zinc-700 bg-zinc-900/40 p-4">
          <div className="flex h-20 items-end gap-2">
            {[16, 22, 18, 26, 24, 31, 28, 34, 30, 36, 33, 39].map((height, index) => (
              <div
                key={`spark-${index}`}
                className="w-full rounded-sm bg-zinc-700/60"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
          <p className="mt-3 text-xs text-zinc-500">
            Daily snapshots: Twitter followers, Discord members, Stripe MRR, GitHub stars
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
          <Globe className="h-4 w-4 text-zinc-200" />
          Platform Health
        </h3>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <HealthCard
            title="Stratify Frontend"
            href="https://stratify-black.vercel.app"
            detail={`Deployments: ${formatNumber(vercel.deployments)}`}
            statusLabel={health.vercelLoaded ? 'Online' : 'Waiting for data'}
            statusClass={health.vercelLoaded ? 'bg-emerald-400' : 'bg-zinc-500'}
            icon={Rocket}
          />

          <HealthCard
            title="Mission Control"
            href="https://mission-control-seven-henna.vercel.app"
            detail={`Last deploy: ${formatRelativeTime(vercel.latestDeploy)}`}
            statusLabel={health.vercelLoaded ? 'Online' : 'Waiting for data'}
            statusClass={health.vercelLoaded ? 'bg-emerald-400' : 'bg-zinc-500'}
            icon={BarChart3}
          />

          <HealthCard
            title="Railway Backend"
            href="https://stratify-backend-production-3ebd.up.railway.app"
            detail={health.apiAlive ? 'Analytics API responding' : 'No response yet'}
            statusLabel={health.apiAlive ? 'Monitoring' : 'Unknown'}
            statusClass={health.apiAlive ? 'bg-amber-400' : 'bg-zinc-500'}
            icon={Globe}
          />

          <HealthCard
            title="X Bot (@StratifyAI)"
            href="https://x.com/StratifyAI"
            detail={`Tweet count: ${formatNumber(twitter.tweets)}`}
            statusLabel={health.twitterLoaded ? 'Online' : 'Disconnected'}
            statusClass={health.twitterLoaded ? 'bg-emerald-400' : 'bg-rose-400'}
            icon={Radio}
          />
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
          <Zap className="h-4 w-4 text-zinc-200" />
          Quick Actions
        </h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((action) => (
            <a
              key={action.label}
              href={action.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/70 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-900"
            >
              {action.label}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-zinc-500">Last Updated</p>
            <p className="mt-1 text-sm text-zinc-200">{formatTimestamp(analytics?.timestamp)}</p>
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Auto-refresh in {countdown}s
          </div>
        </div>
      </div>
    </section>
  );
}
