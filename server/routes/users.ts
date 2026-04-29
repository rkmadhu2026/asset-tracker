import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, requireAdmin, type AuthedRequest } from '../middleware/auth.js';
import type { Request } from 'express';

const router = Router();

// Upsert user profile on login — called by AuthProvider on every sign-in.
// POST /api/users/sync
router.post('/sync', requireAuth, async (req, res) => {
  const { uid, email } = req as AuthedRequest;
  const { display_name, photo_url } = req.body;

  // Admin bootstrap — matches AuthProvider logic.
  const ADMIN_EMAIL = 'rajkumarmadhu2024@gmail.com';
  const { rows: existing } = await pool.query('SELECT role FROM users WHERE uid=$1', [uid]);
  const role = existing.length ? existing[0].role : (email === ADMIN_EMAIL ? 'admin' : 'viewer');

  const { rows } = await pool.query(`
    INSERT INTO users (uid, email, display_name, photo_url, role, last_login)
    VALUES ($1,$2,$3,$4,$5,NOW())
    ON CONFLICT (uid) DO UPDATE SET
      email=$2, display_name=$3, photo_url=$4, last_login=NOW()
    RETURNING *
  `, [uid, email||null, display_name||null, photo_url||null, role]);
  res.json(rows[0]);
});

// GET /api/users — admin only
router.get('/', requireAdmin, async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM users ORDER BY display_name');
  res.json(rows);
});

// PUT /api/users/:uid/role — admin only
router.put('/:uid/role', requireAdmin, async (req, res) => {
  const { role } = req.body;
  if (!['admin','developer','viewer'].includes(role)) {
    res.status(400).json({ error: 'Invalid role' }); return;
  }
  const { rows } = await pool.query(
    'UPDATE users SET role=$1 WHERE uid=$2 RETURNING *',
    [role, req.params.uid]
  );
  if (!rows.length) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(rows[0]);
});

export default router;
