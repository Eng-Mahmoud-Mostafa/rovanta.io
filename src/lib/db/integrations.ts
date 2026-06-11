import "server-only";

import { getOptionalEnv } from "@/lib/env";
import {
  createCredentialMetadata,
  createIntegrationConnection,
  listIntegrationConnectionsForOwner,
  listSafeCredentialsForOwner
} from "@/lib/db/workflows";
import type { IntegrationConnectionStatus, SafeCredential } from "@/types/workflow";

export type IntegrationProvider = "resend" | "google_sheets" | "http_api" | "ai_provider";

export type IntegrationCardData = {
  provider: IntegrationProvider;
  name: string;
  description: string;
  envReference: string;
  status: IntegrationConnectionStatus;
  credential: SafeCredential | null;
  isDemo: boolean;
};

export type IntegrationsData = {
  integrations: IntegrationCardData[];
  source: "database" | "demo";
  errorMessage: string | null;
};

const providerDefinitions: Array<Omit<IntegrationCardData, "status" | "credential" | "isDemo">> = [
  {
    provider: "resend",
    name: "Resend",
    description: "Send workflow emails through a verified Resend sender.",
    envReference: "RESEND_API_KEY"
  },
  {
    provider: "google_sheets",
    name: "Google Sheets",
    description: "Placeholder for future sheet row sync workflows.",
    envReference: "GOOGLE_SHEETS_CREDENTIALS"
  },
  {
    provider: "http_api",
    name: "HTTP API",
    description: "Use environment-backed API keys in HTTP request nodes.",
    envReference: "HTTP_API_KEY"
  },
  {
    provider: "ai_provider",
    name: "AI Provider",
    description: "Generate workflow content and recommendations with Gemini.",
    envReference: "GEMINI_API_KEY"
  }
];

function databaseConfigured() {
  return Boolean(getOptionalEnv("NEXT_PUBLIC_SUPABASE_URL") && getOptionalEnv("SUPABASE_SERVICE_ROLE_KEY"));
}

function demoIntegrations(message: string | null = null): IntegrationsData {
  return {
    source: "demo",
    errorMessage: message,
    integrations: providerDefinitions.map((definition) => ({
      ...definition,
      status: "not_configured",
      credential: null,
      isDemo: true
    }))
  };
}

export async function getIntegrationsData(ownerId: string): Promise<IntegrationsData> {
  if (!databaseConfigured()) {
    return demoIntegrations("Supabase is not configured. Showing metadata-only demo integrations.");
  }

  try {
    const [credentials, connections] = await Promise.all([
      listSafeCredentialsForOwner(ownerId),
      listIntegrationConnectionsForOwner(ownerId)
    ]);

    return {
      source: "database",
      errorMessage: null,
      integrations: providerDefinitions.map((definition) => {
        const credential = credentials.find((item) => item.provider === definition.provider) ?? null;
        const connection = connections.find((item) => item.provider === definition.provider);

        return {
          ...definition,
          status: connection?.status ?? (credential ? "connected" : "not_configured"),
          credential,
          isDemo: false
        };
      })
    };
  } catch (error) {
    return demoIntegrations(error instanceof Error ? error.message : "Unable to load integrations. Showing demo data.");
  }
}

export async function createIntegrationMetadata(input: {
  ownerId: string;
  provider: IntegrationProvider;
  label: string;
  secretReference: string;
}) {
  const credential = await createCredentialMetadata({
    ownerId: input.ownerId,
    provider: input.provider,
    label: input.label,
    secretReference: input.secretReference
  });

  await createIntegrationConnection({
    ownerId: input.ownerId,
    credentialId: credential.id,
    provider: input.provider,
    displayName: input.label,
    status: "connected",
    metadata: {
      secretStorage: "environment_variable",
      secretReference: input.secretReference
    }
  });

  return credential;
}
