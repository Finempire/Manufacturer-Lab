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
        "SENIOR_MERCHANDISER",
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
    if (role === "SENIOR_MERCHANDISER" && order.order_type !== "SAMPLE") {
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
    const auth = await requireRole(["ACCOUNTANT", "PRODUCTION_MANAGER", "SENIOR_MERCHANDISER", "CEO"]);
    if (!auth.authorized) return auth.response;

    try {
        const body = await req.json();
        const { status, assigned_merchandiser_id, remarks, shipping_date, buyer_id, order_date, order_type, lines } = body;

        const existingOrder = await prisma.order.findUnique({
            where: { id: params.id },
            include: { lines: true },
        });
        if (!existingOrder) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        // Full edit (with lines) — only ACCOUNTANT can do this
        if (lines && Array.isArray(lines)) {
            if (auth.user.role !== "ACCOUNTANT") {
                return NextResponse.json({ error: "Only accountants can edit order details" }, { status: 403 });
            }

            const totalAmount = lines.reduce((sum: number, l: { amount: number }) => sum + Number(l.amount), 0);

            const order = await prisma.$transaction(async (tx) => {
                // Delete old lines
                await tx.orderLine.deleteMany({ where: { order_id: params.id } });

                // Update order + create new lines
                return tx.order.update({
                    where: { id: params.id },
                    data: {
                        buyer_id: buyer_id || existingOrder.buyer_id,
                        order_date: order_date ? new Date(order_date) : existingOrder.order_date,
                        shipping_date: shipping_date ? new Date(shipping_date) : existingOrder.shipping_date,
                        order_type: order_type || existingOrder.order_type,
                        remarks: remarks !== undefined ? remarks : existingOrder.remarks,
                        total_amount: totalAmount,
                        lines: {
                            create: lines.map((l: { style_id: string; description?: string; quantity: number; rate: number; amount: number }) => ({
                                style_id: l.style_id,
                                description: l.description || "",
                                quantity: Number(l.quantity),
                                rate: Number(l.rate),
                                amount: Number(l.amount),
                            })),
                        },
                    },
                    include: { lines: true, buyer: true },
                });
            });

            await createAuditLog({
                entityType: "ORDER",
                entityId: order.id,
                action: "ORDER_EDITED",
                performedBy: auth.user.id,
                previousState: JSON.stringify({ total_amount: existingOrder.total_amount, lines_count: existingOrder.lines.length }),
                newState: JSON.stringify({ total_amount: order.total_amount, lines_count: order.lines.length }),
            });

            return NextResponse.json(order);
        }

        // Partial update (status, merchandiser, remarks, shipping_date)
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
