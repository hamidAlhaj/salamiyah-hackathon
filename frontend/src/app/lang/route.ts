import { NextResponse, type NextRequest } from 'next/server';
import { LANG_COOKIE, toLocale } from '@/i18n/locale';

/** Same-site path to return to: "/x?y" only, never another origin or "//host". */
function safePath(value: string | null | undefined): string | null {
  return value && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\')
    ? value
    : null;
}

/**
 * POST /lang (the ع / EN switch, a plain form so it works without JavaScript): stores the choice
 * in the `lang` cookie and goes back to the same page (303, so the browser does a GET).
 * The URL never changes with the language.
 */
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const lang = toLocale(String(form.get('lang') ?? ''));
  const next = safePath(String(form.get('next') ?? '')) ?? '/';

  // Prefer the referring URL (it keeps the query string) when it is this site and the same page.
  let target = next;
  const referer = request.headers.get('referer');
  if (referer) {
    try {
      const url = new URL(referer);
      if (url.host === request.headers.get('host') && url.pathname === next) {
        target = `${url.pathname}${url.search}`;
      }
    } catch {
      // Malformed Referer: use `next`.
    }
  }

  const response = new NextResponse(null, { status: 303, headers: { Location: target } });
  response.cookies.set(LANG_COOKIE, lang, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    httpOnly: true,
  });
  return response;
}
