'use client';

import { useEffect, useMemo, useState, useCallback, type MouseEvent } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Logo } from './Logo';

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

const suggestedActions = [
  { label: 'New conversation', icon: '✦', helper: 'Start fresh with a premium workspace' },
];

function formatDate(updatedAt: string) {
  const date = new Date(updatedAt);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function displayName(email: string) {
  return email
    .split('@')[0]
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

export function Sidebar({ userEmail }: { userEmail: string }) {
  const router = useRouter();
  const pathname = usePathname();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [clearingHistory, setClearingHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDesktop, setIsDesktop] = useState(false);

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
    void loadConversations();
  }, [loadConversations, pathname]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const handleMediaChange = (event: MediaQueryListEvent) => {
      setIsDesktop(event.matches);
      setSidebarOpen(event.matches);
    };

    setIsDesktop(mediaQuery.matches);
    setSidebarOpen(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleMediaChange);

    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange);
    };
  }, []);

  async function handleNewChat() {
    const res = await fetch('/api/conversations', { method: 'POST' });
    if (!res.ok) return;
    const data = await res.json();
    router.push(`/chat/${data.conversation.id}`);
    if (!isDesktop) {
      setSidebarOpen(false);
    }
    void loadConversations();
  }

  async function handleDelete(id: string, e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Delete this conversation?')) return;
    const res = await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setConversations((prev) => prev.filter((conversation) => conversation.id !== id));
      if (pathname === `/chat/${id}`) {
        router.push('/chat');
      }
    }
  }

  async function handleClearHistory() {
    if (!confirm('Delete all conversation history? This cannot be undone.')) return;

    setClearingHistory(true);
    try {
      const res = await fetch('/api/conversations', { method: 'DELETE' });
      if (res.ok) {
        setConversations([]);
        router.push('/chat');
        router.refresh();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setClearingHistory(false);
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  const recentChats = useMemo(() => {
    const sorted = conversations
      .slice()
      .sort((a, b) => Number(new Date(b.updated_at)) - Number(new Date(a.updated_at)));

    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return sorted.slice(0, 8);
    }

    return sorted.filter((conversation) => conversation.title.toLowerCase().includes(query)).slice(0, 8);
  }, [conversations, searchQuery]);

  const name = displayName(userEmail);

  return (
    <>
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed left-4 top-4 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-electric/20 bg-electric text-white shadow-glow-soft backdrop-blur-xl transition hover:bg-electric-soft"
          aria-label="Open sidebar"
        >
          <span className="text-lg">☰</span>
        </button>
      )}

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-[100dvh] w-[92vw] max-w-[360px] flex-col border-r border-white/10 bg-[linear-gradient(180deg,rgba(12,15,27,0.98),rgba(7,9,15,0.98))] shadow-[0_35px_140px_rgba(0,0,0,0.45)] transition-transform duration-300 ease-out sm:w-[320px] lg:relative lg:h-full lg:w-[320px] ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-white/10 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <Link href="/chat" className="flex items-center gap-3" onClick={() => setSidebarOpen(false)}>
                <Logo className="h-12 w-12 shrink-0 sm:h-14 sm:w-14" />
                <div>
                  <p className="text-base font-semibold tracking-tight text-white">Amior</p>
                  <p className="text-[10px] uppercase tracking-[0.32em] text-white/45">Premium AI workspace</p>
                </div>
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
                aria-label="Close sidebar"
              >
                <span className="text-lg">✕</span>
              </button>
            </div>

            <div className="mt-4 rounded-[1.3rem] border border-white/10 bg-white/5 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.32em] text-white/40">Workspace</p>
                  <p className="mt-2 text-sm font-semibold text-white">Hello, {name}</p>
                </div>
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.25em] text-emerald-300">
                  Online
                </span>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
            <button
              type="button"
              onClick={handleNewChat}
              className="flex w-full items-center justify-between rounded-[1.4rem] border border-electric/25 bg-electric/15 px-4 py-4 text-left text-sm text-white transition hover:border-electric/40 hover:bg-electric/20"
            >
              <div>
                <p className="font-semibold text-white">{suggestedActions[0].label}</p>
                <p className="mt-1 text-xs text-white/60">{suggestedActions[0].helper}</p>
              </div>
              <span className="text-xl text-electric-soft">✦</span>
            </button>

            <div className="rounded-[1.3rem] border border-white/10 bg-white/[0.03] p-3">
              <label className="block text-[10px] uppercase tracking-[0.32em] text-white/40">Search chats</label>
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Find a conversation"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-electric/40"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between px-1 text-[10px] uppercase tracking-[0.32em] text-white/40">
                <span>Recent chats</span>
                <button type="button" onClick={handleClearHistory} disabled={clearingHistory} className="text-[10px] uppercase tracking-[0.25em] text-white/55 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50">
                  Clear
                </button>
              </div>

              {loading ? (
                <p className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white/40">Loading chats…</p>
              ) : recentChats.length === 0 ? (
                <p className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white/40">
                  {searchQuery ? 'No matches found.' : 'No recent chats yet.'}
                </p>
              ) : (
                recentChats.map((conversation) => {
                  const active = pathname === `/chat/${conversation.id}`;
                  return (
                    <div
                      key={conversation.id}
                      className={`group flex items-center justify-between gap-2 rounded-[1.25rem] border px-3 py-3 transition ${
                        active ? 'border-electric/30 bg-white/10' : 'border-transparent bg-white/[0.03] hover:border-white/10 hover:bg-white/[0.05]'
                      }`}
                    >
                      <Link
                        href={`/chat/${conversation.id}`}
                        onClick={() => setSidebarOpen(false)}
                        className="flex min-w-0 flex-1 items-start gap-3"
                      >
                        <span className={`mt-0.5 inline-flex h-8 w-8 flex-none items-center justify-center rounded-full text-sm ${active ? 'bg-electric/20 text-electric-soft' : 'bg-white/10 text-white/70'}`}>
                          ✦
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white">{conversation.title}</p>
                          <p className="mt-1 text-[11px] text-white/40">{formatDate(conversation.updated_at)}</p>
                        </div>
                      </Link>
                      <button
                        onClick={(e) => handleDelete(conversation.id, e)}
                        className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-white/40 transition hover:bg-white/10 hover:text-red-400"
                        aria-label="Delete conversation"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="border-t border-white/10 px-4 py-4 sm:px-5">
            <div className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
              <p className="text-[10px] uppercase tracking-[0.32em] text-white/40">Signed in as</p>
              <p className="mt-3 truncate text-sm font-semibold text-white">{userEmail}</p>
              <div className="mt-4 grid gap-2">
                <button
                  type="button"
                  onClick={handleClearHistory}
                  disabled={clearingHistory}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Clear history
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full rounded-2xl bg-electric/90 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-electric"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
