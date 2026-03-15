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

  const userId = (session.user as { id: string }).id;
  const entityType = req.nextUrl.searchParams.get("entity_type");

  const where: { user_id: string; entity_type?: string } = { user_id: userId };
  if (entityType) {
    where.entity_type = entityType;
  }

  const items = await prisma.recentItem.findMany({
    where,
    orderBy: { viewed_at: "desc" },
    take: 20,
  });

  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  const body = await req.json();
  const { entity_type, entity_id, entity_label } = body;

  if (!entity_type || !entity_id || !entity_label) {
    return NextResponse.json(
      { error: "entity_type, entity_id, and entity_label are required" },
      { status: 400 }
    );
  }

  const item = await prisma.recentItem.upsert({
    where: {
      user_id_entity_type_entity_id: {
        user_id: userId,
        entity_type,
        entity_id,
      },
    },
    update: {
      entity_label,
      viewed_at: new Date(),
    },
    create: {
      user_id: userId,
      entity_type,
      entity_id,
      entity_label,
      viewed_at: new Date(),
    },
  });

  // Keep max 50 per user — delete oldest beyond 50
  const allItems = await prisma.recentItem.findMany({
    where: { user_id: userId },
    orderBy: { viewed_at: "desc" },
    select: { id: true },
  });

  if (allItems.length > 50) {
    const idsToDelete = allItems.slice(50).map((i) => i.id);
    await prisma.recentItem.deleteMany({
      where: { id: { in: idsToDelete } },
    });
  }

  return NextResponse.json(item);
}
