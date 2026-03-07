import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export async function POST() {
    const auth = await requireRole([
        "ACCOUNTANT", "SAMPLE_PRODUCTION_MANAGER", "PRODUCTION_MANAGER",
        "MERCHANDISER", "STORE_MANAGER", "RUNNER", "CEO",
    ]);
    if (!auth.authorized) return auth.response;

    await prisma.notification.updateMany({
        where: { user_id: auth.user.id, is_read: false },
        data: { is_read: true },
    });

    return NextResponse.json({ success: true });
}
