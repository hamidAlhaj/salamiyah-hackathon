import { describe, expect, it } from 'vitest';
import { canUse, linksFor } from './workspace';

describe('workspace links per role', () => {
  const keys = (role: Parameters<typeof linksFor>[0]) => linksFor(role).map((l) => l.key);

  it('ADMIN manages categories and campaigns, plus intake, cases and imports', () => {
    expect(keys('ADMIN')).toEqual([
      'home',
      'categories',
      'campaigns',
      'newCampaign',
      'intake',
      'cases',
      'imports',
    ]);
  });

  it('each staff role sees only its own screens', () => {
    expect(keys('STAFF')).toEqual(['home', 'intake', 'cases', 'imports']);
    expect(keys('CASE_OFFICER')).toEqual(['home', 'cases']);
    expect(keys('FINANCE_VERIFIER')).toEqual(['home', 'finance']);
  });

  it('donors and collectors have no staff screens on the web yet', () => {
    expect(keys('DONOR')).toEqual(['home']);
    expect(keys('COLLECTOR')).toEqual(['home']);
    expect(canUse('DONOR', 'categories')).toBe(false);
    expect(canUse('CASE_OFFICER', 'finance')).toBe(false);
  });
});
