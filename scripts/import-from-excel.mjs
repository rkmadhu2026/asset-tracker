#!/usr/bin/env node
// Postgres seeder for Argus-asset-tracker.
//
// Stage A — upserts clients + sites from the hand-audited mapping
//           (mirrors scripts/migrate-tenants-to-clients-sites.mjs, but writes
//           to Postgres instead of Firestore).
// Stage B — parses each *-le.xlsx file's `Devices` sheet and upserts rows
//           into the `assets` table, attached to the right site/client.
//
// Idempotent: deterministic IDs (slug for clients/sites; site_id+slug(textname)
// for assets). Re-running upserts cleanly. The R15 rack/power xlsx is skipped.
//
// Usage:
//   node scripts/import-from-excel.mjs           # dry-run summary only
//   node scripts/import-from-excel.mjs --apply   # write to DB
//
// Reads PG connection from env (PG_HOST/PG_PORT/PG_DATABASE/PG_USER/PG_PASSWORD,
// or DATABASE_URL).

import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as XLSX from 'xlsx';
import pg from 'pg';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const APPLY = process.argv.includes('--apply');

// ─── clients ─────────────────────────────────────────────────────────────────
const FINSPOT = 'finspot';
const ISV = 'finspot-isv';

const clients = [
  { id: FINSPOT, name: 'FinSpot', slug: 'finspot', status: 'Active',
    legal_name: 'FinSpot Technology Solutions Private Limited',
    address: 'No. 55B, 1st Main Road, Electronic City Phase 1, Bengaluru - 560 100',
    website: 'https://finspot.in/' },
  { id: 'ifsc',       name: 'IFSC (FinSpot)', slug: 'ifsc',         status: 'Active', parent_client_id: FINSPOT },
  { id: 'dx',         name: 'DX (FinSpot)',   slug: 'dx',           status: 'Active', parent_client_id: FINSPOT },
  { id: ISV,          name: 'FinSpot ISV',    slug: 'finspot-isv',  status: 'Active', parent_client_id: FINSPOT },
  { id: 'vachana',    name: 'VACHANA',        slug: 'vachana',      status: 'Active', parent_client_id: ISV },
  { id: 'vertex',     name: 'VERTEX',         slug: 'vertex',       status: 'Active', parent_client_id: ISV },
  { id: 'bullsmart',  name: 'BULLSMART',      slug: 'bullsmart',    status: 'Active', parent_client_id: ISV },
  { id: 'skycommod',  name: 'SKYCOMMOD',      slug: 'skycommod',    status: 'Active', parent_client_id: ISV },
  { id: 'aionion',    name: 'AIONION',        slug: 'aionion',      status: 'Active', parent_client_id: ISV },
  { id: 'indmoney',   name: 'IndMoney',       slug: 'indmoney',     status: 'Active' },
  { id: 'pl-india',   name: 'PL India',       slug: 'pl-india',     status: 'Active' },
  { id: 'neo-wealth', name: 'Neo Wealth',     slug: 'neo-wealth',   status: 'Active' },
  { id: 'flattrade',  name: 'Flattrade',      slug: 'flattrade',    status: 'Active' },
  { id: 'way2wealth', name: 'Way2Wealth',     slug: 'way2wealth',   status: 'Active' },
  { id: 'lemonn',     name: 'Lemonn',         slug: 'lemonn',       status: 'Active' },
  { id: 'mirae',      name: 'Mirae Asset',    slug: 'mirae',        status: 'Active' },
  { id: 'smifs',      name: 'SMIFS',          slug: 'smifs',        status: 'Active' },
];

// ─── sites ───────────────────────────────────────────────────────────────────
const sites = [
  { id: 'indmoney-prod-mum',  name: 'IndMoney Mumbai (PROD)',  client_ids: ['indmoney'],   env: 'PROD', region: 'Mumbai',    ip: '10.172.0.10',     url: 'https://indmoney-prod-le.finspot.in', domain: 'indmoney-prod-le.finspot.in', status: 'Active' },
  { id: 'indmoney-dr-blr',    name: 'IndMoney Bangalore (DR)', client_ids: ['indmoney'],   env: 'DR',   region: 'Bangalore', ip: '10.10.10.110',                                                                                                                                                            status: 'Active' },
  { id: 'pl-india-prod',      name: 'PL India (PROD)',         client_ids: ['pl-india'],   env: 'PROD', region: 'Chennai',   ip: '10.40.1.10',      url: 'https://prod-le.plindia.com',          domain: 'prod-le.plindia.com',         status: 'Active' },
  { id: 'neo-wealth-prod',    name: 'Neo Wealth (PROD)',       client_ids: ['neo-wealth'], env: 'PROD', region: 'Bangalore', ip: '10.40.40.23',     url: 'https://prod-le.neo-wealth.com',       domain: 'prod-le.neo-wealth.com',      status: 'Active' },
  { id: 'flattrade-prod',     name: 'Flattrade (PROD)',        client_ids: ['flattrade'],  env: 'PROD', region: 'Mumbai',    ip: '202.87.54.194',   url: 'https://prod-le.flattrade.in',         domain: 'prod-le.flattrade.in',        status: 'Active' },
  { id: 'finspot-isv-shared', name: 'FinSpot ISV Shared',      client_ids: ['vachana','vertex','bullsmart','skycommod','aionion'], env: 'ISV', region: 'Mumbai', ip: '10.10.0.101', url: 'https://fs-le-isv.finspot.in', domain: 'fs-le-isv.finspot.in', status: 'Active' },
  { id: 'way2wealth-prod',    name: 'Way2Wealth (PROD)',       client_ids: ['way2wealth'], env: 'PROD', region: 'Bangalore', ip: '192.168.12.109',  url: 'https://w2w-prod-le.way2wealth.com',   domain: 'w2w-prod-le.way2wealth.com',  status: 'Active' },
  { id: 'ifsc-prod',          name: 'IFSC (PROD)',             client_ids: ['ifsc'],       env: 'PROD', region: 'GIFT City', ip: '10.200.1.18',     url: 'https://fs-ifsc-le.finspot.in',        domain: 'fs-ifsc-le.finspot.in',       status: 'Active' },
  { id: 'lemonn-prod',        name: 'Lemonn (PROD)',           client_ids: ['lemonn'],     env: 'PROD', region: 'Mumbai',    ip: '154.210.170.126', url: 'https://lemonn-prod-le.finspot.in',    domain: 'lemonn-prod-le.finspot.in',   status: 'Active' },
  { id: 'dx-prod',            name: 'DX (PROD)',               client_ids: ['dx'],         env: 'PROD', region: 'Mumbai',    ip: '206.1.32.216',    url: 'https://fs-le-dx.finspot.in',          domain: 'fs-le-dx.finspot.in',         status: 'Active' },
  { id: 'mirae-prod',         name: 'Mirae Asset (PROD)',      client_ids: ['mirae'],      env: 'PROD', region: 'Mumbai',    ip: '192.168.152.156', url: 'https://fs-le-prod-mirae.com',         domain: 'fs-le-prod-mirae.com',        status: 'Active' },
  { id: 'smifs-prod',         name: 'SMIFS (PROD)',            client_ids: ['smifs'],      env: 'PROD', region: 'Kolkata',   ip: '10.43.0.100',     url: 'https://smifs-prod-le.finspot.in',     domain: 'smifs-prod-le.finspot.in',    status: 'Active' },
  { id: 'finspot-dr',         name: 'FinSpot DR',              client_ids: [FINSPOT],      env: 'DR',   region: 'Bangalore', ip: '10.173.0.10',     url: 'https://fs-dr-le.finspot.in',          domain: 'fs-dr-le.finspot.in',         status: 'Active' },
  { id: 'finspot-dev',        name: 'FinSpot DEV',             client_ids: [FINSPOT],      env: 'DEV',  region: 'Mumbai',    ip: '172.16.0.56',     url: 'https://fs-le-dev.finspot.in',         domain: 'fs-le-dev.finspot.in',        status: 'Active' },
  { id: 'finspot-uat',        name: 'FinSpot UAT',             client_ids: [FINSPOT],      env: 'UAT',  region: 'Mumbai',    ip: '172.16.0.55',     url: 'https://fs-le-uat.finspot.in',         domain: 'fs-le-uat.finspot.in',        status: 'Active' },
];

// ─── filename → site mapping ─────────────────────────────────────────────────
const fileToSite = {
  'lemonn-prod-le.xlsx':              'lemonn-prod',
  'pl-prod-le.xlsx':                  'pl-india-prod',
  'neo-prod-le.xlsx':                 'neo-wealth-prod',
  'fs-le-isv.xlsx':                   'finspot-isv-shared',
  'fs-w2w-le.xlsx':                   'way2wealth-prod',
  'fs-blr-indmoney-dr-le.xlsx':       'indmoney-dr-blr',
  'fs-mum-indmoney-prod-le.xlsx':     'indmoney-prod-mum',
  'fs-ifsc-le.xlsx':                  'ifsc-prod',
  'fs-dr-le.xlsx':                    'finspot-dr',
  'fs-uat-le_Restore.xlsx':           'finspot-uat',
  'fs-dx-le.xlsx':                    'dx-prod',
  'smifs-mum-le.xlsx':                'smifs-prod',
  'ftc-mum-finspot-le.xlsx':          'flattrade-prod',
  // 'indmoney-ifsc-le.xlsx': site mapping unclear (IndMoney inside IFSC?) — skipped
  // 'R15_Devices&PowerUnits-New (1).xlsx': rack file, different schema — skipped
};

// ─── helpers ─────────────────────────────────────────────────────────────────
function slug(s) {
  return String(s ?? '').toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function classify(pathhost, selecthost) {
  const p = String(pathhost || '').toLowerCase();
  if (p.includes('vm')) return { type: 'VM',                 osField: 'os',    modelField: null };
  if (p.includes('physical')) return { type: 'Server',       osField: 'os',    modelField: null };
  if (p.includes('switch')) return { type: 'Switch',         osField: null,    modelField: 'model' };
  if (p.includes('fortigate') || p.includes('firewall')) return { type: 'Firewall', osField: null, modelField: 'model' };
  // Heuristic on selecthost when pathhost is empty
  const s = String(selecthost || '').toLowerCase();
  if (s.includes('cisco') || s.includes('catalyst')) return { type: 'Switch',     osField: null, modelField: 'model' };
  if (s.includes('fortigate') || s.includes('120g')) return { type: 'Firewall',   osField: null, modelField: 'model' };
  if (s.includes('windows') || s.includes('ubuntu') || s.includes('centos') || s.includes('rhel')) {
    return { type: 'Server', osField: 'os', modelField: null };
  }
  return { type: 'Device', osField: 'os', modelField: null };
}

function manufacturerFrom(selecthost) {
  const s = String(selecthost || '').toLowerCase();
  if (s.includes('cisco'))       return 'Cisco';
  if (s.includes('fortigate'))   return 'Fortinet';
  if (s.includes('120g'))        return 'Fortinet';
  if (s.includes('windows'))     return 'Microsoft';
  if (s.includes('ubuntu'))      return 'Canonical';
  if (s.includes('centos'))      return 'Red Hat';
  if (s.includes('rhel'))        return 'Red Hat';
  return null;
}

// ─── DB ──────────────────────────────────────────────────────────────────────
const pool = new pg.Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host:     process.env.PG_HOST     || 'localhost',
        port:     Number(process.env.PG_PORT || 5432),
        database: process.env.PG_DATABASE || 'argus',
        user:     process.env.PG_USER     || 'argus',
        password: process.env.PG_PASSWORD || 'changeme',
      }
);

async function upsertClients(client) {
  // Two passes: parents first, then those with parent_client_id, so the FK is satisfiable.
  const parents = clients.filter((c) => !c.parent_client_id);
  const children = clients.filter((c) =>  c.parent_client_id);
  for (const c of [...parents, ...children]) {
    await client.query(
      `INSERT INTO clients (id, name, slug, status, parent_client_id, legal_name, address, website)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (id) DO UPDATE SET
         name=$2, slug=$3, status=$4, parent_client_id=$5,
         legal_name=COALESCE($6, clients.legal_name),
         address=COALESCE($7, clients.address),
         website=COALESCE($8, clients.website)`,
      [c.id, c.name, c.slug, c.status, c.parent_client_id ?? null,
       c.legal_name ?? null, c.address ?? null, c.website ?? null]
    );
  }
}

async function upsertSites(client) {
  for (const s of sites) {
    await client.query(
      `INSERT INTO sites (id, name, env, region, ip, url, domain, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (id) DO UPDATE SET
         name=$2, env=$3, region=$4, ip=$5, url=$6, domain=$7, status=$8`,
      [s.id, s.name, s.env, s.region ?? null, s.ip ?? null, s.url ?? null, s.domain ?? null, s.status]
    );
    // join table: replace the set so it always matches the mapping
    await client.query(`DELETE FROM site_clients WHERE site_id = $1`, [s.id]);
    for (const cid of s.client_ids) {
      await client.query(
        `INSERT INTO site_clients (site_id, client_id) VALUES ($1,$2)
         ON CONFLICT DO NOTHING`,
        [s.id, cid]
      );
    }
  }
}

function readSheet(filePath) {
  const buf = readFileSync(filePath);
  const wb = XLSX.read(buf, { type: 'buffer' });
  const sheetName = wb.SheetNames.find((n) => n.toLowerCase() === 'devices') || wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(ws, { defval: '' });
}

async function importAssets(client) {
  const summary = [];
  for (const [file, siteId] of Object.entries(fileToSite)) {
    const filePath = resolve(ROOT, file);
    if (!existsSync(filePath)) { summary.push({ file, siteId, count: 0, note: 'missing on disk' }); continue; }
    const site = sites.find((s) => s.id === siteId);
    const primaryClientId = site?.client_ids?.[0] ?? null;
    const rows = readSheet(filePath);
    let imported = 0;
    const seenIds = new Map();
    for (const r of rows) {
      const textname = String(r.textname || '').trim();
      if (!textname) continue; // skip blank rows
      const id = `${siteId}-${slug(textname)}`;
      const duplicateInfo = seenIds.get(id);
      if (duplicateInfo) {
        console.warn(`  [skip dup] ${id} in ${file} (ip=${String(r.ipaddress || '').trim() || 'n/a'})`);
        continue;
      }
      seenIds.set(id, {
        file,
        textname,
        ip: String(r.ipaddress || '').trim() || null,
      });
      const cls = classify(r.pathhost, r.selecthost);
      const tags = [];
      if (r.servertype) tags.push(`env:${r.servertype}`);
      if (r.servicename) tags.push(`svc:${r.servicename}`);
      if (r.physical_ip) tags.push(`host_ip:${r.physical_ip}`);
      if (r.subipaddress && r.subipaddress !== '[]') tags.push(`subnet:${r.subipaddress}`);
      const params = [
        id,
        textname,                                       // name
        cls.type,                                       // type
        manufacturerFrom(r.selecthost),                 // manufacturer
        cls.modelField === 'model' ? String(r.selecthost || '').trim() || null : null, // model
        'Active',                                       // status
        String(r.ipaddress || '').trim() || null,       // ip
        null,                                           // serial
        cls.osField === 'os' ? String(r.selecthost || '').trim() || null : null,       // os
        null,                                           // risk
        null,                                           // warranty
        tags,                                           // tags
        String(r.emailid || '').trim() || null,         // owner
        siteId,
        primaryClientId,
      ];
      if (APPLY) {
        await client.query(
          `INSERT INTO assets (id, name, type, manufacturer, model, status, ip, serial, os, risk, warranty, tags, owner, site_id, client_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
           ON CONFLICT (id) DO UPDATE SET
             name=$2, type=$3, manufacturer=$4, model=$5, status=$6, ip=$7,
             os=$9, tags=$12, owner=$13, site_id=$14, client_id=$15`,
          params
        );
        // Mirror into `infrastructure` so Infrastructure / Topology / Monitoring pages have data.
        // vendor/model/type are NOT NULL there — fall back to safe placeholders.
        const vendor = manufacturerFrom(r.selecthost) || 'Unknown';
        const model  = String(r.selecthost || '').trim() || cls.type || 'Unknown';
        const infraType = cls.type;
        await client.query(
          `INSERT INTO infrastructure (id, name, vendor, model, type, status, site_id, ip, owner)
           VALUES ($1,$2,$3,$4,$5,'Active',$6,$7,$8)
           ON CONFLICT (id) DO UPDATE SET
             name=$2, vendor=$3, model=$4, type=$5, site_id=$6, ip=$7, owner=$8`,
          [id, textname, vendor, model, infraType, siteId,
           String(r.ipaddress || '').trim() || null,
           String(r.emailid || '').trim() || null]
        );
      }
      imported++;
    }
    summary.push({ file, siteId, count: imported });
  }
  return summary;
}

// ─── main ────────────────────────────────────────────────────────────────────
(async () => {
  console.log(APPLY ? '== APPLY MODE — writing to DB ==' : '== DRY RUN — pass --apply to write ==');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (APPLY) {
      await upsertClients(client);
      await upsertSites(client);
      // Seed the AUTH_BYPASS user so the api's audit-log writes don't violate the FK.
      await client.query(
        `INSERT INTO users (uid, email, display_name, role, last_login)
         VALUES ('dev-bypass','dev@local','Local Dev','admin', NOW())
         ON CONFLICT (uid) DO NOTHING`
      );
    }
    const summary = await importAssets(client);
    if (APPLY) {
      await client.query('COMMIT');
    } else {
      await client.query('ROLLBACK');
    }
    console.log('\nclients:', clients.length, '  sites:', sites.length);
    console.log('\nassets per site:');
    let total = 0;
    for (const row of summary) {
      const suffix = row.note ? `  (${row.note})` : '';
      console.log(`  ${row.file.padEnd(34)}  ${row.siteId.padEnd(22)}  ${String(row.count).padStart(4)}${suffix}`);
      total += row.count;
    }
    console.log(`  ${'TOTAL'.padEnd(34)}  ${''.padEnd(22)}  ${String(total).padStart(4)}`);
    if (!APPLY) console.log('\n(dry-run; nothing written. Re-run with --apply to commit.)');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Import failed:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
})();
