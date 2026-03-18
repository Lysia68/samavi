import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const slug  = searchParams.get("slug")
  const email = searchParams.get("email")

  const result: { slugTaken?: boolean; emailTaken?: boolean } = {}

  try {
    const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    // Slug : anon key suffit (studios est lisible publiquement via RLS ou pas de RLS)
    const anon = createClient(url, anonKey)
    if (slug) {
      const { data } = await anon.from("studios").select("id").eq("slug", slug).maybeSingle()
      result.slugTaken = !!data
    }

    // Email : RPC email_exists_in_auth (nécessite service_role)
    if (email) {
      if (serviceKey) {
        const admin = createClient(url, serviceKey, {
          auth: { autoRefreshToken: false, persistSession: false }
        })
        const { data } = await admin.rpc("email_exists_in_auth", { p_email: email })
        result.emailTaken = data === true
      } else {
        // Fallback sans service_role : vérifier dans pending_registrations seulement
        const { data } = await anon
          .from("pending_registrations").select("email").eq("email", email).maybeSingle()
        result.emailTaken = !!data
      }
    }
  } catch (err) {
    console.error("check-availability:", err)
    // On retourne un résultat vide plutôt que 500 — la vérification finale au submit bloquera
  }

  return NextResponse.json(result)
}
