import type {
  AuditLogAction,
  IntegrationConnectionStatus,
  JsonObject,
  WorkflowEdge,
  WorkflowNode,
  WorkflowRunStatus,
  WorkflowStatus
} from "@/types/workflow";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      workflows: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          description: string | null;
          status: WorkflowStatus;
          nodes: WorkflowNode[];
          edges: WorkflowEdge[];
          webhook_token: string | null;
          webhook_path: string | null;
          schedule_config: JsonObject | null;
          last_run_at: string | null;
          next_run_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          description?: string | null;
          status?: WorkflowStatus;
          nodes?: WorkflowNode[];
          edges?: WorkflowEdge[];
          webhook_token?: string | null;
          webhook_path?: string | null;
          schedule_config?: JsonObject | null;
          last_run_at?: string | null;
          next_run_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          status?: WorkflowStatus;
          nodes?: WorkflowNode[];
          edges?: WorkflowEdge[];
          webhook_token?: string | null;
          webhook_path?: string | null;
          schedule_config?: JsonObject | null;
          last_run_at?: string | null;
          next_run_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workflows_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      workflow_runs: {
        Row: {
          id: string;
          workflow_id: string;
          status: WorkflowRunStatus;
          input: JsonObject;
          output: JsonObject | null;
          error_message: string | null;
          started_at: string;
          finished_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workflow_id: string;
          status?: WorkflowRunStatus;
          input?: JsonObject;
          output?: JsonObject | null;
          error_message?: string | null;
          started_at?: string;
          finished_at?: string | null;
          created_at?: string;
        };
        Update: {
          status?: WorkflowRunStatus;
          output?: JsonObject | null;
          error_message?: string | null;
          finished_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "workflow_runs_workflow_id_fkey";
            columns: ["workflow_id"];
            isOneToOne: false;
            referencedRelation: "workflows";
            referencedColumns: ["id"];
          }
        ];
      };
      credentials: {
        Row: {
          id: string;
          owner_id: string;
          provider: string;
          label: string;
          encrypted_secret: string | null;
          secret_reference: string | null;
          secret_storage_strategy: "environment_variable" | "encrypted_secret";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          provider: string;
          label: string;
          encrypted_secret?: string | null;
          secret_reference?: string | null;
          secret_storage_strategy?: "environment_variable" | "encrypted_secret";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          provider?: string;
          label?: string;
          encrypted_secret?: string | null;
          secret_reference?: string | null;
          secret_storage_strategy?: "environment_variable" | "encrypted_secret";
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "credentials_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      integration_connections: {
        Row: {
          id: string;
          owner_id: string;
          credential_id: string | null;
          provider: string;
          status: IntegrationConnectionStatus;
          display_name: string;
          metadata: JsonObject;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          credential_id?: string | null;
          provider: string;
          status?: IntegrationConnectionStatus;
          display_name: string;
          metadata?: JsonObject;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          credential_id?: string | null;
          provider?: string;
          status?: IntegrationConnectionStatus;
          display_name?: string;
          metadata?: JsonObject;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "integration_connections_credential_id_fkey";
            columns: ["credential_id"];
            isOneToOne: false;
            referencedRelation: "credentials";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "integration_connections_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      audit_logs: {
        Row: {
          id: string;
          owner_id: string | null;
          action: AuditLogAction;
          entity_type: string;
          entity_id: string | null;
          metadata: JsonObject;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id?: string | null;
          action: AuditLogAction;
          entity_type: string;
          entity_id?: string | null;
          metadata?: JsonObject;
          created_at?: string;
        };
        Update: never;
        Relationships: [
          {
            foreignKeyName: "audit_logs_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      workflow_status: WorkflowStatus;
      workflow_run_status: WorkflowRunStatus;
      integration_connection_status: IntegrationConnectionStatus;
      audit_log_action: AuditLogAction;
    };
    CompositeTypes: Record<string, never>;
  };
};
