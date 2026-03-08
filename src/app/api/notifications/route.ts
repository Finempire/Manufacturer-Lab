import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    const auth = await requireRole([
        "ACCOUNTANT", "SAMPLE_PRODUCTION_MANAGER", "PRODUCTION_MANAGER",
        "MERCHANDISER", "STORE_MANAGER", "RUNNER", "CEO",
    ]);
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unread") === "true";

    if (unreadOnly) {
        const count = await prisma.notification.count({
            where: { user_id: auth.user.id, is_read: false },
        });
        return NextResponse.json({ count });
    }

    const notifications = await prisma.notification.findMany({
        where: { user_id: auth.user.id },
        orderBy: { created_at: "desc" },
        take: 50,
    });

    return NextResponse.json(notifications);
}
