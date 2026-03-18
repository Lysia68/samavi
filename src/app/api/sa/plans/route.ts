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

  const errors: string[] = []
  for (const plan of plans) {
    const priceId = plan.stripe_price_id?.trim() || null
    // Valider que c'est bien un Price ID (price_…) et non un Product ID (prod_…)
    if (priceId && !priceId.startsWith("price_")) {
      errors.push(`${plan.name} : "${priceId}" est un Product ID (prod_…), pas un Price ID. Créez un prix dans Stripe Dashboard → Produits → ${plan.name} → Ajouter un prix.`)
      continue
    }
    const { error } = await db.from("plans").upsert({
      slug: plan.slug, name: plan.name,
      price_monthly: plan.price_monthly || plan.price,
      stripe_price_id: priceId,
    }, { onConflict: "slug" })
    if (error) errors.push(`${plan.name} : ${error.message}`)
  }
  if (errors.length) return NextResponse.json({ ok: false, errors }, { status: 400 })
  return NextResponse.json({ ok: true })
}
