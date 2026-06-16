import { NextRequest } from 'next/server';
import { getRecordingStream } from '@/lib/db';
import { isAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest, { params }: { params: { filename: string } }) {
  if (!isAdmin(req)) return new Response('Unauthorized', { status: 401 });
  const safe = params.filename.replace(/[^a-z0-9_.]/gi, '');
  const result = await getRecordingStream(safe);
  if (!result) return new Response('Not found', { status: 404 });

  const { stream, size } = result;
  const headers: Record<string, string> = { 'Content-Type': 'video/webm' };
  if (size) headers['Content-Length'] = String(size);

  const readableStream = new ReadableStream({
    start(controller) {
      stream.on('data', chunk => controller.enqueue(chunk));
      stream.on('end', () => controller.close());
      stream.on('error', err => controller.error(err));
    }
  });

  return new Response(readableStream, { headers });
}
