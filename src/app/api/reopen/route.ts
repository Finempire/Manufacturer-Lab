import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAuditLog } from "@/lib/auditLog";

export const dynamic = "force-dynamic";

const VALID_ENTITY_TYPES = ["purchase", "expense", "tech_pack", "order"] as const;
type EntityType = (typeof VALID_ENTITY_TYPES)[number];

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = session.user as any;

    if (user.role !== "ACCOUNTANT") {
        return NextResponse.json(
            { error: "Forbidden: Only accountants can reopen entities" },
            { status: 403 }
        );
    }

    try {
        const body = await req.json();
        const { entity_type, entity_id, reason, reopen_to_status } = body;

        if (!entity_type || !VALID_ENTITY_TYPES.includes(entity_type)) {
            return NextResponse.json(
                { error: "Invalid entity_type. Must be one of: purchase, expense, tech_pack, order" },
                { status: 400 }
            );
        }

        if (!entity_id) {
            return NextResponse.json(
                { error: "entity_id is required" },
                { status: 400 }
            );
        }

        if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
            return NextResponse.json(
                { error: "A non-empty reason is required to reopen an entity" },
                { status: 400 }
            );
        }

        if (!reopen_to_status) {
            return NextResponse.json(
                { error: "reopen_to_status is required" },
                { status: 400 }
            );
        }

        const trimmedReason = reason.trim();
        const now = new Date();
        let previousStatus: string;

        switch (entity_type as EntityType) {
            case "purchase": {
                const existing = await prisma.purchase.findUnique({
                    where: { id: entity_id },
                    select: { status: true, exception_flags: true },
                });
                if (!existing) {
                    return NextResponse.json(
                        { error: "Purchase not found" },
                        { status: 404 }
                    );
                }
                previousStatus = existing.status;
                const purchaseFlags = existing.exception_flags.includes("REOPENED_ITEM")
                    ? existing.exception_flags
                    : [...existing.exception_flags, "REOPENED_ITEM" as const];

                await prisma.purchase.update({
                    where: { id: entity_id },
                    data: {
                        status: reopen_to_status,
                        reopened_at: now,
                        reopened_by_id: user.id,
                        reopen_reason: trimmedReason,
                        exception_flags: { set: purchaseFlags },
                    },
                });
                break;
            }

            case "expense": {
                const existing = await prisma.expenseRequest.findUnique({
                    where: { id: entity_id },
                    select: { status: true, exception_flags: true },
                });
                if (!existing) {
                    return NextResponse.json(
                        { error: "Expense request not found" },
                        { status: 404 }
                    );
                }
                previousStatus = existing.status;
                const expenseFlags = existing.exception_flags.includes("REOPENED_ITEM")
                    ? existing.exception_flags
                    : [...existing.exception_flags, "REOPENED_ITEM" as const];

                await prisma.expenseRequest.update({
                    where: { id: entity_id },
                    data: {
                        status: reopen_to_status,
                        reopened_at: now,
                        reopened_by_id: user.id,
                        reopen_reason: trimmedReason,
                        exception_flags: { set: expenseFlags },
                    },
                });
                break;
            }

            case "tech_pack": {
                const existing = await prisma.techPack.findUnique({
                    where: { id: entity_id },
                    select: { status: true, exception_flags: true },
                });
                if (!existing) {
                    return NextResponse.json(
                        { error: "Tech pack not found" },
                        { status: 404 }
                    );
                }
                previousStatus = existing.status;
                const techPackFlags = existing.exception_flags.includes("REOPENED_ITEM")
                    ? existing.exception_flags
                    : [...existing.exception_flags, "REOPENED_ITEM" as const];

                await prisma.techPack.update({
                    where: { id: entity_id },
                    data: {
                        status: reopen_to_status,
                        reopened_at: now,
                        reopened_by_id: user.id,
                        reopen_reason: trimmedReason,
                        exception_flags: { set: techPackFlags },
                    },
                });
                break;
            }

            case "order": {
                const existing = await prisma.order.findUnique({
                    where: { id: entity_id },
                    select: { status: true, exception_flags: true },
                });
                if (!existing) {
                    return NextResponse.json(
                        { error: "Order not found" },
                        { status: 404 }
                    );
                }
                previousStatus = existing.status;
                const orderFlags = existing.exception_flags.includes("REOPENED_ITEM")
                    ? existing.exception_flags
                    : [...existing.exception_flags, "REOPENED_ITEM" as const];

                await prisma.order.update({
                    where: { id: entity_id },
                    data: {
                        status: reopen_to_status,
                        reopened_at: now,
                        reopened_by_id: user.id,
                        reopen_reason: trimmedReason,
                        exception_flags: { set: orderFlags },
                    },
                });
                break;
            }
        }

        await createAuditLog({
            entityType: entity_type,
            entityId: entity_id,
            action: "REOPEN",
            performedBy: user.id,
            previousState: previousStatus!,
            newState: reopen_to_status,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Reopen error:", error);
        return NextResponse.json(
            { error: "Failed to reopen entity" },
            { status: 500 }
        );
    }
}
