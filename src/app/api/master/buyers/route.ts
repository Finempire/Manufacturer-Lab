import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
    const buyers = await prisma.buyer.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json(buyers);
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string }).role !== "ACCOUNTANT") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { name, brand_code, contact_person, phone, email, shipping_address, notes, created_inline } = body;

    if (!name || name.trim().length < 2) {
        return NextResponse.json({ error: "Buyer name is required (min 2 characters)" }, { status: 400 });
    }

    // Check for duplicate buyer name (case-insensitive)
    const existing = await prisma.buyer.findFirst({
        where: { name: { equals: name.trim(), mode: "insensitive" } },
    });
    if (existing) {
        return NextResponse.json({ error: "A buyer with this name already exists" }, { status: 409 });
    }

    const buyer = await prisma.buyer.create({
        data: {
            name: name.trim(),
            brand_code: brand_code ? brand_code.trim().toUpperCase() : `BUY-${Date.now().toString(36).toUpperCase()}`,
            contact_person: contact_person || null,
            phone: phone || null,
            email: email || null,
            shipping_address: shipping_address || null,
            notes: notes || null,
            created_inline: created_inline === true,
            created_by_user_id: (session.user as { id: string }).id,
        },
    });

    // Write AuditLog if created inline
    if (created_inline === true) {
        await prisma.auditLog.create({
            data: {
                entity_type: "Buyer",
                entity_id: buyer.id,
                action: "BUYER_CREATED_INLINE",
                performed_by: (session.user as { id: string }).id,
                new_state: JSON.stringify({ name: buyer.name, brand_code: buyer.brand_code }),
            },
        });
    }

    return NextResponse.json(buyer, { status: 201 });
}
