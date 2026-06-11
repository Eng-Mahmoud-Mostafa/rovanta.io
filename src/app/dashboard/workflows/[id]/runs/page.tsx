import { DashboardNav } from "@/components/dashboard-nav";
import { RunsHistory } from "@/components/runs-history";
import { getRequestIdentity } from "@/lib/auth";
import { getRunHistoryData } from "@/lib/db/runs";

export const dynamic = "force-dynamic";

export default async function WorkflowRunsPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, identity] = await Promise.all([params, getRequestIdentity()]);
  const data = await getRunHistoryData(identity.userId, id);

  return (
    <main className="dashboard-page runs-page">
      <DashboardNav />
      <RunsHistory
        runs={data.runs}
        workflows={data.workflows}
        source={data.source}
        errorMessage={data.errorMessage}
        initialWorkflowId={id}
      />
    </main>
  );
}
