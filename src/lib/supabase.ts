import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const isProduction = typeof window !== "undefined" && window.location.hostname.includes("fydelys.fr")
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        // Partager TOUS les cookies (session + PKCE verifier) sur .fydelys.fr
        // Indispensable pour que le code_verifier créé sur slug.fydelys.fr
        // soit accessible depuis fydelys.fr/auth/callback
        domain: isProduction ? ".fydelys.fr" : undefined,
        sameSite: "lax",
        secure: isProduction,
        path: "/",
      },
    }
  )
}
