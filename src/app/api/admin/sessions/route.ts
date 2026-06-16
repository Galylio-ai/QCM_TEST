import { NextRequest, NextResponse } from 'next/server';
import { customAlphabet } from 'nanoid';
import { listSessions, saveSession, getSessionByEmail, Session } from '@/lib/db';
import { isAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 12);

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const all = await listSessions();
  const sessions = all
    .map(s => ({
      token: s.token,
      candidateName: s.candidateName,
      candidateEmail: s.candidateEmail,
      createdAt: s.createdAt,
      status: s.status,
      startedAt: s.startedAt,
      submittedAt: s.submittedAt,
      score: s.score,
      antiFraudScore: s.antiFraudScore,
      suspiciousEvents: (s.events || []).filter(e => e.suspicious).length
    }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return NextResponse.json({ sessions });
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const { candidateName, candidateEmail } = body;
  if (!candidateName) return NextResponse.json({ error: 'candidateName required' }, { status: 400 });
  if (!candidateEmail) return NextResponse.json({ error: 'candidateEmail required' }, { status: 400 });

  const normalizedEmail = candidateEmail.toLowerCase().trim();
  const existing = await getSessionByEmail(normalizedEmail);
  if (existing) {
    return NextResponse.json({ error: `Ce candidat (${normalizedEmail}) a déjà un QCM assigné (statut: ${existing.status}).` }, { status: 409 });
  }

  const token = nanoid();
  const session: Session = {
    token,
    candidateName,
    candidateEmail: normalizedEmail,
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
  return NextResponse.json({ token, link });
}
