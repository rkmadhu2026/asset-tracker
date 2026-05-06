import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/chats/messages?limit=50
router.get('/messages', requireAuth, async (req, res) => {
  const limit = Number(req.query.limit || 50);
  const { rows } = await pool.query(
    `SELECT * FROM chats WHERE user_id = $1 ORDER BY timestamp ASC LIMIT $2`,
    [(req as AuthedRequest).uid, limit]
  );
  res.json(rows);
});

// POST /api/chats/messages
router.post('/messages', requireAuth, async (req, res) => {
  const { role, content, type, metadata } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO chats (user_id, role, content, type, metadata)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [(req as AuthedRequest).uid, role, content, type || 'text', metadata || null]
  );
  res.status(201).json(rows[0]);
});

export default router;
