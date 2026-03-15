import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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

            case "order-aging": {
                const orders = await prisma.order.findMany({
                    where: {
                        status: { notIn: ["COMPLETED", "CANCELLED"] },
                        created_at: startDate && endDate ? dateFilter : undefined,
                    },
                    include: {
                        buyer: { select: { name: true } },
                        next_action_user: { select: { name: true } },
                    },
                    orderBy: { pending_since_at: "asc" },
                });

                const data = orders.map((o) => {
                    const pendingSince = o.pending_since_at || o.entered_stage_at || o.created_at;
                    const agingDays = Math.floor((Date.now() - new Date(pendingSince).getTime()) / 86400000);
                    return {
                        order_no: o.order_no,
                        buyer: o.buyer.name,
                        order_type: o.order_type,
                        current_stage: o.status,
                        pending_since: pendingSince.toISOString().split("T")[0],
                        aging_days: agingDays,
                        blocker: o.blocker_code || "—",
                        next_action_owner: o.next_action_user?.name || o.next_action_role || "—",
                    };
                });

                return NextResponse.json(data);
            }

            case "stage-turnaround": {
                const stages = await prisma.stageDuration.findMany({
                    where: {
                        entity_type: "order",
                        duration_hours: { not: null },
                        entered_at: startDate && endDate ? dateFilter : undefined,
                    },
                });

                // Load related orders for grouping
                const entityIds = Array.from(new Set(stages.map((s) => s.entity_id)));
                const orders = await prisma.order.findMany({
                    where: { id: { in: entityIds } },
                    select: {
                        id: true,
                        order_type: true,
                        buyer: { select: { name: true } },
                        assigned_sample_pm: { select: { name: true } },
                        assigned_production_pm: { select: { name: true } },
                    },
                });
                const orderMap = new Map(orders.map((o) => [o.id, o]));

                // Group by stage and compute averages
                const stageGroups = new Map<string, { total_hours: number; count: number; by_type: Record<string, { total: number; count: number }>; by_buyer: Record<string, { total: number; count: number }>; by_pm: Record<string, { total: number; count: number }> }>();

                stages.forEach((s) => {
                    const order = orderMap.get(s.entity_id);
                    if (!order || !s.duration_hours) return;
                    if (!stageGroups.has(s.stage)) {
                        stageGroups.set(s.stage, { total_hours: 0, count: 0, by_type: {}, by_buyer: {}, by_pm: {} });
                    }
                    const g = stageGroups.get(s.stage)!;
                    g.total_hours += s.duration_hours;
                    g.count++;

                    const typKey = order.order_type;
                    if (!g.by_type[typKey]) g.by_type[typKey] = { total: 0, count: 0 };
                    g.by_type[typKey].total += s.duration_hours;
                    g.by_type[typKey].count++;

                    const buyerName = order.buyer.name;
                    if (!g.by_buyer[buyerName]) g.by_buyer[buyerName] = { total: 0, count: 0 };
                    g.by_buyer[buyerName].total += s.duration_hours;
                    g.by_buyer[buyerName].count++;

                    const pmName = (order.assigned_production_pm?.name || order.assigned_sample_pm?.name || "Unassigned");
                    if (!g.by_pm[pmName]) g.by_pm[pmName] = { total: 0, count: 0 };
                    g.by_pm[pmName].total += s.duration_hours;
                    g.by_pm[pmName].count++;
                });

                const data: any[] = [];
                stageGroups.forEach((g, stage) => {
                    data.push({
                        stage,
                        avg_hours: Math.round((g.total_hours / g.count) * 10) / 10,
                        total_orders: g.count,
                        avg_sample: g.by_type["SAMPLE"] ? Math.round((g.by_type["SAMPLE"].total / g.by_type["SAMPLE"].count) * 10) / 10 : 0,
                        avg_production: g.by_type["PRODUCTION"] ? Math.round((g.by_type["PRODUCTION"].total / g.by_type["PRODUCTION"].count) * 10) / 10 : 0,
                    });
                });

                return NextResponse.json(data);
            }

            case "techpack-revision": {
                const techPacks = await prisma.techPack.findMany({
                    where: {
                        created_at: startDate && endDate ? dateFilter : undefined,
                    },
                    include: {
                        order: { select: { order_no: true, buyer: { select: { name: true } } } },
                        merchandiser: { select: { name: true } },
                    },
                    orderBy: { revision_count: "desc" },
                });

                const data = techPacks.map((tp) => {
                    const completionTime = tp.completed_at && tp.created_at
                        ? Math.round((new Date(tp.completed_at).getTime() - new Date(tp.created_at).getTime()) / 86400000)
                        : null;
                    return {
                        tech_pack_no: tp.tech_pack_no,
                        order: tp.order.order_no,
                        buyer: tp.order.buyer.name,
                        merchandiser: tp.merchandiser?.name || "—",
                        revision_count: tp.revision_count,
                        latest_status: tp.status,
                        completion_days: completionTime ?? "In Progress",
                    };
                });

                return NextResponse.json(data);
            }

            case "material-cycle-time": {
                const requirements = await prisma.materialRequirement.findMany({
                    where: {
                        created_at: startDate && endDate ? dateFilter : undefined,
                    },
                    include: {
                        order: { select: { order_no: true } },
                        buyer: { select: { name: true } },
                        style: { select: { style_code: true, style_name: true } },
                        requests: {
                            select: {
                                status: true,
                                purchases: {
                                    select: { status: true, created_at: true },
                                    orderBy: { created_at: "desc" },
                                    take: 1,
                                },
                            },
                        },
                    },
                    orderBy: { created_at: "desc" },
                });

                const data = requirements.map((mr) => {
                    const allCompleted = mr.status === "COMPLETED";
                    const lastPurchase = mr.requests.flatMap((r) => r.purchases).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
                    const completionDate = allCompleted && lastPurchase ? lastPurchase.created_at : null;
                    const cycleTimeDays = completionDate
                        ? Math.round((new Date(completionDate).getTime() - new Date(mr.created_at).getTime()) / 86400000)
                        : null;

                    return {
                        order_no: mr.order.order_no,
                        buyer: mr.buyer.name,
                        style: `${mr.style.style_code} — ${mr.style.style_name}`,
                        need_request_date: mr.created_at.toISOString().split("T")[0],
                        required_by: mr.required_by_date.toISOString().split("T")[0],
                        completion_date: completionDate ? completionDate.toISOString().split("T")[0] : "Pending",
                        cycle_time_days: cycleTimeDays ?? "—",
                        status: mr.status,
                    };
                });

                return NextResponse.json(data);
            }

            case "pending-provisional": {
                const purchases = await prisma.purchase.findMany({
                    where: {
                        invoice_type_submitted: "PROVISIONAL",
                        tax_invoice_path: null,
                        created_at: startDate && endDate ? dateFilter : undefined,
                    },
                    include: {
                        vendor: { select: { name: true } },
                        runner: { select: { name: true } },
                    },
                    orderBy: { invoice_date: "asc" },
                });

                const data = purchases.map((p) => {
                    const daysPending = Math.floor((Date.now() - new Date(p.invoice_date).getTime()) / 86400000);
                    return {
                        purchase_no: p.purchase_no,
                        vendor: p.vendor.name,
                        invoice_no: p.invoice_no,
                        invoice_date: p.invoice_date.toISOString().split("T")[0],
                        amount: p.invoice_amount,
                        runner: p.runner.name,
                        days_pending: daysPending,
                        status: p.status,
                    };
                });

                return NextResponse.json(data);
            }

            case "expense-approval-tat": {
                const expenses = await prisma.expenseRequest.findMany({
                    where: {
                        created_at: startDate && endDate ? dateFilter : undefined,
                        status: { in: ["APPROVED", "PAID", "COMPLETED"] },
                    },
                    include: {
                        raised_by: { select: { name: true } },
                        order: { select: { order_no: true } },
                        style: { select: { style_code: true } },
                    },
                    orderBy: { created_at: "desc" },
                });

                const data = expenses.map((e) => {
                    // Approval TAT: created_at to when status moved past PENDING_APPROVAL
                    // Use entered_stage_at as proxy for approval time; fallback to updated_at
                    const approvalTatDays = e.entered_stage_at
                        ? Math.round((new Date(e.entered_stage_at).getTime() - new Date(e.created_at).getTime()) / 86400000)
                        : null;
                    const paymentTatDays = e.payment_date
                        ? Math.round((new Date(e.payment_date).getTime() - new Date(e.created_at).getTime()) / 86400000)
                        : null;

                    return {
                        expense_no: e.expense_no,
                        requester: e.raised_by.name,
                        category: e.expense_category,
                        order_no: e.order.order_no,
                        style: e.style?.style_code || "—",
                        expected_amount: parseFloat(e.expected_amount.toString()),
                        approval_tat_days: approvalTatDays ?? "—",
                        payment_tat_days: paymentTatDays ?? "—",
                        status: e.status,
                    };
                });

                return NextResponse.json(data);
            }

            case "production-lead-time": {
                const orders = await prisma.order.findMany({
                    where: {
                        material_completed_at: { not: null },
                        created_at: startDate && endDate ? dateFilter : undefined,
                    },
                    include: {
                        buyer: { select: { name: true } },
                        assigned_sample_pm: { select: { name: true } },
                        assigned_production_pm: { select: { name: true } },
                    },
                    orderBy: { material_completed_at: "asc" },
                });

                const data = orders.map((o) => {
                    const matDate = new Date(o.material_completed_at!);
                    const prodDate = o.production_completed_at ? new Date(o.production_completed_at) : null;
                    const daysInProduction = prodDate
                        ? Math.round((prodDate.getTime() - matDate.getTime()) / 86400000)
                        : Math.round((Date.now() - matDate.getTime()) / 86400000);
                    const pm = o.assigned_production_pm?.name || o.assigned_sample_pm?.name || "—";

                    return {
                        order_no: o.order_no,
                        buyer: o.buyer.name,
                        order_type: o.order_type,
                        material_completed: matDate.toISOString().split("T")[0],
                        production_completed: prodDate ? prodDate.toISOString().split("T")[0] : "In Progress",
                        days_in_production: daysInProduction,
                        pm,
                        status: o.status,
                    };
                });

                return NextResponse.json(data);
            }

            case "shipping-risk": {
                const now = new Date();
                const orders = await prisma.order.findMany({
                    where: {
                        status: { notIn: ["COMPLETED", "CANCELLED"] },
                        shipping_date: { gte: startDate && endDate ? new Date(startDate) : undefined },
                    },
                    include: {
                        buyer: { select: { name: true } },
                    },
                    orderBy: { shipping_date: "asc" },
                });

                const data = orders.map((o) => {
                    const daysUntilShip = Math.ceil((new Date(o.shipping_date).getTime() - now.getTime()) / 86400000);
                    let risk_level: string;
                    if (daysUntilShip <= 0) risk_level = "OVERDUE";
                    else if (daysUntilShip <= 7) risk_level = "HIGH";
                    else if (daysUntilShip <= 14) risk_level = "MEDIUM";
                    else risk_level = "LOW";

                    return {
                        order_no: o.order_no,
                        buyer: o.buyer.name,
                        shipping_date: o.shipping_date.toISOString().split("T")[0],
                        days_until_ship: daysUntilShip,
                        current_stage: o.status,
                        risk_level,
                        blocker: o.blocker_code || "—",
                    };
                });

                return NextResponse.json(data);
            }

            case "audit-exception": {
                // Gather reopened orders, purchases, expenses
                const [reopenedOrders, reopenedPurchases, reopenedExpenses, rejectedPurchases, rejectedExpenses, overdueOrders, missingDocPurchases] = await Promise.all([
                    prisma.order.findMany({
                        where: { reopened_at: { not: null }, created_at: startDate && endDate ? dateFilter : undefined },
                        select: { order_no: true, reopened_at: true, reopen_reason: true, reopened_by: { select: { name: true } } },
                    }),
                    prisma.purchase.findMany({
                        where: { reopened_at: { not: null }, created_at: startDate && endDate ? dateFilter : undefined },
                        select: { purchase_no: true, reopened_at: true, reopen_reason: true, reopened_by: { select: { name: true } } },
                    }),
                    prisma.expenseRequest.findMany({
                        where: { reopened_at: { not: null }, created_at: startDate && endDate ? dateFilter : undefined },
                        select: { expense_no: true, reopened_at: true, reopen_reason: true, reopened_by: { select: { name: true } } },
                    }),
                    prisma.purchase.findMany({
                        where: { status: "REJECTED", created_at: startDate && endDate ? dateFilter : undefined },
                        select: { purchase_no: true, created_at: true, vendor: { select: { name: true } } },
                    }),
                    prisma.expenseRequest.findMany({
                        where: { status: "REJECTED", created_at: startDate && endDate ? dateFilter : undefined },
                        select: { expense_no: true, rejection_reason: true, created_at: true },
                    }),
                    prisma.order.findMany({
                        where: { overdue_flag: true, created_at: startDate && endDate ? dateFilter : undefined },
                        select: { order_no: true, overdue_reason: true, status: true },
                    }),
                    prisma.purchase.findMany({
                        where: {
                            invoice_type_submitted: "PROVISIONAL",
                            tax_invoice_path: null,
                            status: { in: ["PAID", "PAID_PENDING_TAX_INVOICE"] },
                            created_at: startDate && endDate ? dateFilter : undefined,
                        },
                        select: { purchase_no: true, vendor: { select: { name: true } }, invoice_date: true },
                    }),
                ]);

                const data: any[] = [];

                reopenedOrders.forEach((o) => data.push({ type: "Reopened Order", reference: o.order_no, date: o.reopened_at?.toISOString().split("T")[0], reason: o.reopen_reason || "—", by: o.reopened_by?.name || "—" }));
                reopenedPurchases.forEach((p) => data.push({ type: "Reopened Purchase", reference: p.purchase_no, date: p.reopened_at?.toISOString().split("T")[0], reason: p.reopen_reason || "—", by: p.reopened_by?.name || "—" }));
                reopenedExpenses.forEach((e) => data.push({ type: "Reopened Expense", reference: e.expense_no, date: e.reopened_at?.toISOString().split("T")[0], reason: e.reopen_reason || "—", by: e.reopened_by?.name || "—" }));
                rejectedPurchases.forEach((p) => data.push({ type: "Rejected Purchase", reference: p.purchase_no, date: p.created_at.toISOString().split("T")[0], reason: "Rejected", by: p.vendor.name }));
                rejectedExpenses.forEach((e) => data.push({ type: "Rejected Expense", reference: e.expense_no, date: e.created_at.toISOString().split("T")[0], reason: e.rejection_reason || "—", by: "—" }));
                overdueOrders.forEach((o) => data.push({ type: "Overdue Order", reference: o.order_no, date: "—", reason: o.overdue_reason || "—", by: o.status }));
                missingDocPurchases.forEach((p) => data.push({ type: "Missing Tax Invoice", reference: p.purchase_no, date: p.invoice_date.toISOString().split("T")[0], reason: "Provisional without tax invoice", by: p.vendor.name }));

                return NextResponse.json(data);
            }

            case "runner-performance-v2": {
                const runners = await prisma.user.findMany({
                    where: { role: "RUNNER", is_active: true },
                    include: {
                        assigned_requests: {
                            where: { created_at: startDate && endDate ? dateFilter : undefined },
                            include: {
                                purchases: {
                                    select: {
                                        status: true,
                                        invoice_type_submitted: true,
                                        tax_invoice_path: true,
                                        created_at: true,
                                        updated_at: true,
                                    },
                                },
                            },
                        },
                    },
                });

                const data = runners.map((r) => {
                    const allPurchases = r.assigned_requests.flatMap((req) => req.purchases);
                    const assigned = allPurchases.length;
                    const accepted = allPurchases.filter((p) => p.status !== "PENDING_PURCHASE" && p.status !== "REJECTED" && p.status !== "CANCELLED").length;
                    const completed = allPurchases.filter((p) => p.status === "COMPLETED" || p.status === "PAID").length;
                    const rejected = allPurchases.filter((p) => p.status === "REJECTED").length;
                    const provisionalPendingTax = allPurchases.filter((p) => p.invoice_type_submitted === "PROVISIONAL" && !p.tax_invoice_path).length;

                    // Average completion time in days (created_at to updated_at for completed)
                    const completedPurchases = allPurchases.filter((p) => p.status === "COMPLETED" || p.status === "PAID");
                    const avgCompletionDays = completedPurchases.length > 0
                        ? Math.round(completedPurchases.reduce((sum, p) => sum + (new Date(p.updated_at).getTime() - new Date(p.created_at).getTime()) / 86400000, 0) / completedPurchases.length * 10) / 10
                        : 0;

                    return {
                        runner_name: r.name,
                        assigned,
                        accepted,
                        completed,
                        rejected,
                        provisional_pending_tax: provisionalPendingTax,
                        avg_completion_days: avgCompletionDays,
                    };
                }).filter((r) => r.assigned > 0);

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
