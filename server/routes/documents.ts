import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';
import { logAudit } from '../audit.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const { templateId, search } = req.query as Record<string, string>;
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (templateId) { params.push(templateId); conditions.push(`gd.template_id = $${params.length}`); }
  if (search) { params.push(`%${search}%`); conditions.push(`gd.name ILIKE $${params.length}`); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `SELECT gd.id, gd.template_id, dt.name AS template_name,
            gd.name, gd.status, gd.created_by, gd.created_at
     FROM generated_documents gd
     LEFT JOIN document_templates dt ON dt.id = gd.template_id
     ${where}
     ORDER BY gd.created_at DESC
     LIMIT 200`,
    params,
  );
  res.json(rows);
});

router.get('/:id', requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT gd.*, dt.name AS template_name, dt.content, dt.schema, dt.settings
     FROM generated_documents gd
     LEFT JOIN document_templates dt ON dt.id = gd.template_id
     WHERE gd.id = $1`,
    [req.params.id],
  );
  if (!rows[0]) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(rows[0]);
});

router.post('/', requireAuth, async (req, res) => {
  const authed = req as AuthedRequest;
  const { template_id, name, data } = req.body;
  if (!name) { res.status(400).json({ error: 'name required' }); return; }

  const { rows } = await pool.query(
    `INSERT INTO generated_documents (template_id, name, data, created_by)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [template_id || null, name, JSON.stringify(data || {}), authed.uid],
  );
  logAudit({ userId: authed.uid, action: `Generated document: ${name}`, type: 'User', severity: 'Info', resourceType: 'generated_document', resourceId: rows[0].id });
  res.status(201).json(rows[0]);
});

router.delete('/:id', requireAuth, async (req, res) => {
  const authed = req as AuthedRequest;
  await pool.query(`DELETE FROM generated_documents WHERE id = $1`, [req.params.id]);
  logAudit({ userId: authed.uid, action: `Deleted generated document`, type: 'User', severity: 'Warning', resourceType: 'generated_document', resourceId: req.params.id });
  res.status(204).send();
});

export default router;
