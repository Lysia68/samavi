import { NextRequest, NextResponse } from "next/server"
import { createServiceSupabase } from "@/lib/supabase-server"
import { checkAuth } from "@/lib/auth-check"
import { checkPlanLimit } from "@/lib/plan-limits"

export const dynamic = "force-dynamic"

// GET /api/disciplines?studioId=xxx
export async function GET(req: NextRequest) {
  const studioId = req.nextUrl.searchParams.get("studioId")
  if (!studioId) return NextResponse.json({ error: "studioId requis" }, { status: 400 })

  const db = createServiceSupabase()
  const { data } = await db.from("disciplines")
    .select("id, name, icon, color, slots")
    .eq("studio_id", studioId)
    .order("created_at")

  const res = NextResponse.json({ disciplines: data || [] })
  res.headers.set("Cache-Control", "private, s-maxage=30, stale-while-revalidate=60")
  return res
}

// POST /api/disciplines — créer une discipline (avec vérification plan)
export async function POST(req: NextRequest) {
  const { studioId, name, icon, color, slots } = await req.json()
  if (!studioId || !name) return NextResponse.json({ error: "studioId et name requis" }, { status: 400 })

  const auth = await checkAuth(req, studioId)
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  // Vérifier limite du plan
  const limit = await checkPlanLimit(studioId, "add_discipline")
  if (!limit.ok) return NextResponse.json({ error: limit.error, limit: true }, { status: 403 })

  const db = createServiceSupabase()
  const { data, error } = await db.from("disciplines")
    .insert({ studio_id: studioId, name, icon: icon || null, color: color || "#B07848", slots: slots || [] })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, discipline: data })
}
