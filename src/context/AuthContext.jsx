// C:\Users\itsme\OneDrive\Desktop\Labsy\src\context\AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { storage } from '../lib/helpers';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Initialize from localStorage so we have user data immediately on mount
    // This prevents the "flash of loading" on page navigations
    const cached = storage.get('user');
    console.log('[Auth] initial user from cache:', cached ? cached.email : 'none');
    return cached;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Track current user id to avoid unnecessary re-sets
  const currentUserIdRef = useRef(null);

  // Only update user state if data actually changed
  const updateUser = useCallback((userData) => {
    if (!userData) {
      if (currentUserIdRef.current !== null) {
        console.log('[Auth] clearing user');
        currentUserIdRef.current = null;
        setUser(null);
        storage.remove('user');
      }
      return;
    }

    // Check if user data actually changed
    const prevId = currentUserIdRef.current;
    if (
      prevId === userData.id
    ) {
      // Same user, check if any field changed
      setUser((prev) => {
        if (
          prev &&
          prev.id === userData.id &&
          prev.email === userData.email &&
          prev.fullName === userData.fullName &&
          prev.role === userData.role &&
          prev.labId === userData.labId
        ) {
          console.log('[Auth] user unchanged, skipping update');
          return prev; // Return same reference — no re-render
        }
        console.log('[Auth] ✅ updating user:', userData.email);
        storage.set('user', userData);
        return userData;
      });
    } else {
      console.log('[Auth] ✅ setting new user:', userData.email);
      currentUserIdRef.current = userData.id;
      setUser(userData);
      storage.set('user', userData);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    console.log('[Auth] useEffect MOUNT');

    const fetchAndSetUser = async (sessionUser) => {
      console.log('[Auth] fetchAndSetUser | uid:', sessionUser.id);
      try {
        const { data: dbUser, error: dbError } = await supabase
          .from('users')
          .select('role, lab_id')
          .eq('id', sessionUser.id)
          .single();

        if (!isMounted) return;

        if (dbError) {
          console.error('[Auth] DB error:', dbError.message);
          updateUser(null);
          return;
        }

        const userData = {
          id: sessionUser.id,
          email: sessionUser.email,
          fullName: sessionUser.user_metadata?.full_name || sessionUser.email.split('@')[0],
          role: dbUser.role || 'technician',
          labId: dbUser.lab_id || null,
        };

        updateUser(userData);
      } catch (err) {
        console.error('[Auth] fetchAndSetUser exception:', err);
        if (isMounted) updateUser(null);
      }
    };

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('[Auth] getSession uid:', session?.user?.id ?? 'NONE');

        if (session?.user && isMounted) {
          await fetchAndSetUser(session.user);
        } else if (isMounted) {
          updateUser(null);
        }
      } catch (err) {
        console.error('[Auth] getSession error:', err);
        if (isMounted) updateUser(null);
      } finally {
        if (isMounted) {
          setLoading(false);
          console.log('[Auth] init done, loading = false');
        }
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] onAuthStateChange:', event, '| uid:', session?.user?.id ?? 'NONE');
        if (!isMounted) return;

        if (event === 'INITIAL_SESSION') return;

        if (event === 'SIGNED_IN') {
          if (session?.user) {
            await fetchAndSetUser(session.user);
          }
        } else if (event === 'TOKEN_REFRESHED') {
          // Token refresh — user is the same, only update if we don't have user data
          if (session?.user && !currentUserIdRef.current) {
            await fetchAndSetUser(session.user);
          } else {
            console.log('[Auth] TOKEN_REFRESHED — user already set, skipping');
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('[Auth] SIGNED_OUT → clearing user');
          updateUser(null);
        }
      }
    );

    return () => {
      console.log('[Auth] useEffect CLEANUP');
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [updateUser]);

  const login = useCallback(async (email, password) => {
    setError(null);
    console.log('[Auth] login:', email);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      throw new Error(signInError.message);
    }

    if (!data.user) {
      throw new Error('Login failed - no user returned');
    }

    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select('role, lab_id')
      .eq('id', data.user.id)
      .single();

    if (dbError) {
      throw new Error(`Failed to fetch user data: ${dbError.message}`);
    }

    const userData = {
      id: data.user.id,
      email: data.user.email,
      fullName: data.user.user_metadata?.full_name || email.split('@')[0],
      role: dbUser.role || 'technician',
      labId: dbUser.lab_id || null,
    };

    console.log('[Auth] login ✅ user:', userData.email);
    currentUserIdRef.current = userData.id;
    setUser(userData);
    storage.set('user', userData);
    return userData;
  }, []);

  const signup = useCallback(async (email, password, labName) => {
    setError(null);
    console.log('[Auth] signup:', email);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: labName,
          role: 'admin',
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      throw new Error(signUpError.message);
    }

    if (!data.user) {
      throw new Error('Signup failed - no user returned');
    }

    const { data: labData, error: labError } = await supabase
      .from('labs')
      .insert([{ name: labName }])
      .select()
      .single();

    if (labError) {
      throw new Error(`Failed to create lab: ${labError.message}`);
    }

    const { error: userError } = await supabase
      .from('users')
      .insert([{
        id: data.user.id,
        lab_id: labData.id,
        role: 'admin',
      }]);

    if (userError) {
      throw new Error(`Failed to create user record: ${userError.message}`);
    }

    const userData = {
      id: data.user.id,
      email: data.user.email,
      fullName: labName,
      role: 'admin',
      labId: labData.id,
    };

    console.log('[Auth] signup ✅ user:', userData.email);
    currentUserIdRef.current = userData.id;
    setUser(userData);
    storage.set('user', userData);
    return userData;
  }, []);

  const logout = useCallback(async () => {
    console.log('[Auth] logout called');
    try {
      currentUserIdRef.current = null;
      setUser(null);
      storage.remove('user');
      setError(null);
      await supabase.auth.signOut();
      console.log('[Auth] logout ✅ done');
    } catch (err) {
      console.error('[Auth] logout error:', err);
    }
  }, []);

  const value = {
    user,
    loading,
    error,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};