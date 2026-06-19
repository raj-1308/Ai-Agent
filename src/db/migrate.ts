/**
 * Applies schema.sql to the database pointed at by DATABASE_URL.
 * Run with: npm run db:migrate
 */
import fs from 'fs';
import path from 'path';
import 'dotenv/config';
import { Pool } from 'pg';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not set. Copy .env.example to .env.local first.');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString,
    ssl: connectionString.includes('sslmode=require')
      ? { rejectUnauthorized: false }
      : undefined,
  });

  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf-8');

  const client = await pool.connect();
  try {
    // gen_random_uuid() requires pgcrypto on some Postgres installs (Postgres 13+
    // ships it built in via the extension; this is a no-op if already enabled).
    await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');
    await client.query(sql);
    console.log('✅ Migration complete. Tables: users, conversations, messages, rate_limits');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
