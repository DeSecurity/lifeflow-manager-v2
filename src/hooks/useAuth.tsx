/**
 * Authentication hook for managing user sessions
 */

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const STORAGE_KEY_PREFIX = 'sb-';
const REMEMBER_FLAG_KEY = 'lifepm.rememberMe';

/**
 * Move the persisted Supabase auth token between localStorage and sessionStorage
 * to honor the "Remember me" choice. When rememberMe=false, the session lives in
 * sessionStorage and is cleared when the browser/tab closes.
 */
function applySessionPersistence(rememberMe: boolean) {
  try {
    const target = rememberMe ? localStorage : sessionStorage;
    const source = rememberMe ? sessionStorage : localStorage;
    for (let i = source.length - 1; i >= 0; i--) {
      const key = source.key(i);
      if (key && key.startsWith(STORAGE_KEY_PREFIX) && key.includes('-auth-token')) {
        const value = source.getItem(key);
        if (value !== null) {
          target.setItem(key, value);
          source.removeItem(key);
        }
      }
    }
    localStorage.setItem(REMEMBER_FLAG_KEY, String(rememberMe));
  } catch {
    // Storage may be unavailable; fall back silently.
  }
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string, rememberMe = true) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (!error) {
      applySessionPersistence(rememberMe);
    }
    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      }
    });
    return { error };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } finally {
      try {
        const clearAuthTokens = (storage: Storage) => {
          for (let i = storage.length - 1; i >= 0; i--) {
            const key = storage.key(i);
            if (key && key.startsWith(STORAGE_KEY_PREFIX) && key.includes('-auth-token')) {
              storage.removeItem(key);
            }
          }
        };

        clearAuthTokens(localStorage);
        clearAuthTokens(sessionStorage);
        localStorage.removeItem(REMEMBER_FLAG_KEY);
      } catch {
        // Ignore storage cleanup errors.
      }
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signUp,
      signIn,
      signInWithGoogle,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
