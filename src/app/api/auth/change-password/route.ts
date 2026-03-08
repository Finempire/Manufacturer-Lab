import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { newPassword } = body;

        if (!newPassword || newPassword.length < 8) {
            return NextResponse.json(
                { error: "Password must be at least 8 characters long" },
                { status: 400 }
            );
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);

        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                password_hash: hashedPassword,
                must_change_password: false,
            },
        });

        // Add to audit log
        await prisma.auditLog.create({
            data: {
                entity_type: "User",
                entity_id: session.user.id,
                action: "PASSWORD_CHANGED",
                performed_by: session.user.id,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Change password error:", error);
        return NextResponse.json(
            { error: "Failed to change password" },
            { status: 500 }
        );
    }
}
