/**
 * Mail abstraction.
 *
 * Every outgoing email is recorded in the MailLog table — gives admin/audit
 * visibility and lets E2E tests retrieve verification/reset links without
 * a real inbox.
 *
 * Two implementations:
 * - DevMailer (default): only writes to MailLog. Used in tests and any
 *   environment that has not configured SMTP.
 * - SmtpMailer (Phase 2.x): wraps nodemailer; we wire it in once the user
 *   provides SMTP credentials. The interface stays the same.
 */
import type { MailCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export interface OutgoingMail {
  to: string;
  subject: string;
  body: string;
  category: MailCategory;
  refId?: string;
}

export interface Mailer {
  send(mail: OutgoingMail): Promise<{ id: string; deliveredAt: Date | null }>;
}

class DevMailer implements Mailer {
  async send(mail: OutgoingMail) {
    const now = new Date();
    const row = await prisma.mailLog.create({
      data: {
        toAddress: mail.to,
        subject: mail.subject,
        body: mail.body,
        category: mail.category,
        refId: mail.refId,
        sentAt: now,
      },
    });
    return { id: row.id, deliveredAt: row.sentAt };
  }
}

let cached: Mailer | null = null;

/** Resolve the mailer based on env. */
export function getMailer(): Mailer {
  if (cached) return cached;
  // Future: if (process.env.SMTP_HOST) cached = new SmtpMailer(...)
  cached = new DevMailer();
  return cached;
}

/** Test helper to inject a fake mailer (vitest only). */
export function __setMailer(mailer: Mailer | null) {
  cached = mailer;
}
