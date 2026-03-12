import { NextResponse, type NextRequest } from "next/server"
import { createServiceSupabase } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

// GET /api/team?studioId=xxx → liste coaches + invitations
export async function GET(request: NextRequest) {
  const studioId = request.nextUrl.searchParams.get("studioId")
  if (!studioId) return NextResponse.json({ error: "studioId requis" }, { status: 400 })

  const db = createServiceSupabase()

  const [{ data: profiles }, { data: links }, { data: invites }] = await Promise.all([
    db.from("profiles").select("id, first_name, last_name, role, is_coach")
      .eq("studio_id", studioId),
    db.from("coach_disciplines").select("profile_id, discipline_id").eq("studio_id", studioId),
    db.from("invitations").select("id, email, created_at")
      .eq("studio_id", studioId).eq("role", "coach").eq("used", false),
  ])

  // Croiser avec auth.users pour détecter email_confirmed_at
  const profileIds = (profiles||[]).map((p: any) => p.id)
  let confirmedMap: Record<string, boolean> = {}
  if (profileIds.length > 0) {
    const { data: { users: authUsers } } = await db.auth.admin.listUsers({ perPage: 1000 })
    ;(authUsers||[]).forEach((u: any) => {
      confirmedMap[u.id] = !!u.email_confirmed_at
    })
  }

  const discMap: Record<string, string[]> = {}
  ;(links||[]).forEach((l: any) => {
    if (!discMap[l.profile_id]) discMap[l.profile_id] = []
    discMap[l.profile_id].push(l.discipline_id)
  })

  const coaches = (profiles||[]).map((p: any) => ({
    id: p.id,
    fn: p.first_name || "",
    ln: p.last_name || "",
    role: p.role,
    is_coach: p.is_coach,
    disciplines: discMap[p.id] || [],
    confirmed: confirmedMap[p.id] !== false, // true si confirmé ou inconnu
  }))

  return NextResponse.json({ coaches, invites: invites || [] })
}

// POST /api/team → sauvegarder disciplines d'un coach
export async function POST(request: NextRequest) {
  const { coachId, discIds, studioId } = await request.json()
  if (!coachId || !studioId) return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 })

  const db = createServiceSupabase()

  await db.from("coach_disciplines").delete().eq("profile_id", coachId).eq("studio_id", studioId)

  if (discIds?.length > 0) {
    const { error } = await db.from("coach_disciplines").insert(
      discIds.map((dId: string) => ({ profile_id: coachId, discipline_id: dId, studio_id: studioId }))
    )
    if (error) {
      console.error("coach_disciplines insert error:", error)
      return NextResponse.json({ error: "Erreur sauvegarde disciplines" }, { status: 500 })
    }
  }

  // Mettre à jour is_coach si disciplines assignées
  await db.from("profiles").update({ is_coach: discIds?.length > 0 }).eq("id", coachId)

  return NextResponse.json({ ok: true })
}