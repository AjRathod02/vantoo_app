import { getPool } from "../db/pool.js";
export class NotificationService {
    renderTemplate(template, variables) {
        return template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? "");
    }
    async send(input) {
        const pool = getPool();
        let title = input.title ?? "";
        let body = input.body ?? "";
        if (input.templateName) {
            const templateResult = await pool.query(`SELECT subject, body FROM notifications.notification_templates
         WHERE name = $1 AND is_active = TRUE`, [input.templateName]);
            if (templateResult.rows.length > 0) {
                const tpl = templateResult.rows[0];
                title = this.renderTemplate(tpl.subject || input.templateName, input.variables ?? {});
                body = this.renderTemplate(tpl.body, input.variables ?? {});
            }
        }
        if (!body)
            throw new Error("Notification body is required");
        const result = await pool.query(`INSERT INTO notifications.notifications
       (user_id, channel, template_name, title, body, data, status, reference_type, reference_id, sent_at)
       VALUES ($1,$2,$3,$4,$5,$6,'sent',$7,$8,NOW())
       RETURNING *`, [
            input.userId ?? null,
            input.channel,
            input.templateName ?? null,
            title || "Notification",
            body,
            JSON.stringify(input.data ?? {}),
            input.referenceType ?? null,
            input.referenceId ?? null,
        ]);
        await pool.query(`INSERT INTO notifications.delivery_log (notification_id, channel, provider, status)
       VALUES ($1, $2, 'internal', 'sent')`, [result.rows[0].id, input.channel]);
        if (input.channel === "sms" && input.recipient) {
            console.info(`[SMS → ${input.recipient}] ${body}`);
        }
        return this.mapRow(result.rows[0]);
    }
    async list(userId, limit = 20) {
        const pool = getPool();
        const result = await pool.query(`SELECT * FROM notifications.notifications
       WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`, [userId, limit]);
        return result.rows.map(this.mapRow);
    }
    async markRead(id, userId) {
        const pool = getPool();
        await pool.query(`UPDATE notifications.notifications SET status = 'read', read_at = NOW()
       WHERE id = $1 AND user_id = $2`, [id, userId]);
    }
    mapRow(row) {
        return {
            id: row.id,
            userId: row.user_id,
            channel: row.channel,
            templateName: row.template_name,
            title: row.title,
            body: row.body,
            data: row.data,
            status: row.status,
            referenceType: row.reference_type,
            referenceId: row.reference_id,
            readAt: row.read_at ? row.read_at.toISOString() : null,
            sentAt: row.sent_at ? row.sent_at.toISOString() : null,
            createdAt: row.created_at.toISOString(),
        };
    }
}
export const notificationService = new NotificationService();
