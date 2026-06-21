import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/db/pool';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { rows } = await pool.query(
    `SELECT id, title, created_at, updated_at
     FROM conversations
     WHERE user_id = $1
     ORDER BY updated_at DESC`,
    [user.userId]
  );

  return NextResponse.json({ conversations: rows });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  let title = 'New conversation';
  try {
    const body = await req.json();
    if (typeof body?.title === 'string' && body.title.trim().length > 0) {
      title = body.title.trim().slice(0, 120);
    }
  } catch {
    // No body provided — fine, use the default title.
  }

  const { rows } = await pool.query(
    `INSERT INTO conversations (user_id, title) VALUES ($1, $2)
     RETURNING id, title, created_at, updated_at`,
    [user.userId, title]
  );

  return NextResponse.json({ conversation: rows[0] }, { status: 201 });
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  await pool.query(
    `DELETE FROM messages WHERE conversation_id IN (
       SELECT id FROM conversations WHERE user_id = $1
     )`,
    [user.userId]
  );

  await pool.query('DELETE FROM conversations WHERE user_id = $1', [user.userId]);

  return NextResponse.json({ ok: true });
}
