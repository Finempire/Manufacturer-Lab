import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const auth = await requireRole([
        "ACCOUNTANT", "PRODUCTION_MANAGER", "SENIOR_MERCHANDISER", "CEO",
    ]);
    if (!auth.authorized) return auth.response;

    const role = req.nextUrl.searchParams.get("role");

    const users = await prisma.user.findMany({
        where: {
            is_active: true,
            ...(role ? { role: role as never } : {}),
        },
        select: { id: true, name: true, email: true, role: true, is_active: true },
        orderBy: { name: "asc" },
    });

    return NextResponse.json(users);
}
