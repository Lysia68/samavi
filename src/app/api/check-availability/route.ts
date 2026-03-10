import { NextRequest, NextResponse } from "next/server"
import { createServiceSupabase } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

// GET /api/check-availability?slug=xxx&email=xxx
// Vérifie si un slug ou email est déjà utilisé (service_role pour accéder à auth.users)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const slug  = searchParams.get("slug")
  const email = searchParams.get("email")

  const db = createServiceSupabase()
  const result: { slugTaken?: boolean; emailTaken?: boolean } = {}

  if (slug) {
    const { data } = await db
      .from("studios").select("id").eq("slug", slug).single()
    result.slugTaken = !!data
  }

  if (email) {
    // Vérifier dans auth.users via service_role
    const { data } = await db.auth.admin.listUsers()
    const exists = data?.users?.some(u => u.email === email)
    result.emailTaken = exists ?? false
  }

  return NextResponse.json(result)
}

>>>>>>> 644e36d223c3e059bbbf93ea2931dd0010623886