import { NextResponse } from 'next/server';

export async function POST() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'Missing TELEGRAM_BOT_TOKEN' }, { status: 500 });
  }

  const webhookUrl = 'https://mission-control-seven-henna.vercel.app/api/telegram/webhook';

  const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: webhookUrl,
      allowed_updates: ['message', 'edited_message'],
    }),
  });

  const data = await res.json();
  return NextResponse.json(data);
}

// GET to check current webhook status
export async function GET() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'Missing TELEGRAM_BOT_TOKEN' }, { status: 500 });
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
  const data = await res.json();
  return NextResponse.json(data);
}
