import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createServiceSupabase } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" })

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig  = req.headers.get("stripe-signature")!

  // Webhook secret Connect (différent du webhook Fydelys billing)
  const secret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET!
  if (!secret) {
    console.error("STRIPE_CONNECT_WEBHOOK_SECRET manquant")
    return NextResponse.json({ error: "Config error" }, { status: 500 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret)
  } catch (err: any) {
    console.error("Connect webhook signature error:", err.message)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const db = createServiceSupabase()

  try {
    switch (event.type) {

      // ── Paiement one-time réussi (crédits ou séance) ─────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.payment_status !== "paid") break

        const { studioId, memberId, type, sessionId, creditsPackId, credits } = session.metadata || {}
        if (!studioId) break

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
          await db.from("payments").insert({
            studio_id:    studioId,
            member_id:    memberId,
            amount:       (session.amount_total || 0) / 100,
            status:       "payé",
            payment_date: new Date().toISOString().slice(0, 10),
            payment_type: "Carte",
            stripe_payment_id: session.payment_intent as string,
            notes: `Pack crédits — ${creditsAmount} crédits`,
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
            await db.from("payments").insert({
              studio_id:    studioId,
              member_id:    memberId,
              amount:       (session.amount_total || 0) / 100,
              status:       "payé",
              payment_date: new Date().toISOString().slice(0, 10),
              payment_type: "Carte",
              stripe_payment_id: session.payment_intent as string,
              notes: `Séance à l'unité`,
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
        await db.from("payments").insert({
          studio_id:    studioId,
          member_id:    memberId,
          amount:       (invoice.amount_paid || 0) / 100,
          status:       "payé",
          payment_date: new Date().toISOString().slice(0, 10),
          payment_type: "Carte",
          stripe_payment_id: invoice.payment_intent as string,
          notes:        `Abonnement mensuel`,
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
        if (account.charges_enabled && account.payouts_enabled) {
          await db.from("studios")
            .update({ stripe_connect_status: "active" })
            .eq("stripe_connect_id", account.id)
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
