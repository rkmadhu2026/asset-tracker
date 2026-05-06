import React, { createContext, useContext, useEffect, useState } from 'react';
import { usersApi, type UserRow } from '../lib/api';
import { ADMIN_BOOTSTRAP_EMAIL } from '../../config/bootstrap-admin';

export type UserRole = 'admin' | 'developer' | 'viewer';

interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  lastLogin: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  apiSyncFailed: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  signOut: () => void;
  isAdmin: boolean;
  isDeveloper: boolean;
  isViewer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiSyncFailed, setApiSyncFailed] = useState(false);

  const isAdmin = user?.role === 'admin';
  const isDeveloper = user?.role === 'developer' || user?.role === 'admin';
  const isViewer = true;

  const setSession = (token: string, profile: UserProfile) => {
    localStorage.setItem('jwt', token);
    localStorage.setItem('user', JSON.stringify(profile));
    setUser(profile);
  };

  const clearSession = () => {
    localStorage.removeItem('jwt');
    localStorage.removeItem('user');
    setUser(null);
  };

  useEffect(() => {
    if (process.env.AUTH_BYPASS === 'true') {
      console.warn('[auth] AUTH_BYPASS=true — using local dev admin.');
      const profile: UserProfile = {
        uid: 'dev-bypass',
        email: 'dev@local',
        displayName: 'Local Dev',
        photoURL: null,
        role: 'admin',
        lastLogin: new Date().toISOString(),
      };
      setUser(profile);
      setLoading(false);
      return;
    }
    const token = localStorage.getItem('jwt');
    const stored = localStorage.getItem('user');
    if (token && stored) {
      try {
        const profile: UserProfile = JSON.parse(stored);
        setUser(profile);
      } catch {
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const signInWithEmail = async (email: string, pass: string) => {
    setApiSyncFailed(false);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Login failed');
      }
      const { token, user: u } = await res.json();
      const profile: UserProfile = {
        uid: u.uid,
        email: u.email,
        displayName: u.display_name || null,
        photoURL: u.photo_url || null,
        role: u.role,
        lastLogin: new Date().toISOString(),
      };
      setSession(token, profile);
    } catch (err) {
      setApiSyncFailed(true);
      throw err;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    setApiSyncFailed(false);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass, displayName: name }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Registration failed');
      }
      const { token, user: u } = await res.json();
      const profile: UserProfile = {
        uid: u.uid,
        email: u.email,
        displayName: u.display_name || null,
        photoURL: u.photo_url || null,
        role: u.role,
        lastLogin: new Date().toISOString(),
      };
      setSession(token, profile);
    } catch (err) {
      setApiSyncFailed(true);
      throw err;
    }
  };

  const handleSignOut = () => {
    clearSession();
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      apiSyncFailed,
      signInWithEmail,
      signUpWithEmail,
      signOut: handleSignOut,
      isAdmin,
      isDeveloper,
      isViewer
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
