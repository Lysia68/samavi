import { NextResponse, type NextRequest } from "next/server"
import { createServiceSupabase } from "@/lib/supabase-server"
import { checkAuth } from "@/lib/auth-check"

export const dynamic = "force-dynamic"

// GET /api/activity?studioId=xxx&memberId=xxx&limit=100
// Renvoie l'historique d'activité d'un membre (ou du studio si memberId absent)
export async function GET(request: NextRequest) {
  const studioId = request.nextUrl.searchParams.get("studioId")
  const memberId = request.nextUrl.searchParams.get("memberId")
  const limit    = Math.min(parseInt(request.nextUrl.searchParams.get("limit") || "100"), 500)
  const from     = request.nextUrl.searchParams.get("from") // YYYY-MM-DD
  const to       = request.nextUrl.searchParams.get("to")   // YYYY-MM-DD

  if (!studioId) return NextResponse.json({ error: "studioId requis" }, { status: 400 })

  const auth = await checkAuth(request, studioId)
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const db = createServiceSupabase()
  let q = db.from("member_activity")
    .select("id, member_id, actor_id, actor_role, action, details, created_at, members(first_name, last_name)")
    .eq("studio_id", studioId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (memberId) q = q.eq("member_id", memberId)
  if (from) q = q.gte("created_at", from + "T00:00:00")
  if (to)   q = q.lte("created_at", to + "T23:59:59")

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ activity: data || [] })
}
