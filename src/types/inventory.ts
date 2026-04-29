// Argus inventory model: clients → sites → racks → devices.
// Phase 1 — new types live alongside the legacy `tenants` shape until migration completes.

export type ClientStatus = 'Active' | 'Inactive' | 'Suspended';
export type SiteEnv = 'PROD' | 'DR' | 'UAT' | 'DEV' | 'ISV';

export interface Client {
  id: string;
  name: string;
  slug: string;
  status: ClientStatus;
  parentClientId?: string;       // for sub-clients (e.g. ISV brands under a parent)
  legalName?: string;            // full registered company name
  address?: string;
  website?: string;
  primaryContactEmail?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Site {
  id: string;
  name: string;
  clientIds: string[];           // many-to-many; usually [oneClientId], ISV-shared site has 5
  env: SiteEnv;
  region?: string;
  ip?: string;
  url?: string;
  domain?: string;
  status?: 'Active' | 'Inactive';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Rack {
  id: string;
  siteId: string;                // FK to /sites/{siteId}
  name: string;
  position?: string;             // e.g. "Row A / Pos 12"
  totalU?: number;               // rack-unit capacity
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}
