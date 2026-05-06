import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';
import { logAudit } from '../audit.js';

const router = Router();

// GET /api/audit-logs?search=&type=&severity=&limit=&offset=
router.get('/', requireAuth, async (req, res) => {
  const { search, type, severity } = req.query as Record<string, string>;
  const limit  = Math.min(Number(req.query.limit)  || 200, 500);
  const offset = Number(req.query.offset) || 0;

  const conditions: string[] = [];
  const params: unknown[]    = [];

  if (type) {
    params.push(type);
    conditions.push(`al.type = $${params.length}`);
  }
  if (severity) {
    params.push(severity);
    conditions.push(`al.severity = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    const n = params.length;
    conditions.push(
      `(al.action ILIKE $${n} OR COALESCE(u.email,'') ILIKE $${n} OR al.details::text ILIKE $${n})`
    );
  }

  params.push(limit);
  const limitIdx = params.length;
  params.push(offset);
  const offsetIdx = params.length;

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const { rows } = await pool.query(
    `SELECT al.id, al.action, al.type, al.severity,
            al.resource_type, al.resource_id, al.details, al.created_at,
            COALESCE(u.email, 'system') AS user_email
     FROM   audit_logs al
     LEFT JOIN users u ON u.uid = al.user_id
     ${where}
     ORDER BY al.created_at DESC
     LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    params
  );
  res.json(rows);
});

// POST /api/audit-logs — clients can write their own events (e.g. UI actions)
router.post('/', requireAuth, async (req, res) => {
  const authed = req as AuthedRequest;
  const { action, type, severity, resource_type, resource_id, details } = req.body;
  if (!action) { res.status(400).json({ error: 'action required' }); return; }

  logAudit({
    userId:       authed.uid,
    action,
    type:         type       || 'User',
    severity:     severity   || 'Info',
    resourceType: resource_type || undefined,
    resourceId:   resource_id   || undefined,
    details:      details        || undefined,
  });

  res.status(201).json({ ok: true });
});

export default router;
