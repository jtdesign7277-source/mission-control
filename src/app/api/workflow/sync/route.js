import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function categorize(name, agent) {
  if (agent === 'xbot') return { category: 'social', icon: '🐦', color: '#3b82f6' };
  if (agent === 'trader') return { category: 'trading', icon: '💰', color: '#10b981' };
  if (name.includes('Market Intel')) return { category: 'intel', icon: '📊', color: '#f59e0b' };
  if (name.includes('Sophia')) return { category: 'content', icon: '☀️', color: '#ec4899' };
  if (name.includes('Summary')) return { category: 'system', icon: '📝', color: '#8b5cf6' };
  if (name.includes('Weekly')) return { category: 'content', icon: '📺', color: '#ef4444' };
  return { category: 'system', icon: '🔄', color: '#6b7280' };
}

function humanSchedule(expr) {
  if (!expr) return 'Unknown';
  const [min, hour, , , dow] = expr.split(' ');
  const parts = [];
  if (min.startsWith('*/')) parts.push(`Every ${min.slice(2)}min`);
  if (hour.startsWith('*/')) parts.push(`Every ${hour.slice(2)}h`);
  if (hour.includes(',')) parts.push(hour.split(',').map(h => `${h > 12 ? h - 12 : h}${h >= 12 ? 'pm' : 'am'}`).join(', ') + ' ET');
  if (dow === '1-5') parts.push('weekdays');
  if (dow === '0') parts.push('Sundays');
  return parts.join(', ') || expr;
}

function mapJob(job) {
  const { category, icon, color } = categorize(job.name || '', job.agentId || '');
  const state = job.state || {};
  const schedExpr = job.schedule?.expr || '';
  return {
    id: (job.id || '').slice(0, 8),
    full_id: job.id,
    name: job.name,
    agent: job.agentId,
    enabled: job.enabled,
    schedule_expr: schedExpr,
    schedule_human: humanSchedule(schedExpr),
    last_status: state.lastStatus || null,
    last_run_at: state.lastRunAtMs ? new Date(state.lastRunAtMs).toISOString() : null,
    next_run_at: state.nextRunAtMs ? new Date(state.nextRunAtMs).toISOString() : null,
    last_duration_ms: state.lastDurationMs || null,
    consecutive_errors: state.consecutiveErrors || 0,
    last_error: state.lastError || null,
    category, icon, color,
    synced_at: new Date().toISOString(),
  };
}

export async function POST(request) {
  try {
    const { jobs } = await request.json();
    if (!Array.isArray(jobs)) return NextResponse.json({ error: 'jobs must be array' }, { status: 400 });

    const mapped = jobs.map(mapJob);

    // Try Supabase first
    try {
      const sb = getSupabase();
      if (!sb) throw new Error('no supabase');
      const { error } = await sb.from('cron_jobs').upsert(mapped, { onConflict: 'id' });
      if (error) throw error;
      return NextResponse.json({ synced: mapped.length, source: 'supabase' });
    } catch (e) {
      console.warn('Supabase upsert failed, falling back to file:', e.message);
      writeFileSync('/tmp/mc-cron-jobs.json', JSON.stringify(mapped, null, 2));
      return NextResponse.json({ synced: mapped.length, source: 'file' });
    }
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
