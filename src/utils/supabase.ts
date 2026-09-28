import { createClient, SupabaseClient } from '@supabase/supabase-js';

const envUrl = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_URL : undefined;
const envKey = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY : undefined;

const supabaseUrl = envUrl || 'https://vcsjmarnrctomlvtshaa.supabase.co';
const supabaseKey = envKey || 'sb_publishable_KFcL-J6HCilztzXegHQ5mQ_b_AG-kJC';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

/**
 * Singleton Supabase client initialized with project credentials
 */
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
    autoRefreshToken: true,
  },
});

/**
 * Test connectivity to the configured Supabase instance
 */
export async function testSupabaseConnection(): Promise<{ success: boolean; message: string; error?: any }> {
  if (!isSupabaseConfigured) {
    return { success: false, message: 'Supabase credentials are not configured.' };
  }

  try {
    // Attempt a lightweight ping or read
    const { error } = await supabase.from('system_users').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      // If table doesn't exist yet, we still know Supabase responded
      return {
        success: true,
        message: `Connected to Supabase (${supabaseUrl}). Ready for queries or schema migrations. Note: ${error.message}`,
      };
    }
    return {
      success: true,
      message: `Successfully connected to Supabase (${supabaseUrl}).`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Failed to connect to Supabase: ${err?.message || err}`,
      error: err,
    };
  }
}
