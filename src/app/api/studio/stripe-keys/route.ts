import { NextRequest, NextResponse } from "next/server"
import { createServerSupabase, createServiceSupabase } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

// POST /api/studio/stripe-keys — stocke les clés Stripe directes du studio (admin du studio)
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

    const db = createServiceSupabase()
    const { data: profile } = await db.from("profiles")
      .select("role, studio_id").eq("id", user.id).single()

    // Autorisé : admin du studio OU superadmin
    if (!profile || !["admin", "superadmin"].includes(profile.role))
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })

    const { studioId, pk, sk, whsec } = await req.json()
    if (!studioId || !pk) return NextResponse.json({ error: "studioId et pk requis" }, { status: 400 })

    // Un admin ne peut modifier que son propre studio
    if (profile.role === "admin" && profile.studio_id !== studioId)
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })

    const update: Record<string, any> = { stripe_pk: pk }
    if (sk) update.stripe_sk = sk
    if (whsec) update.stripe_webhook_secret = whsec

    const { error } = await db.from("studios").update(update).eq("id", studioId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}