import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

function normalizeContactPayload(payload) {
  return {
    name: String(payload?.name || '').trim(),
    email: String(payload?.email || '').trim(),
    company: String(payload?.company || '').trim() || null,
    phone: String(payload?.phone || '').trim() || null,
    category: String(payload?.category || '').trim() || 'Other',
    notes: String(payload?.notes || '').trim() || null,
    last_emailed: payload?.last_emailed || null,
  };
}

export async function GET(request) {
  try {
    const supabase = getSupabaseAdminClient();
    const { searchParams } = new URL(request.url);
    const search = String(searchParams.get('search') || '').trim();
    const category = String(searchParams.get('category') || '').trim();

    let query = supabase
      .from('contacts')
      .select('id, name, email, company, phone, category, notes, created_at, last_emailed')
      .order('created_at', { ascending: false });

    if (category && category !== 'All') {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ contacts: data || [] });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to fetch contacts' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const payload = await request.json();
    const contact = normalizeContactPayload(payload);

    if (!contact.name || !contact.email) {
      return NextResponse.json({ error: 'name and email are required' }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from('contacts')
      .insert(contact)
      .select('id, name, email, company, phone, category, notes, created_at, last_emailed')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ contact: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to create contact' }, { status: 500 });
  }
}
