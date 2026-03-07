import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const userId = (session.user as any).id;
        const body = await req.json();

        // Security check: Only the assigned runner should confirm
        const purchase = await prisma.purchase.findUnique({
            where: { id: params.id },
            include: { confirmation: true }
        });

        if (!purchase) return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
        if (purchase.runner_id !== userId) return NextResponse.json({ error: "Forbidden: Not your assignment" }, { status: 403 });

        const confirm = await prisma.$transaction(async (tx) => {
            const result = await tx.vendorConfirmation.update({
                where: { purchase_id: purchase.id },
                data: {
                    status: "SHOWN_TO_VENDOR",
                    shown_to_vendor_at: new Date(),
                    runner_remark: body.remark || null
                }
            });

            // Action Log
            await tx.auditLog.create({
                data: {
                    entity_type: "VENDOR_CONFIRMATION",
                    entity_id: result.id,
                    action: "MARKED_SHOWN_TO_VENDOR",
                    performed_by: userId,
                    new_state: JSON.stringify({ remark: body.remark })
                }
            });

            return result;
        });

        return NextResponse.json(confirm);

    } catch (error) {
        console.error("Vendor confirmation error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
