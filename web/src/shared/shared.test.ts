import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

// web/src/shared is a copy of api/src/common/shared (no shared packages). The api copy is checked
// against Prisma by the api enum-sync spec; this keeps the web copy identical to it.
const apiShared = path.resolve(__dirname, '../../../api/src/common/shared');

describe.each(['enums.ts', 'constants.ts', 'utils.ts', 'types.ts'])('web/src/shared/%s', (file) => {
  it('is identical to the api copy', () => {
    const web = readFileSync(path.join(__dirname, file), 'utf8');
    const api = readFileSync(path.join(apiShared, file), 'utf8');
    expect(web).toBe(api);
  });
});
