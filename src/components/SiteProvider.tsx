import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './AuthProvider';
import { useClient } from './ClientProvider';
import { sitesApi } from '../lib/api';
import type { Site } from '../types/inventory';

interface SiteContextType {
  sites: Site[];
  sitesForSelectedClient: Site[];
  selectedSiteId: string | null;
  setSelectedSiteId: (id: string | null) => void;
  loading: boolean;
  refresh: () => void;
}

const SiteContext = createContext<SiteContextType | undefined>(undefined);

export function SiteProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { selectedClientId } = useClient();
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSites = useCallback(async () => {
    if (!user) { setSites([]); setLoading(false); return; }
    try {
      const rows = await sitesApi.list();
      // Map snake_case → camelCase for clientIds array
      const mapped = rows.map((r: any) => ({
        ...r,
        clientIds: r.client_ids ?? r.clientIds ?? [],
        createdAt: r.created_at ?? r.createdAt ?? undefined,
        updatedAt: r.updated_at ?? r.updatedAt ?? undefined,
      })) as Site[];
      setSites(mapped);
      if (mapped.length > 0 && !selectedSiteId) {
        setSelectedSiteId(mapped[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch sites', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    fetchSites();
    const interval = setInterval(fetchSites, 30_000);
    return () => clearInterval(interval);
  }, [authLoading, fetchSites]);

  const sitesForSelectedClient = useMemo(
    () => selectedClientId ? sites.filter(s => s.clientIds?.includes(selectedClientId)) : sites,
    [sites, selectedClientId]
  );

  return (
    <SiteContext.Provider value={{
      sites, sitesForSelectedClient, selectedSiteId, setSelectedSiteId,
      loading, refresh: fetchSites,
    }}>
      {children}
    </SiteContext.Provider>
  );
}

export function useSite() {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error('useSite must be used within a SiteProvider');
  return ctx;
}
