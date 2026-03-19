import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Simple serial queue without external dependency
let pending: Promise<void> = Promise.resolve();

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function sendEmail(to: string, subject: string, html: string) {
  pending = pending.then(async () => {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await transporter.sendMail({
          from: process.env.SMTP_USER || "noreply@cashflow.com",
          to,
          subject,
          html,
        });
        break;
      } catch (e) {
        if (attempt === 3) console.error("Email failed after 3 attempts:", e);
        else await sleep(attempt * 2000);
      }
    }
  });
}

// ---------------------------------------------------------------------------
// Reusable HTML email template builder
// ---------------------------------------------------------------------------

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000";

export function buildEmailHtml(
  title: string,
  body: string,
  actionUrl?: string,
  actionLabel?: string
): string {
  const actionButton = actionUrl
    ? `
      <div style="text-align:center;margin:28px 0;">
        <a href="${escapeHtml(actionUrl)}"
           style="display:inline-block;padding:12px 28px;background-color:#2563eb;color:#ffffff;
                  text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;">
          ${escapeHtml(actionLabel || "View Details")}
        </a>
      </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0"
             style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background-color:#1e293b;padding:20px 32px;">
            <h1 style="margin:0;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:0.5px;">
              Manufacturer Lab
            </h1>
          </td>
        </tr>
        <!-- Title -->
        <tr>
          <td style="padding:28px 32px 0 32px;">
            <h2 style="margin:0 0 16px 0;color:#1e293b;font-size:20px;font-weight:600;">
              ${escapeHtml(title)}
            </h2>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:0 32px;color:#374151;font-size:14px;line-height:1.7;">
            ${body}
          </td>
        </tr>
        <!-- Action Button -->
        <tr>
          <td style="padding:0 32px;">
            ${actionButton}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:24px 32px;border-top:1px solid #e5e7eb;margin-top:24px;">
            <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.5;">
              This is an automated notification from Manufacturer Lab. Please do not reply to this email.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ---------------------------------------------------------------------------
// Template email functions
// ---------------------------------------------------------------------------

export async function sendOrderAssignedEmail(
  to: string,
  orderNo: string,
  role: string
) {
  const subject = `Order ${orderNo} — Assigned to you`;
  const body = `
    <p>You have been assigned to order <strong>${escapeHtml(orderNo)}</strong> as <strong>${escapeHtml(role)}</strong>.</p>
    <p>Please review the order details and take the required next action at your earliest convenience.</p>`;
  const html = buildEmailHtml(
    `Order Assigned: ${orderNo}`,
    body,
    `${APP_URL}/orders`,
    "View Order"
  );
  await sendEmail(to, subject, html);
}

export async function sendApprovalRequestEmail(
  to: string,
  entityType: string,
  entityNo: string,
  amount: number
) {
  const formattedAmount = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);

  const subject = `Approval Required — ${entityType} ${entityNo}`;
  const body = `
    <p>A new <strong>${escapeHtml(entityType)}</strong> requires your approval.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr>
        <td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-size:13px;color:#6b7280;width:140px;">Reference</td>
        <td style="padding:8px 12px;border:1px solid #e5e7eb;font-size:14px;font-weight:600;">${escapeHtml(entityNo)}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-size:13px;color:#6b7280;">Amount</td>
        <td style="padding:8px 12px;border:1px solid #e5e7eb;font-size:14px;font-weight:600;">${escapeHtml(formattedAmount)}</td>
      </tr>
    </table>
    <p>Please review and take action.</p>`;
  const html = buildEmailHtml(
    `Approval Required: ${entityNo}`,
    body,
    `${APP_URL}/approvals`,
    "Review Now"
  );
  await sendEmail(to, subject, html);
}

export async function sendPaymentConfirmationEmail(
  to: string,
  purchaseNo: string,
  amount: number,
  method: string
) {
  const formattedAmount = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);

  const subject = `Payment Completed — ${purchaseNo}`;
  const body = `
    <p>Payment has been processed for purchase <strong>${escapeHtml(purchaseNo)}</strong>.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr>
        <td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-size:13px;color:#6b7280;width:140px;">Purchase No</td>
        <td style="padding:8px 12px;border:1px solid #e5e7eb;font-size:14px;font-weight:600;">${escapeHtml(purchaseNo)}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-size:13px;color:#6b7280;">Amount Paid</td>
        <td style="padding:8px 12px;border:1px solid #e5e7eb;font-size:14px;font-weight:600;">${escapeHtml(formattedAmount)}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-size:13px;color:#6b7280;">Payment Method</td>
        <td style="padding:8px 12px;border:1px solid #e5e7eb;font-size:14px;font-weight:600;">${escapeHtml(method)}</td>
      </tr>
    </table>`;
  const html = buildEmailHtml(
    `Payment Confirmed: ${purchaseNo}`,
    body,
    `${APP_URL}/purchases`,
    "View Purchase"
  );
  await sendEmail(to, subject, html);
}

export async function sendReminderEmail(
  to: string,
  entityType: string,
  entityNo: string,
  message: string
) {
  const subject = `Reminder — ${entityType} ${entityNo}`;
  const body = `
    <p>This is a reminder regarding <strong>${escapeHtml(entityType)}</strong> <strong>${escapeHtml(entityNo)}</strong>.</p>
    <div style="background-color:#eff6ff;border-left:4px solid #3b82f6;padding:12px 16px;margin:16px 0;border-radius:4px;">
      <p style="margin:0;font-size:14px;color:#1e40af;">${escapeHtml(message)}</p>
    </div>
    <p>Please take action at your earliest convenience.</p>`;
  const html = buildEmailHtml(
    `Reminder: ${entityType} ${entityNo}`,
    body,
    `${APP_URL}`,
    "Open Dashboard"
  );
  await sendEmail(to, subject, html);
}

export async function sendOverdueAlertEmail(
  to: string,
  entityType: string,
  entityNo: string,
  daysPending: number
) {
  const subject = `Overdue Alert — ${entityType} ${entityNo} (${daysPending} days)`;
  const body = `
    <div style="background-color:#fef2f2;border-left:4px solid #ef4444;padding:12px 16px;margin:0 0 16px 0;border-radius:4px;">
      <p style="margin:0;font-size:14px;color:#991b1b;font-weight:600;">
        This item is overdue by ${daysPending} day${daysPending === 1 ? "" : "s"}.
      </p>
    </div>
    <p><strong>${escapeHtml(entityType)}</strong> <strong>${escapeHtml(entityNo)}</strong> has been pending for <strong>${daysPending} day${daysPending === 1 ? "" : "s"}</strong> and requires immediate attention.</p>
    <p>Please review and take action to avoid further delays.</p>`;
  const html = buildEmailHtml(
    `Overdue: ${entityType} ${entityNo}`,
    body,
    `${APP_URL}`,
    "Take Action"
  );
  await sendEmail(to, subject, html);
}
