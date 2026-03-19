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

    // Récupérer le slug pour l'URL de retour
    const { data: studioData } = await db.from("studios").select("slug").eq("id", studioId).single()
    const slug = studioData?.slug || "app"
    const baseUrl = `https://${slug}.fydelys.fr`

    // Stripe Checkout one-shot pour les SMS
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "payment",
      line_items: [{
        price_data: {
          currency: "eur",
          product_data: { name: pack.label, description: `${pack.credits} crédits SMS pour ${studio.name}` },
          unit_amount: pack.price * 100,
        },
        quantity: 1,
      }],
      success_url: `${baseUrl}/billing?sms_success=1&pack=${packId}`,
      cancel_url: `${baseUrl}/billing`,
      metadata: { studioId, packId, credits: pack.credits.toString() },
    })

    return NextResponse.json({ url: session.url, type: "checkout" })
  } catch (err: any) {
    console.error("POST /api/stripe/sms-credits error:", err?.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}