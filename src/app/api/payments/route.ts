import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrderIdFromPurchase, recalculateOrderCost } from "@/lib/costTracker";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const userId = (session.user as any).id;
        const userRole = (session.user as any).role;

        if (userRole !== "ACCOUNTANT" && userRole !== "CEO") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();

        // Validation
        const {
            purchase_id,
            payment_method,
            payment_date,
            amount_paid,
            reference_id,
            payment_proof_path,
            notes,
        } = body;

        if (!purchase_id || !payment_method || !payment_date || !amount_paid || !payment_proof_path) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Fetch the purchase to determine status mapping
        const purchase = await prisma.purchase.findUnique({
            where: { id: purchase_id }
        });

        if (!purchase) {
            return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
        }

        // Calculate new status
        // Spec: paid == invoice -> PAID, paid < invoice -> PARTIALLY_PAID. If PROVISIONAL -> PAID_PENDING_TAX_INVOICE.
        const parsedPaid = parseFloat(amount_paid);
        const floatInvoiceAmt = parseFloat(purchase.invoice_amount.toString());

        // This is a simplified check, typically you'd aggregate all payments for a purchase.
        let newStatus = "PAID";
        if (parsedPaid < floatInvoiceAmt) {
            newStatus = "PARTIALLY_PAID";
        } else if (purchase.invoice_type_submitted === "PROVISIONAL") {
            newStatus = "PAID_PENDING_TAX_INVOICE";
        }

        const payment = await prisma.$transaction(async (tx) => {
            // 1. Record the Payment
            const newPayment = await tx.payment.create({
                data: {
                    purchase_id,
                    accountant_id: userId,
                    payment_date: new Date(payment_date),
                    payment_method,
                    amount_paid: parsedPaid,
                    reference_id: reference_id || null,
                    payment_proof_path,
                    notes: notes || null
                }
            });

            // 2. Update Purchase Status
            const updatedPur = await tx.purchase.update({
                where: { id: purchase_id },
                data: { status: newStatus as any }
            });

            // 3. Create or Update VendorConfirmation if Paid
            const runner = await tx.user.findUnique({ where: { id: purchase.runner_id } });
            if (newStatus === "PAID" || newStatus === "PAID_PENDING_TAX_INVOICE") {
                await tx.vendorConfirmation.upsert({
                    where: { purchase_id },
                    update: { status: "NOT_CONFIRMED" },
                    create: {
                        purchase_id,
                        runner_id: purchase.runner_id,
                        status: "NOT_CONFIRMED",
                    }
                });
            }

            // 4. Create Audit Log
            await tx.auditLog.create({
                data: {
                    entity_type: "PAYMENT",
                    entity_id: newPayment.id,
                    action: "PAYMENT_RECORDED",
                    performed_by: userId,
                    new_state: JSON.stringify({ amount_paid, payment_method, purchase_status: newStatus }),
                    ip_address: req.headers.get("x-forwarded-for") || "unknown"
                }
            });

            // 5. Notify Runner
            if (runner) {
                await tx.notification.create({
                    data: {
                        user_id: runner.id,
                        title: "Payment Completed",
                        message: `Payment ₹${amount_paid} done for ${purchase.purchase_no}. Show proof to vendor.`,
                        entity_type: "PURCHASE",
                        entity_id: purchase_id,
                    }
                });
            }

            return updatedPur; // returning the updated purchase
        });

        // Recalculate cost summary for the linked order
        const orderId = await getOrderIdFromPurchase(purchase_id);
        if (orderId) {
            recalculateOrderCost(orderId).catch(console.error);
        }

        return NextResponse.json(payment, { status: 201 });

    } catch (error) {
        console.error("Record payment error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
