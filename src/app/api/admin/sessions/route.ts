import { NextRequest, NextResponse } from 'next/server';
import { customAlphabet } from 'nanoid';
import { loadDB, saveDB, Session } from '@/lib/db';
import { isAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 12);

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const db = loadDB();
  const sessions = Object.values(db.sessions)
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

  const db = loadDB();
  const token = nanoid();
  const session: Session = {
    token,
    candidateName,
    candidateEmail: candidateEmail || '',
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
  db.sessions[token] = session;
  saveDB(db);

  const proto = req.headers.get('x-forwarded-proto') || 'http';
  const host = req.headers.get('host') || 'localhost:3000';
  const link = `${proto}://${host}/qcm/${token}`;
  return NextResponse.json({ token, link });
}
