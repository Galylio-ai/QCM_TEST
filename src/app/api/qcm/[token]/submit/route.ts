import { NextRequest, NextResponse } from 'next/server';
import { getSession, saveSession } from '@/lib/db';
import { buildOrderedQuestions } from '@/lib/shuffle';
import { QUESTIONS, TOTAL_QUESTIONS } from '@/lib/questions';

export const dynamic = 'force-dynamic';

export async function POST(_req: NextRequest, { params }: { params: { token: string } }) {
  const s = await getSession(params.token);
  if (!s) return NextResponse.json({ error: 'Lien invalide' }, { status: 404 });
  if (s.status === 'submitted') return NextResponse.json({ error: 'QCM déjà soumis' }, { status: 403 });

  const ordered = buildOrderedQuestions(s.token);
  let score = 0;
  let antiFraudCorrect = 0;
  let antiFraudTotal = 0;
  for (const o of ordered) {
    const given = s.answers[String(o.displayIndex)];
    const givenOrig = (given === undefined || given === null) ? null : o.choiceOrder[given];
    const correct = givenOrig !== null && givenOrig === QUESTIONS[o.originalIndex].answer;
    if (correct) score++;
    if (o.antiFraud) { antiFraudTotal++; if (correct) antiFraudCorrect++; }
  }
  s.score = score;
  s.antiFraudScore = `${antiFraudCorrect}/${antiFraudTotal}`;
  s.status = 'submitted';
  s.submittedAt = new Date().toISOString();
  await saveSession(s);

  return NextResponse.json({ score, total: TOTAL_QUESTIONS, antiFraudScore: s.antiFraudScore });
}
