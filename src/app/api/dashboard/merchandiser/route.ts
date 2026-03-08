import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export async function GET() {
    const auth = await requireRole(["MERCHANDISER"]);
    if (!auth.authorized) return auth.response;

    const [assignedOrders, draftTechPacks, completedTechPacks] = await Promise.all([
        prisma.order.count({ where: { assigned_merchandiser_id: auth.user.id } }),
        prisma.techPack.count({ where: { merchandiser_id: auth.user.id, status: "IN_PROGRESS" } }),
        prisma.techPack.count({ where: { merchandiser_id: auth.user.id, status: "BUYER_APPROVED" } }),
    ]);

    return NextResponse.json({ assignedOrders, draftTechPacks, completedTechPacks });
}
