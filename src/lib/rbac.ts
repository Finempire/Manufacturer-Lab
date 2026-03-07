import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions, UserRole } from "@/lib/auth";

export async function requireRole(allowedRoles: UserRole[]) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      authorized: false as const,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!allowedRoles.includes(session.user.role as UserRole)) {
    return {
      authorized: false as const,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return {
    authorized: true as const,
    user: session.user,
  };
}

export function getRoleDashboardPath(role: string): string {
  const paths: Record<string, string> = {
    ACCOUNTANT: "/dashboard/accountant",
    SAMPLE_PRODUCTION_MANAGER: "/dashboard/sample-pm",
    PRODUCTION_MANAGER: "/dashboard/production",
    MERCHANDISER: "/dashboard/merchandiser",
    STORE_MANAGER: "/dashboard/manager",
    RUNNER: "/dashboard/runner",
    CEO: "/dashboard/ceo",
  };
  return paths[role] || "/login";
}

export function canViewFinancials(role: string): boolean {
  return role === "ACCOUNTANT" || role === "CEO";
}

export function isPMRole(role: string): boolean {
  return role === "SAMPLE_PRODUCTION_MANAGER" || role === "PRODUCTION_MANAGER";
}

export function getOrderTypeForPM(role: string): string | null {
  if (role === "SAMPLE_PRODUCTION_MANAGER") return "SAMPLE";
  if (role === "PRODUCTION_MANAGER") return "PRODUCTION";
  return null;
}
