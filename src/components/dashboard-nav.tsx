"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Bot, Cable, LayoutTemplate, ListChecks, Workflow } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: Activity },
  { href: "/dashboard/workflows", label: "Workflows", icon: Workflow },
  { href: "/dashboard/runs", label: "Runs", icon: ListChecks },
  { href: "/dashboard/ai-assistant", label: "Rovanta AI", icon: Bot },
  { href: "/dashboard/templates", label: "Templates", icon: LayoutTemplate },
  { href: "/dashboard/integrations", label: "Integrations", icon: Cable }
];

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="dashboard-nav" aria-label="Dashboard navigation">
      <Link className="brand" href="/">
        <span className="brand-mark">R</span>
        <span>Rovanta.io</span>
      </Link>
      <div className="dashboard-nav-links">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link className={isActivePath(pathname, href) ? "active" : ""} href={href} key={href}>
            <Icon size={17} />
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
