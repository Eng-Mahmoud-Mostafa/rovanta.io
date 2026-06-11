import type { JsonObject, JsonValue, WorkflowNode } from "@/types/workflow";

export type ScheduleIntervalType = "minutes" | "hourly" | "daily" | "weekly";

export type ScheduleConfig = {
  intervalType: ScheduleIntervalType;
  intervalValue: number;
  timezone: string;
};

const intervalMs: Record<ScheduleIntervalType, number> = {
  minutes: 60 * 1000,
  hourly: 60 * 60 * 1000,
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000
};

function isScheduleIntervalType(value: JsonValue | undefined): value is ScheduleIntervalType {
  return value === "minutes" || value === "hourly" || value === "daily" || value === "weekly";
}

function toPositiveNumber(value: JsonValue | undefined) {
  const numberValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : 1;
}

export function extractScheduleConfig(nodes: WorkflowNode[]): ScheduleConfig | null {
  const scheduleNode = nodes.find((node) => node.type === "scheduleTrigger");

  if (!scheduleNode) return null;

  const intervalType = isScheduleIntervalType(scheduleNode.config.intervalType)
    ? scheduleNode.config.intervalType
    : "daily";
  const intervalValue = toPositiveNumber(scheduleNode.config.intervalValue);
  const timezone =
    typeof scheduleNode.config.timezone === "string" && scheduleNode.config.timezone.trim()
      ? scheduleNode.config.timezone.trim()
      : "UTC";

  return {
    intervalType,
    intervalValue,
    timezone
  };
}

export function scheduleConfigToJson(config: ScheduleConfig | null): JsonObject | null {
  if (!config) return null;

  return {
    intervalType: config.intervalType,
    intervalValue: config.intervalValue,
    timezone: config.timezone
  };
}

export function calculateNextRunAt(config: ScheduleConfig | JsonObject | null, from = new Date()) {
  if (!config) return null;

  const intervalType = isScheduleIntervalType(config.intervalType) ? config.intervalType : "daily";
  const intervalValue = toPositiveNumber(config.intervalValue);
  const nextRunAt = new Date(from.getTime() + intervalMs[intervalType] * intervalValue);

  return nextRunAt.toISOString();
}
