import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export async function GET() {
    const auth = await requireRole([
        "ACCOUNTANT", "SENIOR_MERCHANDISER", "PRODUCTION_MANAGER",
        "MERCHANDISER", "STORE_MANAGER", "CEO",
    ]);
    if (!auth.authorized) return auth.response;

    const where =
        auth.user.role === "ACCOUNTANT" || auth.user.role === "CEO"
            ? {}
            : { raised_by_id: auth.user.id };

    const expenses = await prisma.expenseRequest.findMany({
        where,
        include: {
            raised_by: { select: { name: true } },
            buyer: { select: { name: true } },
            order: { select: { order_no: true } },
            style: { select: { style_code: true, style_name: true } },
        },
        orderBy: { created_at: "desc" },
    });

    return NextResponse.json(expenses);
}

export async function POST(req: Request) {
    const auth = await requireRole([
        "ACCOUNTANT", "SENIOR_MERCHANDISER", "PRODUCTION_MANAGER",
        "MERCHANDISER", "STORE_MANAGER",
    ]);
    if (!auth.authorized) return auth.response;

    try {
        const body = await req.json();

        // Generate expense number
        const last = await prisma.expenseRequest.findFirst({
            orderBy: { created_at: "desc" },
            select: { expense_no: true },
        });
        let nextSeq = 1;
        if (last?.expense_no) {
            const parts = last.expense_no.split("-");
            nextSeq = parseInt(parts[2] || "0", 10) + 1;
        }
        const expense_no = `EXP-2026-${String(nextSeq).padStart(4, "0")}`;

        // Look up buyer from order if not provided
        let buyer_id = body.buyer_id;
        if (!buyer_id && body.order_id) {
            const order = await prisma.order.findUnique({
                where: { id: body.order_id },
                select: { buyer_id: true },
            });
            buyer_id = order?.buyer_id;
        }

        const expense = await prisma.expenseRequest.create({
            data: {
                expense_no,
                raised_by_id: auth.user.id,
                buyer_id,
                order_id: body.order_id,
                style_id: body.style_id || null,
                expense_date: new Date(body.expense_date),
                expense_category: body.expense_category,
                job_work_type: body.job_work_type || null,
                description: body.description,
                vendor_name: body.vendor_name || null,
                vendor_id: body.vendor_id || null,
                expected_amount: body.expected_amount,
                attachment_path: body.attachment_path || null,
            },
        });

        return NextResponse.json(expense, { status: 201 });
    } catch (error) {
        console.error("Create expense error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
