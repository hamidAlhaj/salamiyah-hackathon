import { NextResponse, type NextRequest } from 'next/server';

const NEST_API_URL = process.env.NEST_API_URL ?? 'http://localhost:4000';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * A published spending proof (invoice or photo) for the public timeline, served from the same
 * origin. It never sends a session token: the API only returns proofs that were marked public at
 * upload on a public campaign, and 404 for everything else.
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!UUID_RE.test(id)) return new NextResponse('Not found', { status: 404 });
  const res = await fetch(new URL(`/expenditures/${id}/proof`, NEST_API_URL), {
    cache: 'no-store',
  });
  if (!res.ok || !res.body) return new NextResponse('Not found', { status: 404 });
  return new NextResponse(res.body, {
    headers: {
      'Content-Type': res.headers.get('content-type') ?? 'application/octet-stream',
      'Content-Disposition': 'inline',
      'Cache-Control': 'public, max-age=300',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
