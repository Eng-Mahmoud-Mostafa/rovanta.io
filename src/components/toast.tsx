import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

export type ToastTone = "success" | "error" | "info";

const iconByTone = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info
};

export function Toast({ tone, title, message }: { tone: ToastTone; title: string; message: string }) {
  const Icon = iconByTone[tone];

  return (
    <section className={`toast toast-${tone}`} role={tone === "error" ? "alert" : "status"} aria-live="polite">
      <Icon size={18} />
      <div>
        <strong>{title}</strong>
        <p>{message}</p>
      </div>
    </section>
  );
}
