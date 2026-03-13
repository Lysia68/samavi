import { NextResponse, type NextRequest } from "next/server"
import { createServiceSupabase } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

// GET /api/team?studioId=xxx → liste coaches + invitations
export async function GET(request: NextRequest) {
  const studioId = request.nextUrl.searchParams.get("studioId")
  if (!studioId) return NextResponse.json({ error: "studioId requis" }, { status: 400 })

  const db = createServiceSupabase()

  const [{ data: profiles }, { data: links }, { data: invites }, { data: members }] = await Promise.all([
    db.from("profiles").select("id, first_name, last_name, role, is_coach")
      .eq("studio_id", studioId),
    db.from("coach_disciplines").select("profile_id, discipline_id").eq("studio_id", studioId),
    db.from("invitations").select("id, email, created_at")
      .eq("studio_id", studioId).eq("role", "coach").eq("used", false),
    db.from("members").select("auth_user_id, first_name, last_name, email")
      .eq("studio_id", studioId).not("auth_user_id", "is", null),
  ])

  // Map membres par auth_user_id pour enrichissement rapide
  const membersByUid: Record<string, any> = {}
  ;(members || []).forEach((m: any) => { membersByUid[m.auth_user_id] = m })

  // Croiser avec auth.users pour email + confirmed
  const profileIdSet = new Set((profiles || []).map((p: any) => p.id))
  // Toujours charger authMap — nécessaire pour les orphans (membres avec auth_user_id sans profil)
  const authMap: Record<string, { email: string; confirmed: boolean }> = {}
  try {
    const { data: { users: authUsers } } = await db.auth.admin.listUsers({ perPage: 1000 })
    ;(authUsers || []).forEach((u: any) => {
      authMap[u.id] = { email: u.email || "", confirmed: !!u.email_confirmed_at }
    })
  } catch(_) {}

  const discMap: Record<string, string[]> = {}
  ;(links || []).forEach((l: any) => {
    if (!discMap[l.profile_id]) discMap[l.profile_id] = []
    discMap[l.profile_id].push(l.discipline_id)
  })

  const coaches = (profiles || []).map((p: any) => {
    // Priorité : members > profiles pour les noms
    const member = membersByUid[p.id]
    const fn = member?.first_name || p.first_name || ""
    const ln = member?.last_name  || p.last_name  || ""
    const email = member?.email   || authMap[p.id]?.email || ""
    return {
      id: p.id,
      fn,
      ln,
      email,
      role: p.role,
      is_coach: p.is_coach,
      disciplines: discMap[p.id] || [],
      confirmed: authMap[p.id]?.confirmed !== false,
    }
  })

  // Membres avec auth_user_id mais sans profil dans profiles (adherents sans compte app complet)
  const orphanMembers = (members || [])
    .filter((m: any) => m.auth_user_id && !profileIdSet.has(m.auth_user_id))
    .map((m: any) => ({
      id: m.auth_user_id,
      fn: m.first_name || "",
      ln: m.last_name  || "",
      email: m.email   || authMap[m.auth_user_id]?.email || "",
      role: "adherent",
      is_coach: false,
      disciplines: [],
      confirmed: authMap[m.auth_user_id]?.confirmed !== false,
    }))

  return NextResponse.json({ coaches: [...coaches, ...orphanMembers], invites: invites || [] })
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