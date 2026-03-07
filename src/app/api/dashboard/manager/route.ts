import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export async function GET() {
    const auth = await requireRole(["STORE_MANAGER"]);
    if (!auth.authorized) return auth.response;

    const [materialRequirements, pendingRequests, myExpenses] = await Promise.all([
        prisma.materialRequirement.count({ where: { store_manager_id: auth.user.id } }),
        prisma.materialRequest.count({ where: { manager_id: auth.user.id, status: "PENDING_PURCHASE" } }),
        prisma.expenseRequest.count({ where: { raised_by_id: auth.user.id } }),
    ]);

    return NextResponse.json({ materialRequirements, pendingRequests, myExpenses });
}
