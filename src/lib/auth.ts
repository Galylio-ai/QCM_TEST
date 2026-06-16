import { NextRequest } from 'next/server';

export function isAdmin(req: NextRequest): boolean {
  const pw = req.headers.get('x-admin-password') ?? new URL(req.url).searchParams.get('pw');
  const expected = process.env.ADMIN_PASSWORD || 'admin2026';
  return pw === expected;
}
