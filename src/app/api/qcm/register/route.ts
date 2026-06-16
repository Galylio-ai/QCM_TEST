import { NextRequest, NextResponse } from 'next/server';
import { customAlphabet } from 'nanoid';
import { getSessionByEmail, saveSession, Session } from '@/lib/db';

export const dynamic = 'force-dynamic';

const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 12);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const candidateName = (body.candidateName || '').trim();
    const candidateEmail = (body.candidateEmail || '').toLowerCase().trim();

    if (!candidateName) return NextResponse.json({ error: 'Nom complet requis' }, { status: 400 });
    if (!candidateEmail || !candidateEmail.includes('@')) {
      return NextResponse.json({ error: 'Email valide requis' }, { status: 400 });
    }

    // One QCM per email — return the existing link if already registered
    const existing = await getSessionByEmail(candidateEmail);
    if (existing) {
      if (existing.status === 'submitted') {
        return NextResponse.json({ error: 'Vous avez déjà passé le QCM avec cet email. Merci.' }, { status: 409 });
      }
      // Already registered but not yet submitted — return their link again
      const proto = req.headers.get('x-forwarded-proto') || 'http';
      const host = req.headers.get('host') || 'localhost:3000';
      const link = `${proto}://${host}/qcm/${existing.token}`;
      return NextResponse.json({ token: existing.token, link, alreadyRegistered: true });
    }

    const token = nanoid();
    const session: Session = {
      token,
      candidateName,
      candidateEmail,
      createdAt: new Date().toISOString(),
      status: 'pending',
      startedAt: null,
      submittedAt: null,
      answers: {},
      events: [],
      score: null,
      antiFraudScore: null,
      recordings: []
    };
    await saveSession(session);

    const proto = req.headers.get('x-forwarded-proto') || 'http';
    const host = req.headers.get('host') || 'localhost:3000';
    const link = `${proto}://${host}/qcm/${token}`;
    return NextResponse.json({ token, link, alreadyRegistered: false });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: 'Erreur serveur : ' + msg }, { status: 500 });
  }
}
