import { NextResponse } from "next/server";
import { getRequestIdentity } from "@/lib/auth";
import { duplicateWorkflowForOwner } from "@/lib/db/workflows";
import { getOptionalEnv } from "@/lib/env";

function databaseConfigured() {
  return Boolean(getOptionalEnv("NEXT_PUBLIC_SUPABASE_URL") && getOptionalEnv("SUPABASE_SERVICE_ROLE_KEY"));
}

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!databaseConfigured()) {
      return NextResponse.json({ error: "Supabase is not configured. Duplicate is disabled in demo mode." }, { status: 503 });
    }

    const identity = await getRequestIdentity();
    const { id } = await params;
    const workflow = await duplicateWorkflowForOwner(identity.userId, id);

    return NextResponse.json({ id: workflow.id, status: workflow.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to duplicate workflow." },
      { status: 500 }
    );
  }
}
