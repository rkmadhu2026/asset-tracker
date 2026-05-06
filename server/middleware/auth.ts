import type { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../auth-jwt.js';

const AUTH_BYPASS = process.env.AUTH_BYPASS === 'true';
const BYPASS_UID = 'dev-bypass';
const BYPASS_EMAIL = 'dev@local';

if (AUTH_BYPASS) {
  console.warn('[auth] AUTH_BYPASS=true — all requests treated as admin. NEVER enable in production.');
}

export interface AuthedRequest extends Request {
  uid: string;
  email: string | undefined;
  role?: string;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (AUTH_BYPASS) {
    (req as AuthedRequest).uid = BYPASS_UID;
    (req as AuthedRequest).email = BYPASS_EMAIL;
    (req as AuthedRequest).role = 'admin';
    next();
    return;
  }
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing Authorization header' });
    return;
  }
  const payload = verifyToken(header.slice(7));
  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }
  (req as AuthedRequest).uid = payload.uid;
  (req as AuthedRequest).email = payload.email;
  (req as AuthedRequest).role = payload.role;
  next();
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  await requireAuth(req, res, async () => {
    if ((req as AuthedRequest).role === 'admin') {
      next();
    } else {
      res.status(403).json({ error: 'Admin role required' });
    }
  });
}
