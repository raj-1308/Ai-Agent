'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Logo } from '@/components/Logo';

const SUGGESTIONS = [
  'Explain a complex topic simply',
  'Help me debug a piece of code',
  'Draft an email to a client',
  'Brainstorm names for a project',
];

export default function ChatIndexPage() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  async function startConversation(initialMessage?: string) {
    setCreating(true);
    const res = await fetch('/api/conversations', { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      const id = data.conversation.id as string;
      if (initialMessage) {
        sessionStorage.setItem(`amior_pending_message_${id}`, initialMessage);
      }
      router.push(`/chat/${id}`);
    }
    setCreating(false);
  }

  return (
    <main className="flex-1 flex items-center justify-center px-6">
      <div className="max-w-xl w-full text-center">
        <div className="mx-auto mb-10 w-fit rounded-[2rem] bg-white/5 p-6 shadow-[0_32px_90px_rgba(59,130,246,0.18)] ring-1 ring-white/10 backdrop-blur-xl">
          <Logo className="h-24 w-24 mx-auto animate-logo-entry" />
          <h1 className="mt-6 text-4xl font-semibold tracking-tight">
            One Intelligence. Unlimited Possibilities.
          </h1>
          <p className="text-white/50 mt-3 max-w-xl mx-auto">
            Launch Amior instantly with smart prompts and a premium AI interface built for powerful conversations.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              disabled={creating}
              onClick={() => startConversation(s)}
              className="glass rounded-xl px-4 py-3 text-sm text-left text-white/80 hover:text-white hover:bg-white/[0.07] transition-colors disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>

        <button
          disabled={creating}
          onClick={() => startConversation()}
          className="mt-6 text-sm text-electric-soft hover:underline disabled:opacity-50"
        >
          Or start a blank conversation →
        </button>
      </div>
    </main>
  );
}
