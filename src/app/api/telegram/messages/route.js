import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Read from the same global store that the webhook populates
const messageStore = globalThis.__telegramMessages || [];
if (!globalThis.__telegramMessages) globalThis.__telegramMessages = messageStore;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const after = Number(searchParams.get('after')) || 0;

  // Return messages after the given ID (for incremental polling)
  const filtered = after
    ? messageStore.filter((m) => m.id > after)
    : messageStore;

  return NextResponse.json(filtered);
}
