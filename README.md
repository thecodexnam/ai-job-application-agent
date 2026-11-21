# JobBuddy AI

JobBuddy is a Next.js job-search and application workspace built with Supabase, Gemini, Brave Search, Inngest, and optional Browserbase/Stagehand automation.

## Features

- Supabase email/password and Google authentication
- Profile and resume management
- Verified job discovery across configured job platforms
- Application pipeline and status tracking
- Manual and automated application workflows
- Mock automation mode for local testing

## Local setup

Requirements: Node.js 20+ and a Supabase project.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment variables

Required:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Optional integrations:

```env
GEMINI_API_KEY=
GEMINI_MODEL=
BRAVE_SEARCH_API_KEY=
JSEARCH_API_KEY=
APPLICATION_AUTOMATION_MODE=mock

BROWSERBASE_API_KEY=
BROWSERBASE_PROJECT_ID=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
```

Use `APPLICATION_AUTOMATION_MODE=mock` to test application UI flows without real browser submission.

## Supabase setup

Apply the SQL schema and migrations from `supabase/` in chronological migration order. The project uses Supabase Auth triggers, Row Level Security policies, storage, and application workflow tables.

Configure the Google OAuth provider in Supabase and add:

```text
http://localhost:3000/auth/callback
```

For production, add the deployed `/auth/callback` URL instead.

## Validation

```bash
npm test
npm run lint
npm run build
npm start
```
