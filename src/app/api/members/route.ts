import { NextResponse, type NextRequest } from "next/server"
import { createServiceSupabase } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

// GET /api/members?studioId=xxx
export async function GET(request: NextRequest) {
  const studioId = request.nextUrl.searchParams.get("studioId")
  if (!studioId) return NextResponse.json({ error: "studioId requis" }, { status: 400 })

  const search = request.nextUrl.searchParams.get("search")
  const db = createServiceSupabase()

  let query = db.from("members")
  if (search) {
    // Recherche légère pour la BookingModal
    query = query
      .select("id, first_name, last_name, email, phone")
      .eq("studio_id", studioId)
      .or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`)
      .limit(8)
  } else {
    // Liste complète pour la page Adhérents
    query = query
      .select("id, first_name, last_name, email, phone, address, postal_code, city, birth_date, status, credits, credits_total, joined_at, next_payment, notes, subscription_id, profile_complete, subscriptions(name)")
      .eq("studio_id", studioId)
      .order("last_name")
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ members: data || [] })
}

// POST /api/members → créer un membre
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { studioId, ...payload } = body
  if (!studioId) return NextResponse.json({ error: "studioId requis" }, { status: 400 })

  const db = createServiceSupabase()
  const { data: existing } = await db.from("members")
    .select("id").eq("studio_id", studioId).eq("email", payload.email).single()
  if (existing) return NextResponse.json({ error: "EMAIL_EXISTS" }, { status: 409 })

  const { data, error } = await db.from("members")
    .insert({ studio_id: studioId, ...payload })
    .select("id").single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id })
}

// PATCH /api/members → mettre à jour un membre
export async function PATCH(request: NextRequest) {
  const { id, ...updates } = await request.json()
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 })

  const db = createServiceSupabase()
  const { error } = await db.from("members").update(updates).eq("id", id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// DELETE /api/members?id=xxx
export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 })

  const db = createServiceSupabase()
  const { error } = await db.from("members").delete().eq("id", id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}