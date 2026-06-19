# Amior — Phase 1: AI Chat

This is Phase 1 of Amior: a real, working ChatGPT-style chat application built on
Next.js 14 (App Router) + TypeScript, with email/password auth, Postgres
persistence, and streaming responses from Claude via the Anthropic API.

It does **not** yet include voice, image generation, the website builder, AI
agents, file uploads, or billing — those are later phases. This phase is meant
to be a solid, correct foundation you can actually run and build on.

## What's included

- Email/password signup and login (bcrypt-hashed passwords, JWT session in an
  HttpOnly cookie — no third-party auth service)
- Postgres schema: `users`, `conversations`, `messages`, `rate_limits`
- Chat UI: sidebar with conversation history, streaming assistant replies,
  markdown + syntax-highlighted code blocks
- API routes for auth, conversations (list/create/get/delete), and sending
  messages (server-sent-events streaming from Claude)
- A simple per-user rate limiter (15 requests/minute) so one account can't run
  away with your Anthropic bill
- Ownership checks on every conversation/message route, so users can only
  ever read or modify their own data

## What's deliberately NOT included yet

Voice activation, image generation, the website builder, autonomous agents,
the research engine, file intelligence, business mode, Stripe billing, and
the marketing homepage are all out of scope for Phase 1. Building stubs for
all of them now would produce code that looks finished but doesn't work —
better to build each phase for real when you're ready for it.

A few things from the original spec are not "code" deliverables at all and
need to be addressed operationally rather than in this repo: sub-1-second
response time depends on your model choice, hosting region, and database
latency, not application code; "scale to millions of users" depends on load
testing, connection pooling limits, and infrastructure choices made at
deploy time.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Postgres

Use a local Postgres instance or a hosted one (e.g. [Neon](https://neon.tech)
or [Supabase](https://supabase.com) both have free tiers and work well with
serverless deployments like Vercel).

Copy the environment template:

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

- `DATABASE_URL` — your Postgres connection string
- `ANTHROPIC_API_KEY` — from https://console.anthropic.com
- `SESSION_SECRET` — generate with `openssl rand -base64 32`

### 3. Run the migration

```bash
npm run db:migrate
```

This creates the `users`, `conversations`, `messages`, and `rate_limits`
tables (and enables the `pgcrypto` extension for UUID generation).

### 4. Run the app

```bash
npm run dev
```

Visit `http://localhost:3000`. You'll be redirected to `/signup` to create an
account, then land in the chat interface.

## Verifying the Anthropic streaming integration

This was built against the `@anthropic-ai/sdk` streaming interface as
documented at the time of writing (`messages.stream()` emitting a `'text'`
event per token, with `.finalMessage()` resolving when the response
completes). I could not run `npm install` or execute a live build in the
sandbox this was built in — it has no network access — so **please run it
locally and confirm the first message streams correctly before relying on
it**. If the SDK version you install has a different streaming API, the only
file that should need adjusting is:

```
src/app/api/conversations/[id]/messages/route.ts
```

## Project structure

```
src/
  app/
    (app)/chat/          # protected chat UI (layout requires a session)
      page.tsx           # empty state / new chat
      [id]/page.tsx       # conversation view, handles streaming
    api/
      auth/               # signup, login, logout
      conversations/      # CRUD + message streaming endpoint
    login/, signup/        # auth pages
    layout.tsx, page.tsx   # root layout + redirect logic
  components/
    Sidebar.tsx, MessageBubble.tsx, Button.tsx
  db/
    pool.ts               # pg connection pool
    schema.sql            # table definitions
    migrate.ts            # migration runner (npm run db:migrate)
  lib/
    session.ts, auth.ts   # JWT session creation/verification
    rate-limit.ts          # per-user rolling rate limit
    anthropic.ts            # Claude client + model/system prompt config
```

## Deploying

Works well on Vercel: connect the repo, set the same three environment
variables in the project settings, and point `DATABASE_URL` at a hosted
Postgres instance (Neon/Supabase both have a generous free tier and work
out of the box with Vercel's serverless functions).

## Next phases

When you're ready to continue, the natural next step per the original roadmap
is Phase 2 (voice, "Hey Amior" wake word) or Phase 3 (image generation) —
either can be added without restructuring what's here, since both are
additive: new API routes and UI panels alongside the existing chat.
