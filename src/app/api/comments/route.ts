import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CommentEntityType } from "@prisma/client";
import { notify } from "@/lib/notifications";

export const dynamic = "force-dynamic";

const entityFkMap: Record<string, string> = {
  ORDER: "order_id",
  TECH_PACK: "tech_pack_id",
  MATERIAL_REQUIREMENT: "material_requirement_id",
  MATERIAL_REQUEST: "material_request_id",
  PURCHASE: "purchase_id",
  EXPENSE_REQUEST: "expense_id",
};

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const entityType = searchParams.get("entity_type");
  const entityId = searchParams.get("entity_id");

  if (!entityType || !entityId) {
    return NextResponse.json(
      { error: "entity_type and entity_id are required" },
      { status: 400 }
    );
  }

  const fkColumn = entityFkMap[entityType];
  if (!fkColumn) {
    return NextResponse.json(
      { error: "Invalid entity_type" },
      { status: 400 }
    );
  }

  const comments = await prisma.comment.findMany({
    where: {
      entity_type: entityType as CommentEntityType,
      [fkColumn]: entityId,
    },
    include: {
      author: { select: { id: true, name: true } },
      mentions: {
        include: {
          user: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { created_at: "desc" },
  });

  return NextResponse.json(comments);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { entity_type, entity_id, content } = body;

    if (!entity_type || !entity_id || !content) {
      return NextResponse.json(
        { error: "entity_type, entity_id, and content are required" },
        { status: 400 }
      );
    }

    const fkColumn = entityFkMap[entity_type];
    if (!fkColumn) {
      return NextResponse.json(
        { error: "Invalid entity_type" },
        { status: 400 }
      );
    }

    // Parse @mentions from content — pattern: @[Name](userId)
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const mentionedUserIds: string[] = [];
    let match;
    while ((match = mentionRegex.exec(content)) !== null) {
      mentionedUserIds.push(match[2]);
    }

    // Deduplicate
    const uniqueMentionedUserIds = [...new Set(mentionedUserIds)];

    const authorId = (session.user as { id: string }).id;
    const authorName = session.user.name ?? "Someone";

    const comment = await prisma.comment.create({
      data: {
        entity_type: entity_type as CommentEntityType,
        author_id: authorId,
        content,
        [fkColumn]: entity_id,
        mentions:
          uniqueMentionedUserIds.length > 0
            ? {
                create: uniqueMentionedUserIds.map((userId) => ({
                  user_id: userId,
                })),
              }
            : undefined,
      },
      include: {
        author: { select: { id: true, name: true } },
        mentions: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
    });

    // Create notifications for mentioned users
    for (const userId of uniqueMentionedUserIds) {
      await notify({
        userId,
        title: "You were mentioned in a comment",
        message: `${authorName} mentioned you in a comment: "${content.length > 100 ? content.slice(0, 100) + "..." : content}"`,
        entityType: entity_type,
        entityId: entity_id,
      });
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Create comment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
