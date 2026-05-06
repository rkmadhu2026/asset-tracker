import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { pool } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JwtPayload {
  uid: string;
  email: string;
  role: string;
}

export function issueToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function findUserByEmail(email: string) {
  const { rows } = await pool.query(
    'SELECT uid, email, password_hash, role, display_name, photo_url FROM users WHERE email = $1',
    [email]
  );
  return rows[0] || null;
}

export async function createUser(email: string, password: string, displayName?: string) {
  const passwordHash = await hashPassword(password);
  const uid = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const role = email === process.env.ADMIN_BOOTSTRAP_EMAIL ? 'admin' : 'viewer';

  const { rows } = await pool.query(
    `INSERT INTO users (uid, email, password_hash, role, display_name, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
     RETURNING uid, email, role, display_name, photo_url`,
    [uid, email, passwordHash, role, displayName || null]
  );
  return rows[0];
}
