import { describe, expect, it } from 'vitest';
import { safeNextPath } from './next-path';

describe('safeNextPath', () => {
  it('accepts the donate page and workspace pages', () => {
    expect(safeNextPath('/campaigns/orphans-2027/donate')).toBe('/campaigns/orphans-2027/donate');
    expect(safeNextPath('/dashboard/donations')).toBe('/dashboard/donations');
  });

  it.each(['//evil.example', 'https://evil.example', '/\evil.example', '/campaigns/x/../../a', ''])(
    'refuses %s',
    (value) => {
      expect(safeNextPath(value)).toBeUndefined();
    },
  );
});
