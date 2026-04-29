import type { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Initialise Firebase Admin once — reuse if already initialised.
if (!admin.apps.length) {
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credPath) {
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
  } else {
    // Fall back to project ID only (works for emulator / dev without service account).
    const cfg = JSON.parse(
      readFileSync(resolve(process.cwd(), 'firebase-applet-config.json'), 'utf8')
    );
    admin.initializeApp({ projectId: cfg.projectId });
  }
}

export interface AuthedRequest extends Request {
  uid: string;
  email: string | undefined;
  role?: string;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing Authorization header' });
    return;
  }
  const token = header.slice(7);
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    (req as AuthedRequest).uid = decoded.uid;
    (req as AuthedRequest).email = decoded.email;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  await requireAuth(req, res, async () => {
    const { pool } = await import('../db.js');
    const { rows } = await pool.query('SELECT role FROM users WHERE uid = $1', [(req as AuthedRequest).uid]);
    if (rows[0]?.role === 'admin') {
      next();
    } else {
      res.status(403).json({ error: 'Admin role required' });
    }
  });
}
