import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/db/pool';
import { getCurrentUser } from '@/lib/auth';

async function assertOwnership(conversationId: string, userId: string): Promise<boolean> {
  const { rows } = await pool.query('SELECT 1 FROM conversations WHERE id = $1 AND user_id = $2', [
    conversationId,
    userId,
  ]);
  return rows.length > 0;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const owns = await assertOwnership(params.id, user.userId);
  if (!owns) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  const { rows: conversationRows } = await pool.query(
    'SELECT id, title, created_at, updated_at FROM conversations WHERE id = $1',
    [params.id]
  );

  const { rows: messageRows } = await pool.query(
    `SELECT id, role, content, created_at
     FROM messages
     WHERE conversation_id = $1
     ORDER BY created_at ASC`,
    [params.id]
  );

  return NextResponse.json({
    conversation: conversationRows[0],
    messages: messageRows,
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const owns = await assertOwnership(params.id, user.userId);
  if (!owns) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  await pool.query('DELETE FROM conversations WHERE id = $1', [params.id]);
  return NextResponse.json({ ok: true });
}
