import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/db';
import { TOTAL_QUESTIONS, DURATION_PER_QUESTION_SEC } from '@/lib/questions';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const s = await getSession(params.token);
  if (!s) return NextResponse.json({ error: 'Lien invalide' }, { status: 404 });
  return NextResponse.json({
    candidateName: s.candidateName,
    status: s.status,
    totalQuestions: TOTAL_QUESTIONS,
    durationPerQuestionSec: DURATION_PER_QUESTION_SEC
  });
}
