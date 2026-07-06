import { getPool } from "../db/pool.js";
import type { Notification, SendNotificationInput } from "@vantoo/shared";

export class NotificationService {
  private renderTemplate(template: string, variables: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? "");
  }

  async send(input: SendNotificationInput): Promise<Notification> {
    const pool = getPool();
    let title = input.title ?? "";
    let body = input.body ?? "";

    if (input.templateName) {
      const templateResult = await pool.query(
        `SELECT subject, body FROM notifications.notification_templates
         WHERE name = $1 AND is_active = TRUE`,
        [input.templateName]
      );
      if (templateResult.rows.length > 0) {
        const tpl = templateResult.rows[0];
        title = this.renderTemplate(tpl.subject || input.templateName, input.variables ?? {});
        body = this.renderTemplate(tpl.body, input.variables ?? {});
      }
    }

    if (!body) throw new Error("Notification body is required");

    const result = await pool.query(
      `INSERT INTO notifications.notifications
       (user_id, channel, template_name, title, body, data, status, reference_type, reference_id, sent_at)
       VALUES ($1,$2,$3,$4,$5,$6,'sent',$7,$8,NOW())
       RETURNING *`,
      [
        input.userId ?? null,
        input.channel,
        input.templateName ?? null,
        title || "Notification",
        body,
        JSON.stringify(input.data ?? {}),
        input.referenceType ?? null,
        input.referenceId ?? null,
      ]
    );

    await pool.query(
      `INSERT INTO notifications.delivery_log (notification_id, channel, provider, status)
       VALUES ($1, $2, 'internal', 'sent')`,
      [result.rows[0].id, input.channel]
    );

    if (input.channel === "sms" && input.recipient) {
      console.info(`[SMS → ${input.recipient}] ${body}`);
    }

    return this.mapRow(result.rows[0]);
  }

  async list(userId: string, limit = 20): Promise<Notification[]> {
    const pool = getPool();
    const result = await pool.query(
      `SELECT * FROM notifications.notifications
       WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [userId, limit]
    );
    return result.rows.map(this.mapRow);
  }

  async markRead(id: string, userId: string): Promise<void> {
    const pool = getPool();
    await pool.query(
      `UPDATE notifications.notifications SET status = 'read', read_at = NOW()
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
  }

  private mapRow(row: Record<string, unknown>): Notification {
    return {
      id: row.id as string,
      userId: row.user_id as string | null,
      channel: row.channel as Notification["channel"],
      templateName: row.template_name as string | null,
      title: row.title as string,
      body: row.body as string,
      data: row.data as Record<string, unknown>,
      status: row.status as Notification["status"],
      referenceType: row.reference_type as string | null,
      referenceId: row.reference_id as string | null,
      readAt: row.read_at ? (row.read_at as Date).toISOString() : null,
      sentAt: row.sent_at ? (row.sent_at as Date).toISOString() : null,
      createdAt: (row.created_at as Date).toISOString(),
    };
  }
}

export const notificationService = new NotificationService();
