import { checkSeedDatabaseUrl } from './seed-safety.util';

describe('checkSeedDatabaseUrl', () => {
  it('accepts the dedicated local database URL', () => {
    const result = checkSeedDatabaseUrl(
      'postgresql://majlis:pw@localhost:5432/majlis_fund?schema=public',
    );
    expect(result.safe).toBe(true);
  });

  it('accepts 127.0.0.1 as an equivalent local host', () => {
    const result = checkSeedDatabaseUrl('postgresql://majlis@127.0.0.1:5432/majlis_fund');
    expect(result.safe).toBe(true);
  });

  it('accepts the IPv6 loopback host', () => {
    const result = checkSeedDatabaseUrl('postgresql://majlis@[::1]:5432/majlis_fund');
    expect(result.safe).toBe(true);
  });

  it('rejects a non-local host', () => {
    const result = checkSeedDatabaseUrl(
      'postgresql://majlis@production-db.example.com:5432/majlis_fund',
    );
    expect(result.safe).toBe(false);
    expect(result.reason).toMatch(/host/);
  });

  it('rejects an unexpected port', () => {
    const result = checkSeedDatabaseUrl('postgresql://majlis@localhost:5433/majlis_fund');
    expect(result.safe).toBe(false);
    expect(result.reason).toMatch(/port/);
  });

  it('rejects an unexpected database name', () => {
    const result = checkSeedDatabaseUrl('postgresql://majlis@localhost:5432/postgres');
    expect(result.safe).toBe(false);
    expect(result.reason).toMatch(/database name/);
  });

  it('rejects a missing DATABASE_URL', () => {
    const result = checkSeedDatabaseUrl(undefined);
    expect(result.safe).toBe(false);
    expect(result.reason).toMatch(/not set/);
  });

  it('rejects a malformed connection string', () => {
    const result = checkSeedDatabaseUrl('not-a-url');
    expect(result.safe).toBe(false);
    expect(result.reason).toMatch(/valid connection URL/);
  });
});
