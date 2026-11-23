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
      'spending',
      'beneficiaries',
      'imports',
      'outbox',
      'notifications',
      'users',
      'collectionPoints',
      'hospitals',
      'paymentMethods',
    ]);
  });

  it('only ADMIN gets the setup screens; STAFF keeps the beneficiary registry', () => {
    for (const key of ['users', 'collectionPoints', 'hospitals', 'paymentMethods'] as const) {
      expect(canUse('ADMIN', key)).toBe(true);
      expect(canUse('STAFF', key)).toBe(false);
      expect(canUse('COLLECTOR', key)).toBe(false);
    }
    expect(canUse('STAFF', 'beneficiaries')).toBe(true);
    expect(canUse('FINANCE_VERIFIER', 'beneficiaries')).toBe(false);
  });

  it('each staff role sees only its own screens', () => {
    expect(keys('STAFF')).toEqual([
      'home',
      'intake',
      'cases',
      'beneficiaries',
      'imports',
      'notifications',
    ]);
    expect(keys('CASE_OFFICER')).toEqual(['home', 'cases', 'notifications']);
    expect(keys('FINANCE_VERIFIER')).toEqual(['home', 'finance', 'spending', 'notifications']);
  });

  it('donors see their donations; collectors their collection points', () => {
    expect(keys('DONOR')).toEqual(['home', 'donations', 'notifications']);
    expect(keys('COLLECTOR')).toEqual(['home', 'collector', 'notifications']);
    expect(canUse('STAFF', 'collector')).toBe(false);
    expect(canUse('DONOR', 'outbox')).toBe(false);
    expect(canUse('DONOR', 'categories')).toBe(false);
    expect(canUse('CASE_OFFICER', 'finance')).toBe(false);
    expect(canUse('STAFF', 'donations')).toBe(false);
  });
});
