import { decodeStoredValue, encryptValue, maskKeyValue } from '@/lib/cryptoVault';

export function normalizeCategory(category) {
  const value = String(category || '').trim();
  return value || 'Other';
}

export function toMaskedRecord(row) {
  let masked = '****';

  try {
    const decoded = decodeStoredValue(row.key_value);
    masked = maskKeyValue(decoded.value);
  } catch {
    masked = '****';
  }

  return {
    id: row.id,
    name: row.name,
    service: row.service,
    category: normalizeCategory(row.category),
    notes: row.notes || '',
    created_at: row.created_at,
    last_used: row.last_used,
    key_masked: masked,
  };
}

export function buildInsertPayload(payload) {
  return {
    name: String(payload?.name || '').trim(),
    service: String(payload?.service || '').trim(),
    category: normalizeCategory(payload?.category),
    notes: String(payload?.notes || '').trim() || null,
    key_value: encryptValue(String(payload?.keyValue || '')),
  };
}

export function buildUpdatePayload(payload) {
  const updates = {
    name: String(payload?.name || '').trim(),
    service: String(payload?.service || '').trim(),
    category: normalizeCategory(payload?.category),
    notes: String(payload?.notes || '').trim() || null,
  };

  if (payload?.keyValue) {
    updates.key_value = encryptValue(String(payload.keyValue));
  }

  return updates;
}
