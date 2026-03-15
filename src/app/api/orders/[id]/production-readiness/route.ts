import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole([
    "PRODUCTION_MANAGER",
    "SAMPLE_PRODUCTION_MANAGER",
    "ACCOUNTANT",
  ]);
  if (!auth.authorized) return auth.response;

  try {
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        lines: { include: { style: true } },
        buyer: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Get all material requirements for this order
    const materialRequirements = await prisma.materialRequirement.findMany({
      where: { order_id: order.id },
      include: { lines: true },
    });

    // Get all material requests for this order
    const materialRequests = await prisma.materialRequest.findMany({
      where: { order_id: order.id },
      include: { lines: true },
    });

    // Get all expense requests for this order
    const expenseRequests = await prisma.expenseRequest.findMany({
      where: { order_id: order.id },
    });

    // Get purchases linked to material requests for this order
    const requestIds = materialRequests.map((r) => r.id);
    const purchases = requestIds.length > 0
      ? await prisma.purchase.findMany({
          where: { request_id: { in: requestIds } },
        })
      : [];

    // Build checklist items
    const checklist = [];

    // 1. Material requirements - all should be completed
    const totalMatReqs = materialRequirements.length;
    const completedMatReqs = materialRequirements.filter(
      (r) => r.status === "COMPLETED"
    ).length;
    const pendingMatReqs = materialRequirements.filter(
      (r) =>
        r.status !== "COMPLETED" &&
        r.status !== "DECLINED_BY_STORE"
    );

    checklist.push({
      id: "material_requirements",
      label: "All material requirements completed",
      status: totalMatReqs > 0 && completedMatReqs === totalMatReqs ? "complete" : totalMatReqs === 0 ? "na" : "incomplete",
      detail: `${completedMatReqs}/${totalMatReqs} completed`,
      blockers: pendingMatReqs.map((r) => ({
        id: r.id,
        label: `Requirement ${r.status.replace(/_/g, " ")}`,
        status: r.status,
      })),
    });

    // 2. Material requests - all purchases should be completed
    const totalMatRequests = materialRequests.length;
    const completedMatRequests = materialRequests.filter(
      (r) => r.status === "COMPLETED"
    ).length;
    const pendingMatRequests = materialRequests.filter(
      (r) =>
        r.status !== "COMPLETED" &&
        r.status !== "CANCELLED"
    );

    checklist.push({
      id: "material_requests",
      label: "All material requests fulfilled",
      status: totalMatRequests > 0 && completedMatRequests === totalMatRequests ? "complete" : totalMatRequests === 0 ? "na" : "incomplete",
      detail: `${completedMatRequests}/${totalMatRequests} fulfilled`,
      blockers: pendingMatRequests.map((r) => ({
        id: r.id,
        label: `Request ${r.request_no} — ${r.status.replace(/_/g, " ")}`,
        status: r.status,
      })),
    });

    // 3. Expense requests - all should be completed
    const totalExpenses = expenseRequests.length;
    const completedExpenses = expenseRequests.filter(
      (e) => e.status === "COMPLETED" || e.status === "PAID"
    ).length;
    const pendingExpenses = expenseRequests.filter(
      (e) =>
        e.status !== "COMPLETED" &&
        e.status !== "PAID" &&
        e.status !== "REJECTED" &&
        e.status !== "CANCELLED"
    );

    checklist.push({
      id: "expense_requests",
      label: "All expense requests completed",
      status: totalExpenses > 0 && completedExpenses === totalExpenses ? "complete" : totalExpenses === 0 ? "na" : "incomplete",
      detail: `${completedExpenses}/${totalExpenses} completed`,
      blockers: pendingExpenses.map((e) => ({
        id: e.id,
        label: `Expense ${e.expense_no} — ${e.status.replace(/_/g, " ")}`,
        status: e.status,
      })),
    });

    // 4. Pending final tax invoices
    const purchasesNeedingTaxInvoice = purchases.filter(
      (p) => p.status === "PAID_PENDING_TAX_INVOICE"
    );

    checklist.push({
      id: "tax_invoices",
      label: "No pending final tax invoices",
      status: purchasesNeedingTaxInvoice.length === 0 ? "complete" : "warning",
      detail: purchasesNeedingTaxInvoice.length > 0
        ? `${purchasesNeedingTaxInvoice.length} pending tax invoices`
        : "All tax invoices received",
      blockers: purchasesNeedingTaxInvoice.map((p) => ({
        id: p.id,
        label: `Purchase ${p.purchase_no} — pending tax invoice`,
        status: p.status,
      })),
    });

    // 5. Check if tech pack is completed
    const techPacks = await prisma.techPack.findMany({
      where: { order_id: order.id },
    });
    const allTechPacksComplete = techPacks.length > 0 && techPacks.every(
      (tp) => tp.status === "COMPLETED"
    );

    checklist.push({
      id: "tech_packs",
      label: "All tech packs completed",
      status: allTechPacksComplete ? "complete" : techPacks.length === 0 ? "na" : "incomplete",
      detail: techPacks.length > 0
        ? `${techPacks.filter((tp) => tp.status === "COMPLETED").length}/${techPacks.length} completed`
        : "No tech packs",
      blockers: techPacks
        .filter((tp) => tp.status !== "COMPLETED")
        .map((tp) => ({
          id: tp.id,
          label: `Tech Pack — ${tp.status.replace(/_/g, " ")}`,
          status: tp.status,
        })),
    });

    // Overall readiness
    const isReady = checklist.every(
      (item) => item.status === "complete" || item.status === "na"
    );
    const hasWarnings = checklist.some((item) => item.status === "warning");

    return NextResponse.json({
      orderId: order.id,
      orderNo: order.order_no,
      currentStatus: order.status,
      isReady,
      hasWarnings,
      checklist,
    });
  } catch (error) {
    console.error("Production readiness check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
