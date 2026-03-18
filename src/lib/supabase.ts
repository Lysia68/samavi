import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const isProduction = typeof window !== "undefined" && window.location.hostname.includes("fydelys.fr")
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        domain: isProduction ? ".fydelys.fr" : undefined,
        sameSite: "lax",
        secure: isProduction,
        path: "/",
      },
    }
  )
}