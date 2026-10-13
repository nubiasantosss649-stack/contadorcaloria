import type { Session } from '@supabase/supabase-js';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { isSupabaseConfigured } from '@/lib/env';
import { authService } from '@/services/auth-service';

type AuthStatus = 'loading' | 'signedIn' | 'signedOut';

type AuthContextValue = {
  status: AuthStatus;
  session: Session | null;
  /**
   * Developer preview: lets you browse the authenticated screens while Supabase is not
   * configured. Only available in development builds and never persisted.
   */
  isPreview: boolean;
  canUsePreview: boolean;
  isBackendConfigured: boolean;
  enterPreview: () => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);
  const [isPreview, setIsPreview] = useState(false);
  const canUsePreview = __DEV__ && !isSupabaseConfigured;

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    void authService
      .getSession()
      .then((current) => {
        if (active) setSession(current);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    const unsubscribe = authService.onSessionChange((next) => setSession(next));
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const enterPreview = useCallback(() => {
    if (canUsePreview) setIsPreview(true);
  }, [canUsePreview]);

  const signOut = useCallback(async () => {
    setIsPreview(false);
    await authService.signOut();
    setSession(null);
  }, []);

  const status: AuthStatus = isLoading
    ? 'loading'
    : session || isPreview
      ? 'signedIn'
      : 'signedOut';

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      session,
      isPreview,
      canUsePreview,
      isBackendConfigured: isSupabaseConfigured,
      enterPreview,
      signOut,
    }),
    [status, session, isPreview, canUsePreview, enterPreview, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
