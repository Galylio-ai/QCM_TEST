import { NextRequest, NextResponse } from 'next/server';
import { loadDB, saveDB } from '@/lib/db';
import { buildOrderedQuestions } from '@/lib/shuffle';
import { TOTAL_QUESTIONS, DURATION_PER_QUESTION_SEC } from '@/lib/questions';

export const dynamic = 'force-dynamic';

export async function POST(_req: NextRequest, { params }: { params: { token: string } }) {
  const db = loadDB();
  const s = db.sessions[params.token];
  if (!s) return NextResponse.json({ error: 'Lien invalide' }, { status: 404 });
  if (s.status === 'submitted') return NextResponse.json({ error: 'QCM déjà soumis' }, { status: 403 });
  if (s.status === 'pending') {
    s.status = 'in_progress';
    s.startedAt = new Date().toISOString();
  }
  saveDB(db);
  const ordered = buildOrderedQuestions(s.token).map(o => ({
    displayIndex: o.displayIndex,
    question: o.question,
    choices: o.shuffledChoices
  }));
  return NextResponse.json({
    candidateName: s.candidateName,
    totalQuestions: TOTAL_QUESTIONS,
    durationPerQuestionSec: DURATION_PER_QUESTION_SEC,
    questions: ordered,
    startedAt: s.startedAt,
    alreadyAnswered: s.answers || {}
  });
}
