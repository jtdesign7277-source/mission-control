import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

function normalizeUpdates(payload) {
  const updates = {};

  if (payload?.name !== undefined) updates.name = String(payload.name || '').trim();
  if (payload?.email !== undefined) updates.email = String(payload.email || '').trim();
  if (payload?.company !== undefined) updates.company = String(payload.company || '').trim() || null;
  if (payload?.phone !== undefined) updates.phone = String(payload.phone || '').trim() || null;
  if (payload?.category !== undefined) updates.category = String(payload.category || '').trim() || 'Other';
  if (payload?.notes !== undefined) updates.notes = String(payload.notes || '').trim() || null;
  if (payload?.last_emailed !== undefined) updates.last_emailed = payload.last_emailed || null;

  return updates;
}

export async function PUT(request, { params }) {
  const id = params?.id;
  if (!id) {
    return NextResponse.json({ error: 'Missing contact id' }, { status: 400 });
  }

  try {
    const payload = await request.json();
    const updates = normalizeUpdates(payload);

    if (updates.name !== undefined && !updates.name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    if (updates.email !== undefined && !updates.email) {
      return NextResponse.json({ error: 'email is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from('contacts')
      .update(updates)
      .eq('id', id)
      .select('id, name, email, company, phone, category, notes, created_at, last_emailed')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ contact: data });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to update contact' }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  const id = params?.id;
  if (!id) {
    return NextResponse.json({ error: 'Missing contact id' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from('contacts').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to delete contact' }, { status: 500 });
  }
}
