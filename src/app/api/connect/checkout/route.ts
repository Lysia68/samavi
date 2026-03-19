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

    // Récupérer le studio + mode paiement
    const { data: studio } = await db
      .from("studios")
      .select("id, name, slug, stripe_connect_id, stripe_connect_status, payment_mode, stripe_sk, stripe_pk")
      .eq("id", studioId).single()

    if (!studio) return NextResponse.json({ error: "Studio introuvable" }, { status: 404 })

    const paymentMode = studio.payment_mode || "connect"
    const origin = successUrl ? new URL(successUrl).origin : `https://${studio.slug}.fydelys.fr`

    // Stripe à utiliser selon le mode
    let stripeInstance = stripe // Stripe Fydelys par défaut (Connect)
    let useConnect = false
    let connectAccountId: string | undefined

    if (paymentMode === "direct" && studio.stripe_sk) {
      // Mode direct : clés propres au studio
      stripeInstance = new Stripe(studio.stripe_sk, { apiVersion: "2024-06-20" })
    } else if (paymentMode === "connect") {
      if (!studio?.stripe_connect_id)
        return NextResponse.json({ error: "Studio non connecté à Stripe" }, { status: 400 })
      if (studio.stripe_connect_status !== "active")
        return NextResponse.json({ error: "Compte Stripe non activé" }, { status: 400 })
      useConnect = true
      connectAccountId = studio.stripe_connect_id
    } else {
      return NextResponse.json({ error: "Paiements non configurés pour ce studio" }, { status: 400 })
    }

    let sessionParams: Stripe.Checkout.SessionCreateParams

    // ── Abonnement mensuel ───────────────────────────────────────────────────
    if (type === "subscription" && subscriptionId) {
      // Requête sans credits_amount pour compatibilité si colonne absente
      const { data: sub, error: subErr } = await db
        .from("subscriptions")
        .select("id, name, price, period, stripe_price_id, stripe_product_id")
        .eq("id", subscriptionId).single()

      if (!sub || subErr) {
        console.error("[connect/checkout] Abonnement introuvable:", subscriptionId, "err:", subErr?.message)
        return NextResponse.json({ error: `Abonnement introuvable (id: ${subscriptionId})` }, { status: 404 })
      }

      // Récupérer credits si colonne disponible
      const { data: subExtra } = await db
        .from("subscriptions").select("credits").eq("id", subscriptionId).maybeSingle()
      const creditsAmount = (subExtra as any)?.credits || (subExtra as any)?.credits_amount || 1

      const isOnce = ["once", "séance", "carnet", "session", "unit"].includes(sub.period || "")
      const amountCents = Math.round((sub.price || 0) * 100)
      const feeCents = Math.round(amountCents * FYDELYS_COMMISSION_PCT / 100)

      if (isOnce) {
        // ── Paiement unique (séance à l'achat) ────────────────────────────────
        sessionParams = {
          mode: "payment",
          payment_method_types: ["card"],
          line_items: [{
            price_data: {
              currency: "eur",
              unit_amount: amountCents,
              product_data: { name: `${studio.name} — ${sub.name}` },
            },
            quantity: 1,
          }],
          payment_intent_data: {
            application_fee_amount: connectAccountId ? feeCents : undefined,
            metadata: { studioId, memberId: memberId || "", subscriptionId, credits: String(creditsAmount), type: "subscription_once" },
          },
          success_url: successUrl || `${origin}/?payment=success`,
          cancel_url:  cancelUrl  || `${origin}/?payment=canceled`,
          metadata: { studioId, memberId: memberId || "", subscriptionId, credits: String(creditsAmount), type: "subscription_once" },
          locale: "fr",
        }
      } else {
        // ── Abonnement récurrent ───────────────────────────────────────────────
        let priceId = sub.stripe_price_id
        if (priceId) {
          try {
            await stripeInstance.prices.retrieve(priceId, ...(connectAccountId ? [{ stripeAccount: connectAccountId }] : []))
          } catch {
            console.warn(`[connect/checkout] stripe_price_id ${priceId} invalide — recréation`)
            priceId = null
          }
        }
        if (!priceId) {
          const productId = sub.stripe_product_id
          const intervalMap: Record<string, "month"|"year"|"week"> = { mois: "month", trimestre: "month", année: "year", semaine: "week" }
          const interval = intervalMap[sub.period] || "month"
          const intervalCount = sub.period === "trimestre" ? 3 : 1
          const price = await stripeInstance.prices.create({
            unit_amount: amountCents,
            currency: "eur",
            recurring: { interval, interval_count: intervalCount },
            ...(productId ? { product: productId } : { product_data: { name: `${studio.name} — ${sub.name}` } }),
          }, ...(connectAccountId ? [{ stripeAccount: connectAccountId }] : []))
          priceId = price.id
          await db.from("subscriptions").update({ stripe_price_id: priceId }).eq("id", subscriptionId)
        }

        sessionParams = {
          mode: "subscription",
          payment_method_types: ["card"],
          line_items: [{ price: priceId, quantity: 1 }],
          subscription_data: {
            application_fee_percent: connectAccountId ? FYDELYS_COMMISSION_PCT : undefined,
            metadata: { studioId, memberId: memberId || "", subscriptionId, type: "subscription" },
          },
          success_url: successUrl || `${origin}/?payment=success`,
          cancel_url:  cancelUrl  || `${origin}/?payment=canceled`,
          metadata: { studioId, memberId: memberId || "", type: "subscription" },
          locale: "fr",
        }
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
          application_fee_amount: connectAccountId ? feeCents : undefined,
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
          application_fee_amount: connectAccountId ? feeCents : undefined,
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

    // Créer la session Stripe (Connect ou Direct)
    const session = await stripeInstance.checkout.sessions.create(
      sessionParams,
      ...(connectAccountId ? [{ stripeAccount: connectAccountId }] : [])
    )

    return NextResponse.json({ url: session.url, sessionId: session.id })

  } catch (err: any) {
    console.error("Connect checkout error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}