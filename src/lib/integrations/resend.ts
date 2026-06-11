import "server-only";

import { createResendClient, getResendFromEmail } from "@/lib/clients/resend";
import { hasEnv } from "@/lib/env";
import type { JsonObject } from "@/types/workflow";

export type SendEmailInput = {
  to: string;
  subject: string;
  body: string;
  mode?: "live" | "mock";
};

export type SendEmailResult = {
  ok: boolean;
  status: "sent" | "mocked" | "not_configured" | "failed";
  output: JsonObject | null;
  errorMessage: string | null;
};

export function isResendConfigured() {
  return hasEnv("RESEND_API_KEY") && hasEnv("RESEND_FROM_EMAIL");
}

export function validateSendEmailInput(input: SendEmailInput) {
  const errors: string[] = [];

  if (!input.to.trim()) errors.push("Send Email requires a recipient.");
  if (!input.subject.trim()) errors.push("Send Email requires a subject.");
  if (!input.body.trim()) errors.push("Send Email requires a body.");

  return errors;
}

export async function sendEmailWithResend(input: SendEmailInput): Promise<SendEmailResult> {
  const errors = validateSendEmailInput(input);

  if (errors.length > 0) {
    return {
      ok: false,
      status: "failed",
      output: null,
      errorMessage: errors.join(" ")
    };
  }

  if (input.mode === "mock") {
    return {
      ok: true,
      status: "mocked",
      output: {
        mock: true,
        provider: "resend",
        to: input.to,
        message: "Mock email validated. No real email was sent."
      },
      errorMessage: null
    };
  }

  if (!isResendConfigured()) {
    return {
      ok: true,
      status: "not_configured",
      output: {
        mock: true,
        provider: "resend",
        message: "Resend is not configured. No real email was sent."
      },
      errorMessage: null
    };
  }

  try {
    const result = await createResendClient().emails.send({
      from: getResendFromEmail(),
      to: input.to,
      subject: input.subject,
      text: input.body
    });

    if (result.error) {
      console.error("Resend send failed", {
        name: result.error.name,
        message: result.error.message
      });

      return {
        ok: false,
        status: "failed",
        output: null,
        errorMessage: "Resend failed to send the email. Check sender verification and provider configuration."
      };
    }

    return {
      ok: true,
      status: "sent",
      output: {
        provider: "resend",
        id: result.data?.id ?? null
      },
      errorMessage: null
    };
  } catch (error) {
    console.error("Resend send failed", {
      message: error instanceof Error ? error.message : "Unknown Resend error"
    });

    return {
      ok: false,
      status: "failed",
      output: null,
      errorMessage: "Resend failed to send the email. Check provider configuration."
    };
  }
}
