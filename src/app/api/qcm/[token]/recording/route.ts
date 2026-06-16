import { NextRequest, NextResponse } from 'next/server';
import { getSession, saveSession, saveRecording } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const s = await getSession(params.token);
  if (!s) return NextResponse.json({ error: 'Lien invalide' }, { status: 404 });

  const form = await req.formData();
  const file = form.get('video');
  if (!file || typeof (file as Blob).arrayBuffer !== 'function') {
    return NextResponse.json({ error: 'no file' }, { status: 400 });
  }

  const safeToken = params.token.replace(/[^a-z0-9]/gi, '');
  const filename = `${safeToken}_${Date.now()}.webm`;
  const buf = Buffer.from(await (file as Blob).arrayBuffer());
  await saveRecording(filename, buf);

  s.recordings = s.recordings || [];
  s.recordings.push({ filename, size: buf.length, uploadedAt: new Date().toISOString() });
  await saveSession(s);

  return NextResponse.json({ ok: true, filename });
}
