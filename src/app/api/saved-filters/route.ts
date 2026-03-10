import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const page = req.nextUrl.searchParams.get("page");
  if (!page) {
    return NextResponse.json(
      { error: "Missing required query param: page" },
      { status: 400 }
    );
  }

  const filters = await prisma.savedFilter.findMany({
    where: { user_id: session.user.id, page },
    orderBy: { created_at: "desc" },
  });

  return NextResponse.json(filters);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { page, name, filter_json, is_default } = body;

    if (!page || !name || !filter_json) {
      return NextResponse.json(
        { error: "Missing required fields: page, name, filter_json" },
        { status: 400 }
      );
    }

    // If setting as default, unset any existing default for this user+page
    if (is_default) {
      await prisma.savedFilter.updateMany({
        where: { user_id: session.user.id, page, is_default: true },
        data: { is_default: false },
      });
    }

    const filter = await prisma.savedFilter.create({
      data: {
        user_id: session.user.id,
        page,
        name,
        filter_json,
        is_default: is_default ?? false,
      },
    });

    return NextResponse.json(filter, { status: 201 });
  } catch (error) {
    console.error("Create saved filter error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
