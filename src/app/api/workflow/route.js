import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';

export const dynamic = 'force-dynamic';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

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

function asNonEmptyString(value) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : '';
}

function parseCronField(field) {
  const value = asNonEmptyString(field);
  if (!value || value === '*') return null;
  if (value.startsWith('*/')) {
    const step = Number.parseInt(value.slice(2), 10);
    return Number.isFinite(step) && step > 0 ? { step } : null;
  }
  if (value.includes(',')) return { list: value.split(',').map(v => Number.parseInt(v, 10)).filter(Number.isFinite) };
  if (value.includes('-')) {
    const [a, b] = value.split('-').map(v => Number.parseInt(v, 10));
    if (Number.isFinite(a) && Number.isFinite(b)) return { range: [a, b] };
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? { list: [parsed] } : null;
}

function getNextRun(expr, now) {
  const cronExpr = asNonEmptyString(expr);
  if (!cronExpr || !cronExpr.includes(' ')) return new Date(now.getTime() + 3600000);
  const [minF, hourF, , , dowF] = cronExpr.split(' ');
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

  try {
    // Try Supabase
    try {
      const sb = getSupabase();
      if (!sb) throw new Error('no supabase');
      const { data, error } = await sb.from('cron_jobs').select('*').order('synced_at', { ascending: false });
      if (!error && Array.isArray(data) && data.length > 0) {
        jobs = data;
        source = 'supabase';
      }
    } catch (e) { /* ignore */ }

    // Try file fallback
    if (!Array.isArray(jobs) || jobs.length === 0) {
      try {
        if (existsSync('/tmp/mc-cron-jobs.json')) {
          const parsed = JSON.parse(readFileSync('/tmp/mc-cron-jobs.json', 'utf8'));
          const parsedJobs = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.jobs) ? parsed.jobs : [];
          if (parsedJobs.length > 0) {
            jobs = parsedJobs;
            source = 'file';
          }
        }
      } catch (e) { /* ignore */ }
    }

    // Hardcoded fallback
    if (!Array.isArray(jobs) || jobs.length === 0) {
      jobs = FALLBACK_JOBS;
      source = 'hardcoded';
    }

    // Compute nextRun/timeUntil for all jobs
    jobs = jobs
      .filter(job => job && typeof job === 'object')
      .map(job => {
        const scheduleExpr = asNonEmptyString(job.schedule_expr || job.schedule || job.schedule_human);
        const nextRunFromState = job.next_run_at ? new Date(job.next_run_at) : null;
        const nextRun = (nextRunFromState && Number.isFinite(nextRunFromState.getTime()) && nextRunFromState > now)
          ? nextRunFromState
          : getNextRun(scheduleExpr, now);
        return {
          ...job,
          schedule_expr: scheduleExpr || '0 */4 * * *',
          schedule: job.schedule_human || job.schedule || scheduleExpr || 'Every 4 hours',
          nextRun: nextRun.toISOString(),
          timeUntil: timeUntil(now, nextRun),
        };
      })
      .sort((a, b) => new Date(a.nextRun) - new Date(b.nextRun));

    // Pending actions
    try {
      const sb = getSupabase();
      if (!sb) throw new Error('no supabase');
      const { data, error } = await sb.from('cron_actions').select('*').eq('status', 'pending');
      if (!error && Array.isArray(data)) pendingActions = data;
    } catch (e) { /* ignore */ }

    if (pendingActions.length === 0) {
      try {
        if (existsSync('/tmp/mc-cron-actions.json')) {
          const all = JSON.parse(readFileSync('/tmp/mc-cron-actions.json', 'utf8'));
          if (Array.isArray(all)) pendingActions = all.filter(a => a?.status === 'pending');
        }
      } catch (e) { /* ignore */ }
    }

    return NextResponse.json({ jobs, pendingActions, source, syncedAt: now.toISOString() });
  } catch (error) {
    console.error('Workflow GET fatal error:', error);
    const fallbackJobs = FALLBACK_JOBS.map(job => {
      const nextRun = getNextRun(job.schedule_expr, now);
      return {
        ...job,
        schedule: job.schedule_human || job.schedule || job.schedule_expr,
        nextRun: nextRun.toISOString(),
        timeUntil: timeUntil(now, nextRun),
      };
    }).sort((a, b) => new Date(a.nextRun) - new Date(b.nextRun));
    return NextResponse.json({ jobs: fallbackJobs, pendingActions: [], source: 'hardcoded', syncedAt: now.toISOString() });
  }
}
