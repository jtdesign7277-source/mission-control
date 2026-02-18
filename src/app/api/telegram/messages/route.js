import { NextResponse } from 'next/server';

const TARGET_CHAT_ID = 8222086857;
let updatesOffset = 0;
let cachedMessages = [];

export const dynamic = 'force-dynamic';

function toMessageShape(message) {
  if (!message) return null;
  return {
    id: message.message_id,
    text: message.text || message.caption || '',
    from: message.from?.is_bot ? 'bot' : 'user',
    date: (message.date || 0) * 1000,
    chatId: message.chat?.id,
  };
}

export async function GET() {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    return NextResponse.json({ error: 'Missing TELEGRAM_BOT_TOKEN' }, { status: 500 });
  }

  try {
    const params = new URLSearchParams({
      offset: String(updatesOffset),
      limit: '100',
      timeout: '0',
      allowed_updates: JSON.stringify(['message', 'edited_message']),
    });

    const response = await fetch(`https://api.telegram.org/bot${token}/getUpdates?${params.toString()}`, {
      cache: 'no-store',
    });

    const payload = await response.json();

    if (!response.ok || !payload?.ok) {
      return NextResponse.json(
        { error: payload?.description || 'Failed to fetch Telegram updates' },
        { status: response.status || 500 },
      );
    }

    const updates = Array.isArray(payload.result) ? payload.result : [];

    if (updates.length > 0) {
      const maxUpdateId = updates.reduce((maxId, update) => {
        return update.update_id > maxId ? update.update_id : maxId;
      }, updatesOffset - 1);
      updatesOffset = maxUpdateId + 1;
    }

    const messages = updates
      .map((update) => update.message || update.edited_message)
      .filter(Boolean)
      .filter((message) => Number(message.chat?.id) === TARGET_CHAT_ID)
      .map(toMessageShape)
      .filter(Boolean)
      .sort((a, b) => {
        if (a.date !== b.date) return a.date - b.date;
        return a.id - b.id;
      });

    if (messages.length > 0) {
      const deduped = new Map(cachedMessages.map((message) => [message.id, message]));
      messages.forEach((message) => deduped.set(message.id, message));

      cachedMessages = Array.from(deduped.values())
        .sort((a, b) => {
          if (a.date !== b.date) return a.date - b.date;
          return a.id - b.id;
        })
        .slice(-200);
    }

    return NextResponse.json(cachedMessages);
  } catch (error) {
    console.error('Telegram messages GET error:', error);
    return NextResponse.json(
      { error: error?.message || 'Unexpected Telegram fetch error' },
      { status: 500 },
    );
  }
}
