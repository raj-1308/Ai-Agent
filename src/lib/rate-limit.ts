import { pool } from '@/db/pool';

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 15; // generous for a single chatting user

/**
 * Returns true if the request is allowed, false if the user has exceeded
 * the rate limit for the current window. Uses a single upsert so it's safe
 * under concurrent requests from the same user.
 */
export async function checkRateLimit(userId: string): Promise<boolean> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query<{
      window_start: Date;
      request_count: number;
    }>(
      'SELECT window_start, request_count FROM rate_limits WHERE user_id = $1 FOR UPDATE',
      [userId]
    );

    const now = Date.now();

    if (rows.length === 0) {
      await client.query(
        'INSERT INTO rate_limits (user_id, window_start, request_count) VALUES ($1, now(), 1)',
        [userId]
      );
      await client.query('COMMIT');
      return true;
    }

    const windowStart = new Date(rows[0].window_start).getTime();
    const withinWindow = now - windowStart < WINDOW_MS;

    if (!withinWindow) {
      await client.query(
        'UPDATE rate_limits SET window_start = now(), request_count = 1 WHERE user_id = $1',
        [userId]
      );
      await client.query('COMMIT');
      return true;
    }

    if (rows[0].request_count >= MAX_REQUESTS_PER_WINDOW) {
      await client.query('COMMIT');
      return false;
    }

    await client.query(
      'UPDATE rate_limits SET request_count = request_count + 1 WHERE user_id = $1',
      [userId]
    );
    await client.query('COMMIT');
    return true;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
