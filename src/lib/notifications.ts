import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

interface NotifyParams {
  userId: string;
  title: string;
  message: string;
  entityType: string;
  entityId: string;
}

export async function notify({ userId, title, message, entityType, entityId }: NotifyParams) {
  // Create in-app notification
  await prisma.notification.create({
    data: {
      user_id: userId,
      title,
      message,
      entity_type: entityType,
      entity_id: entityId,
    },
  });

  // Send email notification
  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
    if (user?.email) {
      await sendEmail(
        user.email,
        title,
        `<div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #1e40af;">${title}</h2>
          <p style="color: #374151; font-size: 14px;">${message}</p>
          <hr style="border: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="color: #9ca3af; font-size: 12px;">This is an automated notification from CashFlow.</p>
        </div>`
      );
    }
  } catch (e) {
    console.error("Failed to send email notification:", e);
  }
}

export async function notifyRole(role: string, title: string, message: string, entityType: string, entityId: string) {
  const users = await prisma.user.findMany({
    where: { role: role as any, is_active: true },
    select: { id: true },
  });
  for (const user of users) {
    await notify({ userId: user.id, title, message, entityType, entityId });
  }
}
