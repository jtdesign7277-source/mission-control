'use client';

import { useEffect, useState, useCallback } from 'react';

const SECOND_BRAIN_API = 'https://second-brain-beige-gamma.vercel.app/api/documents';

const CATEGORY_STYLES = {
  social:  { bg: 'bg-blue-500/20',    text: 'text-blue-300' },
  intel:   { bg: 'bg-amber-500/20',   text: 'text-amber-300' },
  trading: { bg: 'bg-emerald-500/20', text: 'text-emerald-300' },
  system:  { bg: 'bg-purple-500/20',  text: 'text-purple-300' },
  content: { bg: 'bg-pink-500/20',    text: 'text-pink-300' },
};

function JobCard({ job }) {
  const diffMs = new Date(job.nextRun).getTime() - Date.now();
  const isSoon = diffMs < 30 * 60 * 1000 && diffMs > 0;
  const cat = CATEGORY_STYLES[job.category] || CATEGORY_STYLES.system;

  return (
    <div
      className="rounded-xl border border-white/10 bg-black/25 p-3 flex flex-col gap-1.5"
      style={{ borderLeft: `3px solid ${job.color}` }}
    >
      <div className="flex items-center gap-2">
        {isSoon && (
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: job.color }} />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: job.color }} />
          </span>
        )}
        <span className="text-base">{job.icon}</span>
        <span className="font-semibold text-sm text-zinc-100 truncate">{job.name}</span>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="bg-white/5 border border-white/10 text-zinc-300 text-[11px] px-2 py-0.5 rounded-full">{job.agent}</span>
        <span className={`${cat.bg} ${cat.text} text-[11px] px-2 py-0.5 rounded-full`}>{job.category}</span>
      </div>
      <p className="text-[11px] text-zinc-500">{job.schedule}</p>
      <p className="text-[12px] text-zinc-400">
        Next: <span className="text-zinc-200 font-medium">{job.timeUntil}</span>
      </p>
    </div>
  );
}

function DocCard({ doc, borderColor }) {
  const title = doc.title || doc.id || 'Untitled';
  const content = (doc.content || '').slice(0, 200);
  const ts = doc.created_at || doc.createdAt || doc.timestamp;

  return (
    <div className="rounded-xl border border-white/10 bg-black/25 p-3 flex flex-col gap-1.5" style={{ borderLeft: `3px solid ${borderColor}` }}>
      <p className="font-semibold text-sm text-zinc-100 truncate">{title}</p>
      {ts && <p className="text-[11px] text-zinc-500">{new Date(ts).toLocaleString()}</p>}
      {content && <p className="text-[12px] text-zinc-400 line-clamp-4">{content}</p>}
    </div>
  );
}

function Column({ title, children, className = '' }) {
  return (
    <div className={`flex flex-col gap-3 min-w-0 ${className}`}>
      <h3 className="text-[11px] uppercase tracking-widest text-zinc-400 font-semibold px-1">{title}</h3>
      <div className="flex flex-col gap-2 overflow-y-auto max-h-[70vh] pr-1 custom-scrollbar">
        {children}
      </div>
    </div>
  );
}

export default function WorkflowBoard() {
  const [jobs, setJobs] = useState([]);
  const [intel, setIntel] = useState([]);
  const [social, setSocial] = useState([]);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [jobsRes, intelRes, socialRes, tradesRes] = await Promise.allSettled([
        fetch('/api/workflow').then(r => r.json()),
        fetch(`${SECOND_BRAIN_API}?folder=cron:market-intel&limit=5`).then(r => r.json()),
        fetch(`${SECOND_BRAIN_API}?folder=cron:x-engagement&limit=5`).then(r => r.json()),
        fetch(`${SECOND_BRAIN_API}?folder=cron:trade-log&limit=5`).then(r => r.json()),
      ]);

      if (jobsRes.status === 'fulfilled') setJobs(jobsRes.value.jobs || []);
      if (intelRes.status === 'fulfilled') setIntel(Array.isArray(intelRes.value) ? intelRes.value : intelRes.value.documents || []);
      if (socialRes.status === 'fulfilled') setSocial(Array.isArray(socialRes.value) ? socialRes.value : socialRes.value.documents || []);
      if (tradesRes.status === 'fulfilled') setTrades(Array.isArray(tradesRes.value) ? tradesRes.value : tradesRes.value.documents || []);
    } catch (e) {
      console.error('WorkflowBoard fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 60000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-zinc-500 text-sm">
        <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
        Loading workflow…
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <Column title="⏳ Up Next">
        {jobs.map(job => <JobCard key={job.id} job={job} />)}
        {jobs.length === 0 && <p className="text-zinc-600 text-xs px-1">No scheduled jobs</p>}
      </Column>

      <Column title="📡 Market Intel & Breaking News">
        {intel.map((doc, i) => <DocCard key={doc.id || i} doc={doc} borderColor="#f59e0b" />)}
        {intel.length === 0 && <p className="text-zinc-600 text-xs px-1">No recent intel</p>}
      </Column>

      <Column title="🐦 Social & Engagement">
        {social.map((doc, i) => <DocCard key={doc.id || i} doc={doc} borderColor="#3b82f6" />)}
        {social.length === 0 && <p className="text-zinc-600 text-xs px-1">No recent activity</p>}
      </Column>

      <Column title="💰 Trade Activity">
        {trades.map((doc, i) => <DocCard key={doc.id || i} doc={doc} borderColor="#10b981" />)}
        {trades.length === 0 && <p className="text-zinc-600 text-xs px-1">No recent trades</p>}
      </Column>
    </div>
  );
}
