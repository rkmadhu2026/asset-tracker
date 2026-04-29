#!/usr/bin/env node
// One-shot tenant importer for Argus-asset-tracker.
//
// Idempotent: looks up each tenant by its `tenantId` field. Updates the
// existing document if found, otherwise creates a new one whose document
// ID equals the tenantId (so future runs are stable).
//
// Setup:
//   npm install --save-dev firebase-admin
//   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
//   node scripts/import-tenants.mjs           # dry run (default)
//   node scripts/import-tenants.mjs --apply   # actually write
//
// The service account must have Cloud Datastore User role (or broader)
// on project-00e7fcf4-f07e-4410-b23.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import admin from 'firebase-admin';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cfg = JSON.parse(
  readFileSync(resolve(__dirname, '..', 'firebase-applet-config.json'), 'utf8')
);

const APPLY = process.argv.includes('--apply');

const tenants = [
  { name: 'IndMoney',         tenantId: 'le-indmoney-prod',    ip: '10.172.0.10',     env: 'PROD', url: 'https://indmoney-prod-le.finspot.in',  domain: 'indmoney-prod-le.finspot.in', status: 'Active', region: 'Mumbai',    notes: 'BLR DR: 10.10.10.110' },
  { name: 'PL India',         tenantId: 'le-pl-india-prod',    ip: '10.40.1.10',      env: 'PROD', url: 'https://prod-le.plindia.com',          domain: 'prod-le.plindia.com',         status: 'Active', region: 'Chennai' },
  { name: 'Neo Wealth',       tenantId: 'le-neo-wealth-prod',  ip: '10.40.40.23',     env: 'PROD', url: 'https://prod-le.neo-wealth.com',       domain: 'prod-le.neo-wealth.com',      status: 'Active', region: 'Bangalore' },
  { name: 'Flattrade (FTC)',  tenantId: 'le-ftc-prod',         ip: '202.87.54.194',   env: 'PROD', url: 'https://prod-le.flattrade.in',         domain: 'prod-le.flattrade.in',        status: 'Active', region: 'Mumbai' },
  { name: 'VACHANA (ISV)',    tenantId: 'le-isv-prod',         ip: '10.10.0.101',     env: 'ISV',  url: 'https://fs-le-isv.finspot.in',         domain: 'fs-le-isv.finspot.in',        status: 'Active', region: 'Mumbai' },
  { name: 'VERTEX (ISV)',     tenantId: 'le-vertex-prod',      ip: '10.10.0.101',     env: 'ISV',  url: 'https://fs-le-isv.finspot.in',         domain: 'fs-le-isv.finspot.in',        status: 'Active', region: 'Mumbai' },
  { name: 'BULLSMART (ISV)',  tenantId: 'le-bullsmart-prod',   ip: '10.10.0.101',     env: 'ISV',  url: 'https://fs-le-isv.finspot.in',         domain: 'fs-le-isv.finspot.in',        status: 'Active', region: 'Mumbai' },
  { name: 'SKYCOMMOD. (ISV)', tenantId: 'le-skycmdt-prod',     ip: '10.10.0.101',     env: 'ISV',  url: 'https://fs-le-isv.finspot.in',         domain: 'fs-le-isv.finspot.in',        status: 'Active', region: 'Mumbai' },
  { name: 'AIONION (ISV)',    tenantId: 'le-aionion-prod',     ip: '10.10.0.101',     env: 'ISV',  url: 'https://fs-le-isv.finspot.in',         domain: 'fs-le-isv.finspot.in',        status: 'Active', region: 'Mumbai' },
  { name: 'Way2Wealth',       tenantId: 'le-w2w-prod',         ip: '192.168.12.109',  env: 'PROD', url: 'https://w2w-prod-le.way2wealth.com',   domain: 'w2w-prod-le.way2wealth.com',  status: 'Active', region: 'Bangalore' },
  { name: 'IFSC (FinSpot)',   tenantId: 'le-ifsc-prod',        ip: '10.200.1.18',     env: 'PROD', url: 'https://fs-ifsc-le.finspot.in',        domain: 'fs-ifsc-le.finspot.in',       status: 'Active', region: 'GIFT City' },
  { name: 'Lemonn',           tenantId: 'le-lemonn-prod',      ip: '154.210.170.126', env: 'PROD', url: 'https://lemonn-prod-le.finspot.in',    domain: 'lemonn-prod-le.finspot.in',   status: 'Active', region: 'Mumbai' },
  { name: 'DX (FinSpot)',     tenantId: 'le-dx-prod',          ip: '206.1.32.216',    env: 'PROD', url: 'https://fs-le-dx.finspot.in',          domain: 'fs-le-dx.finspot.in',         status: 'Active', region: 'Mumbai' },
  { name: 'Mirae Asset',      tenantId: 'le-mirae-prod',       ip: '192.168.152.156', env: 'PROD', url: 'https://fs-le-prod-mirae.com',         domain: 'fs-le-prod-mirae.com',        status: 'Active', region: 'Mumbai' },
  { name: 'SMIFS',            tenantId: 'le-smifs-prod',       ip: '10.43.0.100',     env: 'PROD', url: 'https://smifs-prod-le.finspot.in',     domain: 'smifs-prod-le.finspot.in',    status: 'Active', region: 'Kolkata' },
  { name: 'FinSpot DR',       tenantId: 'fs-dr-le',            ip: '10.173.0.10',     env: 'DR',   url: 'https://fs-dr-le.finspot.in',          domain: 'fs-dr-le.finspot.in',         status: 'Active', region: 'Bangalore' },
  { name: 'FinSpot DEV',      tenantId: 'fs-le-dev-finspot',   ip: '172.16.0.56',     env: 'DEV',  url: 'https://fs-le-dev.finspot.in',          domain: 'fs-le-dev.finspot.in',        status: 'Active', region: 'Mumbai' },
  { name: 'FinSpot UAT',      tenantId: 'fs-le-uat',           ip: '172.16.0.55',     env: 'UAT',  url: 'https://fs-le-uat.finspot.in',          domain: 'fs-le-uat.finspot.in',        status: 'Active', region: 'Mumbai' },
];

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

const col = db.collection('tenants');

console.log(`Project: ${cfg.projectId}`);
console.log(`Database: ${cfg.firestoreDatabaseId}`);
console.log(`Mode: ${APPLY ? 'APPLY (writes will be made)' : 'DRY RUN (no writes — pass --apply to commit)'}`);
console.log('');

let created = 0, updated = 0, skipped = 0;
const now = admin.firestore.FieldValue.serverTimestamp();

for (const t of tenants) {
  const existing = await col.where('tenantId', '==', t.tenantId).limit(1).get();
  if (!existing.empty) {
    const docRef = existing.docs[0].ref;
    console.log(`UPDATE  ${t.tenantId.padEnd(28)} → ${docRef.id}`);
    if (APPLY) await docRef.set({ ...t, updatedAt: now }, { merge: true });
    updated++;
  } else {
    const docRef = col.doc(t.tenantId);
    console.log(`CREATE  ${t.tenantId.padEnd(28)} → ${docRef.id}`);
    if (APPLY) await docRef.set({ ...t, createdAt: now, updatedAt: now });
    created++;
  }
}

console.log('');
console.log(`Done. created=${created} updated=${updated} skipped=${skipped} ${APPLY ? '' : '(dry run)'}`);
process.exit(0);
