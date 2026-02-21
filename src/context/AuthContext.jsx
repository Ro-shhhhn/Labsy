import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId, retries = 5) => {
    for (let i = 0; i < retries; i++) {
      const { data, error } = await supabase
        .from("users")
        .select("*, labs(*)")
        .eq("id", userId)
        .maybeSingle();

      if (data) {
        setProfile(data);
        setLoading(false);
        return;
      }

      // If no data yet (signup race condition), wait and retry
      if (!data && !error) {
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }

      // If actual error, log and stop
      if (error) {
        console.error("Profile fetch error:", error.message);
        break;
      }
    }

    // After all retries, still set loading false
    setLoading(false);
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
}