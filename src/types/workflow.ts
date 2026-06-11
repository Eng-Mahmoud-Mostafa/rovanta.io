export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

export type WorkflowStatus = "draft" | "active" | "paused" | "error";
export type WorkflowRunStatus = "queued" | "running" | "success" | "failed";
export type IntegrationConnectionStatus = "not_configured" | "connected" | "needs_attention" | "disabled";

export type WorkflowNodeConfig = JsonObject;

export type WorkflowNode = {
  id: string;
  type: string;
  label: string;
  config: WorkflowNodeConfig;
  position?: {
    x: number;
    y: number;
  };
};

export type WorkflowEdge = {
  id: string;
  source: string;
  target: string;
  label?: string;
};

export type Profile = {
  id: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Workflow = {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  status: WorkflowStatus;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  webhookToken: string | null;
  webhookPath: string | null;
  scheduleConfig: JsonObject | null;
  lastRunAt: string | null;
  nextRunAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WorkflowRun = {
  id: string;
  workflowId: string;
  status: WorkflowRunStatus;
  input: JsonObject;
  output: JsonObject | null;
  errorMessage: string | null;
  startedAt: string;
  finishedAt: string | null;
  createdAt: string;
};

export type Credential = {
  id: string;
  ownerId: string;
  provider: string;
  label: string;
  encryptedSecret: string | null;
  secretReference: string | null;
  secretStorageStrategy: "environment_variable" | "encrypted_secret";
  createdAt: string;
  updatedAt: string;
};

export type SafeCredential = Omit<Credential, "encryptedSecret"> & {
  hasEncryptedSecret: boolean;
};

export type IntegrationConnection = {
  id: string;
  ownerId: string;
  credentialId: string | null;
  provider: string;
  status: IntegrationConnectionStatus;
  displayName: string;
  metadata: JsonObject;
  createdAt: string;
  updatedAt: string;
};

export type AuditLogAction =
  | "profile.created"
  | "workflow.created"
  | "workflow.updated"
  | "workflow.deleted"
  | "workflow.executed"
  | "credential.created"
  | "credential.updated"
  | "integration.connected"
  | "integration.updated";

export type AuditLog = {
  id: string;
  ownerId: string | null;
  action: AuditLogAction;
  entityType: string;
  entityId: string | null;
  metadata: JsonObject;
  createdAt: string;
};

export type CreateWorkflowInput = {
  ownerId: string;
  name: string;
  description?: string | null;
  status?: WorkflowStatus;
  nodes?: WorkflowNode[];
  edges?: WorkflowEdge[];
};

export type UpdateWorkflowInput = Partial<Omit<CreateWorkflowInput, "ownerId">>;

export type CreateWorkflowRunInput = {
  workflowId: string;
  status?: WorkflowRunStatus;
  input?: JsonObject;
  output?: JsonObject | null;
  errorMessage?: string | null;
  startedAt?: string;
  finishedAt?: string | null;
};

export type CreateCredentialMetadataInput = {
  ownerId: string;
  provider: string;
  label: string;
  secretReference?: string | null;
};

export type CreateIntegrationConnectionInput = {
  ownerId: string;
  credentialId?: string | null;
  provider: string;
  displayName: string;
  status?: IntegrationConnectionStatus;
  metadata?: JsonObject;
};
