'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { Logo } from '@/components/Logo';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong');
        return;
      }

      router.push('/chat');
      router.refresh();
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden px-4">
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 20% 20%, rgba(59,130,246,0.18), transparent 45%), radial-gradient(circle at 80% 80%, rgba(59,130,246,0.12), transparent 50%)',
        }}
      />

      <div className="relative w-full max-w-sm">
        <div className="mx-auto mb-8 w-fit rounded-[2.5rem] bg-white/5 p-6 shadow-[0_25px_80px_rgba(59,130,246,0.18)] ring-1 ring-white/10 backdrop-blur-xl">
          <div className="flex items-center justify-center gap-4">
            <Logo className="h-20 w-20 animate-logo-entry" />
            <div className="space-y-2 text-left">
              <p className="text-sm uppercase tracking-[0.32em] text-electric-soft">Welcome to</p>
              <h1 className="text-3xl font-bold tracking-tight">Amior</h1>
              <p className="text-white/60 text-sm">The premium AI command center.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 space-y-4">          <div>
            <label htmlFor="email" className="block text-sm text-white/70 mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-electric/60 focus:ring-1 focus:ring-electric/40"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-white/70 mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-electric/60 focus:ring-1 focus:ring-electric/40"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Logging in…' : 'Log in'}
          </Button>
        </form>

        <p className="text-center text-sm text-white/50 mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-electric-soft hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
