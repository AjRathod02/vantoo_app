import { getPool } from "../db/pool.js";
import { AppError } from "../utils/errors.js";
function mapDocument(row) {
    return {
        id: row.id,
        riderId: row.rider_id,
        documentType: row.document_type,
        documentNumber: row.document_number ?? null,
        fileUrl: row.file_url,
        status: row.status,
        rejectionReason: row.rejection_reason ?? null,
        verifiedAt: row.verified_at ? row.verified_at.toISOString() : null,
        expiresAt: row.expires_at ? row.expires_at.toISOString() : null,
        createdAt: row.created_at.toISOString(),
    };
}
export class DocumentService {
    async list(riderId) {
        const pool = getPool();
        const result = await pool.query(`SELECT * FROM rider.rider_documents WHERE rider_id = $1 ORDER BY created_at DESC`, [riderId]);
        return result.rows.map(mapDocument);
    }
    async upload(riderId, input) {
        const pool = getPool();
        const result = await pool.query(`INSERT INTO rider.rider_documents (rider_id, document_type, document_number, file_url, expires_at)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`, [riderId, input.documentType, input.documentNumber ?? null, input.fileUrl, input.expiresAt ?? null]);
        await pool.query(`UPDATE rider.riders SET status = 'under_review', updated_at = NOW()
       WHERE id = $1 AND status = 'pending'`, [riderId]);
        return mapDocument(result.rows[0]);
    }
    async verify(documentId, adminUserId) {
        const pool = getPool();
        const result = await pool.query(`UPDATE rider.rider_documents SET status = 'verified', verified_at = NOW(), verified_by = $2, updated_at = NOW()
       WHERE id = $1 RETURNING *`, [documentId, adminUserId]);
        if (result.rows.length === 0)
            throw AppError.notFound("Document not found");
        return mapDocument(result.rows[0]);
    }
}
export const documentService = new DocumentService();
