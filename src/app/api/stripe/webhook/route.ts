import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

async function updateStudioBilling(studioId: string, patch: Record<string, any>) {
  // Initialisé ici pour éviter l'erreur "supabaseKey is required" au build
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const { error } = await supabaseAdmin.from("studios").update(patch).eq("id", studioId)
  if (error) console.error("Supabase update error:", error)
}

async function getStudioBySubscription(subId: string) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const { data } = await supabaseAdmin
    .from("studios").select("id, billing_status, plan_slug").eq("stripe_subscription_id", subId).single()
  return data
}

export async function POST(req: NextRequest) {
  const body    = await req.text()
  const sig     = req.headers.get("stripe-signature")!
  const secret  = process.env.STRIPE_WEBHOOK_SECRET!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret)
  } catch (err: any) {
    console.error("Webhook signature error:", err.message)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const getStudioId = (obj: any): string | null =>
    obj?.metadata?.studioId || null

  try {
    switch (event.type) {

      // ── Paiement réussi → activer ────────────────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const studioId = getStudioId(session)
        if (!studioId) break
        const subId   = session.subscription as string
        const planSlug = session.metadata?.planSlug || "essentiel"
        await updateStudioBilling(studioId, {
          billing_status:         "active",
          stripe_subscription_id: subId,
          plan_slug:              planSlug,
          plan_started_at:        new Date().toISOString(),
        })
        break
      }

      // ── Abonnement actif / mis à jour ────────────────────────────────────
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription
        const studioId = getStudioId(sub)
        if (!studioId) break

        const planSlug = sub.metadata?.planSlug || "essentiel"
        const statusMap: Record<string, string> = {
          active:   "active",
          trialing: "trialing",
          past_due: "past_due",
          canceled: "canceled",
          unpaid:   "suspended",
          paused:   "suspended",
        }
        const billing_status = statusMap[sub.status] || "suspended"
        await updateStudioBilling(studioId, {
          billing_status,
          plan_slug: planSlug,
          stripe_subscription_id: sub.id,
        })
        break
      }

      // ── Abonnement annulé ────────────────────────────────────────────────
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription
        const studioId = getStudioId(sub)
        if (!studioId) break
        await updateStudioBilling(studioId, {
          billing_status: "canceled",
          stripe_subscription_id: null,
        })
        break
      }

      // ── Paiement échoué → past_due ───────────────────────────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        const subId   = invoice.subscription as string
        if (!subId) break
        const studio = await getStudioBySubscription(subId)
        if (studio) {
          await updateStudioBilling(studio.id, { billing_status: "past_due" })
        }
        break
      }

      // ── Paiement récupéré après échec ────────────────────────────────────
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice
        const subId   = invoice.subscription as string
        if (!subId) break
        const studio = await getStudioBySubscription(subId)
        if (studio && studio.billing_status === "past_due") {
          await updateStudioBilling(studio.id, { billing_status: "active" })
        }
        break
      }

      // ── Achat crédits SMS ────────────────────────────────────────────────
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent
        const { studioId, credits } = pi.metadata || {}
        if (studioId && credits) {
          const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
          )
          const creditsToAdd = parseInt(credits)
          const { data: st } = await supabaseAdmin.from("studios")
            .select("sms_credits_balance").eq("id", studioId).single()
          const newBalance = (st?.sms_credits_balance || 0) + creditsToAdd
          await supabaseAdmin.from("studios").update({ sms_credits_balance: newBalance }).eq("id", studioId)
          await supabaseAdmin.from("sms_credit_purchases").insert({
            studio_id: studioId, credits: creditsToAdd,
            amount_cents: pi.amount, stripe_payment_id: pi.id,
          })
        }
        break
      }

      // ── Remise à zéro mensuelle crédits SMS lors du renouvellement ──────
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice
        const subId   = invoice.subscription as string
        if (subId) {
          const studio = await getStudioBySubscription(subId)
          if (studio && studio.billing_status === "past_due") {
            await updateStudioBilling(studio.id, { billing_status: "active" })
          }
          // Rollover : ajouter les crédits inclus au solde existant
          if (studio) {
            const SMS_BY_PLAN: Record<string, number> = { essentiel:0, standard:50, pro:100 }
            const included = SMS_BY_PLAN[(studio as any).plan_slug] || 0
            if (included > 0) {
              const supabaseAdmin2 = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!,
              )
              const nextReset = new Date()
              nextReset.setMonth(nextReset.getMonth() + 1)
              const { data: currentSt } = await supabaseAdmin2.from("studios")
                .select("sms_credits_balance").eq("id", studio.id).single()
              const newBalance = (currentSt?.sms_credits_balance || 0) + included
              await supabaseAdmin2.from("studios").update({
                sms_credits_included: included,
                sms_credits_balance:  newBalance,
                sms_credits_reset_at: nextReset.toISOString().slice(0, 10),
              }).eq("id", studio.id)
            }
          }
        }
        break
      }

      default:
        break
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error("Webhook handler error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
