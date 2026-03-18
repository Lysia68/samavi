import { NextResponse, type NextRequest } from "next/server"
import { createServiceSupabase } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const { userId, userEmail, userMetadata, tenantSlug } = await request.json()

  if (!userId || !tenantSlug) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 })
  }

  const db = createServiceSupabase()

  // Récupérer le studio
  const { data: studio } = await db.from("studios").select("id, slug").eq("slug", tenantSlug).single()
  if (!studio) return NextResponse.json({ error: "Studio introuvable" }, { status: 404 })

  // Vérifier si profil existe déjà
  const { data: existing } = await db.from("profiles").select("role, studio_id").eq("id", userId).single()

  if (existing) {
    // Profil existant — s'assurer que auth_user_id est à jour dans members
    if (existing.role === "adherent" && existing.studio_id) {
      await db.from("members")
        .update({ auth_user_id: userId })
        .eq("studio_id", existing.studio_id)
        .eq("email", userEmail)
    }
    // Lire profile_complete pour savoir si onboarding requis
    const { data: member } = await db.from("members")
      .select("profile_complete")
      .eq("studio_id", existing.studio_id || studio.id)
      .eq("email", userEmail)
      .single()

    return NextResponse.json({
      ok: true,
      role: existing.role,
      slug: studio.slug,
      profile_complete: member?.profile_complete ?? true,
    })
  }

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
    // Vérifier si membre existe déjà (créé par l'admin avant invitation)
    const { data: existingMember } = await db.from("members")
      .select("id, profile_complete")
      .eq("studio_id", studio.id)
      .eq("email", userEmail)
      .single()

    if (existingMember) {
      // Membre pré-créé par l'admin — juste mettre à jour auth_user_id
      await db.from("members")
        .update({ auth_user_id: userId })
        .eq("id", existingMember.id)
    } else {
      // Nouveau membre — créer avec profile_complete: false
      await db.from("members").insert({
        studio_id: studio.id, auth_user_id: userId,
        first_name: userMetadata?.first_name || "Nouveau",
        last_name:  userMetadata?.last_name  || "Membre",
        email: userEmail, status: "nouveau", credits: 0, credits_total: 0,
        profile_complete: false,
      })
    }
  }

  return NextResponse.json({
    ok: true, role, slug: studio.slug,
    profile_complete: role === "adherent" ? false : true,
  })
}