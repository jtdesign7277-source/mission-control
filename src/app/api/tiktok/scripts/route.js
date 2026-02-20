import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// GET — fetch all scripts, optionally filter by status/folder
export async function GET(request) {
  try {
    const supabase = getSupabaseAdminClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const folder = searchParams.get('folder');

    let query = supabase
      .from('tiktok_scripts')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (folder) query = query.eq('folder', folder);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ scripts: data || [] }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST — create a new script
export async function POST(request) {
  try {
    const body = await request.json();
    const { topic, hook, script, broll_notes, virality, source, status, folder, tags, video_url } = body;

    if (!topic?.trim()) {
      return NextResponse.json({ error: 'Missing topic' }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from('tiktok_scripts')
      .insert({
        topic: topic.trim(),
        hook: hook?.trim() || null,
        script: script?.trim() || null,
        broll_notes: broll_notes?.trim() || null,
        virality: virality || 2,
        source: source || 'manual',
        status: status || 'draft',
        folder: folder || 'inbox',
        tags: tags || [],
        video_url: video_url || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ script: data }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH — update a script (status, folder, content, etc.)
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from('tiktok_scripts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ script: data }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE — remove a script
export async function DELETE(request) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const supabase = getSupabaseAdminClient();
    const { error } = await supabase
      .from('tiktok_scripts')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
