import { auth } from '../firebase';
import type { Client, Site, Rack } from '../types/inventory';

async function token(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  return user.getIdToken();
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${await token()}`,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data as T;
}

const get  = <T>(path: string)                  => request<T>('GET',    path);
const post = <T>(path: string, body: unknown)   => request<T>('POST',   path, body);
const put  = <T>(path: string, body: unknown)   => request<T>('PUT',    path, body);
const del  = (path: string)                     => request<void>('DELETE', path);

// ── Clients ────────────────────────────────────────────────────────────────

type ClientRow = Omit<Client, 'id'> & { id?: string };

export const clientsApi = {
  list:   ()                              => get<Client[]>('/clients'),
  get:    (id: string)                    => get<Client>(`/clients/${id}`),
  create: (data: ClientRow)               => post<Client>('/clients', data),
  update: (id: string, data: Partial<Client>) => put<Client>(`/clients/${id}`, data),
  delete: (id: string)                    => del(`/clients/${id}`),
};

// ── Sites ──────────────────────────────────────────────────────────────────

type SiteRow = Omit<Site, 'id' | 'clientIds'> & { id?: string; client_ids?: string[] };

export const sitesApi = {
  list:   (clientId?: string) => get<Site[]>(clientId ? `/sites?clientId=${clientId}` : '/sites'),
  get:    (id: string)        => get<Site>(`/sites/${id}`),
  create: (data: SiteRow)     => post<Site>('/sites', data),
  update: (id: string, data: Partial<SiteRow>) => put<Site>(`/sites/${id}`, data),
  delete: (id: string)        => del(`/sites/${id}`),
};

// ── Racks ──────────────────────────────────────────────────────────────────

type RackRow = Omit<Rack, 'id'> & { id?: string };

export const racksApi = {
  list:   (siteId?: string) => get<Rack[]>(siteId ? `/racks?siteId=${siteId}` : '/racks'),
  get:    (id: string)      => get<Rack>(`/racks/${id}`),
  create: (data: RackRow)   => post<Rack>('/racks', data),
  update: (id: string, data: Partial<RackRow>) => put<Rack>(`/racks/${id}`, data),
  delete: (id: string)      => del(`/racks/${id}`),
};

// ── Infrastructure ─────────────────────────────────────────────────────────

export interface Device {
  id: string;
  name: string;
  vendor: string;
  model: string;
  type: string;
  status: 'Active' | 'Warning' | 'Offline';
  site_id?: string;
  rack_id?: string;
  u_position?: string;
  ip?: string;
  mask?: string;
  gateway?: string;
  vlan?: string;
  serial?: string;
  firmware?: string;
  uptime?: string;
  cpu?: string;
  memory?: string;
  temp?: string;
  ports?: string;
  last_backup?: string;
  owner?: string;
  criticality?: 'Critical' | 'High' | 'Medium' | 'Low';
  purchase_date?: string;
  warranty_expiry?: string;
  assigned_to?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DeviceFilters {
  clientId?: string;
  siteId?: string;
  status?: string;
  type?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

function buildQuery(filters: DeviceFilters): string {
  const p = new URLSearchParams();
  if (filters.clientId) p.set('clientId', filters.clientId);
  if (filters.siteId)   p.set('siteId',   filters.siteId);
  if (filters.status)   p.set('status',   filters.status);
  if (filters.type)     p.set('type',     filters.type);
  if (filters.search)   p.set('search',   filters.search);
  if (filters.limit)    p.set('limit',    String(filters.limit));
  if (filters.offset)   p.set('offset',   String(filters.offset));
  const q = p.toString();
  return q ? `/infrastructure?${q}` : '/infrastructure';
}

export const infrastructureApi = {
  list:            (filters?: DeviceFilters)                            => get<Device[]>(buildQuery(filters || {})),
  get:             (id: string)                                         => get<Device>(`/infrastructure/${id}`),
  create:          (data: Omit<Device,'id'> & { id?: string })          => post<Device>('/infrastructure', data),
  update:          (id: string, data: Partial<Device>)                  => put<Device>(`/infrastructure/${id}`, data),
  delete:          (id: string)                                         => del(`/infrastructure/${id}`),
  listDocuments:   (deviceId: string)                                   => get<any[]>(`/infrastructure/${deviceId}/documents`),
  addDocument:     (deviceId: string, doc: { name: string; url: string; type?: string }) =>
                     post<any>(`/infrastructure/${deviceId}/documents`, doc),
};

// ── Assets ─────────────────────────────────────────────────────────────────

export interface AssetRow {
  id: string;
  name: string;
  type?: string;
  manufacturer?: string;
  model?: string;
  status?: string;
  ip?: string;
  serial?: string;
  os?: string;
  risk?: number;
  warranty?: string;
  tags?: string[];
  owner?: string;
  site_id?: string;
  client_id?: string;
  created_at?: string;
  updated_at?: string;
}

export const assetsApi = {
  list:        (params?: { clientId?: string; siteId?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.clientId) q.set('clientId', params.clientId);
    if (params?.siteId)   q.set('siteId',   params.siteId);
    if (params?.status)   q.set('status',   params.status);
    const qs = q.toString();
    return get<AssetRow[]>(qs ? `/assets?${qs}` : '/assets');
  },
  get:         (id: string)                            => get<AssetRow>(`/assets/${id}`),
  create:      (data: Omit<AssetRow,'id'> & { id?: string }) => post<AssetRow>('/assets', data),
  update:      (id: string, data: Partial<AssetRow>)   => put<AssetRow>(`/assets/${id}`, data),
  bulkUpdate:  (ids: string[], field: string, value: unknown) => request<{ updated: number }>('PATCH', '/assets/bulk', { ids, field, value }),
  delete:      (id: string)                            => del(`/assets/${id}`),
  listDocs:    (id: string)                            => get<any[]>(`/assets/${id}/documents`),
  addDoc:      (id: string, data: { name: string; url: string; type?: string }) => post<any>(`/assets/${id}/documents`, data),
  listTypes:       ()                                      => get<any[]>('/assets/types/list'),
  addType:         (name: string)                          => post<any>('/assets/types/list', { name }),
  listDeviceTypes: ()                                      => get<any[]>('/assets/device-types'),
  addDeviceType:   (name: string)                          => post<any>('/assets/device-types', { name }),
};

// ── Config Tasks ───────────────────────────────────────────────────────────

export interface ConfigTask {
  id: string;
  title: string;
  description?: string;
  priority?: string;
  status?: string;
  device_id?: string;
  assigned_to?: string;
  due_date?: string;
  created_at?: string;
  updated_at?: string;
}

export const configTasksApi = {
  list:   ()                                          => get<ConfigTask[]>('/config-tasks'),
  create: (data: Omit<ConfigTask,'id'>)               => post<ConfigTask>('/config-tasks', data),
  update: (id: string, data: Partial<ConfigTask>)     => put<ConfigTask>(`/config-tasks/${id}`, data),
  delete: (id: string)                               => del(`/config-tasks/${id}`),
};

// ── Device Templates ───────────────────────────────────────────────────────

export interface DeviceTemplate {
  id: string;
  name: string;
  vendor?: string;
  model?: string;
  type?: string;
  defaults?: Record<string, unknown>;
  created_at?: string;
}

export const deviceTemplatesApi = {
  list:   ()                                              => get<DeviceTemplate[]>('/device-templates'),
  create: (data: Omit<DeviceTemplate,'id'>)               => post<DeviceTemplate>('/device-templates', data),
  delete: (id: string)                                   => del(`/device-templates/${id}`),
};

// ── Drifts ─────────────────────────────────────────────────────────────────

export interface DriftRow {
  id: string;
  device_id?: string;
  field?: string;
  expected_value?: string;
  actual_value?: string;
  status?: string;
  created_at?: string;
}

export const driftsApi = {
  list:         (params?: { deviceId?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.deviceId) q.set('deviceId', params.deviceId);
    if (params?.status)   q.set('status',   params.status);
    const qs = q.toString();
    return get<DriftRow[]>(qs ? `/drifts?${qs}` : '/drifts');
  },
  create:       (data: Omit<DriftRow,'id'>)             => post<DriftRow>('/drifts', data),
  updateStatus: (id: string, status: string)            => put<DriftRow>(`/drifts/${id}/status`, { status }),
};

// ── Validation History ─────────────────────────────────────────────────────

export interface ValidationRecord {
  id: number;
  user_id?: string;
  device_id?: string;
  result?: string;
  status?: string;
  message?: string;
  details?: unknown;
  created_at?: string;
}

export const validationHistoryApi = {
  list:   ()                                                  => get<ValidationRecord[]>('/validation-history'),
  create: (data: Omit<ValidationRecord,'id'|'user_id'>)       => post<ValidationRecord>('/validation-history', data),
};

// ── Users ──────────────────────────────────────────────────────────────────

export interface UserRow {
  uid: string;
  email?: string;
  display_name?: string;
  photo_url?: string;
  role: 'admin' | 'developer' | 'viewer';
  last_login?: string;
}

export const usersApi = {
  sync:       (data: { display_name?: string; photo_url?: string }) => post<UserRow>('/users/sync', data),
  list:       ()                                 => get<UserRow[]>('/users'),
  updateRole: (uid: string, role: string)        => put<UserRow>(`/users/${uid}/role`, { role }),
};
