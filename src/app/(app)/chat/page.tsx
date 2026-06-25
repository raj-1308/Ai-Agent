'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/Button';

const QUICK_PROMPTS = [
  'Build Website',
  'Create AI Agent',
  'Generate Marketing Plan',
  'Analyze Business',
  'Code Assistant',
  'Research Topic',
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function displayName(email: string) {
  return email
    .split('@')[0]
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

export default function ChatIndexPage() {
  const router = useRouter();
  const [userName, setUserName] = useState('there');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) return;
        const data = await res.json();
        if (data?.user?.email) {
          setUserName(displayName(data.user.email));
        }
      } catch {
        // ignore
      }
    }
    void loadUser();
  }, []);

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
    <main className="flex min-h-[calc(100vh-72px)] flex-col overflow-y-auto bg-midnight px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center">
        <section className="w-full rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] px-6 py-8 shadow-[0_30px_120px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-electric/20 bg-electric/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.32em] text-electric-soft">
              <span className="h-2 w-2 rounded-full bg-electric-soft" />
              Welcome back
            </div>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              {getGreeting()} {userName} 👋
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-white/65 sm:text-xl">
              Your premium workspace is ready. Pick a prompt below to begin a focused, polished conversation.
            </p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => startConversation(prompt)}
                disabled={creating}
                className="min-h-[108px] rounded-[1.5rem] border border-white/10 bg-midnight-soft/80 px-5 py-5 text-left text-white/85 transition hover:border-electric/30 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <p className="text-base font-semibold">{prompt}</p>
              </button>
            ))}
          </div>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:justify-start">
            <Button onClick={() => startConversation('Build Website')} disabled={creating}>
              Start with Build Website
            </Button>
            <Button variant="secondary" onClick={() => startConversation('Create AI Agent')} disabled={creating}>
              Create AI Agent
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
