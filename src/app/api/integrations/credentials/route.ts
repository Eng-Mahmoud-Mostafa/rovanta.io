import { NextResponse } from "next/server";
import { getRequestIdentity } from "@/lib/auth";
import { createIntegrationMetadata } from "@/lib/db/integrations";
import { getOptionalEnv } from "@/lib/env";
import type { IntegrationProvider } from "@/lib/db/integrations";

const allowedProviders: IntegrationProvider[] = ["resend", "google_sheets", "http_api", "ai_provider"];

function databaseConfigured() {
  return Boolean(getOptionalEnv("NEXT_PUBLIC_SUPABASE_URL") && getOptionalEnv("SUPABASE_SERVICE_ROLE_KEY"));
}

export async function POST(request: Request) {
  try {
    if (!databaseConfigured()) {
      return NextResponse.json(
        { error: "Supabase is not configured. Credential metadata cannot be saved in demo mode." },
        { status: 503 }
      );
    }

    const identity = await getRequestIdentity();
    const body = (await request.json()) as {
      provider?: IntegrationProvider;
      label?: string;
      secretReference?: string;
    };

    if (!body.provider || !allowedProviders.includes(body.provider)) {
      return NextResponse.json({ error: "Unsupported integration provider." }, { status: 400 });
    }

    if (!body.label?.trim()) {
      return NextResponse.json({ error: "Credential label is required." }, { status: 400 });
    }

    if (!body.secretReference?.trim()) {
      return NextResponse.json({ error: "Environment variable reference is required." }, { status: 400 });
    }

    const credential = await createIntegrationMetadata({
      ownerId: identity.userId,
      provider: body.provider,
      label: body.label.trim(),
      secretReference: body.secretReference.trim()
    });

    return NextResponse.json({ credential });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save credential metadata." },
      { status: 500 }
    );
  }
}
