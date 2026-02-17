import { NextResponse } from 'next/server';
import { getGmailClient, mapFullMessage } from '@/lib/gmail';

export async function GET(_request, { params }) {
  const id = params?.id;
  if (!id) {
    return NextResponse.json({ error: 'Missing email id' }, { status: 400 });
  }

  try {
    const gmail = getGmailClient();
    const messageRes = await gmail.users.messages.get({
      userId: 'me',
      id,
      format: 'full',
    });

    return NextResponse.json({ email: mapFullMessage(messageRes.data) });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to fetch email' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  const id = params?.id;
  if (!id) {
    return NextResponse.json({ error: 'Missing email id' }, { status: 400 });
  }

  try {
    const { action } = await request.json();
    if (!action) {
      return NextResponse.json({ error: 'Missing action' }, { status: 400 });
    }

    const gmail = getGmailClient();

    if (action === 'archive') {
      await gmail.users.messages.modify({
        userId: 'me',
        id,
        requestBody: {
          removeLabelIds: ['INBOX'],
        },
      });
    } else if (action === 'markRead') {
      await gmail.users.messages.modify({
        userId: 'me',
        id,
        requestBody: {
          removeLabelIds: ['UNREAD'],
        },
      });
    } else if (action === 'markUnread') {
      await gmail.users.messages.modify({
        userId: 'me',
        id,
        requestBody: {
          addLabelIds: ['UNREAD'],
        },
      });
    } else {
      return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to update email' }, { status: 500 });
  }
}
