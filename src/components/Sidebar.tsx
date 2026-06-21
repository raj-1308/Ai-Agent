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
  { label: 'New chat', icon: '✦', helper: 'Start a fresh AI session' },
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
  const [settingsOpen, setSettingsOpen] = useState(false);
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

  function toggleSettings() {
    setSettingsOpen((prev) => !prev);
  }

  function closeSettings() {
    setSettingsOpen(false);
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  const recentChats = useMemo(
    () =>
      conversations
        .slice()
        .sort((a, b) => Number(new Date(b.updated_at)) - Number(new Date(a.updated_at)))
        .slice(0, 6),
    [conversations]
  );

  const name = displayName(userEmail);

  return (
    <>
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed top-4 left-4 z-60 flex h-12 w-12 items-center justify-center rounded-full bg-electric text-white shadow-glow-soft backdrop-blur-xl border border-electric/20 transition hover:bg-electric-soft"
          aria-label="Open sidebar"
        >
          <span className="text-lg">☰</span>
        </button>
      )}

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:relative top-0 left-0 z-50 h-[100dvh] lg:h-full w-[300px] lg:w-[320px] max-w-[calc(100%-1rem)] bg-midnight-soft border-r border-white/10 transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 p-5">
            <Link href="/chat" className="flex items-center gap-3">
              <Logo className="h-10 w-10" />
              <div>
                <p className="text-lg font-semibold tracking-tight">Amior</p>
                <p className="text-xs uppercase tracking-[0.32em] text-white/40">AI Operating System</p>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
              aria-label="Close sidebar"
            >
              <span className="text-lg">✕</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
            <div className="glass-soft rounded-[2rem] border border-white/10 p-5">
              <p className="text-xs uppercase tracking-[0.32em] text-white/40">Workspace</p>
              <p className="mt-4 text-lg font-semibold text-white">Hello, {name}</p>
              <p className="mt-2 text-sm text-white/60">A clean, calm AI workspace to keep you focused.</p>
            </div>

            <div className="space-y-4">
              {suggestedActions.map((action) => (
                <button
                  key={action.label}
                  onClick={handleNewChat}
                  className="glass-soft flex w-full items-center justify-between rounded-3xl border border-white/10 px-4 py-4 text-left text-sm text-white/80 transition hover:border-electric/30 hover:bg-white/10"
                >
                  <div>
                    <p className="font-semibold text-white">{action.label}</p>
                    <p className="mt-1 text-xs text-white/50">{action.helper}</p>
                  </div>
                  <span className="text-xl">{action.icon}</span>
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.32em] text-white/40">
                <span>Recent chats</span>
              </div>
              <div className="space-y-2">
                {loading ? (
                  <p className="text-sm text-white/40">Loading chats…</p>
                ) : recentChats.length === 0 ? (
                  <p className="text-sm text-white/40">No recent chats yet.</p>
                ) : (
                  recentChats.map((conversation) => {
                    const active = pathname === `/chat/${conversation.id}`;
                    return (
                      <Link
                        key={conversation.id}
                        href={`/chat/${conversation.id}`}
                        onClick={() => setSidebarOpen(false)}
                        className={`group flex items-center justify-between gap-3 rounded-3xl px-4 py-3 text-sm transition ${
                          active ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium">{conversation.title}</p>
                          <p className="mt-1 text-[11px] text-white/40">{formatDate(conversation.updated_at)}</p>
                        </div>
                        <button
                          onClick={(e) => handleDelete(conversation.id, e)}
                          className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-red-400"
                          aria-label="Delete conversation"
                        >
                          ✕
                        </button>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 px-5 py-4">
            <div className="relative">
              <button
                type="button"
                onClick={toggleSettings}
                className="w-full rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm font-semibold text-white transition hover:border-electric/30 hover:bg-white/10"
              >
                Settings
              </button>

              {settingsOpen && (
                <div className="absolute left-0 right-0 top-full z-50 mt-3 rounded-[1.75rem] border border-white/10 bg-midnight-soft p-3 shadow-[0_35px_120px_rgba(0,0,0,0.35)]">
                  <div className="flex items-center justify-between text-sm text-white/80">
                    <span>Settings</span>
                    <button
                      type="button"
                      onClick={closeSettings}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 transition hover:bg-white/10"
                    >
                      Close
                    </button>
                  </div>
                  <div className="mt-3 space-y-3">
                    <button
                      type="button"
                      onClick={handleClearHistory}
                      disabled={clearingHistory}
                      className="flex w-full items-center justify-between rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-white/80 transition hover:border-electric/30 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span>Delete history</span>
                      <span className="text-xs text-white/40">Clear all chats</span>
                    </button>
                    <button
                      type="button"
                      onClick={closeSettings}
                      className="flex w-full items-center justify-between rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-white/80 transition hover:border-electric/30 hover:bg-white/10"
                    >
                      <span>Personalization</span>
                      <span className="text-xs text-white/40">Theme & profile</span>
                    </button>
                    <button
                      type="button"
                      onClick={closeSettings}
                      className="flex w-full items-center justify-between rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-white/80 transition hover:border-electric/30 hover:bg-white/10"
                    >
                      <span>Help</span>
                      <span className="text-xs text-white/40">Support center</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 rounded-[1.75rem] border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.32em] text-white/40">Signed in as</p>
              <p className="mt-3 text-sm font-semibold text-white truncate">{userEmail}</p>
              <button
                onClick={handleLogout}
                className="mt-4 w-full rounded-2xl bg-white/5 py-3 text-sm text-white/80 transition hover:bg-white/10"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
