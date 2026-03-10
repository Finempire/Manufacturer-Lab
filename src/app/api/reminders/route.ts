import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reminders = await prisma.reminder.findMany({
        where: { target_user_id: session.user.id },
        orderBy: { created_at: "desc" },
        take: 50,
        include: {
            sent_by: {
                select: { name: true },
            },
        },
    });

    return NextResponse.json(reminders);
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { entity_type, entity_id, target_user_id, message } = body;

    if (!entity_type || !entity_id || !target_user_id) {
        return NextResponse.json(
            { error: "entity_type, entity_id, and target_user_id are required" },
            { status: 400 }
        );
    }

    // Prevent spamming: check if same user already sent a reminder for
    // the same entity within the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const existingReminder = await prisma.reminder.findFirst({
        where: {
            entity_type,
            entity_id,
            sent_by_id: session.user.id,
            target_user_id,
            created_at: { gte: twentyFourHoursAgo },
        },
    });

    if (existingReminder) {
        return NextResponse.json(
            { error: "A reminder for this item was already sent in the last 24 hours" },
            { status: 429 }
        );
    }

    const reminder = await prisma.reminder.create({
        data: {
            entity_type,
            entity_id,
            sent_by_id: session.user.id,
            target_user_id,
            message: message || null,
            is_auto: false,
        },
    });

    await prisma.notification.create({
        data: {
            user_id: target_user_id,
            title: "Reminder",
            message: message
                ? `Reminder: ${message}`
                : `You have a pending action on ${entity_type} ${entity_id}`,
            entity_type,
            entity_id,
        },
    });

    return NextResponse.json(reminder, { status: 201 });
}
