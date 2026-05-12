import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';
import { logAudit } from '../audit.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const { category, search } = req.query as Record<string, string>;
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (category) { params.push(category); conditions.push(`category = $${params.length}`); }
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(name ILIKE $${params.length} OR description ILIKE $${params.length})`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `SELECT id, name, description, category,
            jsonb_array_length(content) AS block_count,
            jsonb_array_length(schema) AS field_count,
            created_by, created_at, updated_at
     FROM document_templates ${where}
     ORDER BY updated_at DESC`,
    params,
  );
  res.json(rows);
});

router.get('/:id', requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT * FROM document_templates WHERE id = $1`, [req.params.id],
  );
  if (!rows[0]) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(rows[0]);
});

router.post('/', requireAuth, async (req, res) => {
  const authed = req as AuthedRequest;
  const { name, description, category, content, schema, settings } = req.body;
  if (!name) { res.status(400).json({ error: 'name required' }); return; }

  const { rows } = await pool.query(
    `INSERT INTO document_templates (name, description, category, content, schema, settings, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [name, description || null, category || 'General',
     JSON.stringify(content || []), JSON.stringify(schema || []),
     JSON.stringify(settings || {}), authed.uid],
  );
  logAudit({ userId: authed.uid, action: `Created document template: ${name}`, type: 'User', severity: 'Info', resourceType: 'document_template', resourceId: rows[0].id });
  res.status(201).json(rows[0]);
});

router.put('/:id', requireAuth, async (req, res) => {
  const authed = req as AuthedRequest;
  const { name, description, category, content, schema, settings } = req.body;

  const { rows } = await pool.query(
    `UPDATE document_templates
     SET name=$1, description=$2, category=$3, content=$4, schema=$5, settings=$6, updated_at=NOW()
     WHERE id=$7 RETURNING *`,
    [name, description || null, category || 'General',
     JSON.stringify(content || []), JSON.stringify(schema || []),
     JSON.stringify(settings || {}), req.params.id],
  );
  if (!rows[0]) { res.status(404).json({ error: 'Not found' }); return; }
  logAudit({ userId: authed.uid, action: `Updated document template: ${name}`, type: 'User', severity: 'Info', resourceType: 'document_template', resourceId: req.params.id });
  res.json(rows[0]);
});

router.post('/:id/duplicate', requireAuth, async (req, res) => {
  const authed = req as AuthedRequest;
  const { rows: src } = await pool.query(`SELECT * FROM document_templates WHERE id = $1`, [req.params.id]);
  if (!src[0]) { res.status(404).json({ error: 'Not found' }); return; }

  const { rows } = await pool.query(
    `INSERT INTO document_templates (name, description, category, content, schema, settings, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [`${src[0].name} (Copy)`, src[0].description, src[0].category,
     JSON.stringify(src[0].content), JSON.stringify(src[0].schema),
     JSON.stringify(src[0].settings), authed.uid],
  );
  res.status(201).json(rows[0]);
});

router.delete('/:id', requireAuth, async (req, res) => {
  const authed = req as AuthedRequest;
  await pool.query(`DELETE FROM document_templates WHERE id = $1`, [req.params.id]);
  logAudit({ userId: authed.uid, action: `Deleted document template`, type: 'User', severity: 'Warning', resourceType: 'document_template', resourceId: req.params.id });
  res.status(204).send();
});

export default router;
