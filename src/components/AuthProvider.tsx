import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
} from '../firebase';
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
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  apiSyncFailed: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isDeveloper: boolean;
  isViewer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Prefer Postgres-backed row from /api/users/sync; fall back to Firebase + bootstrap rules if API is down. */
function buildProfile(user: User, row?: UserRow | null): UserProfile {
  const email = row?.email ?? user.email ?? null;
  const fallbackRole: UserRole =
    email === ADMIN_BOOTSTRAP_EMAIL ? 'admin' : 'viewer';
  const role = (row?.role as UserRole | undefined) ?? fallbackRole;
  return {
    uid: row?.uid ?? user.uid,
    email,
    displayName: row?.display_name ?? user.displayName ?? null,
    photoURL: row?.photo_url ?? user.photoURL ?? null,
    role,
    lastLogin: row?.last_login ?? new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiSyncFailed, setApiSyncFailed] = useState(false);

  const isAdmin = profile?.role === 'admin';
  const isDeveloper = profile?.role === 'developer' || profile?.role === 'admin';
  const isViewer = true;

  useEffect(() => {
    if (process.env.AUTH_BYPASS === 'true') {
      console.warn('[auth] AUTH_BYPASS=true — skipping Firebase, using local dev admin.');
      const fakeUser = {
        uid: 'dev-bypass',
        email: 'dev@local',
        displayName: 'Local Dev',
        photoURL: null,
        getIdToken: async () => 'bypass',
      } as unknown as User;
      setUser(fakeUser);
      setProfile({
        uid: 'dev-bypass',
        email: 'dev@local',
        displayName: 'Local Dev',
        photoURL: null,
        role: 'admin',
        lastLogin: new Date().toISOString(),
      });
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setApiSyncFailed(false);

      if (currentUser) {
        try {
          const row = await usersApi.sync({
            display_name: currentUser.displayName || undefined,
            photo_url: currentUser.photoURL || undefined,
          });
          setProfile(buildProfile(currentUser, row));
        } catch (err) {
          console.error('Failed to sync user profile with API — using Firebase-only profile', err);
          setProfile(buildProfile(currentUser, null));
          setApiSyncFailed(true);
        }
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error('Email sign in error:', error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(result.user, { displayName: name });
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      apiSyncFailed,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      resetPassword,
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
