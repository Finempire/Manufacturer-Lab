import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type CheckType =
  | "DUPLICATE_INVOICE"
  | "DUPLICATE_EXPENSE"
  | "DUPLICATE_MATERIAL_REQUEST"
  | "DUPLICATE_STYLE"
  | "DUPLICATE_VENDOR"
  | "DUPLICATE_BUYER";

interface MatchResult {
  id: string;
  label: string;
  status?: string;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { check_type, params } = body as {
      check_type: CheckType;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      params: Record<string, any>;
    };

    if (!check_type || !params) {
      return NextResponse.json(
        { error: "check_type and params are required" },
        { status: 400 }
      );
    }

    let matches: MatchResult[] = [];

    switch (check_type) {
      case "DUPLICATE_INVOICE": {
        const { vendor_id, invoice_no } = params;
        if (!vendor_id || !invoice_no) {
          return NextResponse.json(
            { error: "vendor_id and invoice_no are required" },
            { status: 400 }
          );
        }

        const existing = await prisma.purchase.findMany({
          where: {
            vendor_id,
            invoice_no,
          },
          include: {
            vendor: { select: { name: true } },
          },
        });

        matches = existing.map((p) => ({
          id: p.id,
          label: `${p.purchase_no} - Invoice #${p.invoice_no} (Vendor: ${p.vendor?.name ?? "Unknown"})`,
          status: p.status,
        }));
        break;
      }

      case "DUPLICATE_EXPENSE": {
        const { expense_category, expense_date, expected_amount, order_id, style_id } = params;
        if (!expense_category || !expense_date || expected_amount == null || !order_id) {
          return NextResponse.json(
            { error: "expense_category, expense_date, expected_amount, and order_id are required" },
            { status: 400 }
          );
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: any = {
          expense_category,
          expense_date: new Date(expense_date),
          expected_amount,
          order_id,
        };
        if (style_id) {
          where.style_id = style_id;
        }

        const existing = await prisma.expenseRequest.findMany({
          where,
          include: {
            order: { select: { order_no: true } },
          },
        });

        matches = existing.map((e) => ({
          id: e.id,
          label: `${e.expense_no} - ${e.expense_category} on ${new Date(e.expense_date).toLocaleDateString()} (Order: ${e.order?.order_no ?? "Unknown"})`,
          status: e.status,
        }));
        break;
      }

      case "DUPLICATE_MATERIAL_REQUEST": {
        const { order_id, style_id } = params;
        if (!order_id || !style_id) {
          return NextResponse.json(
            { error: "order_id and style_id are required" },
            { status: 400 }
          );
        }

        const existing = await prisma.materialRequest.findMany({
          where: {
            order_id,
            style_id,
            status: {
              notIn: ["COMPLETED", "CANCELLED"],
            },
          },
          include: {
            order: { select: { order_no: true } },
            style: { select: { style_code: true } },
          },
        });

        matches = existing.map((mr) => ({
          id: mr.id,
          label: `${mr.request_no} - Order: ${mr.order?.order_no ?? "Unknown"}, Style: ${mr.style?.style_code ?? "Unknown"}`,
          status: mr.status,
        }));
        break;
      }

      case "DUPLICATE_STYLE": {
        const { style_code } = params;
        if (!style_code) {
          return NextResponse.json(
            { error: "style_code is required" },
            { status: 400 }
          );
        }

        const existing = await prisma.style.findMany({
          where: {
            style_code,
          },
        });

        matches = existing.map((s) => ({
          id: s.id,
          label: `${s.style_code} - ${s.style_name}`,
        }));
        break;
      }

      case "DUPLICATE_VENDOR": {
        const { name } = params;
        if (!name) {
          return NextResponse.json(
            { error: "name is required" },
            { status: 400 }
          );
        }

        const existing = await prisma.vendor.findMany({
          where: {
            name: {
              equals: name,
              mode: "insensitive",
            },
          },
        });

        matches = existing.map((v) => ({
          id: v.id,
          label: `${v.name}${v.contact_person ? ` (Contact: ${v.contact_person})` : ""}`,
        }));
        break;
      }

      case "DUPLICATE_BUYER": {
        const { name } = params;
        if (!name) {
          return NextResponse.json(
            { error: "name is required" },
            { status: 400 }
          );
        }

        const existing = await prisma.buyer.findMany({
          where: {
            name: {
              equals: name,
              mode: "insensitive",
            },
          },
        });

        matches = existing.map((b) => ({
          id: b.id,
          label: `${b.name}${b.contact_person ? ` (Contact: ${b.contact_person})` : ""}`,
        }));
        break;
      }

      default:
        return NextResponse.json(
          { error: `Unknown check_type: ${check_type}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      has_duplicates: matches.length > 0,
      matches,
    });
  } catch (error) {
    console.error("Duplicate check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
