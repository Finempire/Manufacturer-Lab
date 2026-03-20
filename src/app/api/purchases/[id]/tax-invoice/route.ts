import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Generic invoice upload - adds files to purchase invoice_files array
export async function POST(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const userId = (session.user as any).id;
        const body = await req.json();
        const newFiles: string[] = Array.isArray(body.invoice_files) ? body.invoice_files : body.invoice_file ? [body.invoice_file] : [];

        if (newFiles.length === 0) {
            return NextResponse.json({ error: "No invoice files provided" }, { status: 400 });
        }

        const purchase = await prisma.purchase.findUnique({ where: { id: params.id } });
        if (!purchase) return NextResponse.json({ error: "Purchase not found" }, { status: 404 });

        const updatedFiles = [...(purchase.invoice_files || []), ...newFiles];

        const updated = await prisma.$transaction(async (tx) => {
            const res = await tx.purchase.update({
                where: { id: purchase.id },
                data: { invoice_files: updatedFiles },
            });

            await tx.auditLog.create({
                data: {
                    entity_type: "PURCHASE",
                    entity_id: purchase.id,
                    action: "INVOICE_FILES_UPLOADED",
                    performed_by: userId,
                    new_state: JSON.stringify({ files: newFiles }),
                },
            });

            return res;
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Invoice upload error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
