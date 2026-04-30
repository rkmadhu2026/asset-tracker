import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, requireAdmin, type AuthedRequest } from '../middleware/auth.js';
import type { Request } from 'express';

const router = Router();

// GET /api/infrastructure?siteId=&status=&type=&search=&limit=&offset=
router.get('/', requireAuth, async (req, res) => {
  const { siteId, clientId, status, type, search, limit = '1000', offset = '0' } = req.query as Record<string, string>;
  const conditions: string[] = [];
  const params: unknown[] = [];
  let fromClause = 'infrastructure i';

  if (clientId) {
    fromClause = 'infrastructure i JOIN site_clients sc ON i.site_id = sc.site_id';
    params.push(clientId);
    conditions.push(`sc.client_id = $${params.length}`);
  }
  if (siteId)  { params.push(siteId);  conditions.push(`i.site_id = $${params.length}`); }
  if (status)  { params.push(status);  conditions.push(`i.status = $${params.length}`); }
  if (type)    { params.push(type);    conditions.push(`i.type = $${params.length}`); }
  if (search)  { params.push(`%${search}%`); conditions.push(`(i.name ILIKE $${params.length} OR i.ip ILIKE $${params.length} OR i.serial ILIKE $${params.length})`); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  params.push(Number(limit), Number(offset));

  const { rows } = await pool.query(
    `SELECT i.* FROM ${fromClause} ${where} ORDER BY i.name LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  res.json(rows);
});

// GET /api/infrastructure/:id
router.get('/:id', requireAuth, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM infrastructure WHERE id=$1', [req.params.id]);
  if (!rows.length) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(rows[0]);
});

// POST /api/infrastructure
router.post('/', requireAdmin, async (req, res) => {
  const d = req.body;
  const { rows } = await pool.query(`
    INSERT INTO infrastructure
      (id, name, vendor, model, type, status, site_id, rack_id, u_position,
       ip, mask, gateway, vlan, serial, firmware, uptime, cpu, memory, temp,
       ports, last_backup, owner, criticality, purchase_date, warranty_expiry, assigned_to, config)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27)
    RETURNING *
  `, [d.id, d.name, d.vendor, d.model, d.type, d.status||'Active',
      d.site_id||null, d.rack_id||null, d.u_position||null,
      d.ip||null, d.mask||null, d.gateway||null, d.vlan||null,
      d.serial||null, d.firmware||null, d.uptime||null,
      d.cpu||null, d.memory||null, d.temp||null, d.ports||null,
      d.last_backup||null, d.owner||null, d.criticality||null,
      d.purchase_date||null, d.warranty_expiry||null, d.assigned_to||null,
      d.config ?? null]);

  // Write audit log
  await pool.query(
    `INSERT INTO audit_logs (user_id, action, resource_type, resource_id) VALUES ($1,$2,$3,$4)`,
    [(req as AuthedRequest).uid, 'CREATE', 'infrastructure', rows[0].id]
  );
  res.status(201).json(rows[0]);
});

// PUT /api/infrastructure/:id
router.put('/:id', requireAdmin, async (req, res) => {
  const d = req.body;
  const { rows } = await pool.query(`
    UPDATE infrastructure SET
      name=$1, vendor=$2, model=$3, type=$4, status=$5,
      site_id=$6, rack_id=$7, u_position=$8,
      ip=$9, mask=$10, gateway=$11, vlan=$12, serial=$13, firmware=$14,
      uptime=$15, cpu=$16, memory=$17, temp=$18, ports=$19, last_backup=$20,
      owner=$21, criticality=$22, purchase_date=$23, warranty_expiry=$24, assigned_to=$25,
      config=$26
    WHERE id=$27 RETURNING *
  `, [d.name, d.vendor, d.model, d.type, d.status,
      d.site_id||null, d.rack_id||null, d.u_position||null,
      d.ip||null, d.mask||null, d.gateway||null, d.vlan||null,
      d.serial||null, d.firmware||null, d.uptime||null,
      d.cpu||null, d.memory||null, d.temp||null, d.ports||null,
      d.last_backup||null, d.owner||null, d.criticality||null,
      d.purchase_date||null, d.warranty_expiry||null, d.assigned_to||null,
      d.config ?? null,
      req.params.id]);
  if (!rows.length) { res.status(404).json({ error: 'Not found' }); return; }

  await pool.query(
    `INSERT INTO audit_logs (user_id, action, resource_type, resource_id) VALUES ($1,$2,$3,$4)`,
    [(req as AuthedRequest).uid, 'UPDATE', 'infrastructure', req.params.id]
  );
  res.json(rows[0]);
});

// DELETE /api/infrastructure/:id
router.delete('/:id', requireAdmin, async (req, res) => {
  await pool.query('DELETE FROM infrastructure WHERE id=$1', [req.params.id]);
  await pool.query(
    `INSERT INTO audit_logs (user_id, action, resource_type, resource_id) VALUES ($1,$2,$3,$4)`,
    [(req as AuthedRequest).uid, 'DELETE', 'infrastructure', req.params.id]
  );
  res.status(204).end();
});

// GET /api/infrastructure/:id/documents
router.get('/:id/documents', requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM device_documents WHERE device_id=$1 ORDER BY created_at DESC',
    [req.params.id]
  );
  res.json(rows);
});

// POST /api/infrastructure/:id/documents
router.post('/:id/documents', requireAuth, async (req, res) => {
  const { name, url, type } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO device_documents (device_id, name, url, type, uploaded_by)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [req.params.id, name, url, type || null, (req as AuthedRequest).uid]
  );
  res.status(201).json(rows[0]);
});

export default router;
