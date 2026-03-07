import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import nodemailer from "nodemailer";

// Helper to check admin role
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

export async function GET() {
    try {
        const authCheck = await checkAdmin();
        if (authCheck.error) {
            return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
        }

        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                is_active: true,
                last_login_at: true,
                created_at: true,
            },
            orderBy: {
                created_at: "desc",
            },
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json(
            { error: "Failed to fetch users" },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const authCheck = await checkAdmin();
        if (authCheck.error || !authCheck.session) {
            return NextResponse.json({ error: authCheck.error || "Unauthorized" }, { status: authCheck.status || 401 });
        }
        const adminId = authCheck.session.user.id;

        const body = await req.json();
        const { name, email, role, password, must_change_password } = body;

        // Validation
        if (!name || !email || !role || !password) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        if (password.length < 8) {
            return NextResponse.json(
                { error: "Password must be at least 8 characters long" },
                { status: 400 }
            );
        }

        // Check unique email
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "This email is already registered" },
                { status: 400 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        // Create User
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                role,
                password_hash: hashedPassword,
                must_change_password: must_change_password !== false, // default true
                created_by_id: adminId,
            },
        });

        // Audit Log
        await prisma.auditLog.create({
            data: {
                entity_type: "User",
                entity_id: newUser.id,
                action: "USER_CREATED",
                performed_by: adminId,
                new_state: JSON.stringify({ name, email, role, is_active: true }),
            },
        });

        // Send Email
        try {
            await transporter.sendMail({
                from: process.env.SMTP_FROM || process.env.SMTP_USER || '"CashFlow" <noreply@cashflow.com>',
                to: email,
                subject: "Your CashFlow account has been created",
                html: `
                    <h2>Welcome to CashFlow, ${name}!</h2>
                    <p>Your account has been created with the role: <strong>${role}</strong>.</p>
                    <p><strong>Login details:</strong></p>
                    <ul>
                        <li>Email: ${email}</li>
                        <li>Temporary Password: ${password}</li>
                    </ul>
                    <p>You can log in at: <a href="${process.env.NEXTAUTH_URL}/login">${process.env.NEXTAUTH_URL}/login</a></p>
                    ${must_change_password !== false ? "<p><em>Note: You will be required to change your password upon your first login.</em></p>" : ""}
                `,
            });
        } catch (emailError) {
            console.error("Failed to send welcome email:", emailError);
            // Don't fail the request if email fails, but maybe alert
            console.log(`Fallback logging email content for ${email}: Password is ${password}`);
        }

        return NextResponse.json({
            success: true,
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
            }
        });

    } catch (error) {
        console.error("Error creating user:", error);
        return NextResponse.json(
            { error: "Failed to create user" },
            { status: 500 }
        );
    }
}
