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

function timeAgo(iso) {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 0) return 'just now';
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function JobCard({ job, pendingActions, onAction, isSelected, onSelect }) {
  const diffMs = new Date(job.nextRun).getTime() - Date.now();
  const isSoon = diffMs < 30 * 60 * 1000 && diffMs > 0;
  const cat = CATEGORY_STYLES[job.category] || CATEGORY_STYLES.system;
  const isEnabled = job.enabled !== false;
  const hasPending = pendingActions.some(a => a.job_id === job.id);
  const hasErrors = (job.consecutive_errors || 0) > 0;

  const handleAction = async (action) => {
    if (action === 'delete' && !confirm(`Delete job "${job.name}"? This will be queued for next sync.`)) return;
    onAction(job.id, action);
  };

  return (
    <div
      onClick={() => onSelect?.(job.id)}
      className={`rounded-xl border ${isSelected ? 'border-emerald-400/40 shadow-[0_0_12px_rgba(52,211,153,0.15)]' : 'border-white/10'} bg-black/25 p-3 flex flex-col gap-1.5 transition-all cursor-pointer hover:border-white/20 ${!isEnabled ? 'opacity-60' : ''}`}
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
        <span className="font-semibold text-sm text-zinc-100 truncate flex-1">{job.name}</span>
        {hasErrors && (
          <span className="bg-rose-500/20 text-rose-300 text-[10px] px-1.5 rounded-full font-medium">
            {job.consecutive_errors} err
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="bg-white/5 border border-white/10 text-zinc-300 text-[11px] px-2 py-0.5 rounded-full">{job.agent}</span>
        <span className={`${cat.bg} ${cat.text} text-[11px] px-2 py-0.5 rounded-full`}>{job.category}</span>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${isEnabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-zinc-500/20 text-zinc-400'}`}>
          {isEnabled ? 'ACTIVE' : 'PAUSED'}
        </span>
      </div>

      <p className="text-[11px] text-zinc-500">{job.schedule}</p>

      <div className="flex items-center justify-between">
        <p className="text-[12px] text-zinc-400">
          Next: <span className="text-zinc-200 font-medium">{job.timeUntil}</span>
        </p>
        {job.last_run_at && (
          <p className="text-[11px] text-zinc-500">
            Last: {timeAgo(job.last_run_at)} — <span className={job.last_status === 'ok' ? 'text-emerald-400' : job.last_status === 'error' ? 'text-rose-400' : 'text-zinc-400'}>{(job.last_status || 'N/A').toUpperCase()}</span>
          </p>
        )}
      </div>

      {job.last_error && (
        <p className="text-[10px] text-rose-400/70 truncate">⚠ {job.last_error}</p>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-1.5 mt-1">
        {isEnabled ? (
          <button onClick={() => handleAction('pause')} className="text-[11px] px-2 py-0.5 rounded-md border border-amber-400/30 text-amber-300 hover:bg-amber-500/10 transition-colors">
            ⏸ Pause
          </button>
        ) : (
          <button onClick={() => handleAction('resume')} className="text-[11px] px-2 py-0.5 rounded-md border border-emerald-400/30 text-emerald-300 hover:bg-emerald-500/10 transition-colors">
            ▶ Resume
          </button>
        )}
        <button onClick={() => handleAction('delete')} className="text-[11px] px-2 py-0.5 rounded-md border border-rose-400/30 text-rose-300 hover:bg-rose-500/10 transition-colors">
          🗑
        </button>
        {hasPending && (
          <span className="bg-amber-500/20 text-amber-200 text-[10px] px-2 py-0.5 rounded-full ml-auto">
            ⏳ Queued
          </span>
        )}
      </div>
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

function Column({ title, children, className = '', header }) {
  return (
    <div className={`flex flex-col gap-3 min-w-0 ${className}`}>
      <h3 className="text-[11px] uppercase tracking-widest text-zinc-400 font-semibold px-1">{title}</h3>
      {header}
      <div className="flex flex-col gap-2 overflow-y-auto max-h-[70vh] pr-1 custom-scrollbar">
        {children}
      </div>
    </div>
  );
}

export default function WorkflowBoard() {
  const [jobs, setJobs] = useState([]);
  const [pendingActions, setPendingActions] = useState([]);
  const [source, setSource] = useState('');
  const [syncedAt, setSyncedAt] = useState(null);
  const [intel, setIntel] = useState([]);
  const [social, setSocial] = useState([]);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [jobRuns, setJobRuns] = useState([]);
  const [runsLoading, setRunsLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [jobsRes, intelRes, socialRes, tradesRes] = await Promise.allSettled([
        fetch('/api/workflow').then(r => r.json()),
        fetch(`${SECOND_BRAIN_API}?folder=cron:market-intel&limit=5`).then(r => r.json()),
        fetch(`${SECOND_BRAIN_API}?folder=cron:x-engagement&limit=5`).then(r => r.json()),
        fetch(`${SECOND_BRAIN_API}?folder=cron:trade-log&limit=5`).then(r => r.json()),
      ]);

      if (jobsRes.status === 'fulfilled') {
        const data = jobsRes.value;
        setJobs(data.jobs || []);
        setPendingActions(data.pendingActions || []);
        setSource(data.source || 'unknown');
        setSyncedAt(data.syncedAt || null);
      }
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

  const handleAction = async (jobId, action) => {
    try {
      await fetch('/api/workflow/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, action }),
      });
      // Optimistically add to pending
      setPendingActions(prev => [...prev, { job_id: jobId, action, status: 'pending' }]);
    } catch (e) {
      console.error('Action failed:', e);
    }
  };

  const handleSelectJob = async (jobId) => {
    if (selectedJobId === jobId) {
      setSelectedJobId(null);
      setJobRuns([]);
      return;
    }
    setSelectedJobId(jobId);
    setJobRuns([]);
    setRunsLoading(true);
    try {
      const res = await fetch(`/api/workflow/runs?jobId=${jobId}`);
      const data = await res.json();
      setJobRuns(data.runs || []);
    } catch (e) {
      console.error('Failed to fetch runs:', e);
      setJobRuns([]);
    } finally {
      setRunsLoading(false);
    }
  };

  const selectedJob = jobs.find(j => j.id === selectedJobId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-zinc-500 text-sm">
        <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
        Loading workflow…
      </div>
    );
  }

  const syncHeader = (
    <div className="flex items-center gap-2 px-1 text-[10px] text-zinc-500">
      <span className="bg-white/5 px-1.5 py-0.5 rounded">{source}</span>
      <span>{jobs.length} jobs</span>
      {syncedAt && <span>· {timeAgo(syncedAt)}</span>}
    </div>
  );

  return (
    <div className="flex flex-col gap-0">
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <Column title="⏳ Up Next" header={syncHeader}>
        {jobs.map(job => <JobCard key={job.id} job={job} pendingActions={pendingActions} onAction={handleAction} isSelected={selectedJobId === job.id} onSelect={handleSelectJob} />)}
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

    {/* Job Run Detail Panel */}
    {selectedJob && (
      <div className="rounded-2xl border border-white/10 bg-black/30 p-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{selectedJob.icon}</span>
            <span className="font-semibold text-zinc-100">{selectedJob.name}</span>
            <span className="text-zinc-500 text-sm">— Recent Runs</span>
          </div>
          <button onClick={() => { setSelectedJobId(null); setJobRuns([]); }} className="text-zinc-400 hover:text-zinc-200 text-lg leading-none px-2">✕</button>
        </div>

        <div className="flex items-center gap-3 mb-4 flex-wrap text-[11px]">
          <span className="bg-white/5 border border-white/10 text-zinc-300 px-2 py-0.5 rounded-full">{selectedJob.agent}</span>
          <span className="text-zinc-500">{selectedJob.schedule}</span>
          {selectedJob.last_status && (
            <span className={`px-2 py-0.5 rounded-full ${selectedJob.last_status === 'ok' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
              {selectedJob.last_status.toUpperCase()}
            </span>
          )}
          {(selectedJob.consecutive_errors || 0) > 0 && (
            <span className="bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full">{selectedJob.consecutive_errors} consecutive errors</span>
          )}
        </div>

        {runsLoading && (
          <div className="flex items-center gap-2 text-zinc-500 text-sm py-4">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            Loading runs…
          </div>
        )}

        {!runsLoading && jobRuns.length === 0 && (
          <p className="text-zinc-500 text-sm py-4">No recent outputs for this job</p>
        )}

        {!runsLoading && jobRuns.map((run, i) => (
          <div key={run.id || i} className="rounded-xl border border-white/10 bg-black/20 p-4 mb-3">
            <div className="flex items-center justify-between mb-1">
              <p className="font-semibold text-sm text-zinc-100">{run.title}</p>
              {run.createdAt && <span className="text-[11px] text-zinc-500">{timeAgo(run.createdAt)}</span>}
            </div>
            {run.content && (
              <div className="max-h-[400px] overflow-y-auto text-xs font-mono text-zinc-300 whitespace-pre-wrap bg-black/40 rounded-lg p-3 mt-2">
                {run.content}
              </div>
            )}
          </div>
        ))}
      </div>
    )}
    </div>
  );
}
