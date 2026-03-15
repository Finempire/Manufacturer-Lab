import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export async function GET() {
    const auth = await requireRole(["RUNNER"]);
    if (!auth.authorized) return auth.response;

    const [pendingPurchases, myPurchases, pendingConfirmations, currentTask] = await Promise.all([
        prisma.materialRequest.count({ where: { assigned_runner_id: auth.user.id, status: "PENDING_PURCHASE" } }),
        prisma.purchase.count({ where: { runner_id: auth.user.id } }),
        prisma.vendorConfirmation.count({ where: { runner_id: auth.user.id, status: "NOT_CONFIRMED" } }),
        prisma.materialRequest.findFirst({
            where: { assigned_runner_id: auth.user.id, status: "PENDING_PURCHASE" },
            orderBy: [{ overdue_flag: "desc" }, { expected_date: "asc" }, { created_at: "asc" }],
            select: {
                id: true,
                request_no: true,
                store_location: true,
                expected_date: true,
                remarks: true,
                overdue_flag: true,
                buyer: { select: { name: true } },
                manager: { select: { name: true } },
                preferred_vendor: { select: { name: true } },
                order: { select: { order_no: true } },
                style: { select: { style_code: true, style_name: true } },
                lines: {
                    select: {
                        material: { select: { description: true } },
                        quantity: true,
                        expected_amount: true,
                    },
                },
            },
        }),
    ]);

    return NextResponse.json({ pendingPurchases, myPurchases, pendingConfirmations, currentTask });
}
