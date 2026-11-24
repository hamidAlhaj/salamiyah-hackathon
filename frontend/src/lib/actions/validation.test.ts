import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

const { isKnownRoutePath, readFlag, readUuids } = await import('./validation');

const UUID = '3f2b8c1e-6a7d-4e1f-9b2c-0d4e5f6a7b8c';

describe('Server Action helpers', () => {
  it('allows the admin setup pages and a campaign donate page to be revalidated', () => {
    for (const path of [
      '/dashboard/admin/users',
      '/dashboard/admin/collection-points',
      '/dashboard/admin/hospitals',
      '/dashboard/admin/payment-methods',
      '/dashboard/admin/beneficiaries',
      '/campaigns/roof-repair-albaath/donate',
    ]) {
      expect(isKnownRoutePath(path)).toBe(true);
    }
    expect(isKnownRoutePath('/dashboard/admin/users/x')).toBe(false);
    expect(isKnownRoutePath('/campaigns/../donate')).toBe(false);
  });

  it('allows a campaign management page by id only', () => {
    expect(isKnownRoutePath(`/dashboard/admin/campaigns/${UUID}`)).toBe(true);
    expect(isKnownRoutePath('/dashboard/admin/campaigns/roof-repair-albaath')).toBe(false);
  });

  it('reads only valid, de-duplicated UUIDs from repeated fields', () => {
    const form = new FormData();
    form.append('ids', UUID);
    form.append('ids', UUID);
    form.append('ids', 'not-a-uuid');
    expect(readUuids(form, 'ids')).toEqual([UUID]);
  });

  it('reads checkbox flags', () => {
    const form = new FormData();
    form.append('a', 'on');
    form.append('b', 'true');
    expect(readFlag(form, 'a')).toBe(true);
    expect(readFlag(form, 'b')).toBe(true);
    expect(readFlag(form, 'c')).toBe(false);
  });
});
