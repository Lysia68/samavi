import { NextResponse, type NextRequest } from "next/server"
import { createServiceSupabase } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const { userId, userEmail, userMetadata, tenantSlug } = await request.json()

  if (!userId || !tenantSlug) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 })
  }

  const db = createServiceSupabase()

  // Vérifier si profil existe déjà
  const { data: existing } = await db.from("profiles").select("role, studio_id").eq("id", userId).single()
  if (existing) {
    let slug = null
    if (existing.studio_id) {
      const { data: studio } = await db.from("studios").select("slug").eq("id", existing.studio_id).single()
      slug = studio?.slug
    }
    return NextResponse.json({ ok: true, role: existing.role, slug })
  }

  // Récupérer le studio
  const { data: studio } = await db.from("studios").select("id, slug").eq("slug", tenantSlug).single()
  if (!studio) return NextResponse.json({ error: "Studio introuvable" }, { status: 404 })

  // Lire l'invitation
  const { data: invite } = await db.from("invitations")
    .select("role").eq("email", userEmail).eq("studio_id", studio.id)
    .eq("used", false).single()

  const role = invite?.role || userMetadata?.role || "adherent"

  // Créer le profil
  const { error: profileErr } = await db.from("profiles").insert({
    id: userId, role, studio_id: studio.id,
    first_name: userMetadata?.first_name || "",
    last_name:  userMetadata?.last_name  || "",
    is_coach: role === "coach",
  })
  if (profileErr) {
    console.error("create-profile error:", profileErr)
    return NextResponse.json({ error: "Erreur création profil" }, { status: 500 })
  }

  if (invite) {
    await db.from("invitations").update({ used: true })
      .eq("email", userEmail).eq("studio_id", studio.id)
  }

  if (role === "adherent") {
    await db.from("members").upsert({
      studio_id: studio.id, auth_user_id: userId,
      first_name: userMetadata?.first_name || "Nouveau",
      last_name:  userMetadata?.last_name  || "Membre",
      email: userEmail, status: "nouveau", credits: 0, credits_total: 0,
      profile_complete: false,
    }, { onConflict: "studio_id,email" })
  }

  return NextResponse.json({ ok: true, role, slug: studio.slug })
}