import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getOptionalEnv } from "@/lib/env";

export type DashboardIdentity = {
  userId: string;
  displayName: string;
  email: string | null;
  isDemo: boolean;
};

export function isClerkConfigured() {
  return Boolean(
    getOptionalEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY") &&
      getOptionalEnv("CLERK_SECRET_KEY")
  );
}

export async function getDashboardIdentity(): Promise<DashboardIdentity> {
  if (!isClerkConfigured()) {
    return {
      userId: "demo_user",
      displayName: "Demo Operator",
      email: "demo@rovanta.io",
      isDemo: true
    };
  }

  const session = await auth();

  if (!session.userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();
  const displayName =
    user?.fullName ||
    user?.firstName ||
    user?.primaryEmailAddress?.emailAddress ||
    "Rovanta Operator";

  return {
    userId: session.userId,
    displayName,
    email: user?.primaryEmailAddress?.emailAddress ?? null,
    isDemo: false
  };
}

export async function getRequestIdentity(): Promise<DashboardIdentity> {
  if (!isClerkConfigured()) {
    return {
      userId: "demo_user",
      displayName: "Demo Operator",
      email: "demo@rovanta.io",
      isDemo: true
    };
  }

  const session = await auth();

  if (!session.userId) {
    throw new Error("Authentication required.");
  }

  return {
    userId: session.userId,
    displayName: "Rovanta Operator",
    email: null,
    isDemo: false
  };
}
