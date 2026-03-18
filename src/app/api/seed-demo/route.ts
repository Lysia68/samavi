import { NextResponse } from "next/server"
import { createServerSupabase, createServiceSupabase } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

export async function POST() {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

    const db = createServiceSupabase()

    // Récupérer le studio de l'admin
    const { data: profile } = await db
      .from("profiles").select("studio_id, role").eq("id", user.id).single()
    if (!profile?.studio_id || profile.role !== "admin") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }
    const studioId = profile.studio_id

    // Récupérer les disciplines existantes du studio
    const { data: discs } = await db
      .from("disciplines").select("id, name").eq("studio_id", studioId).limit(2)
    const discId = discs?.[0]?.id || null

    const today = new Date()
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
    const fmt = (d: Date) => d.toISOString().split("T")[0]

    // 1. Membres (2)
    await db.from("members").upsert([
      { studio_id: studioId, first_name: "Marie", last_name: "Exemple", email: "marie.exemple@demo.fr", phone: "06 00 00 00 01", status: "actif",    credits: 5,  credits_total: 10 },
      { studio_id: studioId, first_name: "Jean",  last_name: "Exemple", email: "jean.exemple@demo.fr",  phone: "06 00 00 00 02", status: "nouveau", credits: 1,  credits_total: 1  },
    ], { onConflict: "studio_id,email", ignoreDuplicates: true })

    // 2. Sessions (2) — si une discipline existe
    if (discId) {
      await db.from("sessions").upsert([
        { studio_id: studioId, discipline_id: discId, teacher_name: "Coach Exemple", date: fmt(today),    start_time: "09:00", duration_min: 60, capacity: 10, booked_count: 0, room: "Studio A", level: "Tous niveaux" },
        { studio_id: studioId, discipline_id: discId, teacher_name: "Coach Exemple", date: fmt(tomorrow), start_time: "10:00", duration_min: 60, capacity: 10, booked_count: 0, room: "Studio A", level: "Débutant"     },
      ], { onConflict: "studio_id,date,start_time,discipline_id", ignoreDuplicates: true })
    }

    // 3. Abonnement (1)
    await db.from("subscription_plans").upsert([
      { studio_id: studioId, name: "Mensuel", price: 59, period: "mois", description: "Accès illimité", popular: true, color: "#C4956A" },
    ], { onConflict: "studio_id,name", ignoreDuplicates: true })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("seed-demo error:", err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
