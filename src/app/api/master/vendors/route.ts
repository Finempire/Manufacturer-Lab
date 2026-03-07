import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { createAuditLog } from "@/lib/auditLog";

export async function GET() {
    const vendors = await prisma.vendor.findMany({
        orderBy: { name: "asc" },
        include: { created_by: { select: { name: true } } },
    });
    return NextResponse.json(vendors);
}

export async function POST(req: Request) {
    const auth = await requireRole(["ACCOUNTANT", "STORE_MANAGER", "RUNNER"]);
    if (!auth.authorized) return auth.response;

    const body = await req.json();
    const { name, gstin, contact_person, phone, address, notes, created_at_stage } = body;

    if (!name) {
        return NextResponse.json({ error: "Vendor name is required" }, { status: 400 });
    }

    const vendor = await prisma.vendor.create({
        data: {
            name,
            gstin: gstin || null,
            contact_person: contact_person || null,
            phone: phone || null,
            address: address || null,
            notes: notes || null,
            created_inline: !!created_at_stage,
            created_by_user_id: auth.user.id,
            created_at_stage: created_at_stage || null,
        },
    });

    await createAuditLog({
        entityType: "VENDOR",
        entityId: vendor.id,
        action: "CREATED",
        performedBy: auth.user.id,
        newState: JSON.stringify({ name, gstin }),
    });

    return NextResponse.json(vendor, { status: 201 });
}
