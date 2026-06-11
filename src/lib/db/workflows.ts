import "server-only";

import { randomBytes } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/clients/supabase-admin";
import { calculateNextRunAt, extractScheduleConfig, scheduleConfigToJson } from "@/lib/workflow/schedules";
import type {
  AuditLogAction,
  CreateCredentialMetadataInput,
  CreateIntegrationConnectionInput,
  CreateWorkflowInput,
  CreateWorkflowRunInput,
  JsonObject,
  SafeCredential,
  UpdateWorkflowInput,
  WorkflowNode,
  WorkflowRunStatus,
  WorkflowStatus
} from "@/types/workflow";

const supabase = () => createSupabaseAdminClient();
const WEBHOOK_TOKEN_BYTES = 32;

function hasWebhookTrigger(nodes: WorkflowNode[] | undefined) {
  return Boolean(nodes?.some((node) => node.type === "webhookTrigger"));
}

function generateWebhookToken() {
  return randomBytes(WEBHOOK_TOKEN_BYTES).toString("base64url");
}

function webhookPathForToken(token: string) {
  return `/api/webhooks/${token}`;
}

function applyWebhookPathToNodes(nodes: WorkflowNode[], webhookPath: string | null) {
  return nodes.map((node) => {
    if (node.type !== "webhookTrigger") return node;

    return {
      ...node,
      config: {
        ...node.config,
        method: node.config.method ?? "POST",
        webhookUrl: webhookPath ?? "Generated after save"
      }
    };
  });
}

function prepareWebhookMetadata(nodes: WorkflowNode[], existingToken?: string | null) {
  if (!hasWebhookTrigger(nodes)) {
    return {
      nodes: applyWebhookPathToNodes(nodes, null),
      webhookToken: null,
      webhookPath: null
    };
  }

  const webhookToken = existingToken || generateWebhookToken();
  const webhookPath = webhookPathForToken(webhookToken);

  return {
    nodes: applyWebhookPathToNodes(nodes, webhookPath),
    webhookToken,
    webhookPath
  };
}

export async function upsertProfile(input: {
  id: string;
  email?: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
}) {
  const { data, error } = await supabase()
    .from("profiles")
    .upsert(
      {
        id: input.id,
        email: input.email ?? null,
        full_name: input.fullName ?? null,
        avatar_url: input.avatarUrl ?? null
      },
      { onConflict: "id" }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function listWorkflowsForOwner(ownerId: string, options?: {
  status?: WorkflowStatus;
  search?: string;
}) {
  let query = supabase()
    .from("workflows")
    .select("*, workflow_runs(id)")
    .eq("owner_id", ownerId)
    .order("updated_at", { ascending: false });

  if (options?.status) {
    query = query.eq("status", options.status);
  }

  if (options?.search) {
    query = query.ilike("name", `%${options.search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;

  return data.map((workflow) => ({
    ...workflow,
    total_runs: workflow.workflow_runs.length
  }));
}

export async function getWorkflowForOwner(ownerId: string, workflowId: string) {
  const { data, error } = await supabase()
    .from("workflows")
    .select("*")
    .eq("owner_id", ownerId)
    .eq("id", workflowId)
    .single();

  if (error) throw error;
  return data;
}

export async function createWorkflow(input: CreateWorkflowInput) {
  const webhookMetadata = prepareWebhookMetadata(input.nodes ?? []);
  const { data, error } = await supabase()
    .from("workflows")
    .insert({
      owner_id: input.ownerId,
      name: input.name,
      description: input.description ?? null,
      status: input.status ?? "draft",
      nodes: webhookMetadata.nodes,
      edges: input.edges ?? [],
      webhook_token: webhookMetadata.webhookToken,
      webhook_path: webhookMetadata.webhookPath,
      schedule_config: scheduleConfigToJson(extractScheduleConfig(webhookMetadata.nodes)),
      next_run_at:
        input.status === "active" && extractScheduleConfig(webhookMetadata.nodes)
          ? calculateNextRunAt(extractScheduleConfig(webhookMetadata.nodes))
          : null
    })
    .select()
    .single();

  if (error) throw error;
  await createAuditLog(input.ownerId, "workflow.created", "workflow", data.id);
  return data;
}

export async function updateWorkflowForOwner(ownerId: string, workflowId: string, input: UpdateWorkflowInput) {
  const updatePayload: {
    name?: string;
    description?: string | null;
    status?: WorkflowStatus;
    nodes?: UpdateWorkflowInput["nodes"];
    edges?: UpdateWorkflowInput["edges"];
    webhook_token?: string | null;
    webhook_path?: string | null;
    schedule_config?: JsonObject | null;
    next_run_at?: string | null;
  } = {};
  const needsExistingWorkflow = input.nodes !== undefined || input.status !== undefined;
  const existingWorkflow = needsExistingWorkflow ? await getWorkflowForOwner(ownerId, workflowId) : null;

  if (input.name !== undefined) updatePayload.name = input.name;
  if (input.description !== undefined) updatePayload.description = input.description;
  if (input.status !== undefined) updatePayload.status = input.status;
  if (input.nodes !== undefined) {
    const webhookMetadata = prepareWebhookMetadata(input.nodes, existingWorkflow?.webhook_token);

    updatePayload.nodes = webhookMetadata.nodes;
    updatePayload.webhook_token = webhookMetadata.webhookToken;
    updatePayload.webhook_path = webhookMetadata.webhookPath;
  }
  if (input.edges !== undefined) updatePayload.edges = input.edges;

  if (existingWorkflow) {
    const targetNodes = input.nodes ?? existingWorkflow.nodes;
    const targetStatus = input.status ?? existingWorkflow.status;
    const scheduleConfig = extractScheduleConfig(targetNodes);
    const scheduleJson = scheduleConfigToJson(scheduleConfig);

    updatePayload.schedule_config = scheduleJson;
    updatePayload.next_run_at = targetStatus === "active" && scheduleConfig
      ? input.nodes !== undefined
        ? calculateNextRunAt(scheduleConfig)
        : existingWorkflow.next_run_at ?? calculateNextRunAt(scheduleConfig)
      : null;
  }

  const { data, error } = await supabase()
    .from("workflows")
    .update(updatePayload)
    .eq("owner_id", ownerId)
    .eq("id", workflowId)
    .select()
    .single();

  if (error) throw error;
  await createAuditLog(ownerId, "workflow.updated", "workflow", workflowId);
  return data;
}

export async function duplicateWorkflowForOwner(ownerId: string, workflowId: string) {
  const workflow = await getWorkflowForOwner(ownerId, workflowId);
  const webhookMetadata = prepareWebhookMetadata(workflow.nodes);
  const scheduleConfig = extractScheduleConfig(webhookMetadata.nodes);

  const { data, error } = await supabase()
    .from("workflows")
    .insert({
      owner_id: ownerId,
      name: `${workflow.name} copy`,
      description: workflow.description,
      status: "draft",
      nodes: webhookMetadata.nodes,
      edges: workflow.edges,
      webhook_token: webhookMetadata.webhookToken,
      webhook_path: webhookMetadata.webhookPath,
      schedule_config: scheduleConfigToJson(scheduleConfig),
      last_run_at: null,
      next_run_at: null
    })
    .select()
    .single();

  if (error) throw error;
  await createAuditLog(ownerId, "workflow.created", "workflow", data.id, {
    duplicatedFrom: workflowId
  });
  return data;
}

export async function getWorkflowByWebhookToken(token: string) {
  const { data, error } = await supabase()
    .from("workflows")
    .select("*")
    .eq("webhook_token", token)
    .single();

  if (error) throw error;
  return data;
}

export async function listDueScheduledWorkflows(now = new Date(), limit = 10) {
  const { data, error } = await supabase()
    .from("workflows")
    .select("*")
    .eq("status", "active")
    .not("next_run_at", "is", null)
    .lte("next_run_at", now.toISOString())
    .order("next_run_at", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function updateWorkflowScheduleAfterRun(workflowId: string, input: {
  scheduleConfig: JsonObject | null;
  ranAt: string;
}) {
  const { data, error } = await supabase()
    .from("workflows")
    .update({
      last_run_at: input.ranAt,
      next_run_at: calculateNextRunAt(input.scheduleConfig, new Date(input.ranAt))
    })
    .eq("id", workflowId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteWorkflowForOwner(ownerId: string, workflowId: string) {
  const { error } = await supabase()
    .from("workflows")
    .delete()
    .eq("owner_id", ownerId)
    .eq("id", workflowId);

  if (error) throw error;
  await createAuditLog(ownerId, "workflow.deleted", "workflow", workflowId);
}

export async function createWorkflowRun(input: CreateWorkflowRunInput) {
  const { data, error } = await supabase()
    .from("workflow_runs")
    .insert({
      workflow_id: input.workflowId,
      status: input.status ?? "queued",
      input: input.input ?? {},
      output: input.output ?? null,
      error_message: input.errorMessage ?? null,
      started_at: input.startedAt,
      finished_at: input.finishedAt ?? null
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateWorkflowRun(runId: string, input: {
  status: WorkflowRunStatus;
  output?: JsonObject | null;
  errorMessage?: string | null;
  finishedAt?: string | null;
}) {
  const { data, error } = await supabase()
    .from("workflow_runs")
    .update({
      status: input.status,
      output: input.output ?? null,
      error_message: input.errorMessage ?? null,
      finished_at: input.finishedAt ?? new Date().toISOString()
    })
    .eq("id", runId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function listWorkflowRunsForOwner(ownerId: string, workflowId?: string) {
  let query = supabase()
    .from("workflow_runs")
    .select("*, workflows!inner(owner_id, name)")
    .eq("workflows.owner_id", ownerId)
    .order("started_at", { ascending: false });

  if (workflowId) {
    query = query.eq("workflow_id", workflowId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createCredentialMetadata(input: CreateCredentialMetadataInput): Promise<SafeCredential> {
  const { data, error } = await supabase()
    .from("credentials")
    .insert({
      owner_id: input.ownerId,
      provider: input.provider,
      label: input.label,
      secret_reference: input.secretReference ?? null,
      encrypted_secret: null,
      secret_storage_strategy: "environment_variable"
    })
    .select()
    .single();

  if (error) throw error;
  await createAuditLog(input.ownerId, "credential.created", "credential", data.id);

  return {
    id: data.id,
    ownerId: data.owner_id,
    provider: data.provider,
    label: data.label,
    secretReference: data.secret_reference,
    secretStorageStrategy: data.secret_storage_strategy,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    hasEncryptedSecret: Boolean(data.encrypted_secret)
  };
}

export async function listSafeCredentialsForOwner(ownerId: string): Promise<SafeCredential[]> {
  const { data, error } = await supabase()
    .from("credentials")
    .select("id, owner_id, provider, label, encrypted_secret, secret_reference, secret_storage_strategy, created_at, updated_at")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data.map((credential) => ({
    id: credential.id,
    ownerId: credential.owner_id,
    provider: credential.provider,
    label: credential.label,
    secretReference: credential.secret_reference,
    secretStorageStrategy: credential.secret_storage_strategy,
    createdAt: credential.created_at,
    updatedAt: credential.updated_at,
    hasEncryptedSecret: Boolean(credential.encrypted_secret)
  }));
}

export async function listIntegrationConnectionsForOwner(ownerId: string) {
  const { data, error } = await supabase()
    .from("integration_connections")
    .select("*")
    .eq("owner_id", ownerId)
    .order("provider", { ascending: true });

  if (error) throw error;
  return data;
}

export async function createIntegrationConnection(input: CreateIntegrationConnectionInput) {
  const { data, error } = await supabase()
    .from("integration_connections")
    .insert({
      owner_id: input.ownerId,
      credential_id: input.credentialId ?? null,
      provider: input.provider,
      status: input.status ?? "not_configured",
      display_name: input.displayName,
      metadata: input.metadata ?? {}
    })
    .select()
    .single();

  if (error) throw error;
  await createAuditLog(input.ownerId, "integration.connected", "integration_connection", data.id);
  return data;
}

export async function createAuditLog(
  ownerId: string,
  action: AuditLogAction,
  entityType: string,
  entityId?: string,
  metadata: JsonObject = {}
) {
  const { data, error } = await supabase()
    .from("audit_logs")
    .insert({
      owner_id: ownerId,
      action,
      entity_type: entityType,
      entity_id: entityId ?? null,
      metadata
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
