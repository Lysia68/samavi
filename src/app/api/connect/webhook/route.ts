import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createServiceSupabase } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" })

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig  = req.headers.get("stripe-signature")!

  const db = createServiceSupabase()
  let event: Stripe.Event | null = null

  // Récupérer le studioId depuis le corps brut pour trouver le bon secret webhook
  // On essaie d'abord les secrets globaux, puis le secret du studio si mode direct
  const secrets = [
    process.env.STRIPE_CONNECT_WEBHOOK_SECRET,
    process.env.STRIPE_WEBHOOK_SECRET,
  ].filter(Boolean) as string[]

  // Essayer chaque secret global
  for (const secret of secrets) {
    try {
      event = stripe.webhooks.constructEvent(body, sig, secret)
      break
    } catch {
      // continuer
    }
  }

  // Si signature globale échoue → chercher le secret webhook du studio en base
  if (!event) {
    try {
      const parsed = JSON.parse(body)
      // Récupérer le studioId depuis metadata de l'objet
      const studioId = parsed?.data?.object?.metadata?.studioId
      if (studioId) {
        const { data: studio } = await db.from("studios")
          .select("stripe_webhook_secret").eq("id", studioId).maybeSingle()
        const studioSecret = (studio as any)?.stripe_webhook_secret
        if (studioSecret) {
          try {
            event = stripe.webhooks.constructEvent(body, sig, studioSecret)
          } catch (err: any) {
            console.error("Connect webhook: studio secret also failed:", err.message)
          }
        }
      }
    } catch { /* ignore parse errors */ }
  }

  if (!event) {
    console.error("Connect webhook: toutes les signatures ont échoué")
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }
  }


  try {
    switch (event.type) {

      // ── Paiement one-time réussi (crédits ou séance) ─────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.payment_status !== "paid") break

        const { studioId, memberId, type, sessionId, creditsPackId, credits } = session.metadata || {}
        if (!studioId) break

        // Achat à l'unité (period=once) — crédits dans metadata
        if (type === "subscription_once" && memberId) {
          const creditsToAdd = parseInt(session.metadata?.credits || "1")
          const { data: member } = await db.from("members").select("credits, credits_total").eq("id", memberId).single()
          if (member) {
            await db.from("members").update({
              credits:       (member.credits || 0) + creditsToAdd,
              credits_total: (member.credits_total || 0) + creditsToAdd,
            }).eq("id", memberId)
          }
          await db.from("member_payments").insert({
            studio_id: studioId, member_id: memberId,
            amount: (session.amount_total || 0) / 100,
            status: "payé", payment_date: new Date().toISOString().slice(0, 10),
            payment_type: "Carte", source: "card_subscription_once",
            stripe_payment_id: session.payment_intent as string,
            notes: `Achat — ${creditsToAdd} crédit${creditsToAdd > 1 ? "s" : ""}`,
          })
          break
        }

        if (type === "credits" && memberId && credits) {
          // Créditer le membre
          const creditsAmount = parseInt(credits)
          const { data: member } = await db
            .from("members").select("credits, credits_total").eq("id", memberId).single()
          if (member) {
            await db.from("members").update({
              credits:       (member.credits || 0) + creditsAmount,
              credits_total: (member.credits_total || 0) + creditsAmount,
            }).eq("id", memberId)
          }
          // Enregistrer le paiement
          await db.from("member_payments").insert({
            studio_id:         studioId,
            member_id:         memberId,
            amount:            (session.amount_total || 0) / 100,
            status:            "payé",
            payment_date:      new Date().toISOString().slice(0, 10),
            payment_type:      "Carte",
            source:            "card_credits",
            stripe_payment_id: session.payment_intent as string,
            notes:             `Pack crédits — ${creditsAmount} crédits`,
          })
        }

        else if (type === "session" && memberId && sessionId) {
          // Créer la réservation
          const { data: existing } = await db
            .from("bookings").select("id").eq("session_id", sessionId).eq("member_id", memberId).maybeSingle()

          if (!existing) {
            await db.from("bookings").insert({
              session_id: sessionId,
              member_id:  memberId,
              status:     "confirmed",
              attended:   false,
            })
            // Enregistrer le paiement
            await db.from("member_payments").insert({
              studio_id:         studioId,
              member_id:         memberId,
              amount:            (session.amount_total || 0) / 100,
              status:            "payé",
              payment_date:      new Date().toISOString().slice(0, 10),
              payment_type:      "Carte",
              source:            "card_session",
              stripe_payment_id: session.payment_intent as string,
              notes:             `Séance à l'unité`,
            })
          }
        }
        break
      }

      // ── Abonnement créé/renouvelé ────────────────────────────────────────
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice
        const sub = invoice.subscription
        if (!sub) break

        // Récupérer les metadata de la subscription
        const subscription = await stripe.subscriptions.retrieve(
          typeof sub === "string" ? sub : sub.id,
          { stripeAccount: (event as any).account }
        )
        const { studioId, memberId, subscriptionId } = subscription.metadata || {}
        if (!studioId || !memberId) break

        // Mettre à jour le statut membre
        const nextPayment = new Date()
        nextPayment.setMonth(nextPayment.getMonth() + 1)

        await db.from("members").update({
          status:            "Actif",
          subscription_id:   subscriptionId || null,
          next_payment:      nextPayment.toISOString().slice(0, 10),
          stripe_sub_id:     typeof sub === "string" ? sub : sub.id,
        }).eq("id", memberId)

        // Enregistrer le paiement
        await db.from("member_payments").insert({
          studio_id:         studioId,
          member_id:         memberId,
          amount:            (invoice.amount_paid || 0) / 100,
          status:            "payé",
          payment_date:      new Date().toISOString().slice(0, 10),
          payment_type:      "Carte",
          source:            "card_subscription",
          stripe_payment_id: invoice.payment_intent as string,
          notes:             `Abonnement mensuel`,
        })
        break
      }

      // ── Abonnement annulé / paiement échoué ─────────────────────────────
      case "customer.subscription.deleted":
      case "invoice.payment_failed": {
        const obj = event.data.object as any
        const subId = obj.id || obj.subscription
        if (!subId) break

        // Trouver le membre via stripe_sub_id
        const { data: member } = await db
          .from("members").select("id").eq("stripe_sub_id", typeof subId === "string" ? subId : subId.id).maybeSingle()
        if (member) {
          await db.from("members").update({
            status: event.type === "customer.subscription.deleted" ? "Inactif" : "Suspendu",
          }).eq("id", member.id)
        }
        break
      }

      // ── Compte Connect activé ────────────────────────────────────────────
      case "account.updated": {
        const account = event.data.object as Stripe.Account
        const studioIdFromMeta = account.metadata?.studioId

        if (account.charges_enabled && account.payouts_enabled) {
          if (studioIdFromMeta) {
            // Sauvegarder l'ID Connect + statut actif via metadata studioId
            await db.from("studios").update({
              stripe_connect_id: account.id,
              stripe_connect_status: "active",
            }).eq("id", studioIdFromMeta)
          } else {
            // Fallback : chercher par stripe_connect_id déjà stocké
            await db.from("studios")
              .update({ stripe_connect_status: "active" })
              .eq("stripe_connect_id", account.id)
          }
        } else if (studioIdFromMeta) {
          // Compte créé mais pas encore activé → sauvegarder l'ID
          await db.from("studios").update({
            stripe_connect_id: account.id,
            stripe_connect_status: "pending",
          }).eq("id", studioIdFromMeta)
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error("Connect webhook handler error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}