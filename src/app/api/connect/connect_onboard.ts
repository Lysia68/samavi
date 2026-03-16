import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createServerSupabase, createServiceSupabase } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" })

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { studioId } = await req.json()
    if (!studioId) return NextResponse.json({ error: "studioId requis" }, { status: 400 })

    // Vérifier que l'user est admin de ce studio
    const { data: profile } = await supabase
      .from("profiles").select("role, studio_id").eq("id", user.id).single()
    if (!profile || !["admin","superadmin"].includes(profile.role) || profile.studio_id !== studioId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const db = createServiceSupabase()
    const { data: studio } = await db
      .from("studios")
      .select("name, email, stripe_connect_id, stripe_connect_status")
      .eq("id", studioId).single()

    if (!studio) return NextResponse.json({ error: "Studio introuvable" }, { status: 404 })

    // Si déjà un compte Connect actif → générer un lien de dashboard
    if (studio.stripe_connect_id && studio.stripe_connect_status === "active") {
      const loginLink = await stripe.accounts.createLoginLink(studio.stripe_connect_id)
      return NextResponse.json({ url: loginLink.url, existing: true })
    }

    // Créer ou réutiliser un compte Express existant
    let accountId = studio.stripe_connect_id
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "FR",
        email: studio.email || user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_profile: {
          name: studio.name,
          url: `https://${studioId}.fydelys.fr`,
          mcc: "7941", // Sports clubs
        },
        metadata: { studioId, platform: "fydelys" },
      })
      accountId = account.id

      // Sauvegarder l'ID tout de suite
      await db.from("studios").update({
        stripe_connect_id: accountId,
        stripe_connect_status: "pending",
      }).eq("id", studioId)
    }

    const origin = req.headers.get("origin") || `https://${req.headers.get("host")}`

    // Lien d'onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/settings?tab=payments&connect=refresh`,
      return_url:  `${origin}/settings?tab=payments&connect=success`,
      type: "account_onboarding",
    })

    return NextResponse.json({ url: accountLink.url })
  } catch (err: any) {
    console.error("Connect onboard error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}