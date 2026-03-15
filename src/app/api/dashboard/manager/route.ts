import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export async function GET() {
    const auth = await requireRole(["STORE_MANAGER"]);
    if (!auth.authorized) return auth.response;

    const [
        materialRequirements,
        pendingRequests,
        myExpenses,
        // V2 fields
        needRequestsAwaitingAcceptance,
        purchaseRequestsToCreate,
        runnersAssigned,
        runnersAvailable,
        purchasesPendingInvoice,
        purchasesRejected,
        completionBlockers,
    ] = await Promise.all([
        prisma.materialRequirement.count({ where: { store_manager_id: auth.user.id } }),
        prisma.materialRequest.count({ where: { manager_id: auth.user.id, status: "PENDING_PURCHASE" } }),
        prisma.expenseRequest.count({ where: { raised_by_id: auth.user.id } }),
        // Need requests (material requirements) awaiting store acceptance
        prisma.materialRequirement.count({
            where: {
                store_manager_id: auth.user.id,
                status: "PENDING_STORE_ACCEPTANCE",
            },
        }),
        // Material requirements accepted but no request raised yet
        prisma.materialRequirement.count({
            where: {
                store_manager_id: auth.user.id,
                status: "ACCEPTED_BY_STORE",
            },
        }),
        // Runners with active assignments
        prisma.user.count({
            where: {
                role: "RUNNER",
                is_active: true,
                runner_requests: {
                    some: { status: { in: ["PENDING_PURCHASE", "INVOICE_SUBMITTED"] } },
                },
            },
        }),
        // Available runners (no active assignment)
        prisma.user.count({
            where: {
                role: "RUNNER",
                is_active: true,
                runner_requests: {
                    none: { status: { in: ["PENDING_PURCHASE", "INVOICE_SUBMITTED"] } },
                },
            },
        }),
        // Purchases pending invoice (runner assigned but no invoice yet)
        prisma.purchase.count({
            where: {
                status: "INVOICE_SUBMITTED",
                request: { manager_id: auth.user.id },
            },
        }),
        // Purchases rejected
        prisma.purchase.count({
            where: {
                status: "REJECTED",
                request: { manager_id: auth.user.id },
            },
        }),
        // Orders with blocker_code (completion blockers)
        prisma.order.count({
            where: {
                status: { notIn: ["COMPLETED", "CANCELLED"] },
                blocker_code: { not: null },
            },
        }),
    ]);

    return NextResponse.json({
        materialRequirements,
        pendingRequests,
        myExpenses,
        needRequestsAwaitingAcceptance,
        purchaseRequestsToCreate,
        runnersAssigned,
        runnersAvailable,
        purchasesPendingInvoice,
        purchasesRejected,
        completionBlockers,
    });
}
