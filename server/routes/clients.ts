import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// GET /api/clients
router.get('/', requireAuth, async (_req, res) => {
  const { rows } = await pool.query(`
    SELECT * FROM clients ORDER BY parent_client_id NULLS FIRST, name
  `);
  res.json(rows);
});

// GET /api/clients/:id
router.get('/:id', requireAuth, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM clients WHERE id = $1', [req.params.id]);
  if (!rows.length) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(rows[0]);
});

// POST /api/clients
router.post('/', requireAdmin, async (req, res) => {
  const { id, name, slug, status, parent_client_id, legal_name, address, website, primary_contact_email, notes } = req.body;
  const { rows } = await pool.query(`
    INSERT INTO clients (id, name, slug, status, parent_client_id, legal_name, address, website, primary_contact_email, notes)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    RETURNING *
  `, [id || slug, name, slug, status || 'Active', parent_client_id || null, legal_name || null,
      address || null, website || null, primary_contact_email || null, notes || null]);
  res.status(201).json(rows[0]);
});

// PUT /api/clients/:id
router.put('/:id', requireAdmin, async (req, res) => {
  const { name, slug, status, parent_client_id, legal_name, address, website, primary_contact_email, notes } = req.body;
  const { rows } = await pool.query(`
    UPDATE clients SET
      name=$1, slug=$2, status=$3, parent_client_id=$4, legal_name=$5,
      address=$6, website=$7, primary_contact_email=$8, notes=$9
    WHERE id=$10 RETURNING *
  `, [name, slug, status, parent_client_id || null, legal_name || null,
      address || null, website || null, primary_contact_email || null, notes || null, req.params.id]);
  if (!rows.length) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(rows[0]);
});

// DELETE /api/clients/:id
router.delete('/:id', requireAdmin, async (req, res) => {
  await pool.query('DELETE FROM clients WHERE id = $1', [req.params.id]);
  res.status(204).end();
});

export default router;
