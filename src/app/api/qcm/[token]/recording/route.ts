import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { loadDB, saveDB, REC_DIR } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const db = loadDB();
  const s = db.sessions[params.token];
  if (!s) return NextResponse.json({ error: 'Lien invalide' }, { status: 404 });

  const form = await req.formData();
  const file = form.get('video');
  if (!file || typeof (file as Blob).arrayBuffer !== 'function') {
    return NextResponse.json({ error: 'no file' }, { status: 400 });
  }

  const safeToken = params.token.replace(/[^a-z0-9]/gi, '');
  const filename = `${safeToken}_${Date.now()}.webm`;
  const fp = path.join(REC_DIR, filename);
  const buf = Buffer.from(await (file as Blob).arrayBuffer());
  fs.writeFileSync(fp, buf);

  s.recordings = s.recordings || [];
  s.recordings.push({ filename, size: buf.length, uploadedAt: new Date().toISOString() });
  saveDB(db);

  return NextResponse.json({ ok: true, filename });
}
