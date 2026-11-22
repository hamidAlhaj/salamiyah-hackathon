import { NextResponse, type NextRequest } from 'next/server';

const NEST_API_URL = process.env.NEST_API_URL ?? 'http://localhost:4000';

/** The public aggregate numbers as a CSV download (no rows about people), same origin, no token. */
export async function GET(req: NextRequest) {
  const lang = req.nextUrl.searchParams.get('lang') === 'en' ? 'en' : 'ar';
  const url = new URL('/stats/transparency.csv', NEST_API_URL);
  url.searchParams.set('lang', lang);
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return new NextResponse('Unavailable', { status: 502 });
  return new NextResponse(await res.text(), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="majlis-fund-transparency.csv"',
      'Cache-Control': 'no-store',
    },
  });
}
