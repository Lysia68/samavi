import { NextRequest, NextResponse } from "next/server"
import { createServerSupabase, createServiceSupabase } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

// POST /api/sa/stripe-keys — stocke les clés Stripe du studio (SA uniquement)
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

    const db = createServiceSupabase()
    const { data: profile } = await db.from("profiles").select("role").eq("id", user.id).single()
    if (profile?.role !== "superadmin")
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })

    const { studioId, pk, sk } = await req.json()
    if (!studioId || !pk) return NextResponse.json({ error: "studioId et pk requis" }, { status: 400 })

    const update: Record<string, any> = { stripe_pk: pk }
    // sk stockée uniquement si fournie — jamais retournée en GET
    if (sk) update.stripe_sk = sk

    const { error } = await db.from("studios").update(update).eq("id", studioId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
