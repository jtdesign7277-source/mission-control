import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { buildInsertPayload, toMaskedRecord } from '@/lib/keyVault';

export async function GET(request) {
  try {
    const supabase = getSupabaseAdminClient();
    const { searchParams } = new URL(request.url);
    const category = String(searchParams.get('category') || '').trim();
    const search = String(searchParams.get('search') || '').trim();

    let query = supabase
      .from('api_keys')
      .select('id, name, service, key_value, category, created_at, last_used, notes')
      .order('created_at', { ascending: false });

    if (category && category !== 'All') {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,service.ilike.%${search}%,notes.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      keys: (data || []).map(toMaskedRecord),
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to list keys' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const payload = await request.json();
    const service = String(payload?.service || '').trim();
    const name = String(payload?.name || '').trim();
    const keyValue = String(payload?.keyValue || '').trim();

    if (!service || !name || !keyValue) {
      return NextResponse.json({ error: 'service, name, and keyValue are required' }, { status: 400 });
    }

    const insertPayload = buildInsertPayload(payload);
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from('api_keys')
      .insert(insertPayload)
      .select('id, name, service, key_value, category, created_at, last_used, notes')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ key: toMaskedRecord(data) }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to create key' }, { status: 500 });
  }
}
