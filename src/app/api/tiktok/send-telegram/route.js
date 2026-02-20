import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = '8222086857'; // Jeff's Telegram

export async function POST(request) {
  try {
    const { videoUrl, caption } = await request.json();
    if (!videoUrl) return NextResponse.json({ error: 'Missing videoUrl' }, { status: 400 });
    if (!BOT_TOKEN) return NextResponse.json({ error: 'Telegram bot token not configured' }, { status: 500 });

    const text = `🎬 *TikTok Video Ready*\n\n${caption || 'No caption'}\n\n⬇️ Download and upload to TikTok`;

    // Send video via Telegram Bot API
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendVideo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        video: videoUrl,
        caption: text,
        parse_mode: 'Markdown',
      }),
    });

    const data = await res.json();

    if (!data.ok) {
      // Fallback: send as document if video fails (Runway URLs can be large)
      const docRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          document: videoUrl,
          caption: text,
          parse_mode: 'Markdown',
        }),
      });
      const docData = await docRes.json();
      if (!docData.ok) throw new Error(docData.description || 'Telegram send failed');
    }

    return NextResponse.json({ ok: true }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
