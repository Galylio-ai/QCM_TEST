import { NextRequest, NextResponse } from 'next/server';
import { getSession, saveSession } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const s = await getSession(params.token);
  if (!s) return NextResponse.json({ error: 'Lien invalide' }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  const { type, suspicious, details } = body;
  if (!type) return NextResponse.json({ error: 'type required' }, { status: 400 });
  s.events.push({ type, suspicious: !!suspicious, details: details ?? null, at: new Date().toISOString() });
  await saveSession(s);
  return NextResponse.json({ ok: true });
}
