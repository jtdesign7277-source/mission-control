import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

export async function POST(request) {
  try {
    const body = await request.json();
    const source = String(body?.source || '').trim();
    const action = String(body?.action || '').trim();
    const status = String(body?.status || 'ok').trim().toLowerCase();
    const metadata = body?.metadata && typeof body.metadata === 'object' ? body.metadata : {};
    const duration = Number.isFinite(Number(body?.duration)) ? Number(body.duration) : null;

    if (!source || !action) {
      return NextResponse.json({ error: 'source and action are required' }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from('activity_events')
      .insert({ source, action, status, metadata, duration })
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ event: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Invalid request payload' }, { status: 500 });
  }
}
