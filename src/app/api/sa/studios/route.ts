import { NextResponse } from "next/server"
import { createServiceSupabase } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

// GET /api/sa/studios — liste tous les studios avec les profils admins (service role)
export async function GET() {
  try {
    const db = createServiceSupabase()

    const [{ data: studios }, { data: profiles }, { data: memberCounts }] = await Promise.all([
      db.from("studios")
        .select("id, name, slug, city, address, email, phone, status, billing_status, plan_slug, created_at, notes, payment_mode, stripe_connect_enabled")
        .order("created_at", { ascending: false }),
      db.from("profiles")
        .select("studio_id, first_name, last_name, phone, is_coach, role")
        .eq("role", "admin"),
      db.from("members")
        .select("studio_id")
        .not("status", "eq", "inactif"),
    ])

    // Compter les membres par studio côté serveur
    const countByStudio: Record<string, number> = {}
    ;(memberCounts || []).forEach((m: any) => {
      if (m.studio_id) countByStudio[m.studio_id] = (countByStudio[m.studio_id] || 0) + 1
    })

    return NextResponse.json({ studios: studios || [], profiles: profiles || [], memberCounts: countByStudio })
  } catch (err: any) {
    console.error("SA studios error:", err?.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
