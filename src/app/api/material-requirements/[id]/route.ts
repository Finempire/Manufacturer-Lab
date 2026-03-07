import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export async function GET(
    _req: Request,
    { params }: { params: { id: string } }
) {
    const auth = await requireRole([
        "ACCOUNTANT",
        "PRODUCTION_MANAGER",
        "SAMPLE_PRODUCTION_MANAGER",
        "STORE_MANAGER",
        "CEO",
    ]);
    if (!auth.authorized) return auth.response;

    const requirement = await prisma.materialRequirement.findUnique({
        where: { id: params.id },
        include: {
            order: { select: { order_no: true, order_type: true, buyer: { select: { name: true } } } },
            buyer: true,
            style: true,
            production_manager: { select: { id: true, name: true } },
            store_manager: { select: { id: true, name: true } },
            lines: true,
            requests: {
                include: {
                    runner: { select: { name: true } },
                    purchases: { select: { id: true, purchase_no: true, status: true, invoice_amount: true } },
                },
            },
        },
    });

    if (!requirement) {
        return NextResponse.json({ error: "Material requirement not found" }, { status: 404 });
    }

    return NextResponse.json(requirement);
}
