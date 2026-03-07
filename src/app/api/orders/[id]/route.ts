import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { createAuditLog } from "@/lib/auditLog";

export async function GET(
    _req: Request,
    { params }: { params: { id: string } }
) {
    const auth = await requireRole([
        "ACCOUNTANT",
        "SAMPLE_PRODUCTION_MANAGER",
        "PRODUCTION_MANAGER",
        "MERCHANDISER",
        "STORE_MANAGER",
        "RUNNER",
        "CEO",
    ]);
    if (!auth.authorized) return auth.response;

    const order = await prisma.order.findUnique({
        where: { id: params.id },
        include: {
            buyer: true,
            merchandiser: { select: { id: true, name: true } },
            creator: { select: { name: true } },
            assigned_sample_pm: { select: { id: true, name: true } },
            assigned_production_pm: { select: { id: true, name: true } },
            pm_accepted_by: { select: { id: true, name: true } },
            lines: { include: { style: true } },
            tech_packs: true,
            material_requirements: true,
            material_requests: { include: { runner: { select: { name: true } } } },
            expenses: true,
        },
    });

    if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // RBAC visibility checks
    const role = auth.user.role;

    if (role === "MERCHANDISER" && order.assigned_merchandiser_id !== auth.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (role === "SAMPLE_PRODUCTION_MANAGER" && order.order_type !== "SAMPLE") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (role === "PRODUCTION_MANAGER" && order.order_type !== "PRODUCTION") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Strip financial fields for non-financial roles
    const financialRoles = ["ACCOUNTANT", "CEO"];
    if (!financialRoles.includes(role)) {
        return NextResponse.json({
            ...order,
            total_amount: undefined,
            lines: order.lines.map((line) => ({
                ...line,
                rate: undefined,
                amount: undefined,
            })),
        });
    }

    return NextResponse.json(order);
}

export async function PUT(
    req: Request,
    { params }: { params: { id: string } }
) {
    const auth = await requireRole(["ACCOUNTANT", "PRODUCTION_MANAGER", "SAMPLE_PRODUCTION_MANAGER", "CEO"]);
    if (!auth.authorized) return auth.response;

    try {
        const body = await req.json();
        const { status, assigned_merchandiser_id, remarks, shipping_date } = body;

        const existingOrder = await prisma.order.findUnique({
            where: { id: params.id },
        });
        if (!existingOrder) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData: Record<string, any> = {};
        if (status) updateData.status = status;
        if (assigned_merchandiser_id) updateData.assigned_merchandiser_id = assigned_merchandiser_id;
        if (remarks !== undefined) updateData.remarks = remarks;
        if (shipping_date) updateData.shipping_date = new Date(shipping_date);

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
    } catch (error) {
        console.error("Update order error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
