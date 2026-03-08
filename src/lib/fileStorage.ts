import fs from "fs";
import path from "path";
import crypto from "crypto";

const UPLOAD_BASE_PATH =
    process.env.UPLOAD_BASE_PATH || path.join(process.cwd(), "uploads");
const FILE_SIGNING_SECRET =
    process.env.FILE_SIGNING_SECRET || "fallback_signing_secret_for_dev";

export function ensureUploadDir(): void {
    try {
        if (!fs.existsSync(UPLOAD_BASE_PATH)) {
            fs.mkdirSync(UPLOAD_BASE_PATH, { recursive: true });
        }
    } catch (error) {
        console.warn(`[Warning] Could not create upload directory at ${UPLOAD_BASE_PATH}. This is expected during build time. Error:`, error);
    }
}

export async function saveFile(
    buffer: Buffer,
    type: string,
    entityId: string,
    filename: string
): Promise<string> {
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
    const timestamp = Date.now();
    const finalFilename = `${timestamp}_${sanitizedFilename}`;
    const dir = path.join(UPLOAD_BASE_PATH, type, entityId);

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    const filePath = path.join(dir, finalFilename);
    fs.writeFileSync(filePath, buffer);

    // Return relative path (stored in DB)
    return path.join(type, entityId, finalFilename).replace(/\\/g, "/");
}

export function generateSignedUrl(
    relativePath: string,
    _userId: string
): string {
    const expires = Date.now() + 15 * 60 * 1000; // 15 minutes
    const token = crypto
        .createHmac("sha256", FILE_SIGNING_SECRET)
        .update(`${relativePath}:${expires}`)
        .digest("hex");
    return `/api/files/${relativePath}?token=${token}&expires=${expires}`;
}

export function verifySignedToken(
    token: string,
    expires: string,
    relativePath: string
): boolean {
    if (Date.now() > parseInt(expires)) {
        return false;
    }

    const expectedToken = crypto
        .createHmac("sha256", FILE_SIGNING_SECRET)
        .update(`${relativePath}:${expires}`)
        .digest("hex");

    return token === expectedToken;
}

export async function deleteFile(relativePath: string): Promise<void> {
    const absolutePath = getAbsolutePath(relativePath);
    if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
    }
}

export function getAbsolutePath(relativePath: string): string {
    return path.join(UPLOAD_BASE_PATH, relativePath);
}

export const ALLOWED_MIME_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
