import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { decodeStoredValue, encryptValue } from '@/lib/cryptoVault';

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

    let decoded;
    try {
      decoded = decodeStoredValue(data.key_value);
    } catch (decodeError) {
      if (decodeError?.code === 'DECRYPT_FAILED') {
        return NextResponse.json(
          {
            error: 'Stored key cannot be decrypted with current encryption settings. Re-save this key in Edit to repair it.',
            requiresResave: true,
          },
          { status: 422 },
        );
      }
      throw decodeError;
    }

    const value = decoded.value;

    const updates = {
      last_used: new Date().toISOString(),
    };

    if (decoded.needsReencrypt) {
      updates.key_value = encryptValue(value);
    }

    await supabase
      .from('api_keys')
      .update(updates)
      .eq('id', id);

    return NextResponse.json({ id, keyValue: value });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to reveal key' }, { status: 500 });
  }
}
