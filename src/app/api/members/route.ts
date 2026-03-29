import { NextResponse, type NextRequest } from "next/server"
import { createServiceSupabase } from "@/lib/supabase-server"
import { checkAuth } from "@/lib/auth-check"
import { checkPlanLimit } from "@/lib/plan-limits"

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
  return NextResponse.json({ members: data || [] })
}

// POST /api/members → créer un membre + envoyer invitation magic link
export async function POST(request: NextRequest) {
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

  // Si on assigne un abonnement, récupérer les infos avant la mise à jour
  const isSubChange = updates.subscription_id !== undefined
  let oldSubId: string | null = null
  let member: any = null
  if (isSubChange) {
    const { data } = await db.from("members")
      .select("subscription_id, studio_id, first_name, last_name")
      .eq("id", id).single()
    oldSubId = data?.subscription_id || null
    member = data
  }

  const { error } = await db.from("members").update(updates).eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Enregistrer l'achat dans member_payments si un nouvel abonnement est assigné
  if (isSubChange && updates.subscription_id && updates.subscription_id !== oldSubId && member?.studio_id) {
    try {
      const { data: sub } = await db.from("subscriptions")
        .select("name, price, period, credits")
        .eq("id", updates.subscription_id).single()

      if (sub) {
        // Ajouter les crédits au membre si c'est un carnet/séance
        const CREDIT_PERIODS = ["séance", "carnet", "once"]
        if (CREDIT_PERIODS.includes(sub.period) && sub.credits && sub.credits > 0) {
          const { data: currentMember } = await db.from("members").select("credits, credits_total").eq("id", id).single()
          if (currentMember) {
            await db.from("members").update({
              credits: (currentMember.credits || 0) + sub.credits,
              credits_total: (currentMember.credits_total || 0) + sub.credits,
            }).eq("id", id)
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
  return NextResponse.json({ ok: true })
}