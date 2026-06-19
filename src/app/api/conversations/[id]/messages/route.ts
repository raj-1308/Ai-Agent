import { NextRequest } from 'next/server';
import { z } from 'zod';
import { pool } from '@/db/pool';
import { getCurrentUser } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { getAnthropicClient, CHAT_MODEL, SYSTEM_PROMPT } from '@/lib/anthropic';

const sendMessageSchema = z.object({
  content: z.string().min(1).max(16_000),
});

interface DbMessage {
  role: 'user' | 'assistant';
  content: string;
}

async function assertOwnership(conversationId: string, userId: string): Promise<boolean> {
  const { rows } = await pool.query(
    'SELECT 1 FROM conversations WHERE id = $1 AND user_id = $2',
    [conversationId, userId]
  );
  return rows.length > 0;
}

async function maybeSetTitle(conversationId: string, firstMessage: string) {
  const { rows } = await pool.query(
    'SELECT title FROM conversations WHERE id = $1',
    [conversationId]
  );
  if (rows[0]?.title !== 'New conversation') return;
  const title = firstMessage.trim().slice(0, 60) || 'New conversation';
  await pool.query('UPDATE conversations SET title = $1 WHERE id = $2', [
    title,
    conversationId,
  ]);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
  }

  const owns = await assertOwnership(params.id, user.userId);
  if (!owns) {
    return new Response(JSON.stringify({ error: 'Conversation not found' }), { status: 404 });
  }

  const allowed = await checkRateLimit(user.userId);
  if (!allowed) {
    return new Response(
      JSON.stringify({ error: 'Rate limit exceeded. Please wait a moment.' }),
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  const parsed = sendMessageSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }),
      { status: 400 }
    );
  }

  const { content } = parsed.data;

  await pool.query(
    `INSERT INTO messages (conversation_id, role, content) VALUES ($1, 'user', $2)`,
    [params.id, content]
  );
  await maybeSetTitle(params.id, content);

  const { rows: history } = await pool.query<DbMessage>(
    `SELECT role, content FROM messages
     WHERE conversation_id = $1 ORDER BY created_at ASC`,
    [params.id]
  );

  const groq = getAnthropicClient();

  const stream = new ReadableStream({
    async start(controller) {
      let fullResponse = '';
      try {
        const completion = await groq.chat.completions.create({
          model: CHAT_MODEL,
          max_tokens: 4096,
          stream: true,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...history.map((m) => ({
              role: m.role as 'user' | 'assistant',
              content: m.content,
            })),
          ],
        });

        for await (const chunk of completion) {
          const delta = chunk.choices[0]?.delta?.content ?? '';
          if (delta) {
            fullResponse += delta;
            controller.enqueue(
              new TextEncoder().encode(
                `data: ${JSON.stringify({ delta })}\n\n`
              )
            );
          }
        }

        await pool.query(
          `INSERT INTO messages (conversation_id, role, content)
           VALUES ($1, 'assistant', $2)`,
          [params.id, fullResponse]
        );
        await pool.query(
          'UPDATE conversations SET updated_at = now() WHERE id = $1',
          [params.id]
        );

        controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
        controller.close();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('Groq streaming error:', message);
        controller.enqueue(
          new TextEncoder().encode(
            `data: ${JSON.stringify({ error: message })}\n\n`
          )
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}