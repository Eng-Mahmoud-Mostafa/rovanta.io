import { DashboardNav } from "@/components/dashboard-nav";
import { RunsHistory } from "@/components/runs-history";
import { getRequestIdentity } from "@/lib/auth";
import { getRunHistoryData } from "@/lib/db/runs";

export const dynamic = "force-dynamic";

export default async function RunsPage() {
  const identity = await getRequestIdentity();
  const data = await getRunHistoryData(identity.userId);

  return (
    <main className="dashboard-page runs-page">
      <DashboardNav />
      <RunsHistory
        runs={data.runs}
        workflows={data.workflows}
        source={data.source}
        errorMessage={data.errorMessage}
      />
    </main>
  );
}
