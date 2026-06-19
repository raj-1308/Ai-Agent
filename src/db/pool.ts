import { Pool } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var __amiorPgPool: Pool | undefined;
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.'
    );
  }

  return new Pool({
    connectionString,
    // Hosted Postgres providers (Neon, Supabase, RDS) generally require SSL.
    // Local Postgres usually does not. This enables SSL only when the URL
    // signals it, so the same code works in both environments.
    ssl: connectionString.includes('sslmode=require')
      ? { rejectUnauthorized: false }
      : undefined,
    max: 10,
  });
}

// Reuse a single pool across hot reloads in dev and across invocations
// in serverless environments where the module may be cached.
export const pool = global.__amiorPgPool ?? createPool();
if (process.env.NODE_ENV !== 'production') {
  global.__amiorPgPool = pool;
}

export async function query<T extends Record<string, unknown> = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}
