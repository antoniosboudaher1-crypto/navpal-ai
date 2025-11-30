
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants';

const isConfigured = SUPABASE_URL && SUPABASE_ANON_KEY;

if (!isConfigured) {
  console.warn("Supabase credentials missing. Authentication and Database features will be disabled.");
}

// If no key is provided, we create a safe mock that matches the shape expected by App.tsx and services
// to prevent runtime crashes like "supabaseKey is required" or "cannot read property of undefined"
const mockSupabase = {
  auth: {
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword: async () => ({ data: { user: null }, error: new Error("Supabase API Key missing") }),
    signUp: async () => ({ data: { user: null }, error: new Error("Supabase API Key missing") }),
    updateUser: async () => ({ data: { user: null }, error: null }),
    signOut: async () => ({ error: null }),
    getUser: async () => ({ data: { user: null } }),
  },
  from: () => ({
    select: () => ({
      order: () => ({
        limit: async () => ({ data: [], error: null })
      })
    }),
    insert: () => ({
      select: () => ({
        single: async () => ({ data: null, error: null })
      })
    })
  }),
  // Mock Realtime Subscription
  channel: () => ({
    on: () => ({
      subscribe: () => ({
        unsubscribe: () => {}
      })
    }),
    subscribe: () => ({
      unsubscribe: () => {}
    })
  })
} as unknown as SupabaseClient;

export const supabase = isConfigured 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY!, {
      auth: {
        // Important for Sandboxes: Prevent Supabase from reading window.location.href
        // to find auth tokens in the URL hash, which can trigger cross-origin errors.
        detectSessionInUrl: false, 
        persistSession: true
      }
    }) 
  : mockSupabase;
