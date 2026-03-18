import { NextResponse } from "next/server"
import { createServiceSupabase } from "@/lib/supabase-server"
import { sendSMS, smsReminder } from "@/lib/sms"

export const dynamic = "force-dynamic"

// Appelé par Vercel Cron toutes les heures : 0 * * * *
// Envoie les rappels X heures avant chaque séance (selon reminder_hours_default du studio)
export async function GET(request: Request) {
  // Sécurité : vérifier le header Vercel Cron
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const db = createServiceSupabase()
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY

  // Charger tous les studios actifs avec leur config rappel
  const { data: studios } = await db
    .from("studios")
    .select("id, name, slug, email, timezone, reminder_hours_default, sms_enabled")
    .eq("status", "actif")

  if (!studios?.length) return NextResponse.json({ ok: true, processed: 0 })

  let totalSent = 0
  let totalSkipped = 0
  const errors: string[] = []

  for (const studio of studios) {
    const reminderHours = studio.reminder_hours_default ?? 24
    const tz = studio.timezone || "Europe/Paris"

    // Calculer la fenêtre : séances qui démarrent dans [reminderHours-0.5h, reminderHours+0.5h]
    const now = new Date()
    const windowStart = new Date(now.getTime() + (reminderHours - 0.5) * 3600 * 1000)
    const windowEnd   = new Date(now.getTime() + (reminderHours + 0.5) * 3600 * 1000)

    // Dates en format YYYY-MM-DD pour la query
    const dateStart = windowStart.toISOString().slice(0, 10)
    const dateEnd   = windowEnd.toISOString().slice(0, 10)

    // Charger les séances dans la fenêtre
    const { data: sessions } = await db
      .from("sessions")
      .select("id, session_date, session_time, duration_min, teacher, room, discipline_id, disciplines(name, icon)")
      .eq("studio_id", studio.id)
      .eq("status", "scheduled")
      .gte("session_date", dateStart)
      .lte("session_date", dateEnd)

    if (!sessions?.length) continue

    // Filtrer précisément selon l'heure en tenant compte de la timezone du studio
    const targetSessions = sessions.filter(s => {
      const sessDateTime = new Date(`${s.session_date}T${s.session_time}`)
      // Ajuster selon timezone (approximation — Vercel tourne en UTC)
      const tzOffset = getTzOffsetMinutes(tz)
      const sessUTC = new Date(sessDateTime.getTime() - tzOffset * 60 * 1000)
      return sessUTC >= windowStart && sessUTC <= windowEnd
    })

    if (!targetSessions.length) continue

    for (const sess of targetSessions) {
      // Vérifier qu'on n'a pas déjà envoyé le rappel pour cette séance
      const { data: existing } = await db
        .from("reminder_logs")
        .select("id")
        .eq("session_id", sess.id)
        .eq("type", "reminder")
        .maybeSingle()

      if (existing) { totalSkipped++; continue }

      // Charger les inscrits confirmés avec email
      const { data: bookings } = await db
        .from("bookings")
        .select("member_id, members(first_name, last_name, email, phone, sms_opt_in)")
        .eq("session_id", sess.id)
        .eq("status", "confirmed")

      const recipients = (bookings || [])
        .map((b: any) => ({
          name:      `${b.members?.first_name||""} ${b.members?.last_name||""}`.trim(),
          email:     b.members?.email || "",
          phone:     b.members?.phone || "",
          sms_opt_in: b.members?.sms_opt_in !== false,
        }))
        .filter((m: any) => m.email || m.phone)

      if (!recipients.length) { totalSkipped++; continue }

      // Formater la séance
      const sessDate = new Date(sess.session_date).toLocaleDateString("fr-FR", { weekday:"long", day:"numeric", month:"long" })
      const sessTime = sess.session_time?.slice(0, 5) || ""
      const disc = (sess as any).disciplines
      const discName = disc?.name || "Séance"
      const discIcon = disc?.icon || "🧘"

      if (SENDGRID_API_KEY) {
        // Envoyer les emails
        await Promise.allSettled(recipients.map(async (member: any) => {
          const firstName = member.name.split(" ")[0] || member.name
          const body = {
            personalizations: [{ to: [{ email: member.email }], subject: `⏰ Rappel — ${discName} demain chez ${studio.name}` }],
            from: { email: "noreply@synq9.com", name: studio.name },
            content: [{ type: "text/html", value: buildReminderEmail({ studio, sess, sessDate, sessTime, discName, discIcon, member, firstName, reminderHours }) }]
          }
          const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
            method: "POST",
            headers: { "Authorization": `Bearer ${SENDGRID_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify(body)
          })
          if (!res.ok) { const e = await res.text(); throw new Error(e) }
        }))
        totalSent += recipients.length
      } else {
        console.log(`[CRON reminders] Simulé — ${studio.name} | ${discName} ${sessDate} ${sessTime} → ${recipients.length} destinataires`)
        totalSent += recipients.length
      }

      // SMS rappels si activé + crédits disponibles
      if (studio.sms_enabled) {
        const smsRecipients = recipients.filter((m: any) => m.phone && m.sms_opt_in)
        if (smsRecipients.length > 0) {
          const { data: studioCredits } = await db.from("studios")
            .select("sms_credits_balance").eq("id", studio.id).single()
          let balance = studioCredits?.sms_credits_balance ?? 0
          const smsBody = smsReminder({ studioName: studio.name, discName, sessTime, reminderHours })
          let smsSent = 0
          for (const m of smsRecipients) {
            if (balance <= 0) break
            const result = await sendSMS({ to: m.phone, body: smsBody })
            if (result.ok) { smsSent++; balance-- }
          }
          if (smsSent > 0) {
            await db.from("studios").update({ sms_credits_balance: balance }).eq("id", studio.id)
          }
        }
      }

      // Logger pour ne pas re-envoyer
      await db.from("reminder_logs").insert({ session_id: sess.id, studio_id: studio.id, type: "reminder", sent_count: recipients.length })
    }
  }

  return NextResponse.json({ ok: true, sent: totalSent, skipped: totalSkipped, errors })
}

// Offset timezone approximatif (Europe/Paris = UTC+1 hiver, UTC+2 été)
function getTzOffsetMinutes(tz: string): number {
  try {
    const now = new Date()
    const tzDate = new Date(now.toLocaleString("en-US", { timeZone: tz }))
    return Math.round((tzDate.getTime() - now.getTime()) / 60000)
  } catch {
    return 60 // fallback Europe/Paris hiver
  }
}

function buildReminderEmail({ studio, sess, sessDate, sessTime, discName, discIcon, member, firstName, reminderHours }: any) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F4EFE8;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4EFE8;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #DDD5C8;box-shadow:0 4px 24px rgba(42,31,20,.08);">
        <tr>
          <td style="background:#2A1F14;padding:28px 32px;text-align:center;">
            <div style="font-size:24px;font-weight:800;color:#fff;letter-spacing:-0.5px;">${studio.name}</div>
            <div style="font-size:11px;color:rgba(255,255,255,.45);margin-top:6px;text-transform:uppercase;letter-spacing:1.5px;">⏰ Rappel de séance</div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 32px 8px;">
            <p style="font-size:16px;color:#2A1F14;font-weight:700;margin:0 0 12px;">Bonjour ${firstName} 👋</p>
            <p style="font-size:14px;color:#5C4A38;line-height:1.7;margin:0 0 24px;">
              ${reminderHours <= 2 ? "C'est bientôt l'heure !" : `Dans ${reminderHours}h, c'est votre séance chez`} <strong>${studio.name}</strong>.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F2EA;border-radius:12px;border:1px solid #DDD5C8;margin-bottom:24px;">
              <tr><td style="padding:20px 24px;">
                <div style="font-size:20px;margin-bottom:10px;">${discIcon} <strong style="color:#2A1F14;">${discName}</strong></div>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr><td style="padding:4px 0;font-size:13px;color:#8C7B6C;width:40%;">📅 Date</td><td style="font-size:14px;color:#2A1F14;font-weight:700;">${sessDate}</td></tr>
                  ${sessTime ? `<tr><td style="padding:4px 0;font-size:13px;color:#8C7B6C;">🕐 Heure</td><td style="font-size:14px;color:#2A1F14;font-weight:700;">${sessTime}${sess.duration_min ? ` · ${sess.duration_min} min` : ""}</td></tr>` : ""}
                  ${sess.teacher ? `<tr><td style="padding:4px 0;font-size:13px;color:#8C7B6C;">👤 Coach</td><td style="font-size:14px;color:#2A1F14;font-weight:700;">${sess.teacher}</td></tr>` : ""}
                  ${sess.room ? `<tr><td style="padding:4px 0;font-size:13px;color:#8C7B6C;">📍 Salle</td><td style="font-size:14px;color:#2A1F14;font-weight:700;">${sess.room}</td></tr>` : ""}
                </table>
              </td></tr>
            </table>
            <p style="font-size:13px;color:#8C7B6C;line-height:1.7;margin:0 0 24px;">À très bientôt sur votre tapis !</p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px 24px;border-top:1px solid #EDE4D8;text-align:center;">
            <p style="font-size:11px;color:#B0A090;margin:0;">
              ${studio.name} · Géré avec <a href="https://fydelys.fr" style="color:#A06838;text-decoration:none;">Fydelys</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
