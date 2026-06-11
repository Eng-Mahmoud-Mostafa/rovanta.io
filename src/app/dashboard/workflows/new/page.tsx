import { WorkflowBuilder } from "@/components/workflow-builder";
import { emptyBuilderWorkflow } from "@/lib/workflow/builder-data";

export const dynamic = "force-dynamic";

export default function NewWorkflowPage() {
  return <WorkflowBuilder initialWorkflow={emptyBuilderWorkflow} />;
}
