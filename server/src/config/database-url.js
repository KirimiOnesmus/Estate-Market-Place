function configureDatabaseUrl() {
  if (process.env.DATABASE_URL?.trim()) return process.env.DATABASE_URL;

  const required = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Database configuration is incomplete. Set DATABASE_URL or: ${missing.join(', ')}`);
  }

  const host = process.env.DB_HOST.includes(':') && !process.env.DB_HOST.startsWith('[')
    ? `[${process.env.DB_HOST}]`
    : process.env.DB_HOST;
  const databaseName = process.env.DB_NAME || 'pavilion_marketplace';
  const url = new URL(`postgresql://${encodeURIComponent(process.env.DB_USER)}:${encodeURIComponent(process.env.DB_PASSWORD)}@${host}:${process.env.DB_PORT}/${encodeURIComponent(databaseName)}`);
  url.searchParams.set('schema', process.env.DB_SCHEMA || 'public');

  if (process.env.DB_SSL?.toLowerCase() === 'true' || process.env.DB_SSL === 'require') {
    url.searchParams.set('sslmode', 'require');
  }

  process.env.DATABASE_URL = url.toString();
  return process.env.DATABASE_URL;
}

module.exports = configureDatabaseUrl;
