'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle, Bug, CheckCircle2, Clock, ExternalLink,
  Eye, EyeOff, Loader2, RefreshCw, Shield, XCircle,
} from 'lucide-react';

const LEVEL_CONFIG = {
  fatal:   { bg: 'bg-red-500/20', border: 'border-red-500/40', text: 'text-red-300', icon: XCircle },
  error:   { bg: 'bg-red-500/15', border: 'border-red-400/30', text: 'text-red-300', icon: AlertTriangle },
  warning: { bg: 'bg-yellow-500/15', border: 'border-yellow-400/30', text: 'text-yellow-300', icon: AlertTriangle },
  info:    { bg: 'bg-blue-500/15', border: 'border-blue-400/30', text: 'text-blue-300', icon: Bug },
  debug:   { bg: 'bg-zinc-500/15', border: 'border-zinc-600/30', text: 'text-zinc-400', icon: Bug },
};

const STATUS_TABS = [
  { key: 'is:unresolved', label: 'Unresolved', icon: AlertTriangle, color: 'text-red-400' },
  { key: 'is:ignored', label: 'Ignored', icon: EyeOff, color: 'text-zinc-500' },
  { key: 'is:resolved', label: 'Resolved', icon: CheckCircle2, color: 'text-emerald-400' },
];

export default function SentryDashboard() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('is:unresolved');
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchIssues = useCallback(async (showRefresh) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/sentry?endpoint=issues&query=${encodeURIComponent(query)}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setIssues(data.issues || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [query]);

  useEffect(() => { fetchIssues(false); }, [fetchIssues]);

  const updateIssue = async (issueId, status) => {
    setActionLoading(issueId);
    try {
      const res = await fetch('/api/sentry', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueId, status }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      // Remove from list after action
      setIssues(prev => prev.filter(i => i.id !== issueId));
    } catch (err) {
      alert('❌ ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const fmtTime = (d) => {
    const now = Date.now();
    const diff = now - new Date(d).getTime();
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
    if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
    return Math.floor(diff / 86400000) + 'd ago';
  };

  const fmtCount = (n) => {
    if (!n) return '0';
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return String(n);
  };

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-orange-400" />
          <h2 className="text-lg font-semibold text-zinc-100" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            Sentry Errors
          </h2>
          <span className="text-xs text-zinc-500">{issues.length} issues</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchIssues(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-white/10 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <a
            href="https://jeff-thompson-uy.sentry.io/issues/?project=4510920320811008"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-orange-400/30 bg-orange-500/10 px-3 py-1.5 text-xs text-orange-300 hover:bg-orange-500/20 transition"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Open Sentry
          </a>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1">
        {STATUS_TABS.map(tab => {
          const Icon = tab.icon;
          const active = query === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setQuery(tab.key)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                active
                  ? 'bg-white/10 text-zinc-100 border border-white/20'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${active ? tab.color : ''}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          ❌ {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12 text-zinc-500">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading issues...
        </div>
      )}

      {/* Empty */}
      {!loading && !error && issues.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
          <CheckCircle2 className="h-10 w-10 mb-3 opacity-30 text-emerald-400" />
          <p className="text-sm text-emerald-400">All clear! No issues found.</p>
          <p className="text-xs mt-1 text-zinc-600">Sentry is monitoring Stratify for errors</p>
        </div>
      )}

      {/* Issues List */}
      {!loading && issues.length > 0 && (
        <div className="space-y-2">
          {issues.map(issue => {
            const level = LEVEL_CONFIG[issue.level] || LEVEL_CONFIG.error;
            const LevelIcon = level.icon;
            const isActioning = actionLoading === issue.id;

            return (
              <div
                key={issue.id}
                className={`rounded-xl border ${level.border} ${level.bg} p-4 hover:border-white/20 transition`}
              >
                <div className="flex items-start gap-3">
                  <LevelIcon className={`h-4 w-4 mt-0.5 shrink-0 ${level.text}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-medium uppercase ${level.text}`}>{issue.level}</span>
                      <span className="text-[10px] text-zinc-600">•</span>
                      <span className="text-[10px] text-zinc-500">{fmtTime(issue.lastSeen)}</span>
                      {issue.count > 1 && (
                        <>
                          <span className="text-[10px] text-zinc-600">•</span>
                          <span className="text-[10px] text-zinc-400">{fmtCount(issue.count)} events</span>
                        </>
                      )}
                      {issue.userCount > 0 && (
                        <>
                          <span className="text-[10px] text-zinc-600">•</span>
                          <span className="text-[10px] text-zinc-400">{issue.userCount} users</span>
                        </>
                      )}
                    </div>

                    <h3 className="text-sm font-medium text-zinc-100 truncate" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                      {issue.title}
                    </h3>

                    {issue.culprit && (
                      <p className="text-xs text-zinc-500 mt-1 truncate font-mono">{issue.culprit}</p>
                    )}

                    {issue.metadata?.filename && (
                      <p className="text-[10px] text-zinc-600 mt-1 font-mono">{issue.metadata.filename}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {query === 'is:unresolved' && (
                      <>
                        <button
                          onClick={() => updateIssue(issue.id, 'resolved')}
                          disabled={isActioning}
                          className="flex items-center gap-1 rounded-md border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-[10px] text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-40 transition"
                          title="Resolve"
                        >
                          {isActioning ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                          Resolve
                        </button>
                        <button
                          onClick={() => updateIssue(issue.id, 'ignored')}
                          disabled={isActioning}
                          className="flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-zinc-500 hover:text-zinc-300 disabled:opacity-40 transition"
                          title="Ignore"
                        >
                          <EyeOff className="h-3 w-3" />
                        </button>
                      </>
                    )}
                    {query === 'is:resolved' && (
                      <button
                        onClick={() => updateIssue(issue.id, 'unresolved')}
                        disabled={isActioning}
                        className="flex items-center gap-1 rounded-md border border-yellow-400/30 bg-yellow-500/10 px-2 py-1 text-[10px] text-yellow-400 hover:bg-yellow-500/20 disabled:opacity-40 transition"
                      >
                        Reopen
                      </button>
                    )}
                    <a
                      href={issue.permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-md border border-white/10 bg-white/5 p-1 text-zinc-500 hover:text-zinc-300 transition"
                      title="View in Sentry"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
