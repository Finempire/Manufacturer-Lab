import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const style = await prisma.style.findUnique({ where: { id: params.id } });
        if (!style) return NextResponse.json({ error: "Style not found" }, { status: 404 });

        return NextResponse.json(style);
    } catch (error) {
        console.error("Style GET error:", error);
        return NextResponse.json({ error: "Failed to fetch style" }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const userRole = (session.user as any).role;
        if (userRole !== "ACCOUNTANT") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        const { style_name, style_code, category, description } = body;

        if (!style_name || style_name.trim().length < 2) {
            return NextResponse.json({ error: "Style name is required (min 2 chars)" }, { status: 400 });
        }
        if (!style_code || style_code.trim().length < 1) {
            return NextResponse.json({ error: "Style code is required" }, { status: 400 });
        }

        // Duplicate check — exclude self
        const existingCode = await prisma.style.findFirst({
            where: { style_code: { equals: style_code.trim().toUpperCase(), mode: "insensitive" }, id: { not: params.id } }
        });
        if (existingCode) return NextResponse.json({ error: "Style code already exists" }, { status: 409 });

        const existingName = await prisma.style.findFirst({
            where: { style_name: { equals: style_name.trim(), mode: "insensitive" }, id: { not: params.id } }
        });
        if (existingName) return NextResponse.json({ error: "Style with this name already exists" }, { status: 409 });

        const style = await prisma.style.update({
            where: { id: params.id },
            data: {
                style_name: style_name.trim(),
                style_code: style_code.trim().toUpperCase(),
                category: category?.trim() || null,
                description: description?.trim() || null,
            }
        });

        return NextResponse.json(style);
    } catch (error) {
        console.error("Style PUT error:", error);
        return NextResponse.json({ error: "Failed to update style" }, { status: 500 });
    }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const userRole = (session.user as any).role;
        if (userRole !== "ACCOUNTANT") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const style = await prisma.style.update({
            where: { id: params.id },
            data: { is_active: false }
        });

        return NextResponse.json(style);
    } catch (error) {
        console.error("Style DELETE error:", error);
        return NextResponse.json({ error: "Failed to deactivate style" }, { status: 500 });
    }
}
