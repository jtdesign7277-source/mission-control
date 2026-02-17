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
      labelIds: ['INBOX'],
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

    const inbox = detailed
      .map((item) => mapInboxMessage(item.data))
      .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());

    return NextResponse.json({ emails: inbox });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to fetch inbox' }, { status: 500 });
  }
}
