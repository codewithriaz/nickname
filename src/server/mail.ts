import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { siteConfig } from "@/config/site";
import { env } from "./env";

let transporter: Transporter | null | undefined;

function getTransporter() {
  if (transporter !== undefined) return transporter;
  const e = env();
  transporter = e.SMTP_HOST
    ? nodemailer.createTransport({
        host: e.SMTP_HOST,
        port: e.SMTP_PORT,
        secure: e.SMTP_PORT === 465,
        auth: e.SMTP_USER ? { user: e.SMTP_USER, pass: e.SMTP_PASS } : undefined,
      })
    : null;
  return transporter;
}

export async function sendMail(to: string, subject: string, html: string) {
  const t = getTransporter();
  if (!t) {
    console.info(`[mail:dev] to=${to} subject="${subject}"\n${html.replace(/<[^>]+>/g, " ")}`);
    return;
  }
  try {
    await t.sendMail({ from: env().SMTP_FROM, to, subject, html });
  } catch (e) {
    console.error("[mail] failed", e);
  }
}

export const emailLayout = (title: string, body: string) => `
<div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#111">
  <h2 style="margin:0 0 16px">${title}</h2>
  ${body}
  <p style="color:#888;font-size:12px;margin-top:32px">— ${siteConfig.name}</p>
</div>`;
