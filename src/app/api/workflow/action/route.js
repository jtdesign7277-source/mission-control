import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(request) {
  try {
    const { jobId, action } = await request.json();
    if (!jobId || !['pause', 'resume', 'delete'].includes(action)) {
      return NextResponse.json({ error: 'Invalid jobId or action' }, { status: 400 });
    }

    const record = { job_id: jobId, action, status: 'pending', created_at: new Date().toISOString() };

    try {
      const { error } = await supabase.from('cron_actions').insert(record);
      if (error) throw error;
      return NextResponse.json({ queued: true, source: 'supabase' });
    } catch (e) {
      console.warn('Supabase insert failed, falling back to file:', e.message);
      const path = '/tmp/mc-cron-actions.json';
      const existing = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : [];
      existing.push(record);
      writeFileSync(path, JSON.stringify(existing, null, 2));
      return NextResponse.json({ queued: true, source: 'file' });
    }
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
