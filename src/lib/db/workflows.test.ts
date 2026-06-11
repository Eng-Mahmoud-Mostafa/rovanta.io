import { beforeEach, describe, expect, it, vi } from "vitest";
import { getWorkflowByWebhookToken } from "@/lib/db/workflows";

const single = vi.fn();
const eq = vi.fn(() => ({ single }));
const select = vi.fn(() => ({ eq }));
const from = vi.fn(() => ({ select }));

vi.mock("@/lib/clients/supabase-admin", () => ({
  createSupabaseAdminClient: () => ({ from })
}));

describe("workflow database helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("looks up a workflow by webhook token without exposing secrets", async () => {
    const workflow = {
      id: "workflow-1",
      owner_id: "owner-1",
      name: "Webhook Demo",
      status: "active",
      webhook_token: "token-value"
    };

    single.mockResolvedValueOnce({ data: workflow, error: null });

    await expect(getWorkflowByWebhookToken("token-value")).resolves.toBe(workflow);
    expect(from).toHaveBeenCalledWith("workflows");
    expect(select).toHaveBeenCalledWith("*");
    expect(eq).toHaveBeenCalledWith("webhook_token", "token-value");
  });

  it("throws when the webhook token lookup fails", async () => {
    single.mockResolvedValueOnce({ data: null, error: new Error("not found") });

    await expect(getWorkflowByWebhookToken("missing-token")).rejects.toThrow("not found");
  });
});
