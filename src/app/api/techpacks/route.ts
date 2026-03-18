import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { createAuditLog } from "@/lib/auditLog";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    const auth = await requireRole([
        "ACCOUNTANT",
        "SENIOR_MERCHANDISER",
        "PRODUCTION_MANAGER",
        "MERCHANDISER",
        "CEO",
    ]);
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("order_id");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (orderId) where.order_id = orderId;

    const role = auth.user.role;
    if (role === "MERCHANDISER") {
        where.merchandiser_id = auth.user.id;
    } else if (role === "SENIOR_MERCHANDISER") {
        where.order = { order_type: "SAMPLE" };
    } else if (role === "PRODUCTION_MANAGER") {
        where.order = { order_type: "PRODUCTION" };
    }

    const techPacks = await prisma.techPack.findMany({
        where,
        include: {
            order: { select: { order_no: true, order_type: true, buyer: { select: { name: true } } } },
            merchandiser: { select: { id: true, name: true } },
        },
        orderBy: { created_at: "desc" },
    });

    return NextResponse.json(techPacks);
}

export async function POST(req: Request) {
    const auth = await requireRole(["PRODUCTION_MANAGER", "SENIOR_MERCHANDISER", "ACCOUNTANT"]);
    if (!auth.authorized) return auth.response;

    try {
        const body = await req.json();
        const { order_id, merchandiser_id, fabric_details, trim_details, measurements, construction_notes } = body;

        if (!order_id) {
            return NextResponse.json({ error: "order_id is required" }, { status: 400 });
        }

        // Generate tech pack number
        const year = new Date().getFullYear();
        const lastTP = await prisma.techPack.findFirst({
            where: { tech_pack_no: { startsWith: `TP-${year}-` } },
            orderBy: { created_at: "desc" },
        });
        let nextNum = 1;
        if (lastTP) {
            const parsed = parseInt(lastTP.tech_pack_no.split("-")[2]);
            if (!isNaN(parsed)) nextNum = parsed + 1;
        }
        const tech_pack_no = `TP-${year}-${String(nextNum).padStart(4, "0")}`;

        const techPack = await prisma.techPack.create({
            data: {
                tech_pack_no,
                order_id,
                merchandiser_id: merchandiser_id || null,
                fabric_details: fabric_details || null,
                trim_details: trim_details || null,
                measurements: measurements || null,
                construction_notes: construction_notes || null,
                status: merchandiser_id ? "PENDING_MERCH_ACCEPTANCE" : "PENDING_PM_ACCEPTANCE",
            },
        });

        await createAuditLog({
            entityType: "TECHPACK",
            entityId: techPack.id,
            action: "CREATED",
            performedBy: auth.user.id,
            newState: JSON.stringify({ tech_pack_no, order_id }),
        });

        // Notify merchandiser if assigned
        if (merchandiser_id) {
            await prisma.notification.create({
                data: {
                    user_id: merchandiser_id,
                    title: "Tech Pack Assigned",
                    message: `Tech Pack ${tech_pack_no} has been assigned to you.`,
                    entity_type: "TECHPACK",
                    entity_id: techPack.id,
                },
            });
        }

        return NextResponse.json(techPack, { status: 201 });
    } catch (error) {
        console.error("Create tech pack error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
