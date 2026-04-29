import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// GET /api/racks?siteId=xxx
router.get('/', requireAuth, async (req, res) => {
  const { siteId } = req.query;
  const { rows } = siteId
    ? await pool.query('SELECT * FROM racks WHERE site_id=$1 ORDER BY name', [siteId])
    : await pool.query('SELECT * FROM racks ORDER BY site_id, name');
  res.json(rows);
});

// GET /api/racks/:id
router.get('/:id', requireAuth, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM racks WHERE id=$1', [req.params.id]);
  if (!rows.length) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(rows[0]);
});

// POST /api/racks
router.post('/', requireAdmin, async (req, res) => {
  const { id, site_id, name, position, total_u, notes } = req.body;
  const { rows } = await pool.query(`
    INSERT INTO racks (id, site_id, name, position, total_u, notes)
    VALUES ($1,$2,$3,$4,$5,$6) RETURNING *
  `, [id || `${site_id}-${name}`.toLowerCase().replace(/\s+/g,'-'),
      site_id, name, position||null, total_u||null, notes||null]);
  res.status(201).json(rows[0]);
});

// PUT /api/racks/:id
router.put('/:id', requireAdmin, async (req, res) => {
  const { name, position, total_u, notes } = req.body;
  const { rows } = await pool.query(`
    UPDATE racks SET name=$1, position=$2, total_u=$3, notes=$4
    WHERE id=$5 RETURNING *
  `, [name, position||null, total_u||null, notes||null, req.params.id]);
  if (!rows.length) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(rows[0]);
});

// DELETE /api/racks/:id
router.delete('/:id', requireAdmin, async (req, res) => {
  await pool.query('DELETE FROM racks WHERE id=$1', [req.params.id]);
  res.status(204).end();
});

export default router;
