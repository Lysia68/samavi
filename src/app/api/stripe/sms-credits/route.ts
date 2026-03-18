import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createServerSupabase } from "@/lib/supabase-server"
import { createServiceSupabase } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" })

const SMS_PACKS: Record<string, { credits: number; price: number; label: string }> = {
  sms_100:  { credits: 100,  price: 8,  label: "100 SMS Fydelys" },
  sms_500:  { credits: 500,  price: 35, label: "500 SMS Fydelys" },
  sms_1000: { credits: 1000, price: 60, label: "1000 SMS Fydelys" },
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

    const { studioId, packId } = await req.json()
    const pack = SMS_PACKS[packId]
    if (!pack) return NextResponse.json({ error: "Pack inconnu" }, { status: 400 })

    const db = createServiceSupabase()

    // Vérifier admin du studio
    const { data: profile } = await db.from("profiles")
      .select("role, studio_id").eq("id", user.id).single()
    if (!profile || profile.role !== "admin" || profile.studio_id !== studioId)
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })

    const { data: studio } = await db.from("studios")
      .select("name, stripe_customer_id").eq("id", studioId).single()
    if (!studio) return NextResponse.json({ error: "Studio introuvable" }, { status: 404 })

    // Créer/récupérer le customer Stripe
    let customerId = studio.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email, name: studio.name,
        metadata: { studioId }
      })
      customerId = customer.id
      await db.from("studios").update({ stripe_customer_id: customerId }).eq("id", studioId)
    }

    // PaymentIntent one-shot
    const intent = await stripe.paymentIntents.create({
      amount: pack.price * 100,
      currency: "eur",
      customer: customerId,
      description: `${pack.label} — ${studio.name}`,
      metadata: { studioId, packId, credits: pack.credits.toString() },
      automatic_payment_methods: { enabled: true },
    })

    return NextResponse.json({ clientSecret: intent.client_secret, type: "payment" })
  } catch (err: any) {
    console.error("POST /api/stripe/sms-credits error:", err?.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
