import { NextResponse } from 'next/server';

const CRON_JOBS = [
  { id: 'e7dea1ba', name: 'StratifyAI X Engagement', agent: 'xbot', description: 'Posts tweets, replies to FinTwit, engages with trending tickers', schedule: '8am, 12pm, 4pm, 8pm ET', scheduleExpr: '0 8,12,16,20 * * *', category: 'social', color: '#3b82f6', icon: '🐦' },
  { id: '596a2309', name: 'Market Intel Scanner', agent: 'cron', description: 'Scans Yahoo, Reuters, Bloomberg, Reddit, HN, X for trending market news', schedule: 'Every 4 hours', scheduleExpr: '0 */4 * * *', category: 'intel', color: '#f59e0b', icon: '📊' },
  { id: '75f2b428', name: 'TradeBot Strategy Monitor', agent: 'trader', description: 'Monitors active strategies, evaluates conditions, executes paper trades', schedule: 'Every 5min, Mon-Fri 9am-3pm ET', scheduleExpr: '*/5 9-15 * * 1-5', category: 'trading', color: '#10b981', icon: '💰' },
  { id: '3bfdbb62', name: 'Daily Second Brain Summary', agent: 'cron', description: 'Compiles daily summary of all work, fixes, decisions into Second Brain', schedule: '11pm ET daily', scheduleExpr: '0 23 * * *', category: 'system', color: '#8b5cf6', icon: '📝' },
  { id: 'c1098238', name: 'Sophia Morning Briefing', agent: 'sophia', description: 'Pre-market briefing for Stratify users — key movers, macro, sector analysis', schedule: '9:20am ET weekdays', scheduleExpr: '20 9 * * 1-5', category: 'content', color: '#ec4899', icon: '☀️' },
  { id: '22b48176', name: 'Sophia Proactive Insights', agent: 'sophia', description: 'Mid-day market insights and alerts for Stratify users', schedule: '10am, 12pm, 2pm, 4pm, 7pm ET weekdays', scheduleExpr: '0 10,12,14,16,19 * * 1-5', category: 'content', color: '#ec4899', icon: '💡' },
  { id: '950cd7b4', name: 'Load Stratify Status', agent: 'main', description: 'Reminds agent to load STRATIFY-STATUS.md for context', schedule: 'Every 4 hours', scheduleExpr: '0 */4 * * *', category: 'system', color: '#6b7280', icon: '🔄' },
  { id: '8770aca7', name: 'Sophia Weekly Market Recap', agent: 'main', description: 'Generates weekly video recap + newsletter via HeyGen & Claude', schedule: 'Sundays 6pm ET', scheduleExpr: '0 18 * * 0', category: 'content', color: '#ef4444', icon: '📺' },
];

function getETNow() {
  const now = new Date();
  const etStr = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
  const et = new Date(etStr);
  // Get offset: ET time as if UTC
  const diffMs = et.getTime() - now.getTime();
  return { now, diffMs };
}

function toET(date) {
  const s = date.toLocaleString('en-US', { timeZone: 'America/New_York' });
  return new Date(s);
}

function fromET(etDate, refNow) {
  // Convert an "ET interpreted as UTC" date back to real UTC
  const { diffMs } = getETNow();
  return new Date(etDate.getTime() - diffMs);
}

function parseCronField(field, max) {
  if (field === '*') return null; // any
  if (field.startsWith('*/')) return { step: parseInt(field.slice(2)) };
  if (field.includes(',')) return { list: field.split(',').map(Number) };
  if (field.includes('-')) {
    const [a, b] = field.split('-').map(Number);
    return { range: [a, b] };
  }
  return { list: [parseInt(field)] };
}

function getNextRun(expr, now) {
  const [minF, hourF, , , dowF] = expr.split(' ');
  const min = parseCronField(minF);
  const hour = parseCronField(hourF);
  const dow = parseCronField(dowF);

  const et = toET(now);
  
  // Try next 8 days to find a match
  for (let d = 0; d < 8; d++) {
    const candidate = new Date(et);
    candidate.setDate(candidate.getDate() + d);
    
    // Check day of week
    const dayOfWeek = candidate.getDay();
    if (dow) {
      if (dow.range && (dayOfWeek < dow.range[0] || dayOfWeek > dow.range[1])) continue;
      if (dow.list && !dow.list.includes(dayOfWeek)) continue;
    }

    // Get valid hours
    let hours = [];
    if (!hour) hours = Array.from({ length: 24 }, (_, i) => i);
    else if (hour.step) hours = Array.from({ length: Math.ceil(24 / hour.step) }, (_, i) => i * hour.step);
    else if (hour.list) hours = hour.list;
    else if (hour.range) hours = Array.from({ length: hour.range[1] - hour.range[0] + 1 }, (_, i) => i + hour.range[0]);

    // Get valid minutes
    let minutes = [];
    if (!min) minutes = [0];
    else if (min.step) minutes = Array.from({ length: Math.ceil(60 / min.step) }, (_, i) => i * min.step);
    else if (min.list) minutes = min.list;

    for (const h of hours) {
      for (const m of minutes) {
        const c = new Date(candidate);
        c.setHours(h, m, 0, 0);
        if (d === 0 && (c.getHours() < et.getHours() || (c.getHours() === et.getHours() && c.getMinutes() <= et.getMinutes()))) continue;
        // Convert back to UTC
        const { diffMs } = getETNow();
        const utc = new Date(c.getTime() - diffMs);
        return utc;
      }
    }
  }
  return new Date(now.getTime() + 86400000); // fallback: 24h from now
}

function timeUntil(now, target) {
  let diff = Math.max(0, target.getTime() - now.getTime());
  const days = Math.floor(diff / 86400000);
  diff %= 86400000;
  const hours = Math.floor(diff / 3600000);
  diff %= 3600000;
  const mins = Math.floor(diff / 60000);
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export async function GET() {
  const now = new Date();
  const jobs = CRON_JOBS.map(job => {
    const nextRun = getNextRun(job.scheduleExpr, now);
    return { ...job, nextRun: nextRun.toISOString(), timeUntil: timeUntil(now, nextRun) };
  }).sort((a, b) => new Date(a.nextRun) - new Date(b.nextRun));

  return NextResponse.json({ jobs });
}
