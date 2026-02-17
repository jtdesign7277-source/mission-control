import { google } from 'googleapis';

function getOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Missing Google OAuth credentials');
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return oauth2Client;
}

export function getGmailClient() {
  const auth = getOAuthClient();
  return google.gmail({ version: 'v1', auth });
}

function decodeBase64Url(data) {
  if (!data) return '';
  const normalized = data.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(normalized, 'base64').toString('utf8');
}

function findPart(parts = [], mimeType = 'text/plain') {
  for (const part of parts) {
    if (part.mimeType === mimeType && part.body?.data) {
      return decodeBase64Url(part.body.data);
    }
    if (part.parts?.length) {
      const nested = findPart(part.parts, mimeType);
      if (nested) return nested;
    }
  }
  return '';
}

export function extractMessageBody(payload) {
  if (!payload) return { text: '', html: '' };

  if (payload.body?.data) {
    const text = decodeBase64Url(payload.body.data);
    return { text, html: '' };
  }

  const html = findPart(payload.parts, 'text/html');
  const text = findPart(payload.parts, 'text/plain') || html.replace(/<[^>]+>/g, ' ');
  return { text, html };
}

export function getHeader(headers = [], name) {
  const item = headers.find((header) => header.name?.toLowerCase() === name.toLowerCase());
  return item?.value || '';
}

export function mapInboxMessage(message) {
  const payload = message.payload || {};
  const headers = payload.headers || [];

  return {
    id: message.id,
    threadId: message.threadId,
    sender: getHeader(headers, 'From'),
    subject: getHeader(headers, 'Subject') || '(No Subject)',
    snippet: message.snippet || '',
    timestamp: message.internalDate ? new Date(Number(message.internalDate)).toISOString() : null,
    unread: (message.labelIds || []).includes('UNREAD'),
    labels: message.labelIds || [],
  };
}

export function mapFullMessage(message) {
  const payload = message.payload || {};
  const headers = payload.headers || [];
  const { text, html } = extractMessageBody(payload);

  return {
    id: message.id,
    threadId: message.threadId,
    sender: getHeader(headers, 'From'),
    to: getHeader(headers, 'To'),
    cc: getHeader(headers, 'Cc'),
    subject: getHeader(headers, 'Subject') || '(No Subject)',
    snippet: message.snippet || '',
    text,
    html,
    timestamp: message.internalDate ? new Date(Number(message.internalDate)).toISOString() : null,
    unread: (message.labelIds || []).includes('UNREAD'),
    labels: message.labelIds || [],
  };
}
