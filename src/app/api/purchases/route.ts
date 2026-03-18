import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = session.user as any;
        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: any = {};

        if (status) where.status = status;

        // Role-based filtering - Runner, PM, Senior Merch, Merch see only their own purchases
        if (["RUNNER", "PRODUCTION_MANAGER", "SENIOR_MERCHANDISER", "MERCHANDISER"].includes(user.role)) {
            where.runner_id = user.id;
        }

        const purchases = await prisma.purchase.findMany({
            where,
            include: {
                vendor: { select: { name: true } },
                runner: { select: { name: true } },
                request: {
                    select: {
                        request_no: true,
                        manager: { select: { name: true } },
                        buyer: { select: { name: true } },
                    },
                },
                lines: { include: { material: true } },
            },
            orderBy: { created_at: "desc" },
        });

        return NextResponse.json(purchases);
    } catch (error) {
        console.error("Fetch purchases error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const userId = (session.user as any).id;
        const body = await req.json();

        // Basic validation
        const {
            request_id,
            vendor_id,
            invoice_no,
            invoice_date,
            invoice_amount,
            invoice_type_submitted,
            provisional_invoice_path,
            tax_invoice_path,
            lines,
        } = body;

        if (!request_id || !vendor_id || !invoice_no || !invoice_date || !invoice_amount || !invoice_type_submitted) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Generate unique purchase number (PUR-YYYY-0001)
        const year = new Date().getFullYear();
        const lastPurchase = await prisma.purchase.findFirst({
            where: { purchase_no: { startsWith: `PUR-${year}-` } },
            orderBy: { created_at: "desc" }
        });

        let nextNum = 1;
        if (lastPurchase) {
            const lastNum = parseInt(lastPurchase.purchase_no.split("-")[2]);
            if (!isNaN(lastNum)) nextNum = lastNum + 1;
        }
        const purchase_no = `PUR-${year}-${nextNum.toString().padStart(4, "0")}`;

        // Create the purchase, its lines, and update the associated request status
        const purchase = await prisma.$transaction(async (tx) => {
            // 1. Create Purchase
            const newPurchase = await tx.purchase.create({
                data: {
                    purchase_no,
                    request_id,
                    runner_id: userId,
                    vendor_id,
                    invoice_no,
                    invoice_date: new Date(invoice_date),
                    invoice_amount,
                    invoice_type_submitted,
                    provisional_invoice_path: provisional_invoice_path || null,
                    tax_invoice_path: tax_invoice_path || null,
                    status: "INVOICE_SUBMITTED",
                    lines: {
                        create: lines.map((l: any) => ({
                            material_id: l.material_id,
                            quantity: l.quantity,
                            rate: l.rate,
                            amount: l.amount
                        }))
                    }
                }
            });

            // 2. Update Request Status
            await tx.materialRequest.update({
                where: { id: request_id },
                data: { status: "INVOICE_SUBMITTED" }
            });

            // 3. Create Audit Log
            await tx.auditLog.create({
                data: {
                    entity_type: "PURCHASE",
                    entity_id: newPurchase.id,
                    action: "INVOICE_UPLOADED",
                    performed_by: userId,
                    new_state: JSON.stringify({ invoice_no, invoice_amount, type: invoice_type_submitted }),
                    ip_address: req.headers.get("x-forwarded-for") || "unknown"
                }
            });

            // 4. Create Notification for Accountant
            const accountants = await tx.user.findMany({ where: { role: "ACCOUNTANT", is_active: true } });
            if (accountants.length > 0) {
                await tx.notification.createMany({
                    data: accountants.map(acc => ({
                        user_id: acc.id,
                        title: "Invoice Uploaded",
                        message: `Invoice uploaded for ${purchase_no} by Runner. ₹${invoice_amount} awaiting review.`,
                        entity_type: "PURCHASE",
                        entity_id: newPurchase.id,
                    }))
                });
            }

            return newPurchase;
        });

        return NextResponse.json(purchase, { status: 201 });

    } catch (error) {
        console.error("Create purchase error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
