import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface ActionItem {
    id: string;
    type: "order" | "purchase" | "expense" | "tech_pack" | "material_req" | "material_request" | "confirmation";
    title: string;
    subtitle: string;
    action: string;
    href: string;
    priority: "high" | "medium" | "low";
    pending_since: string;
    days_pending: number;
}

function daysSince(date: Date): number {
    return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

function priority(days: number): "high" | "medium" | "low" {
    if (days >= 3) return "high";
    if (days >= 1) return "medium";
    return "low";
}

async function getAccountantActions(): Promise<ActionItem[]> {
    const items: ActionItem[] = [];

    const [pendingPurchases, pendingPayments, pendingExpenses, unassignedOrders] = await Promise.all([
        prisma.purchase.findMany({
            where: { status: "INVOICE_SUBMITTED" },
            include: { vendor: { select: { name: true } }, request: { select: { request_no: true, order: { select: { order_no: true } } } } },
            orderBy: { created_at: "asc" },
            take: 20,
        }),
        prisma.purchase.findMany({
            where: { status: { in: ["APPROVED", "PARTIALLY_PAID"] } },
            include: { vendor: { select: { name: true } } },
            orderBy: { created_at: "asc" },
            take: 20,
        }),
        prisma.expenseRequest.findMany({
            where: { status: "PENDING_APPROVAL" },
            include: { raised_by: { select: { name: true } }, order: { select: { order_no: true } } },
            orderBy: { created_at: "asc" },
            take: 20,
        }),
        prisma.order.findMany({
            where: { status: "ORDER_RECEIVED", assigned_merchandiser_id: null },
            include: { buyer: { select: { name: true } } },
            orderBy: { created_at: "asc" },
            take: 10,
        }),
    ]);

    for (const p of pendingPurchases) {
        const days = daysSince(p.created_at);
        items.push({
            id: p.id, type: "purchase",
            title: `Review Purchase — ${p.vendor.name}`,
            subtitle: p.request?.order?.order_no || p.request?.request_no || "",
            action: "Approve / Reject",
            href: `/dashboard/accountant/purchases-review`,
            priority: priority(days),
            pending_since: p.created_at.toISOString(),
            days_pending: days,
        });
    }

    for (const p of pendingPayments) {
        const days = daysSince(p.created_at);
        items.push({
            id: p.id, type: "purchase",
            title: `Payment Due — ${p.vendor.name}`,
            subtitle: `₹${p.invoice_amount.toLocaleString("en-IN")}`,
            action: "Make Payment",
            href: `/dashboard/accountant/payments`,
            priority: priority(days),
            pending_since: p.created_at.toISOString(),
            days_pending: days,
        });
    }

    for (const e of pendingExpenses) {
        const days = daysSince(e.created_at);
        items.push({
            id: e.id, type: "expense",
            title: `Expense Approval — ${e.expense_no}`,
            subtitle: `${e.raised_by.name} • ${e.order?.order_no || ""}`,
            action: "Approve / Reject",
            href: `/dashboard/accountant/expense-requests/${e.id}`,
            priority: priority(days),
            pending_since: e.created_at.toISOString(),
            days_pending: days,
        });
    }

    for (const o of unassignedOrders) {
        const days = daysSince(o.created_at);
        items.push({
            id: o.id, type: "order",
            title: `New Order — ${o.order_no}`,
            subtitle: o.buyer.name,
            action: "Assign PM",
            href: `/dashboard/accountant/orders/${o.id}`,
            priority: priority(days),
            pending_since: o.created_at.toISOString(),
            days_pending: days,
        });
    }

    return items.sort((a, b) => b.days_pending - a.days_pending);
}

async function getProductionPMActions(userId: string): Promise<ActionItem[]> {
    const items: ActionItem[] = [];

    const [ordersToAccept, ordersNeedMerch, techPacksToReview, productionToComplete] = await Promise.all([
        prisma.order.findMany({
            where: { order_type: "PRODUCTION", status: { in: ["ORDER_RECEIVED", "PENDING_PM_ACCEPTANCE"] } },
            include: { buyer: { select: { name: true } } },
            orderBy: { created_at: "asc" },
            take: 20,
        }),
        prisma.order.findMany({
            where: { order_type: "PRODUCTION", status: { in: ["ORDER_RECEIVED", "PENDING_PM_ACCEPTANCE"] }, assigned_merchandiser_id: null },
            include: { buyer: { select: { name: true } } },
            orderBy: { created_at: "asc" },
            take: 10,
        }),
        prisma.techPack.findMany({
            where: { status: "SUBMITTED_FOR_REVIEW" },
            include: { order: { select: { order_no: true, order_type: true } }, merchandiser: { select: { name: true } } },
            orderBy: { created_at: "asc" },
            take: 20,
        }),
        prisma.order.findMany({
            where: { order_type: "PRODUCTION", status: "UNDER_PRODUCTION", assigned_production_pm_id: userId },
            include: { buyer: { select: { name: true } } },
            orderBy: { created_at: "asc" },
            take: 10,
        }),
    ]);

    for (const o of ordersToAccept) {
        const days = daysSince(o.created_at);
        items.push({
            id: o.id, type: "order",
            title: `Accept Order — ${o.order_no}`,
            subtitle: o.buyer.name,
            action: "Accept Order",
            href: `/dashboard/production/orders/${o.id}`,
            priority: priority(days),
            pending_since: o.created_at.toISOString(),
            days_pending: days,
        });
    }

    for (const o of ordersNeedMerch) {
        if (!ordersToAccept.find(a => a.id === o.id)) {
            const days = daysSince(o.created_at);
            items.push({
                id: `merch-${o.id}`, type: "order",
                title: `Assign Merchandiser — ${o.order_no}`,
                subtitle: o.buyer.name,
                action: "Assign",
                href: `/dashboard/production/orders/${o.id}`,
                priority: priority(days),
                pending_since: o.created_at.toISOString(),
                days_pending: days,
            });
        }
    }

    for (const tp of techPacksToReview.filter(t => t.order.order_type === "PRODUCTION")) {
        const days = daysSince(tp.created_at);
        items.push({
            id: tp.id, type: "tech_pack",
            title: `Review Tech Pack — ${tp.tech_pack_no}`,
            subtitle: `${tp.order.order_no} • by ${tp.merchandiser?.name || "—"}`,
            action: "Review",
            href: `/dashboard/production/tech-packs`,
            priority: priority(days),
            pending_since: tp.created_at.toISOString(),
            days_pending: days,
        });
    }

    for (const o of productionToComplete) {
        const days = daysSince(o.created_at);
        items.push({
            id: `prod-${o.id}`, type: "order",
            title: `Mark Complete — ${o.order_no}`,
            subtitle: o.buyer.name,
            action: "Complete Production",
            href: `/dashboard/production/orders/${o.id}`,
            priority: priority(days),
            pending_since: o.created_at.toISOString(),
            days_pending: days,
        });
    }

    return items.sort((a, b) => b.days_pending - a.days_pending);
}

async function getSamplePMActions(userId: string): Promise<ActionItem[]> {
    const items: ActionItem[] = [];

    const [ordersToAccept, techPacksToReview, productionToComplete] = await Promise.all([
        prisma.order.findMany({
            where: { order_type: "SAMPLE", status: { in: ["ORDER_RECEIVED", "PENDING_PM_ACCEPTANCE"] } },
            include: { buyer: { select: { name: true } } },
            orderBy: { created_at: "asc" },
            take: 20,
        }),
        prisma.techPack.findMany({
            where: { status: "SUBMITTED_FOR_REVIEW" },
            include: { order: { select: { order_no: true, order_type: true } }, merchandiser: { select: { name: true } } },
            orderBy: { created_at: "asc" },
            take: 20,
        }),
        prisma.order.findMany({
            where: { order_type: "SAMPLE", status: "UNDER_PRODUCTION", assigned_sample_pm_id: userId },
            include: { buyer: { select: { name: true } } },
            orderBy: { created_at: "asc" },
            take: 10,
        }),
    ]);

    for (const o of ordersToAccept) {
        const days = daysSince(o.created_at);
        items.push({
            id: o.id, type: "order",
            title: `Accept Order — ${o.order_no}`,
            subtitle: o.buyer.name,
            action: "Accept Order",
            href: `/dashboard/sample-pm/orders/${o.id}`,
            priority: priority(days),
            pending_since: o.created_at.toISOString(),
            days_pending: days,
        });
    }

    for (const tp of techPacksToReview.filter(t => t.order.order_type === "SAMPLE")) {
        const days = daysSince(tp.created_at);
        items.push({
            id: tp.id, type: "tech_pack",
            title: `Review Tech Pack — ${tp.tech_pack_no}`,
            subtitle: `${tp.order.order_no} • by ${tp.merchandiser?.name || "—"}`,
            action: "Review",
            href: `/dashboard/sample-pm/tech-packs`,
            priority: priority(days),
            pending_since: tp.created_at.toISOString(),
            days_pending: days,
        });
    }

    for (const o of productionToComplete) {
        const days = daysSince(o.created_at);
        items.push({
            id: `prod-${o.id}`, type: "order",
            title: `Mark Complete — ${o.order_no}`,
            subtitle: o.buyer.name,
            action: "Complete Production",
            href: `/dashboard/sample-pm/orders/${o.id}`,
            priority: priority(days),
            pending_since: o.created_at.toISOString(),
            days_pending: days,
        });
    }

    return items.sort((a, b) => b.days_pending - a.days_pending);
}

async function getMerchandiserActions(userId: string): Promise<ActionItem[]> {
    const items: ActionItem[] = [];

    const [techPacksToDo, techPacksRevision] = await Promise.all([
        prisma.techPack.findMany({
            where: { merchandiser_id: userId, status: { in: ["MERCH_ACCEPTED", "IN_PROGRESS"] } },
            include: { order: { select: { order_no: true, buyer: { select: { name: true } } } } },
            orderBy: { created_at: "asc" },
            take: 20,
        }),
        prisma.techPack.findMany({
            where: { merchandiser_id: userId, status: { in: ["BUYER_REJECTED", "REVISION_IN_PROGRESS"] } },
            include: { order: { select: { order_no: true, buyer: { select: { name: true } } } } },
            orderBy: { updated_at: "asc" },
            take: 10,
        }),
    ]);

    for (const tp of techPacksToDo) {
        const days = daysSince(tp.created_at);
        items.push({
            id: tp.id, type: "tech_pack",
            title: `Complete Tech Pack — ${tp.tech_pack_no}`,
            subtitle: `${tp.order.order_no} • ${tp.order.buyer.name}`,
            action: tp.status === "MERCH_ACCEPTED" ? "Start Working" : "Submit for Review",
            href: `/dashboard/merchandiser/tech-packs`,
            priority: priority(days),
            pending_since: tp.created_at.toISOString(),
            days_pending: days,
        });
    }

    for (const tp of techPacksRevision) {
        const days = daysSince(tp.updated_at);
        items.push({
            id: `rev-${tp.id}`, type: "tech_pack",
            title: `Revision Required — ${tp.tech_pack_no}`,
            subtitle: `${tp.order.order_no} • ${tp.order.buyer.name}`,
            action: "Fix & Resubmit",
            href: `/dashboard/merchandiser/tech-packs`,
            priority: "high",
            pending_since: tp.updated_at.toISOString(),
            days_pending: days,
        });
    }

    return items.sort((a, b) => b.days_pending - a.days_pending);
}

async function getStoreManagerActions(userId: string): Promise<ActionItem[]> {
    const items: ActionItem[] = [];

    const [pendingReqs, acceptedReqs] = await Promise.all([
        prisma.materialRequirement.findMany({
            where: { store_manager_id: userId, status: "PENDING_STORE_ACCEPTANCE" },
            include: { order: { select: { order_no: true } }, style: { select: { style_code: true } } },
            orderBy: { created_at: "asc" },
            take: 20,
        }),
        prisma.materialRequirement.findMany({
            where: { store_manager_id: userId, status: "ACCEPTED_BY_STORE" },
            include: { order: { select: { order_no: true } }, style: { select: { style_code: true } } },
            orderBy: { created_at: "asc" },
            take: 20,
        }),
    ]);

    for (const r of pendingReqs) {
        const days = daysSince(r.created_at);
        items.push({
            id: r.id, type: "material_req",
            title: `Accept Requirement — ${r.order.order_no}`,
            subtitle: r.style?.style_code || "",
            action: "Accept / Decline",
            href: `/dashboard/manager/requirements`,
            priority: priority(days),
            pending_since: r.created_at.toISOString(),
            days_pending: days,
        });
    }

    for (const r of acceptedReqs) {
        const days = daysSince(r.created_at);
        items.push({
            id: `raise-${r.id}`, type: "material_req",
            title: `Raise Purchase Request — ${r.order.order_no}`,
            subtitle: r.style?.style_code || "",
            action: "Create Request",
            href: `/dashboard/manager/requests/new`,
            priority: priority(days),
            pending_since: r.created_at.toISOString(),
            days_pending: days,
        });
    }

    return items.sort((a, b) => b.days_pending - a.days_pending);
}

async function getRunnerActions(userId: string): Promise<ActionItem[]> {
    const items: ActionItem[] = [];

    const [pendingPurchases, pendingConfirmations] = await Promise.all([
        prisma.materialRequest.findMany({
            where: { assigned_runner_id: userId, status: "PENDING_PURCHASE" },
            include: { order: { select: { order_no: true } } },
            orderBy: { created_at: "asc" },
            take: 20,
        }),
        prisma.vendorConfirmation.findMany({
            where: { runner_id: userId, status: "NOT_CONFIRMED" },
            include: { purchase: { include: { vendor: { select: { name: true } } } } },
            orderBy: { created_at: "asc" },
            take: 20,
        }),
    ]);

    for (const mr of pendingPurchases) {
        const days = daysSince(mr.created_at);
        items.push({
            id: mr.id, type: "material_request",
            title: `Purchase Pending — ${mr.request_no}`,
            subtitle: mr.order?.order_no || "",
            action: "Create Purchase",
            href: `/dashboard/runner/pending`,
            priority: priority(days),
            pending_since: mr.created_at.toISOString(),
            days_pending: days,
        });
    }

    for (const vc of pendingConfirmations) {
        const days = daysSince(vc.created_at);
        items.push({
            id: vc.id, type: "confirmation",
            title: `Confirm Delivery — ${vc.purchase.purchase_no}`,
            subtitle: vc.purchase.vendor.name,
            action: "Confirm with Vendor",
            href: `/dashboard/runner/my-purchases`,
            priority: priority(days),
            pending_since: vc.created_at.toISOString(),
            days_pending: days,
        });
    }

    return items.sort((a, b) => b.days_pending - a.days_pending);
}

async function getCEOSummary(): Promise<ActionItem[]> {
    const items: ActionItem[] = [];

    const [overdueOrders, stuckOrders] = await Promise.all([
        prisma.order.findMany({
            where: { shipping_date: { lt: new Date() }, status: { notIn: ["COMPLETED", "CANCELLED"] } },
            include: { buyer: { select: { name: true } } },
            orderBy: { shipping_date: "asc" },
            take: 20,
        }),
        prisma.order.findMany({
            where: { status: { in: ["ORDER_RECEIVED", "PENDING_PM_ACCEPTANCE"] }, created_at: { lt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) } },
            include: { buyer: { select: { name: true } } },
            orderBy: { created_at: "asc" },
            take: 10,
        }),
    ]);

    for (const o of overdueOrders) {
        const days = daysSince(o.shipping_date);
        items.push({
            id: o.id, type: "order",
            title: `Overdue — ${o.order_no}`,
            subtitle: `${o.buyer.name} • ${days}d past shipping date`,
            action: "View",
            href: `/dashboard/ceo/orders/${o.id}`,
            priority: "high",
            pending_since: o.shipping_date.toISOString(),
            days_pending: days,
        });
    }

    for (const o of stuckOrders) {
        const days = daysSince(o.created_at);
        items.push({
            id: `stuck-${o.id}`, type: "order",
            title: `Stuck at Start — ${o.order_no}`,
            subtitle: `${o.buyer.name} • ${days}d without PM acceptance`,
            action: "View",
            href: `/dashboard/ceo/orders/${o.id}`,
            priority: days >= 5 ? "high" : "medium",
            pending_since: o.created_at.toISOString(),
            days_pending: days,
        });
    }

    return items.sort((a, b) => b.days_pending - a.days_pending);
}

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role;
    const userId = session.user.id;

    let items: ActionItem[] = [];

    switch (role) {
        case "ACCOUNTANT": items = await getAccountantActions(); break;
        case "PRODUCTION_MANAGER": items = await getProductionPMActions(userId); break;
        case "SAMPLE_PRODUCTION_MANAGER": items = await getSamplePMActions(userId); break;
        case "MERCHANDISER": items = await getMerchandiserActions(userId); break;
        case "STORE_MANAGER": items = await getStoreManagerActions(userId); break;
        case "RUNNER": items = await getRunnerActions(userId); break;
        case "CEO": items = await getCEOSummary(); break;
    }

    return NextResponse.json({ items, total: items.length });
}
