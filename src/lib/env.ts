export type EnvScope = "public" | "server";

export type EnvVariable = {
  name: string;
  scope: EnvScope;
  requiredFor: string;
};

export const envVariables: EnvVariable[] = [
  {
    name: "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
    scope: "public",
    requiredFor: "Clerk browser authentication"
  },
  {
    name: "CLERK_SECRET_KEY",
    scope: "server",
    requiredFor: "Clerk server authentication"
  },
  {
    name: "NEXT_PUBLIC_SUPABASE_URL",
    scope: "public",
    requiredFor: "Supabase browser and server clients"
  },
  {
    name: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    scope: "public",
    requiredFor: "Supabase browser client"
  },
  {
    name: "SUPABASE_SERVICE_ROLE_KEY",
    scope: "server",
    requiredFor: "Privileged Supabase server operations"
  },
  {
    name: "RESEND_API_KEY",
    scope: "server",
    requiredFor: "Server-side email sending"
  },
  {
    name: "RESEND_FROM_EMAIL",
    scope: "server",
    requiredFor: "Verified sender for Resend emails"
  },
  {
    name: "GEMINI_API_KEY",
    scope: "server",
    requiredFor: "Server-side AI recommendations"
  },
  {
    name: "CRON_SECRET",
    scope: "server",
    requiredFor: "Protected scheduler endpoint"
  }
];

export function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getOptionalEnv(name: string): string | undefined {
  return process.env[name];
}

export function hasEnv(name: string): boolean {
  return Boolean(getOptionalEnv(name));
}
