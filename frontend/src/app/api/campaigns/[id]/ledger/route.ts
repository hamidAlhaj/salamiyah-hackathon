import { NextResponse, type NextRequest } from 'next/server';
import { ApiError } from '@/lib/api/client';
import { getLedger } from '@/lib/api/campaigns';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Live progress: the campaign page polls this same-origin route every ~5 s while it is visible, so the
 * browser never calls the API directly. Public data only (the campaign account ledger), never cached.
 * A documented deviation from b4f, like the file proxy: Server Actions are not meant for polling reads.
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!UUID_RE.test(id)) return new NextResponse('Not found', { status: 404 });
  try {
    const ledger = await getLedger(id);
    return NextResponse.json(ledger, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    const status = err instanceof ApiError ? err.statusCode : 502;
    return new NextResponse(null, { status: status === 404 ? 404 : 502 });
  }
}
