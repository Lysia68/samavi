import { NextRequest, NextResponse } from "next/server"
import { createServiceSupabase } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

// GET /api/studio-public?slug=yogalatestudio
// Route publique — pas d'auth requise
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug")
  if (!slug) return NextResponse.json({ error: "slug requis" }, { status: 400 })

  const db = createServiceSupabase()

  // Infos publiques du studio
  const { data: studio } = await db
    .from("studios")
    .select("id, name, slug, city, address, phone, email, website, description, cover_photo_url, accent_color, public_page_enabled")
    .eq("slug", slug)
    .eq("status", "actif")
    .single()

  if (!studio) return NextResponse.json({ studio: null })

  // Page vitrine désactivée → rediriger vers login
  if (!studio.public_page_enabled) {
    return NextResponse.json({ redirect_login: true })
  }

  // Séances à venir (30 prochains jours)
  const today = new Date().toISOString().slice(0, 10)
  const in30 = new Date(Date.now() + 30 * 86400 * 1000).toISOString().slice(0, 10)

  const { data: sessions } = await db
    .from("sessions")
    .select("id, session_date, session_time, duration_min, teacher, room, spots, status, discipline_id, disciplines(name, icon)")
    .eq("studio_id", studio.id)
    .eq("status", "scheduled")
    .gte("session_date", today)
    .lte("session_date", in30)
    .order("session_date")
    .order("session_time")

  // Compter les inscrits pour afficher les places restantes
  const sessIds = (sessions || []).map(s => s.id)
  let bookedMap: Record<string, number> = {}
  if (sessIds.length > 0) {
    const { data: bookings } = await db
      .from("bookings")
      .select("session_id")
      .in("session_id", sessIds)
      .eq("status", "confirmed")
    ;(bookings || []).forEach(b => {
      bookedMap[b.session_id] = (bookedMap[b.session_id] || 0) + 1
    })
  }

  const enrichedSessions = (sessions || []).map(s => ({
    ...s,
    booked: bookedMap[s.id] || 0,
  }))

  return NextResponse.json({ studio, sessions: enrichedSessions })
}
