import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
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

export function maskKeyValue(value) {
  const raw = String(value || '');
  if (!raw) return '****';
  const tail = raw.slice(-4);
  return `****${tail}`;
}
