import { NextRequest, NextResponse } from "next/server"
import { createServerSupabase, createServiceSupabase } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

async function checkSA() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const db = createServiceSupabase()
  const { data: profile } = await db.from("profiles").select("role").eq("id", user.id).single()
  return profile?.role === "superadmin" ? db : null
}

// GET — charger les plans
export async function GET() {
  const db = await checkSA()
  if (!db) return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  const { data: plans } = await db.from("plans").select("slug, name, price_monthly, stripe_price_id").order("price_monthly")
  return NextResponse.json({ plans: plans || [] })
}

// POST — sauvegarder les stripe_price_id
export async function POST(req: NextRequest) {
  const db = await checkSA()
  if (!db) return NextResponse.json({ error: "Accès refusé" }, { status: 403 })

  const { plans } = await req.json()
  if (!Array.isArray(plans)) return NextResponse.json({ error: "plans requis" }, { status: 400 })

  for (const plan of plans) {
    await db.from("plans").upsert({
      slug: plan.slug, name: plan.name, price_monthly: plan.price,
      stripe_price_id: plan.stripe_price_id || null,
    }, { onConflict: "slug" })
  }
  return NextResponse.json({ ok: true })
}