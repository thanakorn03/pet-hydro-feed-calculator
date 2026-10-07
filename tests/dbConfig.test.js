const { isTursoEnabled } = require('../db');

describe('database configuration', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  test('detects Turso configuration when URL and auth token are present', () => {
    process.env.TURSO_DATABASE_URL = 'libsql://demo.db';
    process.env.TURSO_AUTH_TOKEN = 'token-123';

    expect(isTursoEnabled()).toBe(true);
  });

  test('falls back to local SQLite when Turso is not configured', () => {
    delete process.env.TURSO_DATABASE_URL;
    delete process.env.TURSO_AUTH_TOKEN;

    expect(isTursoEnabled()).toBe(false);
  });
});
