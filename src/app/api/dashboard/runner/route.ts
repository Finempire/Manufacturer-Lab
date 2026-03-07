import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export async function GET() {
    const auth = await requireRole(["RUNNER"]);
    if (!auth.authorized) return auth.response;

    const [pendingPurchases, myPurchases, pendingConfirmations] = await Promise.all([
        prisma.materialRequest.count({ where: { assigned_runner_id: auth.user.id, status: "PENDING_PURCHASE" } }),
        prisma.purchase.count({ where: { runner_id: auth.user.id } }),
        prisma.vendorConfirmation.count({ where: { runner_id: auth.user.id, status: "NOT_CONFIRMED" } }),
    ]);

    return NextResponse.json({ pendingPurchases, myPurchases, pendingConfirmations });
}
