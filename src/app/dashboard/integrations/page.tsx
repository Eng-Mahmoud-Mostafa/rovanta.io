import { DashboardNav } from "@/components/dashboard-nav";
import { IntegrationsManagement } from "@/components/integrations-management";
import { getRequestIdentity } from "@/lib/auth";
import { getIntegrationsData } from "@/lib/db/integrations";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const identity = await getRequestIdentity();
  const data = await getIntegrationsData(identity.userId);

  return (
    <main className="dashboard-page">
      <DashboardNav />
      <IntegrationsManagement
        integrations={data.integrations}
        source={data.source}
        errorMessage={data.errorMessage}
      />
    </main>
  );
}
