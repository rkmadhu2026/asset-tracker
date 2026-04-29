#!/usr/bin/env node
// Phase 2: tenants → (clients + sites) migration for Argus-asset-tracker.
//
// Reads from the in-source mapping below (NOT from the live `tenants` collection,
// to keep the migration deterministic and reviewable). Writes:
//   - /clients/{slug}  — 17 docs (11 standalone + 1 ISV parent + 5 ISV sub-clients)
//   - /sites/{slug}    — 15 docs (one per legacy tenant row, plus IndMoney BLR DR
//                                 promoted from a notes field, minus the 4 ISV rows
//                                 that collapse into one shared site)
//
// Idempotent: uses deterministic doc IDs (the slug). Re-running upserts cleanly.
// Defaults to dry-run; pass --apply to commit.
//
// Setup:
//   npm install --save-dev firebase-admin
//   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
//   node scripts/migrate-tenants-to-clients-sites.mjs           # dry run
//   node scripts/migrate-tenants-to-clients-sites.mjs --apply

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import admin from 'firebase-admin';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cfg = JSON.parse(
  readFileSync(resolve(__dirname, '..', 'firebase-applet-config.json'), 'utf8')
);
const APPLY = process.argv.includes('--apply');

// ─────────────────────────────────────────────────────────────────────────────
// Mapping: explicit, hand-audited. If a row looks wrong, fix the mapping here
// rather than patching post-migration.
// ─────────────────────────────────────────────────────────────────────────────

const FINSPOT_ID = 'finspot';
const ISV_PARENT_ID = 'finspot-isv';

const clients = [
  // ── FinSpot (operator + parent) ────────────────────────────────────
  {
    id: FINSPOT_ID, name: 'FinSpot', slug: 'finspot', status: 'Active',
    legalName: 'FinSpot Technology Solutions Private Limited',
    address: 'No. 55B, 1st Main Road, Electronic City Phase 1, Bengaluru - 560 100',
    website: 'https://finspot.in/',
    notes: 'Operator company — parent of IFSC, DX, FinSpot ISV; owns DR/DEV/UAT internal environments',
  },

  // ── FinSpot product divisions (sub-clients of FinSpot) ─────────────
  { id: 'ifsc',       name: 'IFSC (FinSpot)',     slug: 'ifsc',         status: 'Active', parentClientId: FINSPOT_ID },
  { id: 'dx',         name: 'DX (FinSpot)',       slug: 'dx',           status: 'Active', parentClientId: FINSPOT_ID },
  { id: ISV_PARENT_ID, name: 'FinSpot ISV',       slug: 'finspot-isv',  status: 'Active', parentClientId: FINSPOT_ID, notes: 'Parent of 5 ISV brands sharing fs-le-isv.finspot.in' },

  // ── ISV brands (sub-sub-clients, parented to FinSpot ISV) ──────────
  { id: 'vachana',    name: 'VACHANA',       slug: 'vachana',    status: 'Active', parentClientId: ISV_PARENT_ID },
  { id: 'vertex',     name: 'VERTEX',        slug: 'vertex',     status: 'Active', parentClientId: ISV_PARENT_ID },
  { id: 'bullsmart',  name: 'BULLSMART',     slug: 'bullsmart',  status: 'Active', parentClientId: ISV_PARENT_ID },
  { id: 'skycommod',  name: 'SKYCOMMOD',     slug: 'skycommod',  status: 'Active', parentClientId: ISV_PARENT_ID },
  { id: 'aionion',    name: 'AIONION',       slug: 'aionion',    status: 'Active', parentClientId: ISV_PARENT_ID },

  // ── External customer clients (no parent) ──────────────────────────
  { id: 'indmoney',   name: 'IndMoney',      slug: 'indmoney',   status: 'Active' },
  { id: 'pl-india',   name: 'PL India',      slug: 'pl-india',   status: 'Active' },
  { id: 'neo-wealth', name: 'Neo Wealth',    slug: 'neo-wealth', status: 'Active' },
  { id: 'flattrade',  name: 'Flattrade',     slug: 'flattrade',  status: 'Active' },
  { id: 'way2wealth', name: 'Way2Wealth',    slug: 'way2wealth', status: 'Active' },
  { id: 'lemonn',     name: 'Lemonn',        slug: 'lemonn',     status: 'Active' },
  { id: 'mirae',      name: 'Mirae Asset',   slug: 'mirae',      status: 'Active' },
  { id: 'smifs',      name: 'SMIFS',         slug: 'smifs',      status: 'Active' },
];

const sites = [
  { id: 'indmoney-prod-mum',  name: 'IndMoney Mumbai (PROD)',  clientIds: ['indmoney'],   env: 'PROD', region: 'Mumbai',    ip: '10.172.0.10',     url: 'https://indmoney-prod-le.finspot.in', domain: 'indmoney-prod-le.finspot.in', status: 'Active', legacyTenantIds: ['le-indmoney-prod'] },
  { id: 'indmoney-dr-blr',    name: 'IndMoney Bangalore (DR)', clientIds: ['indmoney'],   env: 'DR',   region: 'Bangalore', ip: '10.10.10.110',                                                                                                                  status: 'Active', legacyTenantIds: ['le-indmoney-prod'], notes: 'Promoted from IndMoney row notes field' },
  { id: 'pl-india-prod',      name: 'PL India (PROD)',         clientIds: ['pl-india'],   env: 'PROD', region: 'Chennai',   ip: '10.40.1.10',      url: 'https://prod-le.plindia.com',          domain: 'prod-le.plindia.com',         status: 'Active', legacyTenantIds: ['le-pl-india-prod'] },
  { id: 'neo-wealth-prod',    name: 'Neo Wealth (PROD)',       clientIds: ['neo-wealth'], env: 'PROD', region: 'Bangalore', ip: '10.40.40.23',     url: 'https://prod-le.neo-wealth.com',       domain: 'prod-le.neo-wealth.com',      status: 'Active', legacyTenantIds: ['le-neo-wealth-prod'] },
  { id: 'flattrade-prod',     name: 'Flattrade (PROD)',        clientIds: ['flattrade'],  env: 'PROD', region: 'Mumbai',    ip: '202.87.54.194',   url: 'https://prod-le.flattrade.in',         domain: 'prod-le.flattrade.in',        status: 'Active', legacyTenantIds: ['le-ftc-prod'] },

  // Shared ISV site — 5 sub-clients
  { id: 'finspot-isv-shared', name: 'FinSpot ISV Shared',
    clientIds: ['vachana', 'vertex', 'bullsmart', 'skycommod', 'aionion'],
    env: 'ISV', region: 'Mumbai', ip: '10.10.0.101', url: 'https://fs-le-isv.finspot.in', domain: 'fs-le-isv.finspot.in', status: 'Active',
    legacyTenantIds: ['le-isv-prod', 'le-vertex-prod', 'le-bullsmart-prod', 'le-skycmdt-prod', 'le-aionion-prod'] },

  { id: 'way2wealth-prod',    name: 'Way2Wealth (PROD)',       clientIds: ['way2wealth'], env: 'PROD', region: 'Bangalore', ip: '192.168.12.109',  url: 'https://w2w-prod-le.way2wealth.com',   domain: 'w2w-prod-le.way2wealth.com',  status: 'Active', legacyTenantIds: ['le-w2w-prod'] },
  { id: 'ifsc-prod',          name: 'IFSC (PROD)',             clientIds: ['ifsc'],       env: 'PROD', region: 'GIFT City', ip: '10.200.1.18',     url: 'https://fs-ifsc-le.finspot.in',        domain: 'fs-ifsc-le.finspot.in',       status: 'Active', legacyTenantIds: ['le-ifsc-prod'] },
  { id: 'lemonn-prod',        name: 'Lemonn (PROD)',           clientIds: ['lemonn'],     env: 'PROD', region: 'Mumbai',    ip: '154.210.170.126', url: 'https://lemonn-prod-le.finspot.in',    domain: 'lemonn-prod-le.finspot.in',   status: 'Active', legacyTenantIds: ['le-lemonn-prod'] },
  { id: 'dx-prod',            name: 'DX (PROD)',               clientIds: ['dx'],         env: 'PROD', region: 'Mumbai',    ip: '206.1.32.216',    url: 'https://fs-le-dx.finspot.in',          domain: 'fs-le-dx.finspot.in',         status: 'Active', legacyTenantIds: ['le-dx-prod'] },
  { id: 'mirae-prod',         name: 'Mirae Asset (PROD)',      clientIds: ['mirae'],      env: 'PROD', region: 'Mumbai',    ip: '192.168.152.156', url: 'https://fs-le-prod-mirae.com',         domain: 'fs-le-prod-mirae.com',        status: 'Active', legacyTenantIds: ['le-mirae-prod'] },
  { id: 'smifs-prod',         name: 'SMIFS (PROD)',            clientIds: ['smifs'],      env: 'PROD', region: 'Kolkata',   ip: '10.43.0.100',     url: 'https://smifs-prod-le.finspot.in',     domain: 'smifs-prod-le.finspot.in',    status: 'Active', legacyTenantIds: ['le-smifs-prod'] },

  // FinSpot internal environments
  { id: 'finspot-dr',         name: 'FinSpot DR',              clientIds: [FINSPOT_ID],   env: 'DR',   region: 'Bangalore', ip: '10.173.0.10',     url: 'https://fs-dr-le.finspot.in',          domain: 'fs-dr-le.finspot.in',         status: 'Active', legacyTenantIds: ['fs-dr-le'] },
  { id: 'finspot-dev',        name: 'FinSpot DEV',             clientIds: [FINSPOT_ID],   env: 'DEV',  region: 'Mumbai',    ip: '172.16.0.56',     url: 'https://fs-le-dev.finspot.in',         domain: 'fs-le-dev.finspot.in',        status: 'Active', legacyTenantIds: ['fs-le-dev-finspot'] },
  { id: 'finspot-uat',        name: 'FinSpot UAT',             clientIds: [FINSPOT_ID],   env: 'UAT',  region: 'Mumbai',    ip: '172.16.0.55',     url: 'https://fs-le-uat.finspot.in',         domain: 'fs-le-uat.finspot.in',        status: 'Active', legacyTenantIds: ['fs-le-uat'] },
];

// ─────────────────────────────────────────────────────────────────────────────

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('ERROR: set GOOGLE_APPLICATION_CREDENTIALS to your service-account JSON path.');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: cfg.projectId,
});
const db = admin.firestore();
db.settings({ databaseId: cfg.firestoreDatabaseId });

console.log(`Project:  ${cfg.projectId}`);
console.log(`Database: ${cfg.firestoreDatabaseId}`);
console.log(`Mode:     ${APPLY ? 'APPLY (writes will be made)' : 'DRY RUN (no writes — pass --apply to commit)'}`);
console.log(`Plan:     ${clients.length} clients, ${sites.length} sites`);
console.log('');

const now = admin.firestore.FieldValue.serverTimestamp();

console.log('── CLIENTS ──────────────────────────────────────────────────');
for (const c of clients) {
  const { id, ...payload } = c;
  const parentTag = payload.parentClientId ? `  (sub-client of ${payload.parentClientId})` : '';
  console.log(`  ${id.padEnd(20)} ${c.name}${parentTag}`);
  if (APPLY) {
    await db.collection('clients').doc(id).set({ ...payload, updatedAt: now, createdAt: now }, { merge: true });
  }
}

console.log('');
console.log('── SITES ────────────────────────────────────────────────────');
for (const s of sites) {
  const { id, ...payload } = s;
  console.log(`  ${id.padEnd(24)} ${s.env.padEnd(4)} ${(s.ip || '—').padEnd(18)} ${s.name}  → clients: [${s.clientIds.join(', ')}]`);
  if (APPLY) {
    await db.collection('sites').doc(id).set({ ...payload, updatedAt: now, createdAt: now }, { merge: true });
  }
}

console.log('');
console.log(`Done. ${APPLY ? 'Committed' : 'Dry run only'}: clients=${clients.length} sites=${sites.length}`);
console.log('');
console.log('Next steps after --apply:');
console.log('  1. Verify in Firebase Console that /clients and /sites are populated correctly');
console.log('  2. Phase 3: switch UI from TenantProvider to ClientProvider/SiteProvider');
console.log('  3. (Later) backfill /infrastructure documents with siteId FKs and remove the legacy /tenants collection');
process.exit(0);
