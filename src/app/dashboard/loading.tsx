export default function DashboardLoading() {
  return (
    <main className="dashboard">
      <aside className="sidebar" aria-label="Dashboard navigation">
        <div className="skeleton skeleton-brand" />
        <div className="skeleton skeleton-nav" />
        <div className="skeleton skeleton-nav" />
        <div className="skeleton skeleton-nav" />
      </aside>
      <section className="dashboard-content">
        <div className="skeleton skeleton-title" />
        <div className="stats-grid">
          <div className="card stat-card skeleton-card" />
          <div className="card stat-card skeleton-card" />
          <div className="card stat-card skeleton-card" />
          <div className="card stat-card skeleton-card" />
        </div>
        <div className="card table-card skeleton-table" />
      </section>
    </main>
  );
}
