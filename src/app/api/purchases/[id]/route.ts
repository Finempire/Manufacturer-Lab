import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const purchase = await prisma.purchase.findUnique({
            where: { id: params.id },
            include: {
                vendor: true,
                request: {
                    include: { manager: true, buyer: true }
                },
                payments: true,
                confirmation: true,
                lines: { include: { material: true } }
            }
        });

        if (!purchase) return NextResponse.json({ error: "Not found" }, { status: 404 });

        return NextResponse.json(purchase);

    } catch (error) {
        console.error("Fetch purchase details error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = session.user as any;
        if (user.role !== "ACCOUNTANT" && user.role !== "CEO") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        const { status, accountant_notes } = body;

        if (!status) {
            return NextResponse.json({ error: "Status is required" }, { status: 400 });
        }

        const purchase = await prisma.purchase.findUnique({ where: { id: params.id } });
        if (!purchase) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const updated = await prisma.$transaction(async (tx) => {
            const result = await tx.purchase.update({
                where: { id: params.id },
                data: {
                    status,
                    accountant_notes: accountant_notes || purchase.accountant_notes,
                },
            });

            await tx.auditLog.create({
                data: {
                    entity_type: "PURCHASE",
                    entity_id: params.id,
                    action: status === "APPROVED" ? "PURCHASE_APPROVED" : "PURCHASE_REJECTED",
                    performed_by: user.id,
                    new_state: JSON.stringify({ status, accountant_notes }),
                    ip_address: req.headers.get("x-forwarded-for") || "unknown",
                },
            });

            // Notify runner
            await tx.notification.create({
                data: {
                    user_id: purchase.runner_id,
                    title: status === "APPROVED" ? "Purchase Approved" : "Purchase Rejected",
                    message: `Your purchase ${purchase.purchase_no} has been ${status === "APPROVED" ? "approved" : "rejected"} by the accountant.${accountant_notes ? ` Notes: ${accountant_notes}` : ""}`,
                    entity_type: "PURCHASE",
                    entity_id: purchase.id,
                },
            });

            return result;
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Update purchase error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
