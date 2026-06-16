import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import { REC_DIR } from '@/lib/db';
import { isAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { filename: string } }) {
  if (!isAdmin(req)) return new Response('Unauthorized', { status: 401 });
  const safe = params.filename.replace(/[^a-z0-9_.]/gi, '');
  const fp = path.join(REC_DIR, safe);
  if (!fp.startsWith(REC_DIR) || !fs.existsSync(fp)) return new Response('Not found', { status: 404 });
  const data = fs.readFileSync(fp);
  return new Response(data, {
    headers: { 'Content-Type': 'video/webm', 'Content-Length': String(data.length) }
  });
}
