import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { createAuditLog } from "@/lib/auditLog";

export async function GET(
    _req: Request,
    { params }: { params: { id: string } }
) {
    const order = await prisma.order.findUnique({
        where: { id: params.id },
        include: {
            buyer: true,
            merchandiser: { select: { id: true, name: true } },
            creator: { select: { name: true } },
            lines: true,
            tech_packs: true,
            material_requirements: true,
            material_requests: { include: { runner: { select: { name: true } } } },
            expenses: true,
        },
    });

    if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order);
}

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    const auth = await requireRole([
        "ACCOUNTANT",
        "PRODUCTION_MANAGER",
        "CEO",
    ]);
    if (!auth.authorized) return auth.response;

    const body = await req.json();
    const { status, assigned_merchandiser_id, production_manager_notes } = body;

    const existingOrder = await prisma.order.findUnique({
        where: { id: params.id },
    });
    if (!existingOrder) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (assigned_merchandiser_id)
        updateData.assigned_merchandiser_id = assigned_merchandiser_id;
    if (production_manager_notes)
        updateData.production_manager_notes = production_manager_notes;

    const order = await prisma.order.update({
        where: { id: params.id },
        data: updateData,
    });

    await createAuditLog({
        entityType: "ORDER",
        entityId: order.id,
        action: status ? `STATUS_CHANGED_TO_${status}` : "UPDATED",
        performedBy: auth.user.id,
        previousState: JSON.stringify({ status: existingOrder.status }),
        newState: JSON.stringify(updateData),
    });

    return NextResponse.json(order);
}
