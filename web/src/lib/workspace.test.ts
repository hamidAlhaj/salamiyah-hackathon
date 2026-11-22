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
      'outbox',
      'notifications',
    ]);
  });

  it('each staff role sees only its own screens', () => {
    expect(keys('STAFF')).toEqual(['home', 'intake', 'cases', 'imports', 'notifications']);
    expect(keys('CASE_OFFICER')).toEqual(['home', 'cases', 'notifications']);
    expect(keys('FINANCE_VERIFIER')).toEqual(['home', 'finance', 'notifications']);
  });

  it('donors see their donations; collectors have no web screens yet', () => {
    expect(keys('DONOR')).toEqual(['home', 'donations', 'notifications']);
    expect(keys('COLLECTOR')).toEqual(['home', 'notifications']);
    expect(canUse('DONOR', 'outbox')).toBe(false);
    expect(canUse('DONOR', 'categories')).toBe(false);
    expect(canUse('CASE_OFFICER', 'finance')).toBe(false);
    expect(canUse('STAFF', 'donations')).toBe(false);
  });
});
