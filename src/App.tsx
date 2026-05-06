/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Assets } from './pages/Assets';
import { Configurations } from './pages/Configurations';
import { AuditLog } from './pages/AuditLog';
import { Clients } from './pages/Clients';
import { Sites } from './pages/Sites';
import { Automation } from './pages/Automation';
import { Infrastructure } from './pages/Infrastructure';
import { Topology } from './pages/Topology';
import { Monitoring } from './pages/Monitoring';
import { Racks } from './pages/Racks';
import { NetworkAI } from './components/NetworkAI';
import { Onboarding } from './pages/Onboarding';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { Login } from './pages/Login';
import { UsersPage } from './pages/Users';

function AppContent() {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gradient-to-br from-[#faf9f5] via-[#f7f4ee] to-[#efeae3]">
        <div className="flex flex-col items-center gap-5 rounded-2xl border border-stone-200/90 bg-white/85 px-10 py-12 shadow-[0_24px_64px_-32px_rgba(41,37,36,0.14)] backdrop-blur-sm">
          <div className="h-11 w-11 animate-spin rounded-full border-[3px] border-[#C8622E] border-t-transparent" />
          <div className="text-center">
            <p className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight text-stone-900">
              Argus
            </p>
            <p className="mt-1 text-sm text-stone-500">Loading workspace…</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="assets" element={<Assets />} />
          <Route path="assets/:assetId" element={<Assets />} />
          <Route path="infrastructure" element={<Infrastructure />} />
          <Route path="onboarding" element={<Onboarding />} />
          <Route path="topology" element={<Topology />} />
          <Route path="monitoring" element={<Monitoring />} />
          <Route path="racks" element={<Racks />} />
          <Route path="configs" element={<Configurations />} />
          <Route path="automation" element={<Automation />} />
          <Route path="audit-log" element={<AuditLog />} />
          <Route path="clients" element={<Clients />} />
          <Route path="sites" element={<Sites />} />
          {isAdmin && <Route path="users" element={<UsersPage />} />}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <NetworkAI />
    </>
  );
}

import { ErrorBoundary } from './components/ErrorBoundary';
import { ClientProvider } from './components/ClientProvider';
import { SiteProvider } from './components/SiteProvider';

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ClientProvider>
            <SiteProvider>
              <AppContent />
            </SiteProvider>
          </ClientProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
