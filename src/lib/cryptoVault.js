import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const LEGACY_CBC_ALGORITHM = 'aes-256-cbc';
const IV_BYTES = 12;

function getDerivedKey() {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret) {
    throw new Error('Missing ENCRYPTION_SECRET');
  }
  return crypto.createHash('sha256').update(secret).digest();
}

export function encryptValue(plainText) {
  const value = String(plainText ?? '');
  const key = getDerivedKey();
  const iv = crypto.randomBytes(IV_BYTES);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    iv.toString('base64'),
    authTag.toString('base64'),
    encrypted.toString('base64'),
  ].join(':');
}

export function decryptValue(payload) {
  const raw = String(payload || '');
  const [ivB64, authTagB64, encryptedB64] = raw.split(':');
  if (!ivB64 || !authTagB64 || !encryptedB64) {
    throw new Error('Invalid encrypted payload format');
  }

  const key = getDerivedKey();
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(authTagB64, 'base64');
  const encrypted = Buffer.from(encryptedB64, 'base64');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

function decodeBuffer(value) {
  if (typeof value !== 'string') return null;
  const raw = value.trim();
  if (!raw) return null;

  if (/^[0-9a-fA-F]+$/.test(raw) && raw.length % 2 === 0) {
    try {
      return Buffer.from(raw, 'hex');
    } catch {
      return null;
    }
  }

  if (/^[A-Za-z0-9+/]+={0,2}$/.test(raw) && raw.length % 4 === 0) {
    try {
      return Buffer.from(raw, 'base64');
    } catch {
      return null;
    }
  }

  return null;
}

function decryptGcmFromBuffers({ iv, authTag, encrypted, key }) {
  if (!iv || !authTag || !encrypted) return null;

  try {
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  } catch {
    return null;
  }
}

function decryptCbcFromBuffers({ iv, encrypted, key }) {
  if (!iv || !encrypted || iv.length !== 16) return null;

  try {
    const decipher = crypto.createDecipheriv(LEGACY_CBC_ALGORITHM, key, iv);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  } catch {
    return null;
  }
}

function decodeLegacyObject(raw, key) {
  if (!raw.startsWith('{') || !raw.endsWith('}')) return null;

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== 'object') return null;

  const iv = decodeBuffer(parsed.iv || parsed.initializationVector || parsed.nonce);
  const encrypted = decodeBuffer(
    parsed.encrypted
      || parsed.encryptedData
      || parsed.ciphertext
      || parsed.content
      || parsed.data,
  );
  const authTag = decodeBuffer(parsed.authTag || parsed.tag || parsed.auth_tag);

  const gcmValue = decryptGcmFromBuffers({ iv, authTag, encrypted, key });
  if (gcmValue !== null) return gcmValue;

  const cbcValue = decryptCbcFromBuffers({ iv, encrypted, key });
  if (cbcValue !== null) return cbcValue;

  return null;
}

function decodeLegacyDelimited(raw, key) {
  const parts = raw.split(':');
  if (parts.length < 2 || parts.length > 3) return null;

  const first = decodeBuffer(parts[0]);
  const second = decodeBuffer(parts[1]);
  const third = parts.length === 3 ? decodeBuffer(parts[2]) : null;

  if (!first || !second || (parts.length === 3 && !third)) return null;

  if (parts.length === 2) {
    const cbcValue = decryptCbcFromBuffers({ iv: first, encrypted: second, key });
    if (cbcValue !== null) return cbcValue;
    return null;
  }

  const gcmPrimary = decryptGcmFromBuffers({
    iv: first,
    authTag: second,
    encrypted: third,
    key,
  });
  if (gcmPrimary !== null) return gcmPrimary;

  const gcmAlt = decryptGcmFromBuffers({
    iv: first,
    authTag: third,
    encrypted: second,
    key,
  });
  if (gcmAlt !== null) return gcmAlt;

  const cbcPrimary = decryptCbcFromBuffers({ iv: first, encrypted: second, key });
  if (cbcPrimary !== null) return cbcPrimary;

  const cbcAlt = decryptCbcFromBuffers({ iv: first, encrypted: third, key });
  if (cbcAlt !== null) return cbcAlt;

  return null;
}

function isLikelyPlainText(raw) {
  if (!raw) return false;
  if (raw.length > 2048) return false;

  const nonPrintable = raw.replace(/[\t\n\r -~]/g, '');
  return nonPrintable.length === 0;
}

/**
 * Decode stored vault value with backwards-compatible fallbacks.
 * Returns plaintext value and whether it should be re-encrypted to current format.
 */
export function decodeStoredValue(payload) {
  const raw = String(payload || '').trim();
  if (!raw) {
    throw new Error('Stored key value is empty');
  }

  try {
    return { value: decryptValue(raw), needsReencrypt: false };
  } catch (error) {
    const key = getDerivedKey();

    const legacyObjectValue = decodeLegacyObject(raw, key);
    if (legacyObjectValue !== null) {
      return { value: legacyObjectValue, needsReencrypt: true };
    }

    const legacyDelimitedValue = decodeLegacyDelimited(raw, key);
    if (legacyDelimitedValue !== null) {
      return { value: legacyDelimitedValue, needsReencrypt: true };
    }

    const hasStructuredEncryptionMarkers = raw.includes(':') || (raw.startsWith('{') && raw.endsWith('}'));
    if (!hasStructuredEncryptionMarkers && isLikelyPlainText(raw)) {
      return { value: raw, needsReencrypt: true };
    }

    const decryptError = new Error(error?.message || 'Unable to decrypt key value');
    decryptError.code = 'DECRYPT_FAILED';
    throw decryptError;
  }
}

export function maskKeyValue(value) {
  const raw = String(value || '');
  if (!raw) return '****';
  const tail = raw.slice(-4);
  return `****${tail}`;
}
