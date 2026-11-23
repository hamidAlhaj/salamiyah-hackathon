import { existsSync } from 'fs';
import { join } from 'path';
import { WaLinkChannel } from './message-channel';
import { isKnownLink, links } from './links';

const root = join(__dirname, '../../..');

describe('notification links point to routes that exist (bug B2)', () => {
  it('every link builder produces a known pattern', () => {
    expect(isKnownLink(links.myDonations())).toBe(true);
    expect(isKnownLink(links.campaign('orphans-2027'))).toBe(true);
    expect(isKnownLink(links.officialReceipt('R-2026-000012'))).toBe(true);
    expect(isKnownLink(links.staffCase('1c0e8f4e-0000-4000-8000-000000000000'))).toBe(true);
  });

  it('refuses the old /pledges/:id link and anything outside the patterns', () => {
    expect(isKnownLink('/pledges/1c0e8f4e-0000-4000-8000-000000000000')).toBe(false);
    expect(isKnownLink('https://evil.example/campaigns/x')).toBe(false);
    expect(isKnownLink('/campaigns/a/../../admin')).toBe(false);
  });

  it.each([
    ['web «my donations»', 'web/src/app/(app)/dashboard/donations/page.tsx'],
    ['web campaign page', 'web/src/app/(public)/campaigns/[slug]/page.tsx'],
    ['web official receipt', 'web/src/app/(public)/receipts/[no]/page.tsx'],
    ['web staff case (SLA alerts)', 'web/src/app/(app)/dashboard/cases/[id]/page.tsx'],
    [
      'mobile «my donations» (/dashboard/donations → /donations)',
      'mobile/src/app/donations.tsx',
    ],
    [
      'mobile campaign (/campaigns/:slug → /campaign/:slug)',
      'mobile/src/app/campaign/[slug].tsx',
    ],
    ['mobile link resolver', 'mobile/src/lib/links.ts'],
  ])('%s exists', (_label, file) => {
    expect(existsSync(join(root, file))).toBe(true);
  });
});

describe('WaLinkChannel (wa_link driver)', () => {
  it('builds a prefilled wa.me link with the international number and the encoded text', () => {
    const url = new WaLinkChannel().openUrl('+963 900 000 006', 'تم استلام تبرعك\nhttp://x/y');
    expect(url).toBe(
      `https://wa.me/963900000006?text=${encodeURIComponent('تم استلام تبرعك\nhttp://x/y')}`,
    );
  });
});
