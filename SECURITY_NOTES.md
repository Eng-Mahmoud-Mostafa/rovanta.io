# Security Notes

Rovanta.io must read all provider credentials from environment variables. Do not hardcode API keys or commit `.env` files.

## Required Variables

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: public Clerk browser key.
- `CLERK_SECRET_KEY`: server-only Clerk key.
- `NEXT_PUBLIC_SUPABASE_URL`: public Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: public Supabase anon/publishable key.
- `SUPABASE_SERVICE_ROLE_KEY`: server-only Supabase service role key.
- `RESEND_API_KEY`: server-only Resend API key.
- `RESEND_FROM_EMAIL`: verified Resend sender.
- `GEMINI_API_KEY`: server-only Gemini API key.
- `CRON_SECRET`: server-only scheduler protection secret.

## Local Setup

Copy `.env.example` to `.env.local` and fill real values locally. Never commit `.env.local`.

## Vercel Setup

Add the same variables in the Vercel project under Settings > Environment Variables. Server-only variables must not use the `NEXT_PUBLIC_` prefix.
