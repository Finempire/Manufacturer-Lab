import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const userId = (session.user as any).id;
        const body = await req.json();

        if (!body.tax_invoice_path) {
            return NextResponse.json({ error: "Missing tax_invoice_path" }, { status: 400 });
        }

        const purchase = await prisma.purchase.findUnique({ where: { id: params.id } });

        if (!purchase) return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
        if (purchase.runner_id !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const updated = await prisma.$transaction(async (tx) => {
            const res = await tx.purchase.update({
                where: { id: purchase.id },
                data: {
                    tax_invoice_path: body.tax_invoice_path,
                    status: "COMPLETED" // Full tax invoice + paid means completed entirely
                }
            });

            // Audit
            await tx.auditLog.create({
                data: {
                    entity_type: "PURCHASE",
                    entity_id: purchase.id,
                    action: "FINAL_TAX_INVOICE_UPLOADED",
                    performed_by: userId,
                    new_state: JSON.stringify({ path: body.tax_invoice_path, new_status: "COMPLETED" })
                }
            });

            // Notify Accountant
            const accountants = await tx.user.findMany({ where: { role: "ACCOUNTANT", is_active: true } });
            if (accountants.length > 0) {
                await tx.notification.createMany({
                    data: accountants.map(acc => ({
                        user_id: acc.id,
                        title: "Final Tax Invoice Uploaded",
                        message: `Final GST invoice received for ${purchase.purchase_no}.`,
                        entity_type: "PURCHASE",
                        entity_id: purchase.id,
                    }))
                });
            }

            return res;
        });

        return NextResponse.json(updated);

    } catch (error) {
        console.error("Tax invoice upload error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
