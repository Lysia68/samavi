import { NextRequest, NextResponse } from "next/server"
import { createServiceSupabase } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const { memberId, studioId } = await req.json()
    if (!memberId || !studioId) return NextResponse.json({ error: "memberId et studioId requis" }, { status: 400 })

    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
    if (!SENDGRID_API_KEY) {
      console.warn("[notify-new-member] SENDGRID_API_KEY absent — simulé")
      return NextResponse.json({ ok: true, simulated: true })
    }

    const db = createServiceSupabase()

    const [{ data: member }, { data: studio }] = await Promise.all([
      db.from("members").select("first_name, last_name, email, phone").eq("id", memberId).single(),
      db.from("studios").select("name, email, slug").eq("id", studioId).single(),
    ])

    if (!member || !studio) return NextResponse.json({ error: "Membre ou studio introuvable" }, { status: 404 })

    const memberName  = `${member.first_name || ""} ${member.last_name || ""}`.trim()
    const firstName   = member.first_name || memberName
    const studioName  = studio.name
    const studioEmail = studio.email || "noreply@synq9.com"
    const studioUrl   = `https://${studio.slug}.fydelys.fr`

    async function sendEmail(to: string, subject: string, html: string) {
      const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: { "Authorization": `Bearer ${SENDGRID_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }], subject }],
          from: { email: "noreply@synq9.com", name: studioName },
          reply_to: { email: studioEmail, name: studioName },
          content: [{ type: "text/html", value: html }],
        }),
      })
      if (!res.ok) console.error("[notify-new-member] SendGrid error:", await res.text())
      return res.ok
    }

    await Promise.allSettled([
      member.email && sendEmail(
        member.email,
        `Bienvenue chez ${studioName} 🎉`,
        buildWelcomeEmail({ studioName, studioUrl, firstName })
      ),
      studio.email && sendEmail(
        studio.email,
        `👤 Nouveau membre — ${memberName}`,
        buildAdminEmail({ studioName, studioUrl, memberName, memberEmail: member.email || "", memberPhone: member.phone || "" })
      ),
    ])

    console.log("[notify-new-member] Envoyés pour", memberName, "| studio:", studioName)
    return NextResponse.json({ ok: true })

  } catch (err: any) {
    console.error("[notify-new-member] error:", err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

function buildWelcomeEmail({ studioName, studioUrl, firstName }: any) {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F0EBE3;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F0EBE3;padding:32px 16px;"><tr><td align="center">
<table width="100%" style="max-width:540px;background:#fff;overflow:hidden;box-shadow:0 4px 24px rgba(42,31,20,.10);">
  <tr><td style="background:linear-gradient(135deg,#2A1F14 0%,#5C3D20 100%);padding:24px 32px 18px;">
    <div style="font-size:20px;font-weight:800;color:#F5D5A8;">${studioName}</div>
    <div style="font-size:10px;color:rgba(255,255,255,.45);margin-top:4px;text-transform:uppercase;letter-spacing:1.5px;">Bienvenue !</div>
  </td></tr>
  <tr><td style="background:#4E8A58;padding:8px 32px;">
    <span style="font-size:12px;font-weight:700;color:#fff;">🎉 Votre inscription est confirmée</span>
  </td></tr>
  <tr><td style="padding:28px 32px 20px;">
    <p style="font-size:16px;color:#2A1F14;font-weight:700;margin:0 0 10px;">Bonjour ${firstName} 👋</p>
    <p style="font-size:14px;color:#5C4A38;line-height:1.7;margin:0 0 22px;">
      Bienvenue chez <strong>${studioName}</strong> ! Votre espace membre est prêt.<br/>
      Vous pouvez dès maintenant réserver vos séances en ligne.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px;">
      <tr><td align="center" style="background:#A06838;border-radius:10px;">
        <a href="${studioUrl}/dashboard" style="display:inline-block;padding:13px 28px;color:#fff;text-decoration:none;font-size:14px;font-weight:700;font-family:Arial,sans-serif;">
          Accéder à mon espace →
        </a>
      </td></tr>
    </table>
    <p style="font-size:13px;color:#8C7B6C;line-height:1.6;margin:0;">À très bientôt sur votre tapis ! 🧘</p>
  </td></tr>
  <tr><td style="background:#FDFAF7;border-top:2px solid #F0E8DC;padding:12px 32px;text-align:center;">
    <p style="font-size:10px;color:#B0A090;margin:0;">${studioName} · Géré avec <a href="https://fydelys.fr" style="color:#A06838;text-decoration:none;">Fydelys</a></p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`
}

function buildAdminEmail({ studioName, studioUrl, memberName, memberEmail, memberPhone }: any) {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F0EBE3;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F0EBE3;padding:32px 16px;"><tr><td align="center">
<table width="100%" style="max-width:480px;background:#fff;overflow:hidden;box-shadow:0 4px 24px rgba(42,31,20,.10);">
  <tr><td style="background:linear-gradient(135deg,#2A1F14 0%,#5C3D20 100%);padding:20px 28px;">
    <div style="font-size:18px;font-weight:800;color:#F5D5A8;">${studioName}</div>
    <div style="font-size:10px;color:rgba(255,255,255,.45);margin-top:4px;text-transform:uppercase;letter-spacing:1px;">Nouveau membre</div>
  </td></tr>
  <tr><td style="background:#A06838;padding:8px 28px;">
    <span style="font-size:12px;font-weight:700;color:#fff;">👤 Inscription complétée</span>
  </td></tr>
  <tr><td style="padding:24px 28px;">
    <p style="font-size:15px;color:#2A1F14;font-weight:700;margin:0 0 16px;">${memberName} vient de compléter son inscription.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#FDFAF7;border:1.5px solid #EDE4D8;border-radius:10px;margin-bottom:18px;">
      <tr><td style="padding:14px 18px;">
        ${memberEmail ? `<div style="font-size:13px;color:#5C4A38;padding:5px 0;border-bottom:1px solid #F0E8DC;">✉️ <strong>Email :</strong> ${memberEmail}</div>` : ""}
        ${memberPhone ? `<div style="font-size:13px;color:#5C4A38;padding:5px 0;">📱 <strong>Tél :</strong> ${memberPhone}</div>` : ""}
      </td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="background:#2A1F14;border-radius:8px;">
        <a href="${studioUrl}/members" style="display:inline-block;padding:10px 22px;color:#F5D5A8;text-decoration:none;font-size:13px;font-weight:700;font-family:Arial,sans-serif;">
          Voir les adhérents →
        </a>
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="background:#FDFAF7;border-top:2px solid #F0E8DC;padding:10px 28px;text-align:center;">
    <p style="font-size:10px;color:#B0A090;margin:0;">${studioName} · Géré avec <a href="https://fydelys.fr" style="color:#A06838;text-decoration:none;">Fydelys</a></p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`
}