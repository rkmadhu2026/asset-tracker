#!/usr/bin/env node
// Rack-details importer for Argus-asset-tracker.
//
// Reads the two rack Excel files in the project root:
//   1. "Rack details (1).xlsx"  — multi-rack file (RACK-1 LEMONN-DR, RACK-16 UAT,
//                                  RACK-20 SMIFs, RACK-23 MOBIKWIK, RACK-32 DX-DR)
//   2. "R15_Devices&PowerUnits-New (1).xlsx" — single rack for FinSpot ISV Shared
//
// For each rack:
//   • Upserts a row in the `racks` table.
//   • For every device slot, tries to match an existing `infrastructure` row by
//     site_id + (serial OR name similarity) and updates its rack_id, u_position,
//     and serial.  If no match is found, inserts a new infrastructure row.
//
// Usage:
//   node scripts/import-racks.mjs          # dry-run (no DB writes)
//   node scripts/import-racks.mjs --apply  # commit to DB

import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import XLSXpkg from 'xlsx';
const XLSX = XLSXpkg;
import pg from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = resolve(__dirname, '..');
const APPLY     = process.argv.includes('--apply');

// ── DB ───────────────────────────────────────────────────────────────────────
const pool = new pg.Pool({
  host:     process.env.PG_HOST     || 'localhost',
  port:     Number(process.env.PG_PORT) || 5432,
  database: process.env.PG_DATABASE || 'argus',
  user:     process.env.PG_USER     || 'argus',
  password: process.env.PG_PASSWORD || 'changeme',
});

// ── Site mapping ─────────────────────────────────────────────────────────────
// Excel rack-name / site-label → site_id in DB  (keys are upper-trimmed)
const SITE_MAP = {
  'LEMONN-DR':     'lemonn-prod',
  'LEMONN':        'lemonn-prod',
  'ISV':           'finspot-isv-shared',
  'FINSPOT-ISV':   'finspot-isv-shared',
  'FS-DX':         'dx-prod',
  'FS-DX ':        'dx-prod',
  'UAT':           'finspot-uat',
  'SMIFS':         'smifs-prod',
  'MOBIKWIK':      null,           // not in DB – skip
  'NEO':           null,           // not in DB – skip
  'DX-DR':         'dx-prod',
  'DX-DR ':        'dx-prod',
  'DX':            'dx-prod',
  'R15':           'dx-prod',      // standalone R15 = same DX main rack
  'FINSPOT':       'finspot-dr',
};

// ── Device type normaliser ────────────────────────────────────────────────────
function normalizeType(raw = '') {
  const t = raw.toLowerCase().replace(/[-_\s]+/g, '');
  if (t.includes('firewall') || t.includes('fortigate') || t.includes('fw'))   return 'Firewall';
  if (t.includes('router') || t.includes('rtr'))                               return 'Router';
  if (t.includes('switch') || t.includes('sw'))                                return 'Switch';
  if (t.includes('server') || t.includes('kvm') || t.includes('adp'))          return 'Server';
  if (t.includes('storage') || t.includes('730xd') || t.includes('aff'))       return 'Storage';
  if (t.includes('ats') || t.includes('ups') || t.includes('power') || t.includes('pdu')) return 'Power';
  if (t.includes('vm') || t.includes('virtual'))                               return 'VM';
  return 'Device';
}

// ── Slug helper ──────────────────────────────────────────────────────────────
function slug(str = '') {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ── Parse "Rack details (1).xlsx" ────────────────────────────────────────────
function parseMultiRackFile(filePath) {
  const wb   = XLSX.readFile(filePath);
  const ws   = wb.Sheets['Sheet1'];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

  const racks = [];
  let current = null;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    // Rack header row: cell[0] matches RACK[-space]NN (e.g. "RACK-1", "RACK -14")
    const firstStr = String(row[0] || '').trim().toUpperCase();
    if (/^RACK[\s-]+\d+/.test(firstStr)) {
      if (current) racks.push(current);
      const rackLabel = String(row[0]).trim().replace(/[\s-]+/g, '-'); // normalise "RACK -14" → "RACK-14"
      const siteLabel = String(row[1] || '').trim();
      current = { rackLabel, siteLabel, devices: [], hasTypeCol: null };
      continue;
    }

    // Column-header row — detect column layout
    const firstCell = String(row[0] || '');
    if (firstCell.toLowerCase().includes('u space')) {
      if (current) {
        // Check if 2nd header is "Type" or a model name
        const col1 = String(row[1] || '').toLowerCase();
        current.hasTypeCol = col1 === 'type';
      }
      continue;
    }
    if (firstCell.toLowerCase() === 'type') continue;

    // Total / empty rows — skip
    if (!current) continue;
    if (!row[0] && !row[2] && !row[3]) continue;
    const anyCell = String(row[0] || '') + String(row[1] || '') + String(row[2] || '') + String(row[3] || '');
    if (anyCell.toLowerCase().includes('total power') || anyCell.toLowerCase().includes('total watt')) continue;

    const uPos  = String(row[0] || '').trim();
    if (!uPos || String(uPos).toLowerCase().startsWith('total')) continue;

    // Use per-rack column layout detected from header row
    const htc = current.hasTypeCol;
    const type  = htc ? String(row[1] || '').trim() : '';
    const model = htc ? String(row[2] || '').trim() : String(row[1] || '').trim();
    const serial= htc ? String(row[3] || '').trim() : String(row[2] || '').trim();
    const watts = htc
      ? (typeof row[4] === 'number' ? row[4] : null)
      : (typeof row[3] === 'number' ? row[3] : null);

    if (!model && !serial) continue;

    current.devices.push({ uPos, type, model, serial, watts });
  }
  if (current) racks.push(current);
  return racks;
}

// ── Parse single-rack R15 xlsx ────────────────────────────────────────────────
function parseSingleRackFile(filePath, rackLabel, siteLabel) {
  const wb   = XLSX.readFile(filePath);
  const ws   = wb.Sheets['Sheet1'];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

  const devices = [];
  for (let i = 1; i < rows.length; i++) { // skip header row
    const row = rows[i];
    if (!row || !row[0]) continue;
    if (String(row[0]).toLowerCase().includes('total')) continue;

    const uPos  = String(row[0] || '').trim();
    const type  = String(row[1] || '').trim();
    const model = String(row[2] || '').trim();
    const serial= String(row[3] || '').trim();
    const watts = typeof row[4] === 'number' ? row[4] : null;

    if (!model && !serial) continue;
    devices.push({ uPos, type, model, serial, watts });
  }
  return [{ rackLabel, siteLabel, devices }];
}

// ── DB helpers ───────────────────────────────────────────────────────────────
async function upsertRack(client, rack, siteId) {
  const id = `rack-${slug(siteId)}-${slug(rack.rackLabel)}`;
  // Estimate total_u from device positions (take highest U number)
  const uNums = rack.devices
    .map(d => parseInt(d.uPos))
    .filter(n => !isNaN(n));
  const totalU = uNums.length > 0 ? Math.max(...uNums) : 48;

  if (!APPLY) {
    console.log(`  [DRY] Upsert rack id=${id} site=${siteId} name=${rack.rackLabel} total_u=${totalU}`);
    return id;
  }

  const { rows } = await client.query(`
    INSERT INTO racks (id, site_id, name, total_u, notes)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (id) DO UPDATE SET
      name    = EXCLUDED.name,
      total_u = EXCLUDED.total_u,
      notes   = EXCLUDED.notes
    RETURNING id
  `, [id, siteId, rack.rackLabel, totalU, `Imported from ${rack.siteLabel}`]);
  return rows[0].id;
}

async function matchOrCreateDevice(client, device, siteId, rackId) {
  const normalType = normalizeType(device.type || device.model);
  const name       = device.type
    ? `${device.type} (${device.model})`.trim()
    : device.model;

  // Try to match by serial number first
  if (device.serial) {
    const { rows } = await client.query(
      'SELECT id FROM infrastructure WHERE serial = $1 LIMIT 1',
      [device.serial.trim()]
    );
    if (rows.length > 0) {
      if (APPLY) {
        await client.query(
          'UPDATE infrastructure SET rack_id=$1, u_position=$2, site_id=COALESCE(NULLIF(site_id,\'\'), $3) WHERE id=$4',
          [rackId, device.uPos, siteId, rows[0].id]
        );
      }
      return { action: 'updated', id: rows[0].id };
    }
  }

  // Try to match by site_id + similar name
  if (siteId) {
    const { rows } = await client.query(
      `SELECT id FROM infrastructure
       WHERE site_id = $1 AND type = $2 AND name ILIKE $3 LIMIT 1`,
      [siteId, normalType, `%${(device.type || device.model).slice(0, 8)}%`]
    );
    if (rows.length > 0) {
      if (APPLY) {
        await client.query(
          'UPDATE infrastructure SET rack_id=$1, u_position=$2, serial=COALESCE(NULLIF(serial,\'\'), $3) WHERE id=$4',
          [rackId, device.uPos, device.serial || null, rows[0].id]
        );
      }
      return { action: 'updated', id: rows[0].id };
    }
  }

  // Create new record
  const id = `${siteId || 'unknown'}-rack-${slug(device.serial || device.model).slice(0, 20)}`;
  // Extract vendor from model name (first word or brand)
  const vendor = device.model.split(/\s+/)[0] || 'Unknown';
  if (APPLY) {
    await client.query(`
      INSERT INTO infrastructure
        (id, name, vendor, type, model, serial, site_id, rack_id, u_position, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'Active')
      ON CONFLICT (id) DO UPDATE SET
        rack_id    = EXCLUDED.rack_id,
        u_position = EXCLUDED.u_position,
        serial     = COALESCE(EXCLUDED.serial, infrastructure.serial)
    `, [id, name, vendor, normalType, device.model || 'Unknown',
        device.serial || null, siteId, rackId, device.uPos]);
  }
  return { action: 'created', id };
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(APPLY ? '🔧 APPLY mode — writing to DB' : '🔍 DRY-RUN mode — no writes');

  const files = [
    // Primary file: contains all rack sections (RACK-1, RACK-14, RACK-15, RACK-16, RACK-20, RACK-23, RACK-32)
    { path: resolve(ROOT, 'Rack details (1).xlsx'), multi: true },
    // R15 standalone files are duplicates of RACK-15 FS-DX above — skip to avoid duplicates
    // { path: resolve(ROOT, 'R15_Devices&PowerUnits-New (1).xlsx'), multi: false, rackLabel: 'R15', siteLabel: 'FS-DX' },
  ];

  let totalRacks   = 0;
  let totalUpdated = 0;
  let totalCreated = 0;
  let skipped      = 0;

  const client = await pool.connect();
  try {
    if (APPLY) await client.query('BEGIN');

    for (const f of files) {
      if (!existsSync(f.path)) {
        console.warn(`⚠  File not found: ${f.path} — skipping`);
        continue;
      }

      const racks = f.multi
        ? parseMultiRackFile(f.path)
        : parseSingleRackFile(f.path, f.rackLabel, f.siteLabel);

      console.log(`\n📂 ${f.path.split('/').pop()} — ${racks.length} rack(s)`);

      for (const rack of racks) {
        const siteId = SITE_MAP[rack.siteLabel.trim()] ?? SITE_MAP[rack.siteLabel.toUpperCase().trim()];
        if (!siteId) {
          console.log(`  ⚠  Rack ${rack.rackLabel} (${rack.siteLabel}) — no site mapping, skipping`);
          skipped++;
          continue;
        }

        console.log(`\n  📦 ${rack.rackLabel} → site=${siteId} (${rack.devices.length} devices)`);
        const rackId = await upsertRack(client, rack, siteId);
        totalRacks++;

        for (const device of rack.devices) {
          const { action, id } = await matchOrCreateDevice(client, device, siteId, rackId);
          console.log(`    ${action === 'created' ? '➕' : '✏️ '} [${action}] ${id}  ${device.uPos}U  ${device.model}  ${device.serial || ''}`);
          if (action === 'created') totalCreated++;
          else totalUpdated++;
        }
      }
    }

    if (APPLY) await client.query('COMMIT');
  } catch (err) {
    if (APPLY) await client.query('ROLLBACK');
    console.error('\n❌ Error — rolled back:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }

  console.log(`\n✅ Done.  Racks: ${totalRacks}  Updated devices: ${totalUpdated}  New devices: ${totalCreated}  Skipped racks: ${skipped}`);
  if (!APPLY) console.log('\nRe-run with --apply to commit these changes.');
}

main().catch(err => { console.error(err); process.exit(1); });
