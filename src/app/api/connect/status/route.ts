import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createServiceSupabase } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" })

export async function GET(req: NextRequest) {
  const studioId = req.nextUrl.searchParams.get("studioId")
  if (!studioId) return NextResponse.json({ error: "studioId requis" }, { status: 400 })

  const db = createServiceSupabase()
  const { data: studio } = await db
    .from("studios")
    .select("stripe_connect_id, stripe_connect_status")
    .eq("id", studioId).single()

  if (!studio?.stripe_connect_id)
    return NextResponse.json({ status: "not_connected" })

  // Vérifier l'état réel chez Stripe
  try {
    const account = await stripe.accounts.retrieve(studio.stripe_connect_id)
    const isActive = account.charges_enabled && account.payouts_enabled

    const newStatus = isActive ? "active" : "pending"

    // Mettre à jour si changement
    if (newStatus !== studio.stripe_connect_status) {
      await db.from("studios").update({ stripe_connect_status: newStatus }).eq("id", studioId)
    }

    return NextResponse.json({
      status: newStatus,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
      account_id: studio.stripe_connect_id,
    })
  } catch (err: any) {
    return NextResponse.json({ status: "error", error: err.message })
  }
}
