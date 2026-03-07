import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const purchase = await prisma.purchase.findUnique({
            where: { id: params.id },
            include: {
                vendor: true,
                request: {
                    include: { manager: true, buyer: true }
                },
                payments: true,
                confirmation: true,
                lines: { include: { material: true } }
            }
        });

        if (!purchase) return NextResponse.json({ error: "Not found" }, { status: 404 });

        return NextResponse.json(purchase);

    } catch (error) {
        console.error("Fetch purchase details error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
