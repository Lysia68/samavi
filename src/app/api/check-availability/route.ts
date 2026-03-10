import { NextRequest, NextResponse } from "next/server"
import { createServiceSupabase } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

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
    // Utilise une RPC SQL pour chercher dans auth.users sans passer par le SDK admin
    // (évite les problèmes de typage de listUsers/getUserByEmail selon la version)
    const { data, error } = await db.rpc("email_exists_in_auth", { p_email: email })
    if (error) {
      // Fallback : cast explicite pour getUserByEmail
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await (db.auth.admin as any).getUserByEmail(email as string)
      result.emailTaken = !!res?.data?.user
    } else {
      result.emailTaken = !!data
    }
  }

  return NextResponse.json(result)
}
