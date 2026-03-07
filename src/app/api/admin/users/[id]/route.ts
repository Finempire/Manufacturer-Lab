import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

async function checkAdmin() {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ACCOUNTANT") {
        return { error: "Forbidden", status: 403 };
    }
    return { session };
}

export async function PUT(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const authCheck = await checkAdmin();
        if (authCheck.error || !authCheck.session) {
            return NextResponse.json({ error: authCheck.error || "Unauthorized" }, { status: authCheck.status || 401 });
        }
        const adminId = authCheck.session.user.id;
        const targetId = params.id;

        const body = await req.json();
        const { name, email, role, is_active } = body;

        // Validation
        if (!name || !email || !role) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Prevent admin from editing their own role or deactivating themselves
        if (adminId === targetId) {
            if (role !== "ACCOUNTANT") {
                return NextResponse.json(
                    { error: "You cannot change your own role" },
                    { status: 400 }
                );
            }
            if (is_active === false) {
                return NextResponse.json(
                    { error: "You cannot deactivate yourself" },
                    { status: 400 }
                );
            }
        }

        // Check unique email if email changed
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser && existingUser.id !== targetId) {
            return NextResponse.json(
                { error: "This email is already registered to another user" },
                { status: 400 }
            );
        }

        // Get previous state for audit log
        const prevStateUser = await prisma.user.findUnique({
            where: { id: targetId },
            select: { name: true, email: true, role: true, is_active: true }
        });

        if (!prevStateUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Update User
        const updatedUser = await prisma.user.update({
            where: { id: targetId },
            data: {
                name,
                email,
                role,
                is_active: is_active ?? true,
            },
        });

        // Audit Log for update
        await prisma.auditLog.create({
            data: {
                entity_type: "User",
                entity_id: targetId,
                action: "USER_UPDATED",
                performed_by: adminId,
                previous_state: JSON.stringify(prevStateUser),
                new_state: JSON.stringify({ name, email, role, is_active: updatedUser.is_active }),
            },
        });

        // If status specifically toggled
        if (prevStateUser.is_active !== updatedUser.is_active) {
            await prisma.auditLog.create({
                data: {
                    entity_type: "User",
                    entity_id: targetId,
                    action: updatedUser.is_active ? "USER_ACTIVATED" : "USER_DEACTIVATED",
                    performed_by: adminId,
                },
            });
        }

        return NextResponse.json({
            success: true,
            user: {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                is_active: updatedUser.is_active
            }
        });

    } catch (error) {
        console.error("Error updating user:", error);
        return NextResponse.json(
            { error: "Failed to update user" },
            { status: 500 }
        );
    }
}
