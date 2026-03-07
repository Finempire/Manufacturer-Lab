import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const userRole = (session.user as any).role;
        if (userRole !== "ACCOUNTANT" && userRole !== "CEO") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const styleFilter = searchParams.get("styleId");

        let dateFilter: any = {};
        if (startDate && endDate) {
            dateFilter = {
                gte: new Date(startDate),
                lte: new Date(endDate + 'T23:59:59Z')
            };
        }

        switch (type) {
            case "daily-petty-cash": {
                const payments = await prisma.payment.findMany({
                    where: { payment_date: startDate && endDate ? dateFilter : undefined },
                    include: { purchase: { include: { request: true } } },
                    orderBy: { payment_date: "asc" }
                });

                const expenses = await prisma.expenseRequest.findMany({
                    where: { payment_date: startDate && endDate ? dateFilter : undefined, status: "PAID" },
                    orderBy: { payment_date: "asc" }
                });

                return NextResponse.json({ payments, expenses });
            }

            case "vendor-wise": {
                const vendors = await prisma.vendor.findMany({
                    include: {
                        purchases: {
                            where: { created_at: startDate && endDate ? dateFilter : undefined },
                            include: {
                                request: {
                                    include: {
                                        lines: { include: { style: true } }
                                    }
                                }
                            }
                        }
                    }
                });

                const data = vendors.map(v => {
                    const totalPurchases = v.purchases.length;
                    const amount = v.purchases.reduce((sum: number, p: any) => sum + parseFloat(p.invoice_amount.toString()), 0);
                    const pendingTax = v.purchases.filter((p: any) => !p.tax_invoice_path && p.invoice_type_submitted === 'PROVISIONAL').length;

                    // Collect unique styles
                    const styleSet = new Set<string>();
                    v.purchases.forEach((p: any) => {
                        p.request?.lines?.forEach((l: any) => {
                            if (l.style) styleSet.add(l.style.style_code);
                        });
                    });

                    return {
                        vendor_name: v.name,
                        styles: Array.from(styleSet).join(", ") || "—",
                        total_invoices: totalPurchases,
                        amount: amount,
                        avg_value: totalPurchases > 0 ? amount / totalPurchases : 0,
                        pending_tax_invoices: pendingTax
                    };
                }).filter(v => v.amount > 0);

                return NextResponse.json(data);
            }

            case "cogs": {
                const orders = await prisma.order.findMany({
                    where: { created_at: startDate && endDate ? dateFilter : undefined },
                    include: {
                        buyer: true,
                        lines: { include: { style: true } },
                        material_requests: {
                            include: {
                                purchases: { select: { invoice_amount: true, status: true } },
                                lines: { include: { style: true, material: true } }
                            }
                        },
                        expenses: {
                            where: { status: { in: ["PAID", "COMPLETED"] } },
                            select: { actual_amount: true, expected_amount: true }
                        }
                    }
                });

                const data: any[] = [];
                orders.forEach(o => {
                    // Group material request lines by style
                    const styleMap = new Map<string, { style_code: string; style_name: string; materials: { name: string; qty: number; rate: number; cost: number }[] }>();

                    o.material_requests.forEach((mr: any) => {
                        mr.lines.forEach((l: any) => {
                            const styleKey = l.style?.id || "general";
                            if (!styleMap.has(styleKey)) {
                                styleMap.set(styleKey, {
                                    style_code: l.style?.style_code || "General",
                                    style_name: l.style?.style_name || "No Style",
                                    materials: []
                                });
                            }
                            styleMap.get(styleKey)!.materials.push({
                                name: l.material?.description || "—",
                                qty: l.quantity,
                                rate: l.expected_rate,
                                cost: l.expected_amount
                            });
                        });
                    });

                    const materialCost = o.material_requests.flatMap((mr: any) => mr.purchases)
                        .reduce((sum: number, p: any) => sum + parseFloat(p.invoice_amount.toString()), 0);

                    const expenseCost = o.expenses
                        .reduce((sum: number, e: any) => sum + parseFloat((e.actual_amount || e.expected_amount).toString()), 0);

                    // If style filter applied, only include matching
                    const styleEntries = Array.from(styleMap.entries());
                    const matchingStyles = styleFilter
                        ? styleEntries.filter(([key]) => key === styleFilter)
                        : styleEntries;

                    if (matchingStyles.length > 0) {
                        matchingStyles.forEach(([, sv]) => {
                            const styleCost = sv.materials.reduce((sum, m) => sum + m.cost, 0);
                            data.push({
                                buyer: o.buyer.name,
                                order_no: o.order_no,
                                style: `${sv.style_code} — ${sv.style_name}`,
                                material_cost: styleCost,
                                expense_cost: expenseCost,
                                total_cost: styleCost + expenseCost
                            });
                        });
                    } else if (!styleFilter) {
                        data.push({
                            buyer: o.buyer.name,
                            order_no: o.order_no,
                            style: "—",
                            material_cost: materialCost,
                            expense_cost: expenseCost,
                            total_cost: materialCost + expenseCost
                        });
                    }
                });

                return NextResponse.json(data.filter(d => d.total_cost > 0));
            }

            case "runner-performance": {
                const runners = await prisma.user.findMany({
                    where: { role: "RUNNER", is_active: true },
                    include: {
                        assigned_requests: {
                            include: { purchases: { include: { confirmation: true } } },
                            where: { created_at: startDate && endDate ? dateFilter : undefined }
                        }
                    }
                });

                const data = runners.map(r => {
                    const requests = r.assigned_requests;
                    let trips = 0;
                    let amountHandled = 0;
                    let pendingConfirmations = 0;
                    let pendingTax = 0;

                    requests.forEach((req: any) => {
                        req.purchases.forEach((p: any) => {
                            trips++;
                            amountHandled += parseFloat(p.invoice_amount.toString());
                            if (p.confirmation?.status === 'NOT_CONFIRMED') pendingConfirmations++;
                            if (p.invoice_type_submitted === 'PROVISIONAL' && !p.tax_invoice_path) pendingTax++;
                        });
                    });

                    return {
                        runner_name: r.name,
                        trips: trips,
                        amount_handled: amountHandled,
                        avg_handled: trips > 0 ? amountHandled / trips : 0,
                        pending_confirmations: pendingConfirmations,
                        pending_tax_uploads: pendingTax
                    };
                }).filter(r => r.trips > 0);

                return NextResponse.json(data);
            }

            case "expense-report": {
                const expenses = await prisma.expenseRequest.findMany({
                    where: { created_at: startDate && endDate ? dateFilter : undefined },
                    include: { buyer: true, order: true, vendor: true, raised_by: true },
                    orderBy: { created_at: "desc" }
                });

                const data = expenses.map(e => ({
                    buyer: e.buyer.name,
                    order_no: e.order.order_no,
                    category: e.expense_category,
                    description: e.description,
                    vendor_payee: e.vendor?.name || e.vendor_name || "-",
                    expected: parseFloat(e.expected_amount.toString()),
                    actual: e.actual_amount ? parseFloat(e.actual_amount.toString()) : 0,
                    method: e.payment_method || "-",
                    raised_by: e.raised_by.name,
                    status: e.status,
                    date: e.expense_date
                }));

                return NextResponse.json(data);
            }

            case "style-wise": {
                // Style-Wise Material Cost Report
                const materialRequestLines = await prisma.materialRequestLine.findMany({
                    where: {
                        style_id: styleFilter ? styleFilter : { not: null },
                        request: {
                            created_at: startDate && endDate ? dateFilter : undefined
                        }
                    },
                    include: {
                        style: true,
                        material: true,
                        request: {
                            include: {
                                buyer: true,
                                order: true,
                                purchases: { select: { invoice_amount: true, status: true, created_at: true } }
                            }
                        }
                    }
                });

                const data = materialRequestLines
                    .filter(l => l.style)
                    .map(l => {
                        const purchaseTotal = l.request.purchases.reduce((sum: number, p: any) => sum + parseFloat(p.invoice_amount.toString()), 0);
                        const latestPurchase = l.request.purchases.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

                        return {
                            style_code: l.style!.style_code,
                            style_name: l.style!.style_name,
                            buyer: l.request.buyer.name,
                            order_no: l.request.order.order_no,
                            material: l.material.description,
                            qty_purchased: l.quantity,
                            rate: l.expected_rate,
                            total_cost: l.expected_amount,
                            purchase_date: latestPurchase?.created_at || l.request.created_at,
                            status: l.request.purchases.length > 0 ? "PURCHASED" : "PENDING"
                        };
                    });

                return NextResponse.json(data);
            }

            default:
                return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
        }

    } catch (error) {
        console.error("Reports API Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
