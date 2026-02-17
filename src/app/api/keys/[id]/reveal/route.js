import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { decryptValue } from '@/lib/cryptoVault';

export async function GET(_request, { params }) {
  const id = params?.id;
  if (!id) {
    return NextResponse.json({ error: 'Missing key id' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from('api_keys')
      .select('id, key_value')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const value = decryptValue(data.key_value);

    await supabase
      .from('api_keys')
      .update({ last_used: new Date().toISOString() })
      .eq('id', id);

    return NextResponse.json({ id, keyValue: value });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to reveal key' }, { status: 500 });
  }
}
