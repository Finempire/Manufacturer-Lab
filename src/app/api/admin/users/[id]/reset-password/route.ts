import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import nodemailer from "nodemailer";

export const dynamic = "force-dynamic";

async function checkAdmin() {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ACCOUNTANT") {
        return { error: "Forbidden", status: 403 };
    }
    return { session };
}

// Nodemailer transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_PORT === "465",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export async function PATCH(
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
        const { new_password, must_change_password } = body;

        // Validation
        if (!new_password) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        if (new_password.length < 8) {
            return NextResponse.json(
                { error: "Password must be at least 8 characters long" },
                { status: 400 }
            );
        }

        const targetUser = await prisma.user.findUnique({
            where: { id: targetId },
            select: { email: true, name: true }
        });

        if (!targetUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const hashedPassword = await bcrypt.hash(new_password, 12);

        // Update User
        await prisma.user.update({
            where: { id: targetId },
            data: {
                password_hash: hashedPassword,
                must_change_password: must_change_password !== false, // default true
            },
        });

        // Audit Log
        await prisma.auditLog.create({
            data: {
                entity_type: "User",
                entity_id: targetId,
                action: "PASSWORD_RESET_BY_ADMIN",
                performed_by: adminId,
            },
        });

        // Send Email
        try {
            await transporter.sendMail({
                from: process.env.SMTP_FROM || process.env.SMTP_USER || '"CashFlow" <noreply@cashflow.com>',
                to: targetUser.email,
                subject: "Your CashFlow password has been reset",
                html: `
                    <h2>Hello ${targetUser.name},</h2>
                    <p>Your password has been reset by an administrator.</p>
                    <p><strong>Login details:</strong></p>
                    <ul>
                        <li>Email: ${targetUser.email}</li>
                        <li>Temporary Password: ${new_password}</li>
                    </ul>
                    <p>You can log in at: <a href="${process.env.NEXTAUTH_URL}/login">${process.env.NEXTAUTH_URL}/login</a></p>
                    ${must_change_password !== false ? "<p><em>Note: You will be required to change your password upon your next login.</em></p>" : ""}
                `,
            });
        } catch (emailError) {
            console.error("Failed to send reset email:", emailError);
            console.log(`Fallback logging email content for ${targetUser.email}: Password is ${new_password}`);
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Error resetting password:", error);
        return NextResponse.json(
            { error: "Failed to reset password" },
            { status: 500 }
        );
    }
}
