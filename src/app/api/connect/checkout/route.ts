import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createServiceSupabase } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" })

// Commission Fydelys en pourcentage (ex: 2 = 2%)
const FYDELYS_COMMISSION_PCT = parseFloat(process.env.FYDELYS_COMMISSION_PCT || "2")

// Types de checkout supportés
// mode "subscription" → abonnement mensuel
// mode "payment"      → achat crédits ou séance unique

export async function POST(req: NextRequest) {
  try {
    const {
      studioId,
      memberId,
      type,          // "subscription" | "credits" | "session"
      subscriptionId, // pour type=subscription
      creditsPackId,  // pour type=credits
      sessionId,      // pour type=session
      successUrl,
      cancelUrl,
    } = await req.json()

    if (!studioId || !type) return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 })

    const db = createServiceSupabase()

    // Récupérer le studio + son compte Connect
    const { data: studio } = await db
      .from("studios")
      .select("id, name, slug, stripe_connect_id, stripe_connect_status")
      .eq("id", studioId).single()

    if (!studio?.stripe_connect_id)
      return NextResponse.json({ error: "Studio non connecté à Stripe" }, { status: 400 })

    if (studio.stripe_connect_status !== "active")
      return NextResponse.json({ error: "Compte Stripe non activé" }, { status: 400 })

    const origin = successUrl ? new URL(successUrl).origin : `https://${studio.slug}.fydelys.fr`

    let sessionParams: Stripe.Checkout.SessionCreateParams

    // ── Abonnement mensuel ───────────────────────────────────────────────────
    if (type === "subscription" && subscriptionId) {
      const { data: sub } = await db
        .from("subscriptions")
        .select("name, price, stripe_price_id, stripe_product_id")
        .eq("id", subscriptionId).single()

      if (!sub) return NextResponse.json({ error: "Abonnement introuvable" }, { status: 404 })

      // Créer le prix à la volée si pas de stripe_price_id
      let priceId = sub.stripe_price_id
      // Vérifier que le price_id stocké appartient au compte Connect du studio (pas à Fydelys)
      // Un price_id valide sur le compte Connect commence par "price_" et est vérifiable via stripeAccount
      if (priceId) {
        try {
          await stripe.prices.retrieve(priceId, { stripeAccount: studio.stripe_connect_id })
        } catch {
          // Price ID invalide sur ce compte Connect → le régénérer
          console.warn(`[connect/checkout] stripe_price_id ${priceId} invalide sur ${studio.stripe_connect_id} — recréation`)
          priceId = null
        }
      }
      if (!priceId) {
        const productParams: any = { name: `${studio.name} — ${sub.name}` }
        // Utiliser le stripe_product_id du studio si défini (sur son propre compte)
        const productId = sub.stripe_product_id
        const price = await stripe.prices.create({
          unit_amount: Math.round((sub.price || 0) * 100),
          currency: "eur",
          recurring: { interval: "month" },
          ...(productId ? { product: productId } : { product_data: productParams }),
        }, { stripeAccount: studio.stripe_connect_id })
        priceId = price.id
        await db.from("subscriptions").update({ stripe_price_id: priceId }).eq("id", subscriptionId)
      }

      const amountCents = Math.round((sub.price || 0) * 100)
      const feeCents = Math.round(amountCents * FYDELYS_COMMISSION_PCT / 100)

      sessionParams = {
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [{ price: priceId, quantity: 1 }],
        subscription_data: {
          application_fee_percent: FYDELYS_COMMISSION_PCT,
          metadata: { studioId, memberId: memberId || "", subscriptionId, type: "subscription" },
        },
        success_url: successUrl || `${origin}/?payment=success`,
        cancel_url:  cancelUrl  || `${origin}/?payment=canceled`,
        metadata: { studioId, memberId: memberId || "", type: "subscription" },
        locale: "fr",
      }
    }

    // ── Pack crédits ─────────────────────────────────────────────────────────
    else if (type === "credits" && creditsPackId) {
      const { data: pack } = await db
        .from("credits_packs")
        .select("name, price, credits_amount")
        .eq("id", creditsPackId).single()

      if (!pack) return NextResponse.json({ error: "Pack introuvable" }, { status: 404 })

      const amountCents = Math.round((pack.price || 0) * 100)
      const feeCents = Math.round(amountCents * FYDELYS_COMMISSION_PCT / 100)

      sessionParams = {
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [{
          price_data: {
            currency: "eur",
            unit_amount: amountCents,
            product_data: { name: `${studio.name} — ${pack.name} (${pack.credits_amount} crédits)` },
          },
          quantity: 1,
        }],
        payment_intent_data: {
          application_fee_amount: feeCents,
          metadata: { studioId, memberId: memberId || "", creditsPackId, credits: pack.credits_amount, type: "credits" },
        },
        success_url: successUrl || `${origin}/?payment=success`,
        cancel_url:  cancelUrl  || `${origin}/?payment=canceled`,
        metadata: { studioId, memberId: memberId || "", type: "credits" },
        locale: "fr",
      }
    }

    // ── Séance unique ────────────────────────────────────────────────────────
    else if (type === "session" && sessionId) {
      const { data: sess } = await db
        .from("sessions")
        .select("id, session_date, session_time, duration_min, price_override, disciplines(name, icon), spots")
        .eq("id", sessionId).single()

      if (!sess) return NextResponse.json({ error: "Séance introuvable" }, { status: 404 })

      const price = (sess as any).price_override || 0
      if (!price) return NextResponse.json({ error: "Séance sans tarif configuré" }, { status: 400 })

      const amountCents = Math.round(price * 100)
      const feeCents = Math.round(amountCents * FYDELYS_COMMISSION_PCT / 100)
      const disc = (sess as any).disciplines
      const dateStr = new Date(sess.session_date).toLocaleDateString("fr-FR", { weekday:"long", day:"numeric", month:"long" })

      sessionParams = {
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [{
          price_data: {
            currency: "eur",
            unit_amount: amountCents,
            product_data: {
              name: `${disc?.icon || ""} ${disc?.name || "Séance"} — ${dateStr} ${sess.session_time?.slice(0,5) || ""}`,
              description: `${studio.name} · ${sess.duration_min || 60} min`,
            },
          },
          quantity: 1,
        }],
        payment_intent_data: {
          application_fee_amount: feeCents,
          metadata: { studioId, memberId: memberId || "", sessionId, type: "session" },
        },
        success_url: successUrl || `${origin}/?payment=success`,
        cancel_url:  cancelUrl  || `${origin}/?payment=canceled`,
        metadata: { studioId, memberId: memberId || "", type: "session", sessionId },
        locale: "fr",
      }
    }

    else {
      return NextResponse.json({ error: "Type de paiement invalide" }, { status: 400 })
    }

    // Créer la session sur le compte Connect du studio
    const session = await stripe.checkout.sessions.create(
      sessionParams,
      { stripeAccount: studio.stripe_connect_id }
    )

    return NextResponse.json({ url: session.url, sessionId: session.id })

  } catch (err: any) {
    console.error("Connect checkout error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
