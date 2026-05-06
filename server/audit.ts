import { pool } from './db.js';

export interface AuditEvent {
  userId: string | null;
  action: string;
  type?: 'User' | 'System' | 'Config';
  severity?: 'Info' | 'Warning' | 'Critical';
  resourceType?: string;
  resourceId?: string;
  details?: string;
}

/** Fire-and-forget — never throws; safe to call from any route without await. */
export function logAudit(event: AuditEvent): void {
  pool.query(
    `INSERT INTO audit_logs (user_id, action, type, severity, resource_type, resource_id, details)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [
      event.userId || null,
      event.action,
      event.type     || 'System',
      event.severity || 'Info',
      event.resourceType || null,
      event.resourceId   || null,
      event.details ? JSON.stringify({ message: event.details }) : null,
    ]
  ).catch((err) => console.error('[audit] write failed:', err));
}
