import { NextResponse } from "next/server"
import { createServerSupabase, createServiceSupabase } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

// GET /api/sa/config — état de configuration de la plateforme Fydelys
export async function GET() {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

    const db = createServiceSupabase()
    const { data: profile } = await db.from("profiles").select("role").eq("id", user.id).single()
    if (profile?.role !== "superadmin")
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })

    // Vérifier présence des variables d'environnement critiques
    // Ne jamais retourner les valeurs — juste présent/absent + hint
    const checks = [
      { key: "STRIPE_SECRET_KEY",              label: "Stripe SK plateforme",        hint: "sk_live_… ou sk_test_…" },
      { key: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", label: "Stripe PK plateforme",   hint: "pk_live_… ou pk_test_…" },
      { key: "STRIPE_WEBHOOK_SECRET",          label: "Webhook billing SaaS",        hint: "whsec_…" },
      { key: "STRIPE_CONNECT_WEBHOOK_SECRET",  label: "Webhook Connect studios",     hint: "whsec_…" },
      { key: "FYDELYS_COMMISSION_PCT",         label: "Commission Connect (%)",       hint: "ex: 2" },
      { key: "SENDGRID_API_KEY",               label: "SendGrid (emails)",            hint: "SG.…" },
      { key: "CRON_SECRET",                    label: "Cron secret",                  hint: "openssl rand -hex 32" },
      { key: "SUPABASE_SERVICE_ROLE_KEY",      label: "Supabase service role",        hint: "eyJ…" },
      { key: "TWILIO_ACCOUNT_SID",             label: "Twilio Account SID",           hint: "ACxxx…" },
      { key: "TWILIO_AUTH_TOKEN",              label: "Twilio Auth Token",            hint: "token…" },
      { key: "TWILIO_PHONE_NUMBER",            label: "Twilio numéro expéditeur",     hint: "+33… ou MSID…" },
    ]

    const status = checks.map(c => {
      const val = process.env[c.key]
      const present = !!val
      const preview = present ? val!.slice(0, 8) + "…" : null
      return { ...c, present, preview }
    })

    return NextResponse.json({ status })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
