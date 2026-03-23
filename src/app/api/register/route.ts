import { NextRequest, NextResponse } from "next/server"
import { createServiceSupabase } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

// Enregistre une inscription en attente et envoie le magic link
// Rate limit simple en mémoire (reset au redémarrage)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

export async function POST(req: NextRequest) {
  try {
    // Rate limit : max 3 inscriptions par IP par heure
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
    const now = Date.now()
    const limit = rateLimitMap.get(ip)
    if (limit && now < limit.resetAt) {
      if (limit.count >= 3) {
        console.warn("[register] Rate limit atteint pour", ip)
        return NextResponse.json({ error: "Trop de tentatives, réessayez dans 1 heure" }, { status: 429 })
      }
      limit.count++
    } else {
      rateLimitMap.set(ip, { count: 1, resetAt: now + 3600_000 })
    }

    const { email, studioName, slug, city, zip, address, type, firstName, lastName, phone, isCoach } = await req.json()
    if (!email || !slug || !studioName) {
      return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 })
    }

    const db = createServiceSupabase()

    // Vérifier slug disponible
    const { data: slugExists } = await db.from("studios").select("id").eq("slug", slug).maybeSingle()
    if (slugExists) return NextResponse.json({ error: "Ce sous-domaine est déjà pris" }, { status: 409 })

    // Enregistrer l'inscription en attente via service role (contourne RLS)
    const { error: upsertErr } = await db.from("pending_registrations").upsert({
      email,
      data: { studioName, slug, city, zip: zip || null, address: address || null, type, firstName, lastName, phone, isCoach },
      expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    }, { onConflict: "email" })

    if (upsertErr) {
      console.error("[register] upsert error:", upsertErr.message)
      return NextResponse.json({ error: "Erreur lors de l'enregistrement" }, { status: 500 })
    }

    // Envoyer OTP via Supabase Admin (envoie l'email automatiquement)
    const { createClient: createAnonClient } = await import("@supabase/supabase-js")
    const anonClient = createAnonClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { error: otpErr } = await anonClient.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `https://fydelys.fr/auth/callback?next=/dashboard&register=1`,
        shouldCreateUser: true,
        data: { first_name: firstName, last_name: lastName },
      },
    })
    if (otpErr) {
      console.error("[register] signInWithOtp error:", otpErr.message)
      return NextResponse.json({ error: "Erreur envoi email" }, { status: 500 })
    }
    console.log("[register] OTP envoyé à", email)

    console.log("[register] Inscription enregistrée pour", email, "| studio:", slug)
    return NextResponse.json({ ok: true })

  } catch (err: any) {
    console.error("[register] error:", err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

function buildRegisterEmail({ firstName, studioName, magicLink }: { firstName: string; studioName: string; magicLink: string }) {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F0EBE3;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F0EBE3;padding:32px 16px;"><tr><td align="center">
<table width="100%" style="max-width:540px;background:#fff;overflow:hidden;box-shadow:0 4px 24px rgba(42,31,20,.10);">
  <tr><td style="background:linear-gradient(135deg,#2A1F14 0%,#5C3D20 100%);padding:24px 32px 18px;">
    <div style="font-size:22px;font-weight:800;color:#F5D5A8;">Fydelys</div>
    <div style="font-size:10px;color:rgba(255,255,255,.45);margin-top:4px;text-transform:uppercase;letter-spacing:1.5px;">Confirmation d'inscription</div>
  </td></tr>
  <tr><td style="background:#A06838;padding:8px 32px;">
    <span style="font-size:12px;font-weight:700;color:#fff;">🎉 Plus qu'une étape !</span>
  </td></tr>
  <tr><td style="padding:28px 32px 20px;">
    <p style="font-size:16px;color:#2A1F14;font-weight:700;margin:0 0 10px;">Bonjour ${firstName} 👋</p>
    <p style="font-size:14px;color:#5C4A38;line-height:1.7;margin:0 0 22px;">
      Votre espace studio <strong>${studioName}</strong> est prêt à être créé.<br/>
      Cliquez sur le bouton ci-dessous pour confirmer et accéder à votre espace.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px;">
      <tr><td align="center" style="background:#A06838;border-radius:10px;">
        <a href="${magicLink}" style="display:inline-block;padding:13px 28px;color:#fff;text-decoration:none;font-size:14px;font-weight:700;font-family:Arial,sans-serif;">
          Créer mon espace studio →
        </a>
      </td></tr>
    </table>
    <p style="font-size:12px;color:#8C7B6C;line-height:1.6;margin:0;">
      Ce lien est valable <strong>24 heures</strong>. Si vous n'avez pas demandé cette inscription, ignorez cet email.
    </p>
  </td></tr>
  <tr><td style="background:#FDFAF7;border-top:2px solid #F0E8DC;padding:12px 32px;text-align:center;">
    <p style="font-size:10px;color:#B0A090;margin:0;">Fydelys — Studio Manager · <a href="https://fydelys.fr" style="color:#A06838;text-decoration:none;">fydelys.fr</a></p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`
}