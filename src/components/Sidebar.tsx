'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

export function Sidebar({ userEmail }: { userEmail: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const loadConversations = useCallback(async () => {
    const res = await fetch('/api/conversations');
    if (res.ok) {
      const data = await res.json();
      setConversations(data.conversations);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations, pathname]);

  async function handleNewChat() {
    const res = await fetch('/api/conversations', { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      router.push(`/chat/${data.conversation.id}`);
      loadConversations();
    }
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Delete this conversation? This cannot be undone.')) return;

    const res = await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (pathname === `/chat/${id}`) {
        router.push('/chat');
      }
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <aside className="w-64 flex-shrink-0 border-r border-white/10 bg-midnight-soft flex flex-col">
      <div className="p-4 border-b border-white/10">
        <Link href="/chat" className="text-lg font-semibold tracking-tight">
          Amior
        </Link>
      </div>

      <div className="p-3">
        <button
          onClick={handleNewChat}
          className="w-full text-sm rounded-lg bg-electric/15 hover:bg-electric/25 text-electric-soft border border-electric/30 px-3 py-2.5 transition-colors"
        >
          + New chat
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 space-y-0.5">
        {loading && <p className="text-xs text-white/30 px-2 py-2">Loading…</p>}
        {!loading && conversations.length === 0 && (
          <p className="text-xs text-white/30 px-2 py-2">No conversations yet</p>
        )}
        {conversations.map((c) => {
          const active = pathname === `/chat/${c.id}`;
          return (
            <Link
              key={c.id}
              href={`/chat/${c.id}`}
              className={`group flex items-center justify-between rounded-lg px-2.5 py-2 text-sm transition-colors ${
                active ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5'
              }`}
            >
              <span className="truncate">{c.title}</span>
              <button
                onClick={(e) => handleDelete(c.id, e)}
                className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-red-400 ml-2 flex-shrink-0"
                aria-label="Delete conversation"
              >
                ✕
              </button>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/10">
        <div className="flex items-center justify-between text-xs text-white/50">
          <span className="truncate">{userEmail}</span>
          <button onClick={handleLogout} className="hover:text-white transition-colors ml-2">
            Log out
          </button>
        </div>
      </div>
    </aside>
  );
}
