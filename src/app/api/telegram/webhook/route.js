import { NextResponse } from 'next/server';

// In-memory message store (persists across warm invocations)
const messageStore = globalThis.__telegramMessages || [];
if (!globalThis.__telegramMessages) globalThis.__telegramMessages = messageStore;

const TARGET_CHAT_ID = 8222086857;
const MAX_MESSAGES = 200;

function toMessageShape(message) {
  if (!message) return null;
  return {
    id: message.message_id,
    text: message.text || message.caption || '',
    from: message.from?.is_bot ? 'bot' : 'user',
    fromName: message.from?.first_name || (message.from?.is_bot ? 'Fred' : 'You'),
    date: (message.date || 0) * 1000,
    chatId: message.chat?.id,
  };
}

// Telegram sends updates here via webhook
export async function POST(request) {
  try {
    const update = await request.json();
    const message = update.message || update.edited_message;

    if (message && Number(message.chat?.id) === TARGET_CHAT_ID) {
      const shaped = toMessageShape(message);
      if (shaped) {
        // Dedupe by message ID
        const existingIndex = messageStore.findIndex((m) => m.id === shaped.id);
        if (existingIndex >= 0) {
          messageStore[existingIndex] = shaped;
        } else {
          messageStore.push(shaped);
        }
        // Trim to max
        while (messageStore.length > MAX_MESSAGES) {
          messageStore.shift();
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ ok: true }); // Always return 200 to Telegram
  }
}
