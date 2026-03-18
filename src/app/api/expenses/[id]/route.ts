import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export async function GET(
    _req: Request,
    { params }: { params: { id: string } }
) {
    const auth = await requireRole([
        "ACCOUNTANT", "SENIOR_MERCHANDISER", "PRODUCTION_MANAGER",
        "STORE_MANAGER", "CEO",
    ]);
    if (!auth.authorized) return auth.response;

    const expense = await prisma.expenseRequest.findUnique({
        where: { id: params.id },
        include: {
            raised_by: { select: { name: true } },
            buyer: { select: { name: true } },
            order: { select: { order_no: true } },
            style: { select: { style_code: true, style_name: true } },
        },
    });

    if (!expense) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(expense);
}

export async function PUT(
    req: Request,
    { params }: { params: { id: string } }
) {
    const auth = await requireRole(["ACCOUNTANT", "CEO"]);
    if (!auth.authorized) return auth.response;

    try {
        const body = await req.json();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData: Record<string, any> = {};
        if (body.status) updateData.status = body.status;
        if (body.accountant_notes !== undefined) updateData.accountant_notes = body.accountant_notes;
        if (body.rejection_reason) updateData.rejection_reason = body.rejection_reason;
        if (body.actual_amount !== undefined) updateData.actual_amount = body.actual_amount;
        if (body.payment_method) updateData.payment_method = body.payment_method;
        if (body.payment_reference) updateData.payment_reference = body.payment_reference;
        if (body.payment_proof_path) updateData.payment_proof_path = body.payment_proof_path;
        if (body.payment_date) updateData.payment_date = new Date(body.payment_date);

        const expense = await prisma.expenseRequest.update({
            where: { id: params.id },
            data: updateData,
        });

        return NextResponse.json(expense);
    } catch (error) {
        console.error("Update expense error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
