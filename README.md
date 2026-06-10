# Rovanta.io

Rovanta.io is an AI workflow automation platform for building smart business workflows, connecting tools, and automating repetitive operations.

This repository is a Next.js/Vercel application. Real provider keys must be configured through local environment files or Vercel Environment Variables and must never be committed.

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment

Copy `.env.example` to `.env.local` for local development, then fill values from Clerk, Supabase, Resend, Gemini, and your cron secret manager.

Never commit `.env`, `.env.local`, `.env.production`, or any secret file.
