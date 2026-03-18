import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createServerSupabase as createClient } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { studioId } = await req.json()

    const { data: profile } = await supabase
      .from("profiles").select("role, studio_id").eq("id", user.id).single()
    if (!profile || profile.role !== "admin" || profile.studio_id !== studioId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data: studio } = await supabase
      .from("studios").select("stripe_customer_id").eq("id", studioId).single()

    if (!studio?.stripe_customer_id) {
      return NextResponse.json({ error: "No Stripe customer found" }, { status: 404 })
    }

    const origin = req.headers.get("origin") || `https://${req.headers.get("host")}`

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: studio.stripe_customer_id,
      return_url: `${origin}/billing`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (err: any) {
    console.error("Stripe portal error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
