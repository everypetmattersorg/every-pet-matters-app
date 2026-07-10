import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadProfile(session.user);
      } else {
        setIsLoadingAuth(false);
      }
    });

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        loadProfile(session.user);
        if (event === 'SIGNED_IN') {
          trackEvent(session.user.id, 'login');
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setIsLoadingAuth(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const trackEvent = async (userId, eventType) => {
    try {
      await supabase.from('analytics_events').insert({ user_id: userId, event_type: eventType });
    } catch { /* silently ignore — analytics should never break the app */ }
  };

  const loadProfile = async (authUser) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();
    setUser({ id: authUser.id, email: authUser.email, ...(profile ?? {}) });
    setIsAuthenticated(true);
    setIsLoadingAuth(false);

    // Track one session event per browser session per day
    const sessionKey = `session_tracked_${authUser.id}_${new Date().toISOString().slice(0, 10)}`;
    if (!sessionStorage.getItem(sessionKey)) {
      sessionStorage.setItem(sessionKey, '1');
      trackEvent(authUser.id, 'session');
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
  };

  const acceptTerms = async () => {
    if (!user) return { error: new Error('Not signed in') };
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, email: user.email, terms_accepted: true });
    if (!error) {
      setUser({ ...user, terms_accepted: true });
    }
    return { error };
  };

  const navigateToLogin = () => {
    sessionStorage.setItem('login_return_url', window.location.href);
    window.location.href = '/Login';
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings: false,
      authError: null,
      appPublicSettings: {},
      logout,
      acceptTerms,
      navigateToLogin,
      checkAppState: () => {},
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
