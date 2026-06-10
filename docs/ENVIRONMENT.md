# Environment Variables

Configure real values locally in `.env.local` and in Vercel project settings. This repository only stores placeholder names in `.env.example`.

| Variable | Scope | Used For |
| --- | --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Public | Clerk browser authentication. |
| `CLERK_SECRET_KEY` | Server-only | Clerk server authentication and protected route checks. |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Public | Clerk sign-in route configuration. |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Public | Clerk sign-up route configuration. |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Public | Redirect after sign-in. |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | Public | Redirect after sign-up. |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project URL for browser and server clients. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Browser-safe Supabase anon/publishable key. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only | Admin database operations. Never expose to the client. |
| `RESEND_API_KEY` | Server-only | Sending emails through Resend. |
| `RESEND_FROM_EMAIL` | Server-only | Verified sender address for Resend emails. |
| `GEMINI_API_KEY` | Server-only | AI assistant and workflow recommendations. |
| `CRON_SECRET` | Server-only | Protecting scheduler endpoints. |

## Local Configuration

1. Copy `.env.example` to `.env.local`.
2. Fill real values from Clerk, Supabase, Resend, Gemini, and your secret generator.
3. Restart `npm run dev` after changing environment variables.

## Vercel Configuration

1. Open the Rovanta.io project in Vercel.
2. Go to Settings > Environment Variables.
3. Add each variable for Production, Preview, and Development as needed.
4. Redeploy after changing production variables.

Never commit `.env`, `.env.local`, `.env.production`, or secret files.
