import { NextResponse, type NextRequest } from "next/server"
import { createServiceSupabase } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const { sessId, studioId, members, sess } = await request.json()

  if (!sessId || !studioId || !members?.length) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 })
  }

  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
  if (!SENDGRID_API_KEY) {
    console.warn("SENDGRID_API_KEY non configuré — rappel simulé")
    return NextResponse.json({ ok: true, simulated: true, count: members.length })
  }

  const db = createServiceSupabase()

  // Récupérer le nom du studio
  const { data: studio } = await db
    .from("studios")
    .select("name, slug")
    .eq("id", studioId)
    .single()

  const studioName = studio?.name || "Votre studio"
  const studioSlug = studio?.slug || ""

  // Formater la date/heure de la séance
  const sessDate = sess?.date
    ? new Date(sess.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
    : "prochainement"
  const sessTime = sess?.time?.slice(0, 5) || ""
  const sessDuration = sess?.duration ? `${sess.duration} min` : ""
  const sessTeacher = sess?.teacher ? `avec ${sess.teacher}` : ""
  const sessRoom = sess?.room || ""

  // Envoyer un email par membre
  const results = await Promise.allSettled(
    members.map(async (member: { email: string; name: string }) => {
      if (!member.email) return

      const emailBody = {
        personalizations: [{
          to: [{ email: member.email }],
          subject: `Rappel de séance — ${studioName}`,
        }],
        from: { email: "noreply@synq9.com", name: studioName },
        content: [{
          type: "text/html",
          value: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F4EFE8;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4EFE8;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #DDD5C8;box-shadow:0 4px 24px rgba(42,31,20,.08);">

        <!-- Header -->
        <tr>
          <td style="background:#2A1F14;padding:28px 32px;text-align:center;">
            <div style="font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">${studioName}</div>
            <div style="font-size:11px;color:rgba(255,255,255,.45);margin-top:6px;text-transform:uppercase;letter-spacing:1.5px;">Rappel de séance</div>
          </td>
        </tr>

        <!-- Corps -->
        <tr>
          <td style="padding:32px 32px 8px;">
            <p style="font-size:16px;color:#2A1F14;font-weight:700;margin:0 0 12px;">
              Bonjour ${member.name ? member.name.split(" ")[0] : ""} 👋
            </p>
            <p style="font-size:14px;color:#5C4A38;line-height:1.7;margin:0 0 24px;">
              Nous vous rappelons votre séance prévue chez <strong>${studioName}</strong>.
            </p>

            <!-- Bloc séance -->
            <table width="100%" cellpadding="0" cellspacing="0"
              style="background:#F8F2EA;border-radius:12px;border:1px solid #DDD5C8;margin-bottom:24px;">
              <tr>
                <td style="padding:20px 24px;">
                  <div style="font-size:13px;color:#8C7B6C;text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-bottom:14px;">📅 Détails de la séance</div>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:5px 0;font-size:13px;color:#8C7B6C;width:40%;">Date</td>
                      <td style="padding:5px 0;font-size:14px;color:#2A1F14;font-weight:700;">${sessDate}</td>
                    </tr>
                    ${sessTime ? `<tr>
                      <td style="padding:5px 0;font-size:13px;color:#8C7B6C;">Heure</td>
                      <td style="padding:5px 0;font-size:14px;color:#2A1F14;font-weight:700;">${sessTime}${sessDuration ? ` · ${sessDuration}` : ""}</td>
                    </tr>` : ""}
                    ${sessTeacher ? `<tr>
                      <td style="padding:5px 0;font-size:13px;color:#8C7B6C;">Intervenant</td>
                      <td style="padding:5px 0;font-size:14px;color:#2A1F14;font-weight:700;">${sess.teacher}</td>
                    </tr>` : ""}
                    ${sessRoom ? `<tr>
                      <td style="padding:5px 0;font-size:13px;color:#8C7B6C;">Salle</td>
                      <td style="padding:5px 0;font-size:14px;color:#2A1F14;font-weight:700;">${sessRoom}</td>
                    </tr>` : ""}
                  </table>
                </td>
              </tr>
            </table>

            <p style="font-size:13px;color:#8C7B6C;line-height:1.7;margin:0 0 24px;">
              À très bientôt sur votre tapis !
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px 24px;border-top:1px solid #EDE4D8;text-align:center;">
            <p style="font-size:11px;color:#B0A090;margin:0;line-height:1.6;">
              ${studioName} · Géré avec <a href="https://fydelys.fr" style="color:#A06838;text-decoration:none;">Fydelys</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
        }]
      }

      const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${SENDGRID_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailBody),
      })

      if (!res.ok) {
        const err = await res.text()
        console.error(`SendGrid reminder error for ${member.email}:`, err)
        throw new Error(`SendGrid error: ${res.status}`)
      }
    })
  )

  const sent    = results.filter(r => r.status === "fulfilled").length
  const failed  = results.filter(r => r.status === "rejected").length

  return NextResponse.json({ ok: true, sent, failed })
}