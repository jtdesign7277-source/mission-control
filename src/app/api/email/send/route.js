import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      return NextResponse.json({ error: 'Missing RESEND_API_KEY' }, { status: 500 });
    }

    const { to, subject, text, html, replyTo } = await request.json();

    if (!to || !subject || (!text && !html)) {
      return NextResponse.json({ error: 'to, subject, and body are required' }, { status: 400 });
    }

    const resend = new Resend(resendApiKey);
    const response = await resend.emails.send({
      from: 'jeff@stratify-associates.com',
      to: Array.isArray(to) ? to : [to],
      subject,
      text: text || undefined,
      html: html || undefined,
      replyTo: replyTo ? [replyTo] : undefined,
    });

    return NextResponse.json({ ok: true, response });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to send email' }, { status: 500 });
  }
}
