import { NextResponse } from "next/server";
import { isResendConfigured, sendEmailWithResend } from "@/lib/integrations/resend";

export async function GET() {
  return NextResponse.json({
    provider: "resend",
    configured: isResendConfigured(),
    mode: "mock-safe",
    message: "This endpoint does not send email. Use it to confirm Resend env presence safely."
  });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    to?: string;
    subject?: string;
    body?: string;
  };

  const result = await sendEmailWithResend({
    to: body.to ?? "demo@example.com",
    subject: body.subject ?? "Rovanta Resend mock test",
    body: body.body ?? "Mock-safe test. No real email was sent.",
    mode: "mock"
  });

  return NextResponse.json({
    provider: "resend",
    configured: isResendConfigured(),
    ...result
  });
}
