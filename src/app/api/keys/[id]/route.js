import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { buildUpdatePayload, toMaskedRecord } from '@/lib/keyVault';

export async function PUT(request, { params }) {
  const id = params?.id;
  if (!id) {
    return NextResponse.json({ error: 'Missing key id' }, { status: 400 });
  }

  try {
    const payload = await request.json();

    const service = String(payload?.service || '').trim();
    const name = String(payload?.name || '').trim();
    if (!service || !name) {
      return NextResponse.json({ error: 'service and name are required' }, { status: 400 });
    }

    const updates = buildUpdatePayload(payload);
    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase
      .from('api_keys')
      .update(updates)
      .eq('id', id)
      .select('id, name, service, key_value, category, created_at, last_used, notes')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ key: toMaskedRecord(data) });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to update key' }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  const id = params?.id;
  if (!id) {
    return NextResponse.json({ error: 'Missing key id' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from('api_keys').delete().eq('id', id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to delete key' }, { status: 500 });
  }
}
