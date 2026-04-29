import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM device_templates ORDER BY name');
  res.json(rows);
});

router.post('/', requireAuth, async (req, res) => {
  const { name, vendor, model, type, defaults } = req.body;
  const id = `TPL-${Date.now()}`;
  const { rows } = await pool.query(`
    INSERT INTO device_templates (id, name, vendor, model, type, defaults)
    VALUES ($1,$2,$3,$4,$5,$6) RETURNING *
  `, [id, name, vendor||null, model||null, type||null, defaults ? JSON.stringify(defaults) : null]);
  res.status(201).json(rows[0]);
});

router.delete('/:id', requireAdmin, async (req, res) => {
  await pool.query('DELETE FROM device_templates WHERE id=$1', [req.params.id]);
  res.status(204).end();
});

export default router;
