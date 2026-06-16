import { NextRequest } from 'next/server';
import { getRecording } from '@/lib/db';
import { isAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { filename: string } }) {
  if (!isAdmin(req)) return new Response('Unauthorized', { status: 401 });
  const safe = params.filename.replace(/[^a-z0-9_.]/gi, '');
  const data = await getRecording(safe);
  if (!data) return new Response('Not found', { status: 404 });
  return new Response(data, {
    headers: { 'Content-Type': 'video/webm', 'Content-Length': String(data.byteLength) }
  });
}
