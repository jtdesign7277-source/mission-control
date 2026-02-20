import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = '8222086857'; // Jeff's Telegram

export async function POST(request) {
  try {
    const { videoUrl, caption, text } = await request.json();
    if (!BOT_TOKEN) return NextResponse.json({ error: 'Telegram bot token not configured' }, { status: 500 });

    // If we have a video URL, send as video
    if (videoUrl) {
      const vidCaption = `🎬 *TikTok Video Ready*\n\n${caption || 'No caption'}\n\n⬇️ Download → [Upload to TikTok](https://www.tiktok.com/upload)`;

      const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendVideo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          video: videoUrl,
          caption: vidCaption,
          parse_mode: 'Markdown',
        }),
      });

      const data = await res.json();

      if (!data.ok) {
        // Fallback: send as document if video fails
        const docRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: CHAT_ID,
            document: videoUrl,
            caption: vidCaption,
            parse_mode: 'Markdown',
          }),
        });
        const docData = await docRes.json();
        if (!docData.ok) throw new Error(docData.description || 'Telegram send failed');
      }

      return NextResponse.json({ ok: true });
    }

    // No video — send as text message (script/caption)
    const message = text || caption;
    if (!message) return NextResponse.json({ error: 'Nothing to send — no video or text provided' }, { status: 400 });

    const fullMessage = message + '\n\n🔗 [Upload to TikTok](https://www.tiktok.com/upload)';

    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: fullMessage,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      }),
    });

    const data = await res.json();
    if (!data.ok) throw new Error(data.description || 'Telegram send failed');

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
