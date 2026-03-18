import { NextRequest, NextResponse } from "next/server"
import { createServiceSupabase } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const { studioId } = await req.json()
    if (!studioId) return NextResponse.json({ error: "studioId requis" }, { status: 400 })

    const db = createServiceSupabase()

    await db.from("studios").update({
      stripe_connect_id:     null,
      stripe_connect_status: "not_connected",
    }).eq("id", studioId)

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error("Connect disconnect error:", err?.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
