import { normalizeDatabaseUrl, requireDatabaseUrl } from '../src/common/database-url';

describe('database URL normalization', () => {
  it.each([
    ['postgres://user:password@host/database', 'postgres://user:password@host/database'],
    [' "postgresql://user:password@host/database" ', 'postgresql://user:password@host/database'],
    ["'postgres://user:password@host/database'", 'postgres://user:password@host/database']
  ])('normalizes %s', (value, expected) => {
    expect(normalizeDatabaseUrl(value)).toBe(expected);
  });

  it('rejects unsupported protocols', () => {
    expect(() => requireDatabaseUrl('"prisma+postgres://example"')).toThrow(
      'DATABASE_URL deve começar com postgresql:// ou postgres://.'
    );
  });

  it('rejects an empty value', () => {
    expect(() => requireDatabaseUrl('  ')).toThrow('DATABASE_URL não foi configurada.');
  });
});
