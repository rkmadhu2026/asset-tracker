import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, requireAdmin, type AuthedRequest } from '../middleware/auth.js';
import type { Request } from 'express';

const router = Router();

// GET /api/assets
router.get('/', requireAuth, async (req, res) => {
  const { clientId, siteId, status } = req.query as Record<string, string>;
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (clientId) { params.push(clientId); conditions.push(`client_id=$${params.length}`); }
  if (siteId)   { params.push(siteId);   conditions.push(`site_id=$${params.length}`); }
  if (status)   { params.push(status);   conditions.push(`status=$${params.length}`); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await pool.query(`SELECT * FROM assets ${where} ORDER BY name`, params);
  res.json(rows);
});

// GET /api/assets/:id
router.get('/:id', requireAuth, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM assets WHERE id=$1', [req.params.id]);
  if (!rows.length) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(rows[0]);
});

// POST /api/assets
router.post('/', requireAuth, async (req, res) => {
  const d = req.body;
  const { rows } = await pool.query(`
    INSERT INTO assets (id, name, type, manufacturer, model, status, ip, serial, os, risk, warranty, tags, owner, site_id, client_id)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *
  `, [d.id, d.name, d.type||null, d.manufacturer||null, d.model||null,
      d.status||'Active', d.ip||null, d.serial||null, d.os||null,
      d.risk||null, d.warranty||null, d.tags||null,
      d.owner||null, d.site_id||null, d.client_id||null]);
  res.status(201).json(rows[0]);
});

// PUT /api/assets/:id
router.put('/:id', requireAuth, async (req, res) => {
  const d = req.body;
  const { rows } = await pool.query(`
    UPDATE assets SET name=$1, type=$2, manufacturer=$3, model=$4, status=$5, ip=$6,
      serial=$7, os=$8, risk=$9, warranty=$10, tags=$11, owner=$12, site_id=$13, client_id=$14
    WHERE id=$15 RETURNING *
  `, [d.name, d.type||null, d.manufacturer||null, d.model||null,
      d.status||'Active', d.ip||null, d.serial||null, d.os||null,
      d.risk||null, d.warranty||null, d.tags||null,
      d.owner||null, d.site_id||null, d.client_id||null, req.params.id]);
  if (!rows.length) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(rows[0]);
});

// PATCH /api/assets/bulk — bulk field update
router.patch('/bulk', requireAdmin, async (req, res) => {
  const { ids, field, value } = req.body;
  if (!ids?.length || !field) { res.status(400).json({ error: 'ids and field required' }); return; }
  const allowed = ['status','owner','site_id','client_id','type'];
  if (!allowed.includes(field)) { res.status(400).json({ error: 'Field not bulk-updatable' }); return; }
  await pool.query(
    `UPDATE assets SET ${field}=$1 WHERE id = ANY($2::text[])`,
    [value, ids]
  );
  res.json({ updated: ids.length });
});

// DELETE /api/assets/:id
router.delete('/:id', requireAdmin, async (req, res) => {
  await pool.query('DELETE FROM assets WHERE id=$1', [req.params.id]);
  res.status(204).end();
});

// ── Asset Documents ────────────────────────────────────────────────────────

router.get('/:id/documents', requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM asset_documents WHERE asset_id=$1 ORDER BY created_at DESC', [req.params.id]
  );
  res.json(rows);
});

router.post('/:id/documents', requireAuth, async (req, res) => {
  const { name, url, type } = req.body;
  const { rows } = await pool.query(`
    INSERT INTO asset_documents (asset_id, name, url, type, uploaded_by)
    VALUES ($1,$2,$3,$4,$5) RETURNING *
  `, [req.params.id, name, url, type||null, (req as AuthedRequest).uid]);
  res.status(201).json(rows[0]);
});

// ── Asset Types ────────────────────────────────────────────────────────────

router.get('/types/list', requireAuth, async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM asset_types ORDER BY name');
  res.json(rows);
});

router.post('/types/list', requireAuth, async (req, res) => {
  const { name } = req.body;
  const id = name.toLowerCase().replace(/\s+/g, '-');
  const { rows } = await pool.query(
    'INSERT INTO asset_types (id, name) VALUES ($1,$2) ON CONFLICT (id) DO NOTHING RETURNING *',
    [id, name]
  );
  res.status(201).json(rows[0] || { id, name });
});

// ── Device Types ───────────────────────────────────────────────────────────

router.get('/device-types', requireAuth, async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM device_types ORDER BY name');
  res.json(rows);
});

router.post('/device-types', requireAuth, async (req, res) => {
  const { name } = req.body;
  const id = name.toLowerCase().replace(/\s+/g, '-');
  const { rows } = await pool.query(
    'INSERT INTO device_types (id, name) VALUES ($1,$2) ON CONFLICT (id) DO NOTHING RETURNING *',
    [id, name]
  );
  res.status(201).json(rows[0] || { id, name });
});

export default router;
