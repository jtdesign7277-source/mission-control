import { NextResponse } from 'next/server';
import { getGmailClient } from '@/lib/gmail';

export async function POST(request) {
  try {
    const { threadId, messageId, to, subject, body } = await request.json();

    if (!threadId || !messageId || !to || !subject || !body) {
      return NextResponse.json({ error: 'Missing required fields: threadId, messageId, to, subject, body' }, { status: 400 });
    }

    const gmail = getGmailClient();

    const rawMessage = [
      `From: jeff@stratify-associates.com`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `In-Reply-To: <${messageId}>`,
      `References: <${messageId}>`,
      `Content-Type: text/plain; charset="UTF-8"`,
      ``,
      body,
    ].join('\r\n');

    const encoded = Buffer.from(rawMessage)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encoded,
        threadId,
      },
    });

    return NextResponse.json({ success: true, messageId: result.data.id });
  } catch (error) {
    console.error('Reply error:', error);
    return NextResponse.json({ error: error.message || 'Failed to send reply' }, { status: 500 });
  }
}
