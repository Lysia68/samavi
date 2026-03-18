import { createServerClient } from "@supabase/ssr"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

export async function createServerSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              // Partager la session sur tous les sous-domaines .fydelys.fr
              const opts = { ...options }
              if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_ROOT_DOMAIN) {
                opts.domain = "." + process.env.NEXT_PUBLIC_ROOT_DOMAIN
              }
              cookieStore.set(name, value, opts)
            })
          } catch {}
        },
      },
    }
  )
}

// Client service_role pour les routes API server-side (bypass RLS)
export function createServiceSupabase() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// Alias pour compatibilité avec les routes API Stripe
export const createClient = createServerSupabase
