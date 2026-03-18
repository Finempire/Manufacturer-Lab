import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export async function PUT(
    req: Request,
    { params }: { params: { id: string } }
) {
    const auth = await requireRole([
        "ACCOUNTANT", "SENIOR_MERCHANDISER", "PRODUCTION_MANAGER",
        "MERCHANDISER", "STORE_MANAGER", "RUNNER", "CEO",
    ]);
    if (!auth.authorized) return auth.response;

    const body = await req.json();

    const notification = await prisma.notification.update({
        where: { id: params.id },
        data: { is_read: body.is_read ?? true },
    });

    return NextResponse.json(notification);
}
