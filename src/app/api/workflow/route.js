import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Hardcoded fallback jobs
const FALLBACK_JOBS = [
  { id: 'e7dea1ba', name: 'StratifyAI X Engagement', agent: 'xbot', enabled: true, schedule_expr: '0 8,12,16,20 * * *', schedule_human: '8am, 12pm, 4pm, 8pm ET', category: 'social', color: '#3b82f6', icon: '🐦', last_status: null, last_run_at: null, next_run_at: null, consecutive_errors: 0 },
  { id: '596a2309', name: 'Market Intel Scanner', agent: 'cron', enabled: true, schedule_expr: '0 */4 * * *', schedule_human: 'Every 4 hours', category: 'intel', color: '#f59e0b', icon: '📊', last_status: null, last_run_at: null, next_run_at: null, consecutive_errors: 0 },
  { id: '75f2b428', name: 'TradeBot Strategy Monitor', agent: 'trader', enabled: true, schedule_expr: '*/5 9-15 * * 1-5', schedule_human: 'Every 5min, Mon-Fri 9am-3pm ET', category: 'trading', color: '#10b981', icon: '💰', last_status: null, last_run_at: null, next_run_at: null, consecutive_errors: 0 },
  { id: '3bfdbb62', name: 'Daily Second Brain Summary', agent: 'cron', enabled: true, schedule_expr: '0 23 * * *', schedule_human: '11pm ET daily', category: 'system', color: '#8b5cf6', icon: '📝', last_status: null, last_run_at: null, next_run_at: null, consecutive_errors: 0 },
  { id: 'c1098238', name: 'Sophia Morning Briefing', agent: 'sophia', enabled: true, schedule_expr: '20 9 * * 1-5', schedule_human: '9:20am ET weekdays', category: 'content', color: '#ec4899', icon: '☀️', last_status: null, last_run_at: null, next_run_at: null, consecutive_errors: 0 },
  { id: '22b48176', name: 'Sophia Proactive Insights', agent: 'sophia', enabled: true, schedule_expr: '0 10,12,14,16,19 * * 1-5', schedule_human: '10am, 12pm, 2pm, 4pm, 7pm ET weekdays', category: 'content', color: '#ec4899', icon: '💡', last_status: null, last_run_at: null, next_run_at: null, consecutive_errors: 0 },
  { id: '950cd7b4', name: 'Load Stratify Status', agent: 'main', enabled: true, schedule_expr: '0 */4 * * *', schedule_human: 'Every 4 hours', category: 'system', color: '#6b7280', icon: '🔄', last_status: null, last_run_at: null, next_run_at: null, consecutive_errors: 0 },
  { id: '8770aca7', name: 'Sophia Weekly Market Recap', agent: 'main', enabled: true, schedule_expr: '0 18 * * 0', schedule_human: 'Sundays 6pm ET', category: 'content', color: '#ef4444', icon: '📺', last_status: null, last_run_at: null, next_run_at: null, consecutive_errors: 0 },
];

function toET(date) {
  const s = date.toLocaleString('en-US', { timeZone: 'America/New_York' });
  return new Date(s);
}

function getETNow() {
  const now = new Date();
  const et = toET(now);
  const diffMs = et.getTime() - now.getTime();
  return { now, diffMs };
}

function parseCronField(field) {
  if (field === '*') return null;
  if (field.startsWith('*/')) return { step: parseInt(field.slice(2)) };
  if (field.includes(',')) return { list: field.split(',').map(Number) };
  if (field.includes('-')) { const [a, b] = field.split('-').map(Number); return { range: [a, b] }; }
  return { list: [parseInt(field)] };
}

function getNextRun(expr, now) {
  const [minF, hourF, , , dowF] = expr.split(' ');
  const min = parseCronField(minF);
  const hour = parseCronField(hourF);
  const dow = parseCronField(dowF);
  const et = toET(now);

  for (let d = 0; d < 8; d++) {
    const candidate = new Date(et);
    candidate.setDate(candidate.getDate() + d);
    const dayOfWeek = candidate.getDay();
    if (dow) {
      if (dow.range && (dayOfWeek < dow.range[0] || dayOfWeek > dow.range[1])) continue;
      if (dow.list && !dow.list.includes(dayOfWeek)) continue;
    }
    let hours = [];
    if (!hour) hours = Array.from({ length: 24 }, (_, i) => i);
    else if (hour.step) hours = Array.from({ length: Math.ceil(24 / hour.step) }, (_, i) => i * hour.step);
    else if (hour.list) hours = hour.list;
    else if (hour.range) hours = Array.from({ length: hour.range[1] - hour.range[0] + 1 }, (_, i) => i + hour.range[0]);

    let minutes = [];
    if (!min) minutes = [0];
    else if (min.step) minutes = Array.from({ length: Math.ceil(60 / min.step) }, (_, i) => i * min.step);
    else if (min.list) minutes = min.list;

    for (const h of hours) {
      for (const m of minutes) {
        const c = new Date(candidate);
        c.setHours(h, m, 0, 0);
        if (d === 0 && (c.getHours() < et.getHours() || (c.getHours() === et.getHours() && c.getMinutes() <= et.getMinutes()))) continue;
        const { diffMs } = getETNow();
        return new Date(c.getTime() - diffMs);
      }
    }
  }
  return new Date(now.getTime() + 86400000);
}

function timeUntil(now, target) {
  let diff = Math.max(0, target.getTime() - now.getTime());
  const days = Math.floor(diff / 86400000); diff %= 86400000;
  const hours = Math.floor(diff / 3600000); diff %= 3600000;
  const mins = Math.floor(diff / 60000);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export async function GET() {
  const now = new Date();
  let jobs = [];
  let pendingActions = [];
  let source = 'hardcoded';

  // Try Supabase
  try {
    const { data, error } = await supabase.from('cron_jobs').select('*').order('synced_at', { ascending: false });
    if (!error && data && data.length > 0) {
      jobs = data;
      source = 'supabase';
    }
  } catch (e) { /* ignore */ }

  // Try file fallback
  if (jobs.length === 0) {
    try {
      if (existsSync('/tmp/mc-cron-jobs.json')) {
        jobs = JSON.parse(readFileSync('/tmp/mc-cron-jobs.json', 'utf8'));
        source = 'file';
      }
    } catch (e) { /* ignore */ }
  }

  // Hardcoded fallback
  if (jobs.length === 0) {
    jobs = FALLBACK_JOBS;
    source = 'hardcoded';
  }

  // Compute nextRun/timeUntil for all jobs
  jobs = jobs.map(job => {
    const nextRunFromState = job.next_run_at ? new Date(job.next_run_at) : null;
    const nextRun = (nextRunFromState && nextRunFromState > now) ? nextRunFromState : getNextRun(job.schedule_expr, now);
    return {
      ...job,
      schedule: job.schedule_human || job.schedule || job.schedule_expr,
      nextRun: nextRun.toISOString(),
      timeUntil: timeUntil(now, nextRun),
    };
  }).sort((a, b) => new Date(a.nextRun) - new Date(b.nextRun));

  // Pending actions
  try {
    const { data, error } = await supabase.from('cron_actions').select('*').eq('status', 'pending');
    if (!error && data) pendingActions = data;
  } catch (e) { /* ignore */ }

  if (pendingActions.length === 0) {
    try {
      if (existsSync('/tmp/mc-cron-actions.json')) {
        const all = JSON.parse(readFileSync('/tmp/mc-cron-actions.json', 'utf8'));
        pendingActions = all.filter(a => a.status === 'pending');
      }
    } catch (e) { /* ignore */ }
  }

  return NextResponse.json({ jobs, pendingActions, source, syncedAt: now.toISOString() });
}
