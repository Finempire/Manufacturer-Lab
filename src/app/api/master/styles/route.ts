import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const styles = await prisma.style.findMany({
            where: { is_active: true },
            orderBy: { style_name: "asc" },
            select: { id: true, style_code: true, style_name: true, category: true, description: true, created_inline: true }
        });

        return NextResponse.json(styles);
    } catch (error) {
        console.error("Styles GET error:", error);
        return NextResponse.json({ error: "Failed to fetch styles" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const userId = (session.user as any).id;
        const body = await req.json();
        const { style_name, style_code, category, description, created_inline } = body;

        if (!style_name || style_name.trim().length < 2) {
            return NextResponse.json({ error: "Style name is required (min 2 chars)" }, { status: 400 });
        }
        if (!style_code || style_code.trim().length < 1) {
            return NextResponse.json({ error: "Style code is required" }, { status: 400 });
        }

        // Duplicate check — style_code (case-insensitive)
        const existingCode = await prisma.style.findFirst({
            where: { style_code: { equals: style_code.trim().toUpperCase(), mode: "insensitive" } }
        });
        if (existingCode) {
            return NextResponse.json({ error: "Style code already exists" }, { status: 409 });
        }

        // Duplicate check — style_name (case-insensitive)
        const existingName = await prisma.style.findFirst({
            where: { style_name: { equals: style_name.trim(), mode: "insensitive" } }
        });
        if (existingName) {
            return NextResponse.json({ error: "Style with this name already exists" }, { status: 409 });
        }

        const style = await prisma.style.create({
            data: {
                style_name: style_name.trim(),
                style_code: style_code.trim().toUpperCase(),
                category: category?.trim() || null,
                description: description?.trim() || null,
                created_inline: created_inline === true,
                created_by_user_id: userId,
            }
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                entity_type: "STYLE",
                entity_id: style.id,
                action: created_inline ? "STYLE_CREATED_INLINE" : "STYLE_CREATED",
                performed_by: userId,
                new_state: JSON.stringify({ style_name: style.style_name, style_code: style.style_code }),
            }
        });

        return NextResponse.json(style, { status: 201 });
    } catch (error) {
        console.error("Styles POST error:", error);
        return NextResponse.json({ error: "Failed to create style" }, { status: 500 });
    }
}
