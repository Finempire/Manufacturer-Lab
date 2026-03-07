import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { createAuditLog } from "@/lib/auditLog";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);

    // Return only the latest order (for auto-generating order numbers)
    if (searchParams.get("last") === "true") {
        const last = await prisma.order.findFirst({ orderBy: { created_at: "desc" }, select: { order_no: true } });
        return NextResponse.json(last || { order_no: null });
    }

    const orders = await prisma.order.findMany({
        include: {
            buyer: true,
            merchandiser: { select: { name: true } },
            creator: { select: { name: true } },
            lines: { include: { style: true } },
        },
        orderBy: { created_at: "desc" },
    });
    return NextResponse.json(orders);
}

export async function POST(req: Request) {
    const auth = await requireRole(["ACCOUNTANT"]);
    if (!auth.authorized) return auth.response;

    const body = await req.json();
    const { buyer_id, order_date, shipping_date, order_type, remarks, lines, order_no: userOrderNo } = body;

    if (!buyer_id || !order_date || !shipping_date || !order_type || !lines?.length) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const total_amount = lines.reduce(
        (sum: number, line: { amount: number }) => sum + line.amount,
        0
    );

    // Use user-provided order_no or auto-generate
    let order_no = userOrderNo;
    if (!order_no) {
        const count = await prisma.order.count();
        order_no = `ORD-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;
    }

    const order = await prisma.order.create({
        data: {
            order_no,
            buyer_id,
            order_date: new Date(order_date),
            shipping_date: new Date(shipping_date),
            order_type,
            total_amount,
            remarks: remarks || null,
            created_by: auth.user.id,
            lines: {
                create: lines.map(
                    (line: {
                        style_id: string;
                        description?: string;
                        quantity: number;
                        rate: number;
                        amount: number;
                    }) => ({
                        style_id: line.style_id,
                        description: line.description || null,
                        quantity: parseFloat(String(line.quantity)),
                        rate: parseFloat(String(line.rate)),
                        amount: parseFloat(String(line.amount)),
                    })
                ),
            },
        },
    });

    await createAuditLog({
        entityType: "ORDER",
        entityId: order.id,
        action: "CREATED",
        performedBy: auth.user.id,
        newState: JSON.stringify({ order_no, total_amount }),
    });

    return NextResponse.json(order, { status: 201 });
}
