import { NextResponse } from 'next/server';

const DEFAULT_CHAT_ID = 8222086857;

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

export async function POST(req) {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    return NextResponse.json({ error: 'Missing TELEGRAM_BOT_TOKEN' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const text = String(body?.text || '').trim();
    const chatId = Number(body?.chatId || DEFAULT_CHAT_ID);

    if (!text) {
      return NextResponse.json({ error: 'text is required' }, { status: 400 });
    }

    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
      }),
    });

    const payload = await response.json();

    if (!response.ok || !payload?.ok) {
      return NextResponse.json(
        { error: payload?.description || 'Failed to send Telegram message' },
        { status: response.status || 500 },
      );
    }

    const sentMessage = toMessageShape(payload.result);
    return NextResponse.json(sentMessage);
  } catch (error) {
    console.error('Telegram send POST error:', error);
    return NextResponse.json(
      { error: error?.message || 'Unexpected Telegram send error' },
      { status: 500 },
    );
  }
}
