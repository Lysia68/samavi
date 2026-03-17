import { NextResponse } from "next/server"
import { createServiceSupabase } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

// GET /api/sa/studios — liste tous les studios avec les profils admins (service role)
export async function GET() {
  try {
    const db = createServiceSupabase()

    const [{ data: studios }, { data: profiles }] = await Promise.all([
      db.from("studios")
        .select("id, name, slug, city, address, email, phone, status, billing_status, plan_slug, created_at, notes")
        .order("created_at", { ascending: false }),
      db.from("profiles")
        .select("studio_id, first_name, last_name, phone, is_coach, role")
        .eq("role", "admin"),
    ])

    return NextResponse.json({ studios: studios || [], profiles: profiles || [] })
  } catch (err: any) {
    console.error("SA studios error:", err?.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}