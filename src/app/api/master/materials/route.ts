import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { createAuditLog } from "@/lib/auditLog";

export async function GET() {
    const materials = await prisma.material.findMany({
        orderBy: { description: "asc" },
        include: { created_by: { select: { name: true } } },
    });
    return NextResponse.json(materials);
}

export async function POST(req: Request) {
    const auth = await requireRole(["ACCOUNTANT", "STORE_MANAGER"]);
    if (!auth.authorized) return auth.response;

    const body = await req.json();
    const { sku_code, description, category, unit_of_measure, default_rate } = body;

    if (!description || !category || !unit_of_measure) {
        return NextResponse.json({ error: "Description, category, and UOM are required" }, { status: 400 });
    }

    const material = await prisma.material.create({
        data: {
            sku_code: sku_code || null,
            description,
            category,
            unit_of_measure,
            default_rate: default_rate ? parseFloat(default_rate) : null,
            created_by_user_id: auth.user.id,
        },
    });

    await createAuditLog({
        entityType: "MATERIAL",
        entityId: material.id,
        action: "CREATED",
        performedBy: auth.user.id,
        newState: JSON.stringify({ description, category }),
    });

    return NextResponse.json(material, { status: 201 });
}
