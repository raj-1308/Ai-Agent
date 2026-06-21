'use client';

import { useEffect, useRef, useState, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MessageBubble } from '@/components/MessageBubble';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function ConversationPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const conversationId = params.id;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [listening, setListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const speechBaseRef = useRef('');

  // Load conversation history on mount / when switching conversations.
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoadingHistory(true);
      setNotFound(false);
      const res = await fetch(`/api/conversations/${conversationId}`);
      if (cancelled) return;

      if (res.status === 404) {
        setNotFound(true);
        setLoadingHistory(false);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
      }
      setLoadingHistory(false);

      // If we arrived here from the empty-state page with a pending
      // suggestion, send it automatically once history has loaded.
      const pendingKey = `amior_pending_message_${conversationId}`;
      const pending = sessionStorage.getItem(pendingKey);
      if (pending) {
        sessionStorage.removeItem(pendingKey);
        void sendMessage(pending);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setListening(true);
    };

    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i += 1) {
        transcript += event.results[i][0].transcript;
      }
      setInput(`${speechBaseRef.current} ${transcript}`.trim());
    };

    recognition.onerror = () => {
      setErrorMsg('Voice input is not available right now. Please try typing instead.');
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    setSpeechSupported(true);

    return () => {
      recognition.stop();
    };
  }, []);

  async function sendMessage(content: string) {
    const trimmed = content.trim();
    if (!trimmed || streaming) return;

    setErrorMsg(null);
    const userMessage: Message = { id: crypto.randomUUID(), role: 'user', content: trimmed };
    const assistantId = crypto.randomUUID();

    setMessages((prev) => [...prev, userMessage, { id: assistantId, role: 'assistant', content: '' }]);
    setInput('');
    setStreaming(true);

    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: trimmed }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.error ?? 'Something went wrong. Please try again.');
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
        setStreaming(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6);
          if (payload === '[DONE]') continue;

          try {
            const parsed = JSON.parse(payload);
            if (parsed.error) {
              setErrorMsg(parsed.error);
              continue;
            }
            if (typeof parsed.delta === 'string') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: m.content + parsed.delta } : m
                )
              );
            }
          } catch {
            // Ignore malformed SSE chunks.
          }
        }
      }
    } catch {
      setErrorMsg('Connection lost. Please try again.');
    } finally {
      setStreaming(false);
      router.refresh(); // keeps sidebar conversation title/order in sync
    }
  }

  async function handleMicToggle() {
    if (!speechSupported || !recognitionRef.current) return;

    if (listening) {
      recognitionRef.current.stop();
      return;
    }

    try {
      setErrorMsg(null);
      speechBaseRef.current = input;
      recognitionRef.current.start();
    } catch {
      setErrorMsg('Your browser does not support voice input or permission was denied.');
      setListening(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  if (notFound) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="text-white/50">This conversation doesn&apos;t exist or was deleted.</p>
      </main>
    );
  }

  const isEmptyConversation = !loadingHistory && messages.length === 0;

  return (
    <main className="flex-1 flex flex-col min-h-0">
      {isEmptyConversation ? (
        <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-10">
          <div className="w-full max-w-3xl rounded-[2rem] bg-midnight-soft border border-white/10 p-10 text-center shadow-glass-lg">
            <p className="text-sm uppercase tracking-[0.32em] text-electric-soft">Start your first message</p>
            <h2 className="mt-6 text-3xl font-semibold tracking-tight text-white">What is the agenda?</h2>
            <p className="mt-4 text-base leading-7 text-white/60">
              What&apos;s on your mind? Share your goal, task, or project and Amior will help you begin with clarity.
            </p>
            <p className="mt-2 text-sm text-white/40">
              Ask anything: write a brief, build a website, create a plan, or analyze your business.
            </p>
          </div>

          <div className="mt-10 w-full max-w-3xl">
            {errorMsg && <p className="text-sm text-red-400 mb-4 text-center">{errorMsg}</p>}
            <form onSubmit={handleSubmit} className="glass rounded-[2rem] border border-white/10 p-4 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <button
                  type="button"
                  onClick={handleMicToggle}
                  className={`inline-flex h-14 w-14 flex-none items-center justify-center rounded-[1.5rem] border border-white/10 bg-white/5 text-white transition hover:bg-white/10 ${
                    listening ? 'ring-2 ring-electric-soft/60 shadow-[0_0_0_6px_rgba(59,130,246,0.12)]' : ''
                  }`}
                  aria-label={listening ? 'Stop voice input' : 'Start voice input'}
                  title={speechSupported ? (listening ? 'Stop microphone' : 'Use microphone') : 'Voice input not supported'}
                  disabled={streaming}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 1.75a3.75 3.75 0 0 0-3.75 3.75v4.5a3.75 3.75 0 1 0 7.5 0v-4.5A3.75 3.75 0 0 0 12 1.75Z" />
                    <path d="M19.25 10.75v.25a6.25 6.25 0 0 1-12.5 0v-.25" />
                    <path d="M16 16.5a6 6 0 0 1-8 0" />
                  </svg>
                </button>
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={listening ? 'Listening… speak now' : 'What do you want to do today?'}
                  rows={3}
                  disabled={streaming}
                  className="min-h-[120px] w-full resize-none rounded-[1.5rem] border border-white/10 bg-black/10 px-4 py-4 text-sm text-white outline-none placeholder:text-white/40 focus:border-electric/40 focus:ring-2 focus:ring-electric/10"
                />
                <button
                  type="submit"
                  disabled={streaming || !input.trim()}
                  className="h-14 min-w-[140px] rounded-[1.5rem] bg-electric text-sm font-semibold text-white transition hover:bg-electric-soft disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {streaming ? 'Sending…' : 'Send'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <>
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-4">
            {loadingHistory && <p className="text-center text-white/30 text-sm">Loading…</p>}

            {!loadingHistory &&
              messages.map((m) => (
                <MessageBubble key={m.id} role={m.role} content={m.content || (streaming ? '…' : '')} />
              ))}
          </div>

          <div className="px-4 sm:px-8 pb-6 pt-2">
            {errorMsg && <p className="text-sm text-red-400 mb-2">{errorMsg}</p>}
            <form
              onSubmit={handleSubmit}
              className="glass rounded-2xl p-2 flex items-end gap-2"
            >
              <button
                type="button"
                onClick={handleMicToggle}
                className={`inline-flex h-11 w-11 flex-none items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition-all duration-200 hover:bg-white/10 ${
                  listening ? 'ring-2 ring-electric-soft/60 shadow-[0_0_0_6px_rgba(59,130,246,0.12)]' : ''
                }`}
                aria-label={listening ? 'Stop voice input' : 'Start voice input'}
                title={speechSupported ? (listening ? 'Stop microphone' : 'Use microphone') : 'Voice input not supported'}
                disabled={streaming}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 1.75a3.75 3.75 0 0 0-3.75 3.75v4.5a3.75 3.75 0 1 0 7.5 0v-4.5A3.75 3.75 0 0 0 12 1.75Z" />
                  <path d="M19.25 10.75v.25a6.25 6.25 0 0 1-12.5 0v-.25" />
                  <path d="M16 16.5a6 6 0 0 1-8 0" />
                </svg>
              </button>

              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={listening ? 'Listening… speak now' : 'Message Amior…'}
                rows={1}
                disabled={streaming}
                className="flex-1 resize-none bg-transparent outline-none text-sm px-3 py-2 max-h-40 placeholder:text-white/30"
              />
              <button
                type="submit"
                disabled={streaming || !input.trim()}
                className="rounded-xl bg-electric hover:bg-electric-soft disabled:opacity-40 disabled:hover:bg-electric text-white px-4 py-2 text-sm font-medium transition-colors"
              >
                {streaming ? '…' : 'Send'}
              </button>
            </form>
          </div>
        </>
      )}
    </main>
  );
}
