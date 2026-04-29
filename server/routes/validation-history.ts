import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';
import type { Request } from 'express';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const uid = (req as AuthedRequest).uid;
  const { rows } = await pool.query(
    'SELECT * FROM validation_history WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100',
    [uid]
  );
  res.json(rows);
});

router.post('/', requireAuth, async (req, res) => {
  const uid = (req as AuthedRequest).uid;
  const { device_id, result, status, message, details } = req.body;
  const { rows } = await pool.query(`
    INSERT INTO validation_history (user_id, device_id, result, status, message, details, timestamp)
    VALUES ($1,$2,$3,$4,$5,$6,NOW()) RETURNING *
  `, [uid, device_id||null, result||null, status||null, message||null,
      details ? JSON.stringify(details) : null]);
  res.status(201).json(rows[0]);
});

export default router;
