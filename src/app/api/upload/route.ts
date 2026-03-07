import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { saveFile, ensureUploadDir, ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from "@/lib/fileStorage";
import { prisma } from "@/lib/prisma";

// Ensure uploads directory exists on boot
ensureUploadDir();

// Basic rate limiting map (IP/User -> { count, timestamp })
const rateLimitMap = new Map<string, { count: number, resetAt: number }>();

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const userRole = (session.user as any).role;

        // Rate limit check: 20 req/minute per user
        const now = Date.now();
        const userRate = rateLimitMap.get(userId) || { count: 0, resetAt: now + 60000 };
        if (now > userRate.resetAt) {
            userRate.count = 1;
            userRate.resetAt = now + 60000;
        } else {
            userRate.count++;
            if (userRate.count > 20) {
                return NextResponse.json({ error: "Rate limit exceeded. Please wait a minute." }, { status: 429 });
            }
        }
        rateLimitMap.set(userId, userRate);

        const formData = await req.formData();
        const file = formData.get("file") as File;
        const type = formData.get("type") as string;
        const entityId = formData.get("entity_id") as string;

        if (!file || !type || !entityId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Validate File Size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
        }

        // Validate MIME type
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            return NextResponse.json({ error: "Invalid file type. Only JPEG, PNG, WEBP, and PDF allowed." }, { status: 400 });
        }

        // RBAC validation for specific upload types
        const typeRoleMap: Record<string, string[]> = {
            PROVISIONAL_INVOICE: ["RUNNER"],
            TAX_INVOICE: ["RUNNER"],
            PAYMENT_PROOF: ["ACCOUNTANT"],
            TECH_PACK_DOC: ["MERCHANDISER"],
            EXPENSE_ATTACHMENT: ["PRODUCTION_MANAGER", "STORE_MANAGER", "ACCOUNTANT"],
        };

        const allowedRoles = typeRoleMap[type];
        if (allowedRoles && !allowedRoles.includes(userRole)) {
            return NextResponse.json({ error: `You do not have permission to upload a ${type}` }, { status: 403 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const relativePath = await saveFile(buffer, type, entityId, file.name);

        // Audit Log entry
        await prisma.auditLog.create({
            data: {
                entity_type: "FILE_UPLOAD",
                entity_id: entityId,
                action: `UPLOAD_${type}`,
                performed_by: userId,
                new_state: JSON.stringify({ path: relativePath, filename: file.name, size: file.size }),
                ip_address: req.headers.get("x-forwarded-for") || "unknown",
            }
        });

        return NextResponse.json({ success: true, path: relativePath });

    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "Internal server error during upload" }, { status: 500 });
    }
}
