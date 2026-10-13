import type { Session } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
   * True after opening a password-recovery link: the user has a temporary session and must
   * choose a new password before using the app.
   */
  isRecoveringPassword: boolean;
  finishPasswordRecovery: () => void;
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
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);
  const [isPreview, setIsPreview] = useState(false);
  const [isRecoveringPassword, setIsRecoveringPassword] = useState(false);
  const lastUserId = useRef<string | null>(null);
  const canUsePreview = __DEV__ && !isSupabaseConfigured;

  // Drop every cached query when the signed-in user changes, so data never leaks between
  // accounts on a shared device.
  const applySession = useCallback(
    (next: Session | null) => {
      const nextUserId = next?.user.id ?? null;
      if (nextUserId !== lastUserId.current) {
        queryClient.clear();
        lastUserId.current = nextUserId;
      }
      setSession(next);
    },
    [queryClient],
  );

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    void authService
      .getSession()
      .then((current) => {
        if (active) applySession(current);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    const unsubscribe = authService.onSessionChange((next, event) => {
      if (event === 'PASSWORD_RECOVERY') setIsRecoveringPassword(true);
      if (event === 'SIGNED_OUT') setIsRecoveringPassword(false);
      applySession(next);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [applySession]);

  const enterPreview = useCallback(() => {
    if (canUsePreview) setIsPreview(true);
  }, [canUsePreview]);

  const finishPasswordRecovery = useCallback(() => setIsRecoveringPassword(false), []);

  const signOut = useCallback(async () => {
    setIsPreview(false);
    setIsRecoveringPassword(false);
    await authService.signOut();
    applySession(null);
  }, [applySession]);

  const status: AuthStatus = isLoading
    ? 'loading'
    : session || isPreview
      ? 'signedIn'
      : 'signedOut';

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      session,
      isRecoveringPassword,
      finishPasswordRecovery,
      isPreview,
      canUsePreview,
      isBackendConfigured: isSupabaseConfigured,
      enterPreview,
      signOut,
    }),
    [
      status,
      session,
      isRecoveringPassword,
      finishPasswordRecovery,
      isPreview,
      canUsePreview,
      enterPreview,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
