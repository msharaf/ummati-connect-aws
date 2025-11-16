import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) {
    console.log("[DEV EMAIL]", { to, subject, html });
    return;
  }

  if (!resend) {
    console.error("[EMAIL] Resend client not initialized");
    return;
  }

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "notifications@ummati.com",
      to,
      subject,
      html
    });
  } catch (error) {
    console.error("[EMAIL] Failed to send email:", error);
    throw error;
  }
}

