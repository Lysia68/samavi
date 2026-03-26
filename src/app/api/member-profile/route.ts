import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { createServiceSupabase } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    // Vérifier la session via cookie
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

    const body = await req.json()
    const { studioId, memberId, first_name, last_name, phone, birth_date, address, postal_code, city, profession } = body
    if (!studioId) return NextResponse.json({ error: "studioId manquant" }, { status: 400 })

    const db = createServiceSupabase()

    const updateData: any = {
      first_name:       first_name?.trim()     || null,
      last_name:        last_name?.trim()      || null,
      phone:            phone?.trim()          || null,
      birth_date:       birth_date             || null,
      address:          address?.trim()        || null,
      postal_code:      postal_code?.trim()    || null,
      city:             city?.trim()           || null,
      profession:       profession?.trim()     || null,
      profile_complete: true,
    }

    let updateErr = null
    let targetId: string | null = null

    // 1. Si memberId fourni (édition admin d'un autre membre) → update direct
    if (memberId) {
      targetId = memberId
      const { error } = await db.from("members").update(updateData).eq("id", memberId)
      updateErr = error
    } else {
      // 2. Chercher le membre par auth_user_id (self-edit adhérent)
      updateData.status = "actif"
      updateData.auth_user_id = user.id

      const { data: byUid } = await db.from("members")
        .select("id").eq("studio_id", studioId).eq("auth_user_id", user.id).maybeSingle()

      if (byUid) {
        targetId = byUid.id
        const { error } = await db.from("members").update(updateData).eq("id", byUid.id)
        updateErr = error
      } else {
        // 3. Fallback par email
        const { data: byEmail } = await db.from("members")
          .select("id").eq("studio_id", studioId).eq("email", user.email!).maybeSingle()
        if (byEmail) {
          targetId = byEmail.id
          const { error } = await db.from("members").update(updateData).eq("id", byEmail.id)
          updateErr = error
        } else {
          return NextResponse.json({ error: "Membre introuvable" }, { status: 404 })
        }
      }
    }

    if (updateErr) {
      console.error("[member-profile] update error:", updateErr.message)
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    // Sync profil
    await db.from("profiles").update({
      first_name: first_name?.trim(),
      last_name:  last_name?.trim(),
    }).eq("id", user.id)

    console.log("[member-profile] Updated for user:", user.id, "studio:", studioId)

    // Envoyer emails de bienvenue (asynchrone, non bloquant)
    const memberId = byUid?.id
    if (memberId) {
      fetch(`${req.nextUrl.origin}/api/notify-new-member`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, studioId }),
      }).catch(e => console.warn("[member-profile] notify error:", e.message))
    }

    return NextResponse.json({ ok: true })

  } catch (err: any) {
    console.error("[member-profile] error:", err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const studioId = searchParams.get("studioId")
    if (!studioId) return NextResponse.json({ error: "studioId manquant" }, { status: 400 })

    const db = createServiceSupabase()
    const SELECT = "id, first_name, last_name, email, status, credits, credits_total, created_at, phone, address, postal_code, city, profile_complete"

    // Par auth_user_id en priorité
    let { data: member } = await db.from("members").select(SELECT)
      .eq("studio_id", studioId).eq("auth_user_id", user.id).maybeSingle()

    // Fallback par email
    if (!member && user.email) {
      const { data: byEmail } = await db.from("members").select(SELECT)
        .eq("studio_id", studioId).eq("email", user.email).maybeSingle()
      member = byEmail
    }

    if (!member) return NextResponse.json({ error: "Membre introuvable" }, { status: 404 })
    return NextResponse.json({ ok: true, member })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}