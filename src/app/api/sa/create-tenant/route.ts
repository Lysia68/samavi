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

    const {
      studioName, slug, city, zip, address, type, email, phone,
      firstName, lastName, isCoach, plan,
      payment_mode, stripe_connect_enabled,
    } = await req.json()

    if (!studioName || !slug || !email)
      return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 })

    if (!firstName?.trim() || !lastName?.trim())
      return NextResponse.json({ error: "Prénom et nom de l'admin sont obligatoires" }, { status: 400 })

    // Vérifier que le slug est libre
    const { data: existing } = await db.from("studios").select("id").eq("slug", slug).maybeSingle()
    if (existing) return NextResponse.json({ error: "Ce sous-domaine est déjà pris" }, { status: 409 })

    // Période de trial : 30 jours
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 30)

    // Créer le studio
    const { data: studio, error: studioErr } = await db.from("studios").insert({
      name:            studioName,
      slug,
      city:            city || null,
      postal_code:     zip || null,
      address:         address || null,
      email,
      phone:           phone || null,
      status:          "actif",
      plan_slug:       plan?.toLowerCase() || "essentiel",
      billing_status:  "trialing",
      trial_ends_at:   trialEndsAt.toISOString().slice(0, 10),
      plan_started_at: new Date().toISOString(),
      payment_mode:    payment_mode || "none",
      stripe_connect_enabled: stripe_connect_enabled || false,
    }).select().single()

    if (studioErr || !studio) {
      console.error("[create-tenant] Erreur création studio:", studioErr?.message)
      return NextResponse.json({ error: studioErr?.message || "Erreur création studio" }, { status: 500 })
    }

    console.log("[create-tenant] Studio créé:", studio.id, studio.slug)

    // Seed disciplines + abonnements + salle
    const { error: seedErr } = await db.rpc("seed_new_tenant", {
      p_studio_id: studio.id,
      p_type:      type || "Yoga",
    })
    if (seedErr) {
      console.error("[create-tenant] Erreur seed:", seedErr.message)
      // On continue malgré l'erreur de seed — le studio est créé
    } else {
      console.log("[create-tenant] Seed OK")
    }

    // Créer le compte Auth pour l'admin du studio
    const { data: authData, error: authErr } = await db.auth.admin.createUser({
      email,
      email_confirm: false, // envoi d'un email de confirmation
      user_metadata: {
        first_name: firstName,
        last_name:  lastName,
      },
    })

    if (authErr || !authData?.user) {
      console.error("[create-tenant] Erreur création user auth:", authErr?.message)
      // On ne bloque pas — le studio existe, l'admin peut être créé manuellement
      return NextResponse.json({
        ok: true,
        studioId: studio.id,
        slug: studio.slug,
        warning: `Studio créé mais compte admin non créé : ${authErr?.message || "email déjà utilisé ?"}. Envoyez un magic link manuellement.`,
      })
    }

    const authUserId = authData.user.id
    console.log("[create-tenant] Auth user créé:", authUserId)

    // Créer le profil admin
    const { error: profileErr } = await db.from("profiles").insert({
      id:         authUserId,
      studio_id:  studio.id,
      role:       "admin",
      first_name: firstName,
      last_name:  lastName,
      email,
      is_coach:   isCoach || false,
    })
    if (profileErr) {
      console.error("[create-tenant] Erreur création profil:", profileErr.message)
    } else {
      console.log("[create-tenant] Profil admin créé")
    }

    // Envoyer un magic link d'invitation à l'admin
    const origin = req.headers.get("origin") || "https://fydelys.fr"
    const { error: magicErr } = await db.auth.admin.generateLink({
      type:       "magiclink",
      email,
      options: {
        redirect_to: `${origin}/dashboard`,
      },
    })
    if (magicErr) {
      console.warn("[create-tenant] Magic link non envoyé:", magicErr.message)
    } else {
      console.log("[create-tenant] Magic link envoyé à", email)
    }

    return NextResponse.json({
      ok: true,
      studioId: studio.id,
      slug: studio.slug,
      adminId: authUserId,
    })

  } catch (err: any) {
    console.error("SA create-tenant error:", err?.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}