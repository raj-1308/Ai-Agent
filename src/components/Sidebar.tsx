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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/conversations');

      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations, pathname]);

  async function handleNewChat() {
    const res = await fetch('/api/conversations', {
      method: 'POST',
    });

    if (res.ok) {
      const data = await res.json();

      router.push(`/chat/${data.conversation.id}`);
      setSidebarOpen(false);
      loadConversations();
    }
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm('Delete this conversation?')) return;

    const res = await fetch(`/api/conversations/${id}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      setConversations((prev) =>
        prev.filter((conversation) => conversation.id !== id)
      );

      if (pathname === `/chat/${id}`) {
        router.push('/chat');
      }
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', {
      method: 'POST',
    });

    router.push('/login');
    router.refresh();
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-[70] h-11 w-11 rounded-xl bg-black/50 backdrop-blur-xl border border-white/10 text-white flex items-center justify-center shadow-lg"
      >
        ☰
      </button>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed lg:relative
          top-0 left-0
          h-[100dvh]
          w-[280px]
          xl:w-[320px]
          bg-midnight-soft
          border-r border-white/10
          flex flex-col
          z-50
          transition-transform duration-300 ease-in-out
          ${
            sidebarOpen
              ? 'translate-x-0'
              : '-translate-x-full lg:translate-x-0'
          }
        `}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <Link
            href="/chat"
            className="text-xl font-bold tracking-tight"
          >
            Amior
          </Link>

          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white/60 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* New Chat */}
        <div className="p-3">
          <button
            onClick={handleNewChat}
            className="w-full text-sm rounded-xl bg-electric/15 hover:bg-electric/25 text-electric-soft border border-electric/30 px-4 py-3 transition-colors"
          >
            + New Chat
          </button>
        </div>

        {/* Conversations */}
        <nav className="flex-1 overflow-y-auto px-2 space-y-1">
          {loading && (
            <p className="text-xs text-white/30 px-2 py-2">
              Loading...
            </p>
          )}

          {!loading && conversations.length === 0 && (
            <p className="text-xs text-white/30 px-2 py-2">
              No conversations yet
            </p>
          )}

          {conversations.map((conversation) => {
            const active = pathname === `/chat/${conversation.id}`;

            return (
              <Link
                key={conversation.id}
                href={`/chat/${conversation.id}`}
                onClick={() => setSidebarOpen(false)}
                className={`group flex items-center justify-between rounded-xl px-3 py-3 text-sm transition-colors ${
                  active
                    ? 'bg-white/10 text-white'
                    : 'text-white/70 hover:bg-white/5'
                }`}
              >
                <span className="truncate">
                  {conversation.title}
                </span>

                <button
                  onClick={(e) =>
                    handleDelete(conversation.id, e)
                  }
                  className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-red-400 ml-2 flex-shrink-0"
                  aria-label="Delete conversation"
                >
                  ✕
                </button>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center justify-between text-xs text-white/50">
            <span className="truncate max-w-[170px]">
              {userEmail}
            </span>

            <button
              onClick={handleLogout}
              className="hover:text-white transition-colors ml-2"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}