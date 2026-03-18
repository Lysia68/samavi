import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createServerSupabase as createClient } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { planSlug, studioId } = await req.json()
    if (!planSlug || !studioId) {
      return NextResponse.json({ error: "planSlug and studioId required" }, { status: 400 })
    }

    // Vérifier que l'user est admin de ce studio
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, studio_id")
      .eq("id", user.id)
      .single()

    if (!profile || profile.role !== "admin" || profile.studio_id !== studioId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Récupérer le plan et le studio
    const { data: plan } = await supabase
      .from("plans")
      .select("stripe_price_id, name, price_monthly")
      .eq("slug", planSlug)
      .single()

    if (!plan?.stripe_price_id) {
      return NextResponse.json({ error: "Plan not found or Stripe price not configured" }, { status: 404 })
    }

    const { data: studio } = await supabase
      .from("studios")
      .select("name, stripe_customer_id, billing_status, trial_ends_at")
      .eq("id", studioId)
      .single()

    if (!studio) return NextResponse.json({ error: "Studio not found" }, { status: 404 })

    // Créer ou récupérer le customer Stripe
    let customerId = studio.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: studio.name,
        metadata: { studioId, userId: user.id },
      })
      customerId = customer.id
      await supabase.from("studios").update({ stripe_customer_id: customerId }).eq("id", studioId)
    }

    // Calcul trial restant (si encore en trial, on le conserve)
    const trialEnd = studio.billing_status === "trialing" && studio.trial_ends_at
      ? Math.floor(new Date(studio.trial_ends_at).getTime() / 1000)
      : undefined

    const origin = req.headers.get("origin") || `https://${req.headers.get("host")}`

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
      subscription_data: trialEnd && trialEnd > Math.floor(Date.now() / 1000)
        ? { trial_end: trialEnd, metadata: { studioId, planSlug } }
        : { metadata: { studioId, planSlug } },
      success_url: `${origin}/billing?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${origin}/billing?canceled=1`,
      metadata: { studioId, planSlug },
      allow_promotion_codes: true,
      locale: "fr",
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error("Stripe checkout error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
