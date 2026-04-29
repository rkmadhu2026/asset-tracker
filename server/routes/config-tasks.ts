import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, requireAdmin, type AuthedRequest } from '../middleware/auth.js';
import type { Request } from 'express';

const router = Router();

router.get('/', requireAuth, async (_req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM configuration_tasks ORDER BY created_at DESC'
  );
  res.json(rows);
});

router.post('/', requireAuth, async (req, res) => {
  const { title, description, priority, status, device_id, assigned_to, due_date } = req.body;
  const id = `CT-${Date.now()}`;
  const { rows } = await pool.query(`
    INSERT INTO configuration_tasks (id, title, description, priority, status, device_id, assigned_to, due_date)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *
  `, [id, title, description||null, priority||null, status||'Pending',
      device_id||null, assigned_to||null, due_date||null]);
  res.status(201).json(rows[0]);
});

router.put('/:id', requireAuth, async (req, res) => {
  const { title, description, priority, status, device_id, assigned_to, due_date } = req.body;
  const { rows } = await pool.query(`
    UPDATE configuration_tasks
    SET title=$1, description=$2, priority=$3, status=$4, device_id=$5, assigned_to=$6, due_date=$7
    WHERE id=$8 RETURNING *
  `, [title, description||null, priority||null, status||'Pending',
      device_id||null, assigned_to||null, due_date||null, req.params.id]);
  if (!rows.length) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(rows[0]);
});

router.delete('/:id', requireAdmin, async (req, res) => {
  await pool.query('DELETE FROM configuration_tasks WHERE id=$1', [req.params.id]);
  res.status(204).end();
});

export default router;
