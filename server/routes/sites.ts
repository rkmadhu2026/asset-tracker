import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// GET /api/sites?clientId=xxx
router.get('/', requireAuth, async (req, res) => {
  const { clientId } = req.query;
  if (clientId) {
    const { rows } = await pool.query(`
      SELECT s.*, COALESCE(ARRAY_AGG(sc.client_id) FILTER (WHERE sc.client_id IS NOT NULL), '{}') AS client_ids
      FROM sites s
      LEFT JOIN site_clients sc ON sc.site_id = s.id
      WHERE s.id IN (SELECT site_id FROM site_clients WHERE client_id = $1)
      GROUP BY s.id
      ORDER BY s.env, s.name
    `, [clientId]);
    res.json(rows);
  } else {
    const { rows } = await pool.query(`
      SELECT s.*, COALESCE(ARRAY_AGG(sc.client_id) FILTER (WHERE sc.client_id IS NOT NULL), '{}') AS client_ids
      FROM sites s
      LEFT JOIN site_clients sc ON sc.site_id = s.id
      GROUP BY s.id
      ORDER BY s.env, s.name
    `);
    res.json(rows);
  }
});

// GET /api/sites/:id
router.get('/:id', requireAuth, async (req, res) => {
  const { rows } = await pool.query(`
    SELECT s.*, COALESCE(ARRAY_AGG(sc.client_id) FILTER (WHERE sc.client_id IS NOT NULL), '{}') AS client_ids
    FROM sites s
    LEFT JOIN site_clients sc ON sc.site_id = s.id
    WHERE s.id = $1
    GROUP BY s.id
  `, [req.params.id]);
  if (!rows.length) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(rows[0]);
});

// POST /api/sites
router.post('/', requireAdmin, async (req, res) => {
  const { id, name, env, region, ip, url, domain, status, notes, client_ids } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(`
      INSERT INTO sites (id, name, env, region, ip, url, domain, status, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *
    `, [id || name.toLowerCase().replace(/\s+/g,'-'), name, env, region||null,
        ip||null, url||null, domain||null, status||'Active', notes||null]);
    const site = rows[0];
    if (Array.isArray(client_ids)) {
      for (const cid of client_ids) {
        await client.query('INSERT INTO site_clients (site_id, client_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [site.id, cid]);
      }
    }
    await client.query('COMMIT');
    res.status(201).json({ ...site, client_ids: client_ids || [] });
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
});

// PUT /api/sites/:id
router.put('/:id', requireAdmin, async (req, res) => {
  const { name, env, region, ip, url, domain, status, notes, client_ids } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(`
      UPDATE sites SET name=$1, env=$2, region=$3, ip=$4, url=$5, domain=$6, status=$7, notes=$8
      WHERE id=$9 RETURNING *
    `, [name, env, region||null, ip||null, url||null, domain||null, status||'Active', notes||null, req.params.id]);
    if (!rows.length) { await client.query('ROLLBACK'); res.status(404).json({ error: 'Not found' }); return; }
    if (Array.isArray(client_ids)) {
      await client.query('DELETE FROM site_clients WHERE site_id = $1', [req.params.id]);
      for (const cid of client_ids) {
        await client.query('INSERT INTO site_clients (site_id, client_id) VALUES ($1,$2)', [req.params.id, cid]);
      }
    }
    await client.query('COMMIT');
    res.json({ ...rows[0], client_ids: client_ids || [] });
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
});

// DELETE /api/sites/:id
router.delete('/:id', requireAdmin, async (req, res) => {
  await pool.query('DELETE FROM sites WHERE id = $1', [req.params.id]);
  res.status(204).end();
});

export default router;
