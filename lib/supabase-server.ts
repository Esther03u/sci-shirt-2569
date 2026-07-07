// lib/supabase-server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (error) {
            // Ignored if called from a Server Component
          }
        },
      },
    }
  );
}

import { createClient } from '@supabase/supabase-js';

export async function createAdminSupabase() {
  // Use standard createClient without cookies to ensure it acts as service_role
  // and does not get overridden by the user's session JWT in cookies.
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    }
  );
}

export async function getSession() {
  const supabase = await createServerSupabase();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    console.error("Auth error in getSession:", error?.message);
    return null;
  }
  return { user };
}

export async function getDistributorProfile(userId: string) {
  const supabase = await createAdminSupabase();
  const { data } = await supabase
    .from('distributors')
    .select('*')
    .eq('id', userId)
    .single();
  return data;
}
