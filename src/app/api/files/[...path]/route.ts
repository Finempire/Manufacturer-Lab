import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { verifySignedToken, getAbsolutePath } from "@/lib/fileStorage";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";


export async function GET(
    req: NextRequest,
    { params }: { params: { path: string[] } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const token = req.nextUrl.searchParams.get("token");
        const expires = req.nextUrl.searchParams.get("expires");
        const relativePath = params.path.join("/");

        if (!token || !expires || !relativePath) {
            return new NextResponse("Missing signed URL parameters", { status: 400 });
        }

        // Verify HMAC-SHA256 signature and timestamp
        const isValid = verifySignedToken(token, expires, relativePath);
        if (!isValid) {
            return new NextResponse("Invalid or expired token", { status: 403 });
        }

        // Note: Additional RBAC check could be done here based on parsing relativePath 
        // Example: if relativePath starts with PAYMENT_PROOF and role is CEO/Accountant
        // but for now, the HMAC token itself proves access was granted when the URL was generated.

        const absolutePath = getAbsolutePath(relativePath);

        if (!fs.existsSync(absolutePath)) {
            return new NextResponse("File not found", { status: 404 });
        }

        const stat = fs.statSync(absolutePath);
        const fileStream = fs.createReadStream(absolutePath);

        // Basic mime type fallback
        const ext = path.extname(absolutePath).toLowerCase();
        let mimeType = "application/octet-stream";
        if (ext === ".jpg" || ext === ".jpeg") mimeType = "image/jpeg";
        else if (ext === ".png") mimeType = "image/png";
        else if (ext === ".webp") mimeType = "image/webp";
        else if (ext === ".pdf") mimeType = "application/pdf";

        // Create ReadableStream from Node fs.ReadStream
        const stream = new ReadableStream({
            start(controller) {
                fileStream.on("data", (chunk: unknown) => controller.enqueue(new Uint8Array(chunk as ArrayBufferLike)));
                fileStream.on("end", () => controller.close());
                fileStream.on("error", (err) => controller.error(err));
            },
            cancel() {
                fileStream.destroy();
            }
        });

        // Determine if it should be viewed inline or downloaded
        const action = req.nextUrl.searchParams.get("action") === "download" ? "attachment" : "inline";
        const filename = path.basename(absolutePath); // This has timestamp, could strip it for user

        return new NextResponse(stream, {
            headers: {
                "Content-Type": mimeType,
                "Content-Length": stat.size.toString(),
                "Content-Disposition": `${action}; filename="${filename}"`,
                "Cache-Control": "private, max-age=3600",
            },
        });

    } catch (error) {
        console.error("File download error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
