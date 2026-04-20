import { NextResponse, type NextRequest } from "next/server"
import { createServiceSupabase } from "@/lib/supabase-server"
import { checkAuth } from "@/lib/auth-check"
import { checkPlanLimit } from "@/lib/plan-limits"
import { rateLimit, getIP } from "@/lib/rate-limit"
import { logActivity } from "@/lib/activity"

export const dynamic = "force-dynamic"

// GET /api/members?studioId=xxx
export async function GET(request: NextRequest) {
  const studioId = request.nextUrl.searchParams.get("studioId")
  if (!studioId) return NextResponse.json({ error: "studioId requis" }, { status: 400 })

  const auth = await checkAuth(request, studioId)
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const search = request.nextUrl.searchParams.get("search")
  const db = createServiceSupabase()

  let query = db.from("members")
  if (search) {
    // Recherche légère pour la BookingModal
    query = query
      .select("id, first_name, last_name, email, phone")
      .eq("studio_id", studioId)
      .is("deleted_at", null)
      .or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`)
      .limit(8)
  } else {
    // Liste complète pour la page Adhérents
    query = query
      .select("id, first_name, last_name, email, phone, address, postal_code, city, birth_date, status, credits, credits_total, joined_at, next_payment, notes, subscription_id, profile_complete, profession, facebook, frozen_until, subscriptions(name, period)")
      .eq("studio_id", studioId)
      .is("deleted_at", null)
      .order("last_name")
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  // Cache 15s + stale-while-revalidate 30s (les données membres changent peu)
  const res = NextResponse.json({ members: data || [] })
  if (!search) res.headers.set("Cache-Control", "private, s-maxage=15, stale-while-revalidate=30")
  return res
}

// POST /api/members → créer un membre + envoyer invitation magic link
export async function POST(request: NextRequest) {
  const rl = rateLimit(getIP(request), { max: 20, windowSec: 60 })
  if (!rl.ok) return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 })

  const body = await request.json()
  const { studioId, ...payload } = body
  if (!studioId) return NextResponse.json({ error: "studioId requis" }, { status: 400 })

  const auth = await checkAuth(request, studioId)
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  // Vérifier limite du plan
  const limit = await checkPlanLimit(studioId, "add_member")
  if (!limit.ok) return NextResponse.json({ error: limit.error, limit: true }, { status: 403 })

  const db = createServiceSupabase()
  const { data: existing } = await db.from("members")
    .select("id").eq("studio_id", studioId).eq("email", payload.email).single()
  if (existing) return NextResponse.json({ error: "EMAIL_EXISTS" }, { status: 409 })

  const { data, error } = await db.from("members")
    .insert({ studio_id: studioId, ...payload })
    .select("id").single()

  if (data?.id) {
    await logActivity(db, { memberId: data.id, studioId, action: "member_created", actorId: (auth as any).user?.id, actorRole: (auth as any).profile?.role || "admin", details: { email: payload.email, name: `${payload.first_name || ""} ${payload.last_name || ""}`.trim() } })
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Envoyer une invitation magic link à l'adhérent
  if (payload.email) {
    try {
      const { data: studio } = await db.from("studios").select("slug, name").eq("id", studioId).single()
      if (studio?.slug) {
        const origin = request.headers.get("origin") || `https://${studio.slug}.fydelys.fr`
        // Appel interne à send-magic-link
        const mlRes = await fetch(`${origin}/api/send-magic-link`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: payload.email, tenantSlug: studio.slug }),
        })
        if (!mlRes.ok) {
          console.warn("[members POST] Magic link envoi échoué pour", payload.email)
        } else {
          console.log("[members POST] Magic link envoyé à", payload.email, "pour", studio.slug)
        }
      }
    } catch (err: any) {
      // Ne pas bloquer la création si l'envoi échoue
      console.warn("[members POST] Erreur envoi invitation:", err.message)
    }
  }

  return NextResponse.json({ id: data.id })
}

// PATCH /api/members → mettre à jour un membre
export async function PATCH(request: NextRequest) {
  const auth = await checkAuth(request)
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id, ...updates } = await request.json()
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 })

  const db = createServiceSupabase()

  // Récupérer l'état avant pour journaliser les changements
  const { data: beforeData } = await db.from("members")
    .select("subscription_id, studio_id, first_name, last_name, credits, credits_total, status, frozen_until")
    .eq("id", id).single()
  const oldSubId: string | null = beforeData?.subscription_id || null
  const member: any = beforeData
  const isSubChange = updates.subscription_id !== undefined && updates.subscription_id !== oldSubId

  const { error } = await db.from("members").update(updates).eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const actorId = (auth as any).user?.id
  const actorRole = (auth as any).profile?.role || "admin"
  const studioId = member?.studio_id

  // Log changements de crédits (hors cas abonnement, géré plus bas)
  if (studioId && (updates.credits !== undefined || updates.credits_total !== undefined) && !isSubChange) {
    const delta = (updates.credits ?? member?.credits ?? 0) - (member?.credits ?? 0)
    if (delta !== 0) {
      await logActivity(db, { memberId: id, studioId, actorId, actorRole, action: delta > 0 ? "credit_add" : "credit_manual", details: { delta, from: member?.credits, to: updates.credits, source: "admin_manual" } })
    }
  }
  // Log changement de statut
  if (studioId && updates.status !== undefined && updates.status !== member?.status) {
    const action = updates.status === "suspendu" ? "member_suspended" : updates.status === "actif" || updates.status === "Actif" ? "member_reactivated" : "member_updated"
    await logActivity(db, { memberId: id, studioId, actorId, actorRole, action, details: { from: member?.status, to: updates.status } })
  }
  // Log gel / dégel
  if (studioId && updates.frozen_until !== undefined && updates.frozen_until !== member?.frozen_until) {
    await logActivity(db, { memberId: id, studioId, actorId, actorRole, action: updates.frozen_until ? "member_frozen" : "member_unfrozen", details: { from: member?.frozen_until, to: updates.frozen_until } })
  }

  // Enregistrer l'achat dans member_payments si un nouvel abonnement est assigné
  if (isSubChange && updates.subscription_id && member?.studio_id) {
    try {
      const { data: sub } = await db.from("subscriptions")
        .select("name, price, period, credits")
        .eq("id", updates.subscription_id).single()

      if (sub) {
        await logActivity(db, { memberId: id, studioId: member.studio_id, actorId, actorRole, action: "subscription_change", details: { from: oldSubId, to: updates.subscription_id, name: sub.name, price: sub.price } })
        // Ajouter les crédits au membre si c'est un carnet/séance
        const CREDIT_PERIODS = ["séance", "carnet", "once"]
        if (CREDIT_PERIODS.includes(sub.period) && sub.credits && sub.credits > 0) {
          const { data: currentMember } = await db.from("members").select("credits, credits_total").eq("id", id).single()
          if (currentMember) {
            await db.from("members").update({
              credits: (currentMember.credits || 0) + sub.credits,
              credits_total: (currentMember.credits_total || 0) + sub.credits,
            }).eq("id", id)
            await logActivity(db, { memberId: id, studioId: member.studio_id, actorId, actorRole, action: "credit_add", details: { amount: sub.credits, source: "admin_subscription", label: sub.name } })
          }
        }

        await db.from("member_payments").insert({
          studio_id: member.studio_id,
          member_id: id,
          subscription_id: updates.subscription_id,
          amount: sub.price || 0,
          status: "payé",
          payment_date: new Date().toISOString().slice(0, 10),
          payment_type: "Manuel",
          source: "admin_subscription",
          notes: sub.name || "Abonnement",
        })
        console.log("[members PATCH] member_payments créé pour", id, "—", sub.name)
        await logActivity(db, { memberId: id, studioId: member.studio_id, actorId, actorRole, action: "payment", details: { amount: sub.price || 0, type: "Manuel", source: "admin_subscription", notes: sub.name } })
      }
    } catch (err: any) {
      console.warn("[members PATCH] Erreur création member_payments:", err.message)
    }
  }

  return NextResponse.json({ ok: true })
}

// DELETE /api/members?id=xxx
export async function DELETE(request: NextRequest) {
  const auth = await checkAuth(request)
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const id = request.nextUrl.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 })

  const db = createServiceSupabase()
  // Vérifier que le membre appartient au studio du caller
  const { data: member } = await db.from("members").select("studio_id").eq("id", id).single()
  if (!member || member.studio_id !== auth.studioId) return NextResponse.json({ error: "Accès refusé" }, { status: 403 })

  // Soft delete : marquer deleted_at au lieu de supprimer (historique préservé)
  const { error } = await db.from("members").update({ deleted_at: new Date().toISOString(), status: "suspendu" }).eq("id", id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await logActivity(db, { memberId: id, studioId: member.studio_id, actorId: (auth as any).user?.id, actorRole: (auth as any).profile?.role || "admin", action: "member_deleted" })
  return NextResponse.json({ ok: true })
}