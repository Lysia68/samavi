import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createServiceSupabase } from "@/lib/supabase-server"
import { logActivity } from "@/lib/activity"

export const dynamic = "force-dynamic"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" })

const L = {
  ok:   (msg: string, data?: any) => console.log(`[CONNECT-WH] ✅ ${msg}`, data !== undefined ? JSON.stringify(data) : ""),
  err:  (msg: string, data?: any) => console.error(`[CONNECT-WH] ❌ ${msg}`, data !== undefined ? JSON.stringify(data) : ""),
  info: (msg: string, data?: any) => console.log(`[CONNECT-WH] ℹ️  ${msg}`, data !== undefined ? JSON.stringify(data) : ""),
  warn: (msg: string, data?: any) => console.warn(`[CONNECT-WH] ⚠️  ${msg}`, data !== undefined ? JSON.stringify(data) : ""),
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig  = req.headers.get("stripe-signature")

  if (!sig) {
    L.err("Header stripe-signature absent")
    return NextResponse.json({ error: "No signature" }, { status: 400 })
  }

  const db = createServiceSupabase()
  let event: Stripe.Event | null = null
  let usedSecret = "none"

  // ── 1) Essayer d'abord le secret studio en base (mode direct) ────
  try {
    const parsed = JSON.parse(body)
    const studioId = parsed?.data?.object?.metadata?.studioId
    if (studioId) {
      const { data: studio } = await db.from("studios")
        .select("stripe_webhook_secret").eq("id", studioId).maybeSingle()
      const studioSecret = (studio as any)?.stripe_webhook_secret
      if (studioSecret) {
        try {
          event = stripe.webhooks.constructEvent(body, sig, studioSecret)
          usedSecret = `studio:${studioId}`
          L.ok(`Signature vérifiée avec secret studio ${studioId}`)
        } catch (e: any) {
          L.warn(`Échec signature secret studio ${studioId} — ${e.message}`)
        }
      }
    }
  } catch { /* ignore parse errors */ }

  // ── 2) Fallback : secrets globaux (Connect / platform) ───────────
  if (!event) {
    const secrets: { label: string; value: string }[] = [
      { label: "STRIPE_CONNECT_WEBHOOK_SECRET", value: process.env.STRIPE_CONNECT_WEBHOOK_SECRET || "" },
      { label: "STRIPE_WEBHOOK_SECRET",          value: process.env.STRIPE_WEBHOOK_SECRET || "" },
    ].filter(s => s.value)

    for (const s of secrets) {
      try {
        event = stripe.webhooks.constructEvent(body, sig, s.value)
        usedSecret = s.label
        L.ok(`Signature vérifiée avec ${s.label}`)
        break
      } catch (e: any) {
        L.warn(`Échec signature avec ${s.label} — ${e.message}`)
      }
    }
  }

  if (!event) {
    L.err("Toutes les signatures ont échoué — rejet 400")
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const connectAccount = (event as any).account
  L.info(`Event reçu`, { type: event.type, account: connectAccount || "platform", usedSecret })

  try {
    switch (event.type) {

      // ── Paiement one-time / abonnement à l'unité ─────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const { studioId, memberId, type, sessionId, creditsPackId, credits } = session.metadata || {}

        L.info("checkout.session.completed", {
          payment_status: session.payment_status,
          studioId, memberId, type, credits, creditsPackId, sessionId,
          amount: session.amount_total,
        })

        if (session.payment_status !== "paid") {
          L.warn(`payment_status = ${session.payment_status} — ignoré`)
          break
        }
        if (!studioId) { L.warn("studioId absent dans metadata — ignoré"); break }

        // ── Vérification idempotence — évite le double-crédit si webhook renvoyé ──
        const paymentRef = (session.payment_intent as string) || session.id
        if (paymentRef) {
          const { data: alreadyDone } = await db.from("member_payments")
            .select("id").eq("stripe_payment_id", paymentRef).maybeSingle()
          if (alreadyDone) {
            L.warn(`Paiement ${paymentRef} déjà traité (id: ${alreadyDone.id}) — ignoré`)
            break
          }
        }

        // ── Abonnement studio Fydelys (plan Essentiel/Standard/Pro) ────────
        const planSlug = session.metadata?.planSlug
        if (planSlug && !memberId) {
          L.info(`Abonnement studio — plan: ${planSlug}, studio: ${studioId}`)
          const subscriptionId = session.subscription as string
          const updateData: any = {
            billing_status: "active",
            plan_slug: planSlug,
            plan_started_at: new Date().toISOString(),
          }
          if (subscriptionId) updateData.stripe_subscription_id = subscriptionId
          // Supprimer la date de fin d'essai
          updateData.trial_ends_at = null
          const { error: uErr } = await db.from("studios").update(updateData).eq("id", studioId)
          if (uErr) L.err("Échec update studio billing", uErr)
          else L.ok(`Studio ${studioId} → billing_status=active, plan=${planSlug}`)
          break
        }

        // ── Achat à l'unité (séance) ────────────────────────────────────────
        if (type === "subscription_once" && memberId) {
          const creditsToAdd = parseInt(session.metadata?.credits || "1")
          L.info(`subscription_once — ${creditsToAdd} crédit(s) → membre ${memberId}`)
          // Récupérer le nom de l'abonnement pour la note
          let subName = `${creditsToAdd} crédit${creditsToAdd > 1 ? "s" : ""}`
          if (session.metadata?.subscriptionId) {
            const { data: subRow } = await db.from("subscriptions").select("name").eq("id", session.metadata.subscriptionId).maybeSingle()
            if (subRow?.name) subName = subRow.name
          }
          const { data: member, error: mErr } = await db.from("members").select("credits, credits_total").eq("id", memberId).single()
          if (mErr || !member) { L.err(`Membre ${memberId} introuvable`, mErr); break }
          const { error: uErr } = await db.from("members").update({
            credits:       (member.credits || 0) + creditsToAdd,
            credits_total: (member.credits_total || 0) + creditsToAdd,
          }).eq("id", memberId)
          if (uErr) L.err("Échec update crédits membre", uErr)
          else L.ok(`Crédits membre mis à jour: ${(member.credits||0)} → ${(member.credits||0)+creditsToAdd}`)
          await logActivity(db, { memberId, studioId, actorRole: "stripe", action: "credit_add", details: { amount: creditsToAdd, source: "subscription_once", label: subName, amount_eur: (session.amount_total || 0) / 100 } })
          const { error: pErr } = await db.from("member_payments").insert({
            studio_id: studioId, member_id: memberId,
            amount: (session.amount_total || 0) / 100,
            status: "payé", payment_date: new Date().toISOString().slice(0, 10),
            payment_type: "Carte", source: "card_subscription_once",
            stripe_payment_id: (session.payment_intent as string) || session.id,
            notes: subName,
          })
          if (pErr) L.err("Échec insert member_payments", pErr)
          else L.ok("member_payments inséré")
          await logActivity(db, { memberId, studioId, actorRole: "stripe", action: "payment", details: { amount: (session.amount_total || 0) / 100, type: "Carte", source: "card_subscription_once", notes: subName } })
          break
        }

        // ── Pack crédits ────────────────────────────────────────────────────
        if (type === "credits" && memberId && credits) {
          const creditsAmount = parseInt(credits)
          L.info(`credits — ${creditsAmount} crédit(s) → membre ${memberId}`)
          // Récupérer le nom du pack pour la note
          let packName = `Pack — ${creditsAmount} crédit${creditsAmount > 1 ? "s" : ""}`
          if (session.metadata?.creditsPackId) {
            const { data: packRow } = await db.from("credits_packs").select("name").eq("id", session.metadata.creditsPackId).maybeSingle()
            if (packRow?.name) packName = packRow.name
          }
          const { data: member, error: mErr } = await db.from("members").select("credits, credits_total").eq("id", memberId).single()
          if (mErr || !member) { L.err(`Membre ${memberId} introuvable`, mErr); break }
          const { error: uErr } = await db.from("members").update({
            credits:       (member.credits || 0) + creditsAmount,
            credits_total: (member.credits_total || 0) + creditsAmount,
          }).eq("id", memberId)
          if (uErr) L.err("Échec update crédits membre", uErr)
          else L.ok(`Crédits membre mis à jour: ${(member.credits||0)} → ${(member.credits||0)+creditsAmount}`)
          await logActivity(db, { memberId, studioId, actorRole: "stripe", action: "credit_add", details: { amount: creditsAmount, source: "credits_pack", label: packName, amount_eur: (session.amount_total || 0) / 100 } })
          const { error: pErr } = await db.from("member_payments").insert({
            studio_id: studioId, member_id: memberId,
            amount: (session.amount_total || 0) / 100,
            status: "payé", payment_date: new Date().toISOString().slice(0, 10),
            payment_type: "Carte", source: "card_credits",
            stripe_payment_id: (session.payment_intent as string) || session.id,
            notes: packName,
          })
          if (pErr) L.err("Échec insert member_payments", pErr)
          else L.ok("member_payments inséré")
          await logActivity(db, { memberId, studioId, actorRole: "stripe", action: "payment", details: { amount: (session.amount_total || 0) / 100, type: "Carte", source: "card_credits", notes: packName } })
          break
        }

        // ── Séance unique ───────────────────────────────────────────────────
        if (type === "session" && memberId && sessionId) {
          L.info(`session — réservation séance ${sessionId} → membre ${memberId}`)
          const { data: existing } = await db.from("bookings").select("id")
            .eq("session_id", sessionId).eq("member_id", memberId).maybeSingle()
          if (existing) { L.warn("Booking déjà existant — ignoré"); break }
          const { error: bErr } = await db.from("bookings").insert({
            session_id: sessionId, member_id: memberId, status: "confirmed", attended: false,
          })
          if (bErr) L.err("Échec insert booking", bErr)
          else L.ok("Booking créé")
          const { error: pErr } = await db.from("member_payments").insert({
            studio_id: studioId, member_id: memberId,
            amount: (session.amount_total || 0) / 100,
            status: "payé", payment_date: new Date().toISOString().slice(0, 10),
            payment_type: "Carte", source: "card_session",
            stripe_payment_id: (session.payment_intent as string) || session.id,
            notes: `Séance à l'unité`,
          })
          if (pErr) L.err("Échec insert member_payments", pErr)
          else L.ok("member_payments inséré")
          break
        }

        L.warn(`type "${type}" non géré ou données manquantes`, { memberId, credits, sessionId })
        break
      }

      // ── Abonnement récurrent créé / renouvelé ────────────────────────────
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice
        const sub = invoice.subscription
        if (!sub) { L.warn("invoice sans subscription — ignoré"); break }

        const subId2 = typeof sub === "string" ? sub : sub.id
        L.info(`invoice.payment_succeeded — subscription ${subId2}`, { account: connectAccount })

        let subscription: Stripe.Subscription
        try {
          subscription = await stripe.subscriptions.retrieve(
            subId2,
            {},
            connectAccount ? { stripeAccount: connectAccount } : undefined
          )
          L.ok(`Subscription récupérée`, { metadata: subscription.metadata })
        } catch (e: any) {
          L.err(`Impossible de récupérer la subscription ${subId2}`, e.message)
          break
        }

        const { studioId, memberId, subscriptionId } = subscription.metadata || {}
        if (!studioId || !memberId) {
          L.warn("studioId ou memberId absent dans metadata subscription", { studioId, memberId })
          break
        }

        const nextPayment = new Date()
        nextPayment.setMonth(nextPayment.getMonth() + 1)

        const { error: uErr } = await db.from("members").update({
          status:          "Actif",
          subscription_id: subscriptionId || null,
          next_payment:    nextPayment.toISOString().slice(0, 10),
          stripe_sub_id:   subId2,
        }).eq("id", memberId)
        if (uErr) L.err("Échec update membre abonnement", uErr)
        else L.ok(`Membre ${memberId} mis à jour — statut Actif`)

        // Récupérer le nom de l'abonnement pour la note
        let subLabel = "Abonnement mensuel"
        if (subscriptionId) {
          const { data: subRow } = await db.from("subscriptions").select("name").eq("id", subscriptionId).maybeSingle()
          if (subRow?.name) subLabel = subRow.name
        }

        const { error: pErr } = await db.from("member_payments").insert({
          studio_id: studioId, member_id: memberId,
          amount: (invoice.amount_paid || 0) / 100,
          status: "payé", payment_date: new Date().toISOString().slice(0, 10),
          payment_type: "Carte", source: "card_subscription",
          stripe_payment_id: (invoice.payment_intent as string) || invoice.id,
          notes: subLabel,
        })
        if (pErr) L.err("Échec insert member_payments", pErr)
        else L.ok("member_payments inséré")
        break
      }

      // ── Abonnement annulé / paiement échoué ─────────────────────────────
      case "customer.subscription.deleted":
      case "invoice.payment_failed": {
        const obj = event.data.object as any
        const subId = obj.id || obj.subscription
        if (!subId) { L.warn("subId absent — ignoré"); break }
        const subIdStr = typeof subId === "string" ? subId : subId.id
        L.info(`${event.type} — subId ${subIdStr}`)

        // Vérifier si c'est un abonnement studio (Fydelys platform)
        const { data: studio } = await db.from("studios")
          .select("id").eq("stripe_subscription_id", subIdStr).maybeSingle()
        if (studio) {
          const studioStatus = event.type === "customer.subscription.deleted" ? "canceled" : "past_due"
          const { error: sErr } = await db.from("studios").update({ billing_status: studioStatus }).eq("id", studio.id)
          if (sErr) L.err(`Échec update billing_status studio → ${studioStatus}`, sErr)
          else L.ok(`Studio ${studio.id} → billing_status=${studioStatus}`)
          break
        }

        // Sinon, c'est un abonnement membre
        const { data: member, error: mErr } = await db.from("members")
          .select("id").eq("stripe_sub_id", subIdStr).maybeSingle()
        if (mErr) { L.err("Erreur lookup membre par stripe_sub_id", mErr); break }
        if (!member) { L.warn(`Aucun studio ni membre trouvé pour stripe_sub_id ${subIdStr}`); break }
        const newStatus = event.type === "customer.subscription.deleted" ? "Inactif" : "Suspendu"
        const { error: uErr } = await db.from("members").update({ status: newStatus }).eq("id", member.id)
        if (uErr) L.err(`Échec update statut membre → ${newStatus}`, uErr)
        else L.ok(`Membre ${member.id} → ${newStatus}`)
        break
      }

      // ── Compte Connect activé ────────────────────────────────────────────
      case "account.updated": {
        const account = event.data.object as Stripe.Account
        const studioIdFromMeta = account.metadata?.studioId
        L.info(`account.updated — ${account.id}`, {
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
          studioId: studioIdFromMeta,
        })
        if (account.charges_enabled && account.payouts_enabled) {
          if (studioIdFromMeta) {
            await db.from("studios").update({
              stripe_connect_id: account.id, stripe_connect_status: "active",
            }).eq("id", studioIdFromMeta)
            L.ok(`Studio ${studioIdFromMeta} → Connect actif`)
          } else {
            await db.from("studios").update({ stripe_connect_status: "active" })
              .eq("stripe_connect_id", account.id)
            L.ok(`Studio (lookup par connect_id ${account.id}) → actif`)
          }
        } else if (studioIdFromMeta) {
          await db.from("studios").update({
            stripe_connect_id: account.id, stripe_connect_status: "pending",
          }).eq("id", studioIdFromMeta)
          L.info(`Studio ${studioIdFromMeta} → Connect pending`)
        }
        break
      }

      default:
        L.info(`Event non géré: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    L.err(`Exception non gérée — ${err.message}`, err.stack?.slice(0, 300))
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}