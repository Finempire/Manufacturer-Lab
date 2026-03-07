import PQueue from "p-queue";
import nodemailer from "nodemailer";

const queue = new PQueue({ concurrency: 1 });

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function sendEmail(to: string, subject: string, html: string) {
  queue.add(async () => {
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
