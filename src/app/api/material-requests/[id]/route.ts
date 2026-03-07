import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export async function GET(
    _req: Request,
    { params }: { params: { id: string } }
) {
    const auth = await requireRole([
        "ACCOUNTANT", "STORE_MANAGER", "PRODUCTION_MANAGER",
        "SAMPLE_PRODUCTION_MANAGER", "CEO",
    ]);
    if (!auth.authorized) return auth.response;

    const request = await prisma.materialRequest.findUnique({
        where: { id: params.id },
        include: {
            manager: { select: { name: true } },
            buyer: { select: { name: true } },
            order: { select: { order_no: true } },
            style: { select: { style_code: true, style_name: true } },
            preferred_vendor: { select: { name: true } },
            runner: { select: { name: true } },
            lines: {
                include: {
                    material: { select: { description: true, category: true } },
                },
            },
            purchases: {
                select: {
                    id: true,
                    purchase_no: true,
                    status: true,
                    invoice_amount: true,
                },
            },
        },
    });

    if (!request) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(request);
}
