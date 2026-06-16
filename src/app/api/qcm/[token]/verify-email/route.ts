import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const s = await getSession(params.token);
  if (!s) return NextResponse.json({ error: 'Lien invalide' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const email = (body.email || '').toLowerCase().trim();
  if (!email) return NextResponse.json({ error: 'Email requis' }, { status: 400 });

  if (s.candidateEmail !== email) {
    return NextResponse.json({ error: 'Email incorrect. Ce lien ne correspond pas à votre email.' }, { status: 403 });
  }

  if (s.status === 'submitted') {
    return NextResponse.json({ error: 'Vous avez déjà passé ce QCM. Merci.' }, { status: 403 });
  }

  return NextResponse.json({ ok: true, candidateName: s.candidateName });
}
