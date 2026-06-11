import { DashboardNav } from "@/components/dashboard-nav";
import { TemplatesGallery } from "@/components/templates-gallery";
import { workflowTemplates } from "@/lib/workflow/templates";

export default function TemplatesPage() {
  return (
    <main className="dashboard-page">
      <DashboardNav />
      <TemplatesGallery templates={workflowTemplates} />
    </main>
  );
}
