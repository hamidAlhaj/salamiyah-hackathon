import { NextResponse, type NextRequest } from 'next/server';
import { getSessionToken } from '@/lib/session';

const NEST_API_URL = process.env.NEST_API_URL ?? 'http://localhost:4000';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Which API file endpoint each kind maps to. Nothing else can be proxied. */
const PATHS: Record<string, (id: string) => string> = {
  documents: (id) => `/documents/${id}/file`,
  receipts: (id) => `/receipts/${id}/file`,
  'import-errors': (id) => `/imports/${id}/errors.csv`,
};

/**
 * Private files (medical documents, transfer receipts, import errors) through the session: the
 * browser sends the HttpOnly cookie, this handler adds the Bearer token and the API checks the role.
 * A documented deviation from b4f (Server Actions cannot stream files to <img> or a download).
 */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ kind: string; id: string }> },
) {
  const { kind, id } = await ctx.params;
  const path = PATHS[kind];
  if (!path || !UUID_RE.test(id)) return new NextResponse('Not found', { status: 404 });
  const token = await getSessionToken();
  if (!token) return new NextResponse('Unauthorized', { status: 401 });
  const res = await fetch(new URL(path(id), NEST_API_URL), {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok || !res.body) {
    return new NextResponse('Not found', { status: res.status === 403 ? 403 : 404 });
  }
  return new NextResponse(res.body, {
    headers: {
      'Content-Type': res.headers.get('Content-Type') ?? 'application/octet-stream',
      'Cache-Control': 'private, no-store',
    },
  });
}
