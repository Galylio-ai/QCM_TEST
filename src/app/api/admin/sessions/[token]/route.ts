import { NextRequest, NextResponse } from 'next/server';
import { getSession, deleteSession } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import { buildOrderedQuestions } from '@/lib/shuffle';
import { QUESTIONS } from '@/lib/questions';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const s = await getSession(params.token);
  if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const ordered = buildOrderedQuestions(s.token);
  const detail = ordered.map(o => {
    const givenShuffled = s.answers[String(o.displayIndex)];
    const givenOriginal = (givenShuffled === undefined || givenShuffled === null)
      ? null : o.choiceOrder[givenShuffled];
    const correct = givenOriginal !== null && givenOriginal === QUESTIONS[o.originalIndex].answer;
    return {
      displayIndex: o.displayIndex,
      question: o.question,
      antiFraud: o.antiFraud,
      shuffledChoices: o.shuffledChoices,
      givenShuffledIndex: givenShuffled ?? null,
      givenAnswer: givenOriginal === null || givenOriginal === undefined ? null : ['A','B','C','D'][givenOriginal],
      correctAnswer: ['A','B','C','D'][QUESTIONS[o.originalIndex].answer],
      isCorrect: correct
    };
  });

  return NextResponse.json({ session: s, detail });
}

export async function DELETE(req: NextRequest, { params }: { params: { token: string } }) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const s = await getSession(params.token);
  if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await deleteSession(params.token);
  return NextResponse.json({ ok: true });
}
