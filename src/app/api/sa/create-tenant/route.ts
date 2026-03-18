import { NextRequest, NextResponse } from "next/server"
import { createServerSupabase, createServiceSupabase } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    // Vérifier que l'appelant est superadmin
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

    const db = createServiceSupabase()
    const { data: profile } = await db
      .from("profiles").select("role").eq("id", user.id).single()
    if (profile?.role !== "superadmin")
      return NextResponse.json({ error: "Accès refusé — superadmin uniquement" }, { status: 403 })

    const { studioName, slug, city, zip, address, type, email, phone, firstName, lastName, isCoach, plan } = await req.json()

    if (!studioName || !slug || !email)
      return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 })

    // Vérifier que le slug est libre
    const { data: existing } = await db.from("studios").select("id").eq("slug", slug).single()
    if (existing) return NextResponse.json({ error: "Ce sous-domaine est déjà pris" }, { status: 409 })

    // Créer le studio
    const { data: studio, error: studioErr } = await db.from("studios").insert({
      name: studioName, slug, city: city || null,
      address: address || null, email,
      phone: phone || null, status: "actif",
      plan_slug: plan?.toLowerCase() || "essentiel",
    }).select().single()

    if (studioErr || !studio)
      return NextResponse.json({ error: studioErr?.message || "Erreur création studio" }, { status: 500 })

    // Seed disciplines + abonnements + salle
    await db.rpc("seed_new_tenant", {
      p_studio_id: studio.id,
      p_type:      type || "Yoga",
    })

    return NextResponse.json({ ok: true, studioId: studio.id, slug: studio.slug })

  } catch (err: any) {
    console.error("SA create-tenant error:", err?.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
