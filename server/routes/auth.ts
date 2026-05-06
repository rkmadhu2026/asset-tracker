import express from 'express';
import { issueToken, verifyToken, findUserByEmail, createUser, comparePassword } from '../auth-jwt.js';
import { pool } from '../db.js';
import { logAudit } from '../audit.js';

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, password, displayName } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password required' });
    return;
  }
  const existing = await findUserByEmail(email);
  if (existing) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }
  const user = await createUser(email, password, displayName);
  const token = issueToken({ uid: user.uid, email: user.email, role: user.role });
  res.json({ token, user });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password required' });
    return;
  }
  const user = await findUserByEmail(email);
  if (!user || !user.password_hash) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }
  const valid = await comparePassword(password, user.password_hash);
  if (!valid) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }
  await pool.query('UPDATE users SET last_login = NOW() WHERE uid = $1', [user.uid]);
  logAudit({ userId: user.uid, action: 'User Login', type: 'User', severity: 'Info', details: `Login from ${req.ip}` });
  const token = issueToken({ uid: user.uid, email: user.email, role: user.role });
  res.json({
    token,
    user: { uid: user.uid, email: user.email, role: user.role, display_name: user.display_name, photo_url: user.photo_url }
  });
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing token' });
    return;
  }
  const payload = verifyToken(header.slice(7));
  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }
  const { rows } = await pool.query(
    'SELECT uid, email, role, display_name, photo_url FROM users WHERE uid = $1',
    [payload.uid]
  );
  if (!rows[0]) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json(rows[0]);
});

export default router;
