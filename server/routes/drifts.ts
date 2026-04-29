import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const { deviceId, status } = req.query as Record<string, string>;
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (deviceId) { params.push(deviceId); conditions.push(`device_id=$${params.length}`); }
  if (status)   { params.push(status);   conditions.push(`status=$${params.length}`); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `SELECT * FROM drifts ${where} ORDER BY created_at DESC`, params
  );
  res.json(rows);
});

router.post('/', requireAuth, async (req, res) => {
  const { device_id, field, expected_value, actual_value, status } = req.body;
  const id = `DFT-${Date.now()}`;
  const { rows } = await pool.query(`
    INSERT INTO drifts (id, device_id, field, expected_value, actual_value, status)
    VALUES ($1,$2,$3,$4,$5,$6) RETURNING *
  `, [id, device_id||null, field||null, expected_value||null, actual_value||null, status||'Open']);
  res.status(201).json(rows[0]);
});

router.put('/:id/status', requireAuth, async (req, res) => {
  const { status } = req.body;
  const { rows } = await pool.query(
    'UPDATE drifts SET status=$1 WHERE id=$2 RETURNING *',
    [status, req.params.id]
  );
  if (!rows.length) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(rows[0]);
});

export default router;
