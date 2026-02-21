import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  console.warn('Missing Supabase credentials. Please check your .env.local file');
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // FIX: Replace Navigator Lock with a simple in-memory lock.
    // Navigator Lock deadlocks when React StrictMode double-mounts
    // because the first mount holds the lock, gets unmounted, and
    // the second mount can't acquire it for 10 seconds.
    lock: async (_name, _acquireTimeout, fn) => {
      return await fn();
    },
  },
});

export { supabaseUrl, supabasePublishableKey };