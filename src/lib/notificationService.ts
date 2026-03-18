import { prisma } from "@/lib/prisma";
import {
  sendEmail,
  buildEmailHtml,
  sendApprovalRequestEmail,
  sendReminderEmail,
  sendOverdueAlertEmail,
  sendOrderAssignedEmail,
  sendTechPackRevisionEmail,
  sendPaymentConfirmationEmail,
} from "./email";

// ---------------------------------------------------------------------------
// Core notification params
// ---------------------------------------------------------------------------

interface NotifyUserParams {
  title: string;
  message: string;
  entity_type: string;
  entity_id: string;
  send_email?: boolean;
  action_url?: string;
  action_label?: string;
}

interface NotifyRoleParams extends NotifyUserParams {
  /** If true, only notify active users with the given role */
  active_only?: boolean;
}

// ---------------------------------------------------------------------------
// Notify a single user (in-app + optional email)
// ---------------------------------------------------------------------------

export async function notifyUser(userId: string, params: NotifyUserParams) {
  // Create in-app notification
  await prisma.notification.create({
    data: {
      user_id: userId,
      title: params.title,
      message: params.message,
      entity_type: params.entity_type,
      entity_id: params.entity_id,
    },
  });

  // Send email if requested and user has email
  if (params.send_email) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true, is_active: true },
      });
      if (user?.email && user.is_active) {
        const html = buildEmailHtml(
          params.title,
          `<p>${escapeHtmlBasic(params.message)}</p>`,
          params.action_url,
          params.action_label
        );
        await sendEmail(user.email, params.title, html);
      }
    } catch (err) {
      console.error(`Failed to send email notification to user ${userId}:`, err);
    }
  }
}

// ---------------------------------------------------------------------------
// Notify all users with a given role (in-app + optional email)
// ---------------------------------------------------------------------------

export async function notifyRole(role: string, params: NotifyRoleParams) {
  const activeOnly = params.active_only ?? true;

  const users = await prisma.user.findMany({
    where: {
      role: role as never,
      ...(activeOnly ? { is_active: true } : {}),
    },
    select: { id: true },
  });

  const promises = users.map((user) => notifyUser(user.id, params));
  await Promise.allSettled(promises);
}

// ---------------------------------------------------------------------------
// Pre-built notification workflows
// ---------------------------------------------------------------------------

/**
 * Send combined in-app + email notification for approval requests.
 * Targets a specific approver (typically an ACCOUNTANT).
 */
export async function notifyApproval(
  approverId: string,
  entityType: string,
  entityNo: string,
  amount: number
) {
  // In-app notification
  await prisma.notification.create({
    data: {
      user_id: approverId,
      title: `Approval Required — ${entityType} ${entityNo}`,
      message: `A ${entityType} (${entityNo}) worth ${formatCurrency(amount)} requires your approval.`,
      entity_type: entityType,
      entity_id: entityNo,
    },
  });

  // Email notification
  try {
    const user = await prisma.user.findUnique({
      where: { id: approverId },
      select: { email: true, is_active: true },
    });
    if (user?.email && user.is_active) {
      await sendApprovalRequestEmail(user.email, entityType, entityNo, amount);
    }
  } catch (err) {
    console.error(`Failed to send approval email to user ${approverId}:`, err);
  }
}

/**
 * Notify a user that an order has been assigned to them.
 */
export async function notifyOrderAssigned(
  userId: string,
  orderNo: string,
  role: string
) {
  await prisma.notification.create({
    data: {
      user_id: userId,
      title: `Order Assigned: ${orderNo}`,
      message: `You have been assigned to order ${orderNo} as ${role}.`,
      entity_type: "ORDER",
      entity_id: orderNo,
    },
  });

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, is_active: true },
    });
    if (user?.email && user.is_active) {
      await sendOrderAssignedEmail(user.email, orderNo, role);
    }
  } catch (err) {
    console.error(`Failed to send order assigned email to user ${userId}:`, err);
  }
}

/**
 * Notify a merchandiser that a tech pack needs revision.
 */
export async function notifyTechPackRevision(
  userId: string,
  techPackNo: string,
  orderNo: string,
  notes: string
) {
  await prisma.notification.create({
    data: {
      user_id: userId,
      title: `Tech Pack Revision Required: ${techPackNo}`,
      message: `Tech pack ${techPackNo} for order ${orderNo} needs revision. Notes: ${notes}`,
      entity_type: "TECH_PACK",
      entity_id: techPackNo,
    },
  });

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, is_active: true },
    });
    if (user?.email && user.is_active) {
      await sendTechPackRevisionEmail(user.email, techPackNo, orderNo, notes);
    }
  } catch (err) {
    console.error(`Failed to send tech pack revision email to user ${userId}:`, err);
  }
}

/**
 * Notify relevant parties that a payment has been completed.
 */
export async function notifyPaymentCompleted(
  userId: string,
  purchaseNo: string,
  amount: number,
  method: string
) {
  await prisma.notification.create({
    data: {
      user_id: userId,
      title: `Payment Completed: ${purchaseNo}`,
      message: `Payment of ${formatCurrency(amount)} via ${method} has been processed for purchase ${purchaseNo}.`,
      entity_type: "PURCHASE",
      entity_id: purchaseNo,
    },
  });

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, is_active: true },
    });
    if (user?.email && user.is_active) {
      await sendPaymentConfirmationEmail(user.email, purchaseNo, amount, method);
    }
  } catch (err) {
    console.error(`Failed to send payment confirmation email to user ${userId}:`, err);
  }
}

/**
 * Send a reminder notification (in-app + email) to a specific user.
 */
export async function notifyReminder(
  userId: string,
  entityType: string,
  entityNo: string,
  message: string
) {
  await prisma.notification.create({
    data: {
      user_id: userId,
      title: `Reminder — ${entityType} ${entityNo}`,
      message,
      entity_type: entityType,
      entity_id: entityNo,
    },
  });

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, is_active: true },
    });
    if (user?.email && user.is_active) {
      await sendReminderEmail(user.email, entityType, entityNo, message);
    }
  } catch (err) {
    console.error(`Failed to send reminder email to user ${userId}:`, err);
  }
}

/**
 * Send an overdue alert (in-app + email) to a specific user.
 */
export async function notifyOverdue(
  userId: string,
  entityType: string,
  entityNo: string,
  daysPending: number
) {
  await prisma.notification.create({
    data: {
      user_id: userId,
      title: `Overdue Alert — ${entityType} ${entityNo}`,
      message: `${entityType} ${entityNo} has been pending for ${daysPending} day${daysPending === 1 ? "" : "s"} and requires immediate attention.`,
      entity_type: entityType,
      entity_id: entityNo,
    },
  });

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, is_active: true },
    });
    if (user?.email && user.is_active) {
      await sendOverdueAlertEmail(user.email, entityType, entityNo, daysPending);
    }
  } catch (err) {
    console.error(`Failed to send overdue alert email to user ${userId}:`, err);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);
}

function escapeHtmlBasic(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
