import { NextRequest, NextResponse } from 'next/server';
import { loadDB, saveDB } from '@/lib/db';
import { TOTAL_QUESTIONS } from '@/lib/questions';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const db = loadDB();
  const s = db.sessions[params.token];
  if (!s) return NextResponse.json({ error: 'Lien invalide' }, { status: 404 });
  if (s.status === 'submitted') return NextResponse.json({ error: 'QCM déjà soumis' }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const { displayIndex, shuffledChoiceIndex } = body;
  if (typeof displayIndex !== 'number' || displayIndex < 0 || displayIndex >= TOTAL_QUESTIONS) {
    return NextResponse.json({ error: 'displayIndex invalide' }, { status: 400 });
  }
  s.answers[String(displayIndex)] = shuffledChoiceIndex;
  saveDB(db);
  return NextResponse.json({ ok: true });
}
