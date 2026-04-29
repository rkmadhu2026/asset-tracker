import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './AuthProvider';
import { clientsApi } from '../lib/api';
import type { Client } from '../types/inventory';

interface ClientContextType {
  clients: Client[];
  selectedClientId: string | null;
  setSelectedClientId: (id: string | null) => void;
  subClients: Client[];
  descendantClients: Client[];
  selectedClientFamily: string[];
  rootClients: Client[];
  loading: boolean;
  refresh: () => void;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchClients = useCallback(async () => {
    if (!user) { setClients([]); setLoading(false); return; }
    try {
      const rows = await clientsApi.list();
      // API returns snake_case; map parent_client_id → parentClientId
      const mapped = rows.map((r: any) => ({
        ...r,
        parentClientId: r.parent_client_id ?? r.parentClientId ?? undefined,
        legalName: r.legal_name ?? r.legalName ?? undefined,
        primaryContactEmail: r.primary_contact_email ?? r.primaryContactEmail ?? undefined,
        createdAt: r.created_at ?? r.createdAt ?? undefined,
        updatedAt: r.updated_at ?? r.updatedAt ?? undefined,
      })) as Client[];
      setClients(mapped);
      if (mapped.length > 0 && !selectedClientId) {
        const topLevel = mapped.find(c => !c.parentClientId) ?? mapped[0];
        setSelectedClientId(topLevel.id);
      }
    } catch (err) {
      console.error('Failed to fetch clients', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    fetchClients();
    // Poll every 30 s for background updates.
    const interval = setInterval(fetchClients, 30_000);
    return () => clearInterval(interval);
  }, [authLoading, fetchClients]);

  const rootClients = useMemo(() => clients.filter(c => !c.parentClientId), [clients]);

  const subClients = useMemo(
    () => selectedClientId ? clients.filter(c => c.parentClientId === selectedClientId) : [],
    [clients, selectedClientId]
  );

  const descendantClients = useMemo(() => {
    if (!selectedClientId) return [];
    const result: Client[] = [];
    const queue = [selectedClientId];
    while (queue.length) {
      const pid = queue.shift()!;
      const children = clients.filter(c => c.parentClientId === pid);
      result.push(...children);
      queue.push(...children.map(c => c.id));
    }
    return result;
  }, [clients, selectedClientId]);

  const selectedClientFamily = useMemo(
    () => selectedClientId ? [selectedClientId, ...descendantClients.map(c => c.id)] : [],
    [selectedClientId, descendantClients]
  );

  return (
    <ClientContext.Provider value={{
      clients, selectedClientId, setSelectedClientId,
      subClients, descendantClients, selectedClientFamily,
      rootClients, loading, refresh: fetchClients,
    }}>
      {children}
    </ClientContext.Provider>
  );
}

export function useClient() {
  const ctx = useContext(ClientContext);
  if (!ctx) throw new Error('useClient must be used within a ClientProvider');
  return ctx;
}
