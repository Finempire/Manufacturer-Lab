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
        "CEO",
    ]);
    if (!auth.authorized) return auth.response;

    const techPack = await prisma.techPack.findUnique({
        where: { id: params.id },
        include: {
            order: { include: { buyer: true } },
            merchandiser: { select: { id: true, name: true } },
            revisions: {
                include: {
                    submitted_by: { select: { name: true } },
                    reviewed_by: { select: { name: true } },
                },
                orderBy: { revision_number: "desc" },
            },
        },
    });

    if (!techPack) {
        return NextResponse.json({ error: "Tech pack not found" }, { status: 404 });
    }

    // RBAC: merchandiser can only see their own
    if (auth.user.role === "MERCHANDISER" && techPack.merchandiser_id !== auth.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(techPack);
}

export async function PUT(
    req: Request,
    { params }: { params: { id: string } }
) {
    const auth = await requireRole(["MERCHANDISER", "PRODUCTION_MANAGER", "SAMPLE_PRODUCTION_MANAGER", "ACCOUNTANT"]);
    if (!auth.authorized) return auth.response;

    try {
        const body = await req.json();
        const { fabric_details, trim_details, measurements, construction_notes, merchandiser_id } = body;

        const techPack = await prisma.techPack.findUnique({ where: { id: params.id } });
        if (!techPack) {
            return NextResponse.json({ error: "Tech pack not found" }, { status: 404 });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData: Record<string, any> = {};
        if (fabric_details !== undefined) updateData.fabric_details = fabric_details;
        if (trim_details !== undefined) updateData.trim_details = trim_details;
        if (measurements !== undefined) updateData.measurements = measurements;
        if (construction_notes !== undefined) updateData.construction_notes = construction_notes;
        if (merchandiser_id !== undefined) updateData.merchandiser_id = merchandiser_id;

        const updated = await prisma.techPack.update({
            where: { id: params.id },
            data: updateData,
        });

        await createAuditLog({
            entityType: "TECHPACK",
            entityId: updated.id,
            action: "UPDATED",
            performedBy: auth.user.id,
            newState: JSON.stringify(updateData),
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Update tech pack error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
