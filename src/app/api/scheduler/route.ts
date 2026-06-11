import { NextResponse } from "next/server";
import { getOptionalEnv } from "@/lib/env";
import { runDueScheduledWorkflows } from "@/lib/workflow/scheduler";

function authorized(request: Request) {
  const cronSecret = getOptionalEnv("CRON_SECRET");

  if (!cronSecret) {
    return false;
  }

  return request.headers.get("authorization") === `Bearer ${cronSecret}`;
}

function limitFromRequest(request: Request) {
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? "10");

  if (!Number.isFinite(limit)) return 10;
  return Math.min(Math.max(Math.floor(limit), 1), 25);
}

async function handleSchedulerRequest(request: Request) {
  if (!getOptionalEnv("CRON_SECRET")) {
    return NextResponse.json({ error: "Scheduler is not configured." }, { status: 503 });
  }

  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const result = await runDueScheduledWorkflows({ limit: limitFromRequest(request) });
  return NextResponse.json(result);
}

export async function GET(request: Request) {
  return handleSchedulerRequest(request);
}

export async function POST(request: Request) {
  return handleSchedulerRequest(request);
}
