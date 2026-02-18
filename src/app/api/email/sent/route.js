import { NextResponse } from 'next/server';
import { getGmailClient, mapInboxMessage } from '@/lib/gmail';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const maxResults = Math.min(Number(searchParams.get('limit')) || 25, 100);

  try {
    const gmail = getGmailClient();

    const listRes = await gmail.users.messages.list({
      userId: 'me',
      maxResults,
      labelIds: ['SENT'],
    });

    const messages = listRes.data.messages || [];

    const detailed = await Promise.all(
      messages.map((item) =>
        gmail.users.messages.get({
          userId: 'me',
          id: item.id,
          format: 'metadata',
          metadataHeaders: ['From', 'To', 'Subject', 'Date'],
        }),
      ),
    );

    const sent = detailed
      .map((item) => {
        const mapped = mapInboxMessage(item.data);
        // For sent messages, show the recipient instead of sender
        const headers = item.data.payload?.headers || [];
        const toHeader = headers.find((h) => h.name?.toLowerCase() === 'to');
        mapped.recipient = toHeader?.value || '';
        return mapped;
      })
      .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());

    return NextResponse.json({ emails: sent });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to fetch sent messages' }, { status: 500 });
  }
}
