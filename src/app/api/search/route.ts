import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface SearchResult {
  id: string;
  type: "order" | "buyer" | "style" | "vendor" | "purchase" | "expense";
  title: string;
  subtitle: string;
  meta?: string;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const query = `%${q}%`;
  const results: SearchResult[] = [];

  const [orders, buyers, styles, vendors, purchases, expenses] =
    await Promise.all([
      prisma.order.findMany({
        where: {
          OR: [
            { order_no: { contains: q, mode: "insensitive" } },
            { buyer: { name: { contains: q, mode: "insensitive" } } },
          ],
        },
        include: { buyer: { select: { name: true } } },
        take: 5,
        orderBy: { created_at: "desc" },
      }),
      prisma.buyer.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { brand_code: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 5,
        orderBy: { created_at: "desc" },
      }),
      prisma.style.findMany({
        where: {
          OR: [
            { style_code: { contains: q, mode: "insensitive" } },
            { style_name: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 5,
        orderBy: { created_at: "desc" },
      }),
      prisma.vendor.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { gstin: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 5,
        orderBy: { created_at: "desc" },
      }),
      prisma.purchase.findMany({
        where: {
          OR: [
            { purchase_no: { contains: q, mode: "insensitive" } },
            { invoice_no: { contains: q, mode: "insensitive" } },
            { vendor: { name: { contains: q, mode: "insensitive" } } },
          ],
        },
        include: { vendor: { select: { name: true } } },
        take: 5,
        orderBy: { created_at: "desc" },
      }),
      prisma.expenseRequest.findMany({
        where: {
          OR: [
            { expense_no: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        },
        include: { order: { select: { order_no: true } } },
        take: 5,
        orderBy: { created_at: "desc" },
      }),
    ]);

  for (const o of orders) {
    results.push({
      id: o.id,
      type: "order",
      title: o.order_no,
      subtitle: o.buyer.name,
      meta: o.order_type,
    });
  }

  for (const b of buyers) {
    results.push({
      id: b.id,
      type: "buyer",
      title: b.name,
      subtitle: b.brand_code ?? "",
    });
  }

  for (const s of styles) {
    results.push({
      id: s.id,
      type: "style",
      title: s.style_code,
      subtitle: s.style_name,
      meta: s.category ?? undefined,
    });
  }

  for (const v of vendors) {
    results.push({
      id: v.id,
      type: "vendor",
      title: v.name,
      subtitle: v.gstin || "—",
    });
  }

  for (const p of purchases) {
    results.push({
      id: p.id,
      type: "purchase",
      title: p.purchase_no,
      subtitle: p.vendor.name,
      meta: p.invoice_no || undefined,
    });
  }

  for (const e of expenses) {
    results.push({
      id: e.id,
      type: "expense",
      title: e.expense_no,
      subtitle: e.description || "—",
      meta: e.order?.order_no || undefined,
    });
  }

  return NextResponse.json({ results });
}
