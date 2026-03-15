import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const body = await req.json();
    const { warning_id } = body;

    if (!warning_id) {
      return NextResponse.json(
        { error: "warning_id is required" },
        { status: 400 }
      );
    }

    const warning = await prisma.duplicateWarning.findUnique({
      where: { id: warning_id },
    });

    if (!warning) {
      return NextResponse.json(
        { error: "Warning not found" },
        { status: 404 }
      );
    }

    if (warning.dismissed) {
      return NextResponse.json(
        { error: "Warning already dismissed" },
        { status: 400 }
      );
    }

    const updated = await prisma.duplicateWarning.update({
      where: { id: warning_id },
      data: {
        dismissed: true,
        dismissed_by_id: userId,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Dismiss duplicate warning error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
