import { NextResponse } from "next/server"
import { createServiceSupabase } from "@/lib/supabase-server"
import { sendSMS, smsReminder } from "@/lib/sms"

export const dynamic = "force-dynamic"

// Appelé par Vercel Cron toutes les heures : 0 * * * *
// Envoie les rappels X heures avant chaque séance (selon reminder_hours_default du studio)
export async function GET(request: Request) {
  // Sécurité : vérifier le header Vercel Cron
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get("authorization")
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const db = createServiceSupabase()
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY

  // Charger tous les studios actifs avec leur config rappel
  const { data: studios } = await db
    .from("studios")
    .select("id, name, slug, email, timezone, reminder_hours_default, sms_enabled")
    .eq("status", "actif")

  console.log("[CRON] Studios actifs:", studios?.length || 0, studios?.map(s => s.name))
  if (!studios?.length) return NextResponse.json({ ok: true, processed: 0, debug: "no studios with status=actif" })

  let totalSent = 0
  let totalSkipped = 0
  const errors: string[] = []
  const debugInfo: any[] = []

  for (const studio of studios) {
    const reminderHours = studio.reminder_hours_default ?? 24
    const tz = studio.timezone || "Europe/Paris"

    // Calculer la fenêtre : séances qui démarrent dans [reminderHours-0.5h, reminderHours+0.5h]
    const now = new Date()
    const windowStart = new Date(now.getTime() + (reminderHours - 0.5) * 3600 * 1000)
    const windowEnd   = new Date(now.getTime() + (reminderHours + 0.5) * 3600 * 1000)
    debugInfo.push({ studio: studio.name, reminderHours, now: now.toISOString(), windowStart: windowStart.toISOString(), windowEnd: windowEnd.toISOString() })
    console.log(`[CRON] ${studio.name} | window: ${windowStart.toISOString()} → ${windowEnd.toISOString()}`)

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

    debugInfo[debugInfo.length-1].sessionsFound = sessions?.length || 0
    debugInfo[debugInfo.length-1].sessions = sessions?.map(s => ({ id: s.id, date: s.session_date, time: s.session_time }))
    console.log(`[CRON] ${studio.name} | sessions trouvées: ${sessions?.length || 0}`)
    if (!sessions?.length) continue

    // Filtrer précisément selon l'heure en tenant compte de la timezone du studio
    const targetSessions = sessions.filter(s => {
      // La session_date/time est stockée en heure locale du studio
      // Pour convertir en UTC : soustraire l'offset (Paris UTC+1 = +60min → UTC = local - 60min)
      const sessLocal = new Date(`${s.session_date}T${s.session_time}`)
      const tzOffsetMs = getTzOffsetMs(tz)
      const sessUTC = new Date(sessLocal.getTime() - tzOffsetMs)
      return sessUTC >= windowStart && sessUTC <= windowEnd
    })

    console.log(`[CRON] ${studio.name} | sessions dans fenêtre: ${targetSessions.length}`)
    debugInfo[debugInfo.length-1].targetSessions = targetSessions.length
    debugInfo[debugInfo.length-1].sessionsDetail = sessions?.map(s => {
      const sessDateTime = new Date(`${s.session_date}T${s.session_time}`)
      const tzOffsetMs = getTzOffsetMs(tz)
      const sessUTC = new Date(sessDateTime.getTime() - tzOffsetMs)
      return { id: s.id, date: s.session_date, time: s.session_time, sessUTC: sessUTC.toISOString(), inWindow: sessUTC >= windowStart && sessUTC <= windowEnd }
    })
    if (!targetSessions.length) continue

    for (const sess of targetSessions) {
      // Vérifier qu'on n'a pas déjà envoyé le rappel pour cette séance
      const { data: existing, error: logErr } = await db
        .from("reminder_logs")
        .select("id")
        .eq("session_id", sess.id)
        .eq("type", "reminder")
        .maybeSingle()
      if (logErr) console.error("[CRON] reminder_logs error:", logErr.message)

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

      debugInfo[debugInfo.length-1].bookingsForSess = (bookings || []).length
      debugInfo[debugInfo.length-1].recipients = recipients.length
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
          const subjectLabel = reminderHours < 1 ? "maintenant" : reminderHours === 1 ? "dans 1 heure" : reminderHours < 24 ? `dans ${reminderHours}h` : reminderHours <= 26 ? "demain" : `dans ${Math.round(reminderHours/24)} jours`
          const body = {
            personalizations: [{ to: [{ email: member.email }], subject: `Votre cours "${discName}" est ${subjectLabel} chez ${studio.name}` }],
            from: { email: "noreply@fydelys.fr", name: studio.name },
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

  return NextResponse.json({ ok: true, sent: totalSent, skipped: totalSkipped, errors, debug: debugInfo })
}

// Offset timezone en millisecondes (positif = ahead of UTC, ex: Paris UTC+1 = +3600000ms)
function getTzOffsetMs(tz: string): number {
  try {
    const now = new Date()
    // toLocaleString donne l'heure locale — la différence avec UTC donne l'offset
    const localStr = now.toLocaleString("en-US", { timeZone: tz })
    const localDate = new Date(localStr)
    return Math.round(localDate.getTime() - now.getTime())
  } catch {
    return 3600000 // fallback Europe/Paris hiver UTC+1
  }
}

// Alias pour compatibilité
function getTzOffsetMinutes(tz: string): number {
  return getTzOffsetMs(tz) / 60000
}

function buildReminderEmail({ studio, sess, sessDate, sessTime, discName, discIcon, member, firstName, reminderHours }: any) {
  const urgencyColor = reminderHours <= 2 ? "#C4400C" : reminderHours <= 26 ? "#A06838" : "#4E8A58"
  const subjectLabel = reminderHours < 1
    ? "C'est l'heure !"
    : reminderHours === 1
      ? "dans 1 heure"
      : reminderHours < 24
        ? `dans ${reminderHours}h`
        : reminderHours <= 26
          ? "demain"
          : `dans ${Math.round(reminderHours/24)} jours`

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Rappel — ${discName}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a1a; background: #F0EBE3; }
    .wrap { max-width: 560px; margin: 32px auto; background: #fff; border-radius: 0; overflow: hidden; box-shadow: 0 4px 24px rgba(42,31,20,.10); }
    /* Header */
    .header { background: linear-gradient(135deg, #2A1F14 0%, #5C3D20 100%); padding: 24px 32px; display: flex; justify-content: space-between; align-items: center; }
    .studio-name { font-size: 18px; font-weight: 800; color: #F5D5A8; letter-spacing: -0.3px; }
    .header-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: rgba(255,255,255,.45); margin-top: 3px; }
    /* Bande urgence */
    .urgency-bar { background: ${urgencyColor}; padding: 8px 32px; font-size: 12px; font-weight: 700; color: #fff; letter-spacing: 0.3px; }
    /* Body */
    .body { padding: 28px 32px 20px; }
    .greeting { font-size: 16px; font-weight: 700; color: #2A1F14; margin-bottom: 6px; }
    .intro { font-size: 14px; color: #5C4A38; line-height: 1.7; margin-bottom: 22px; }
    /* Card séance */
    .sess-card { background: #FDFAF7; border: 1.5px solid #EDE4D8; border-radius: 10px; overflow: hidden; margin-bottom: 22px; }
    .sess-header { background: #F5EBE0; padding: 12px 18px; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid #EDE4D8; }
    .disc-icon { font-size: 20px; line-height: 1; }
    .disc-name { font-size: 15px; font-weight: 800; color: #2A1F14; }
    .sess-rows { padding: 10px 18px 4px; }
    .sess-row { display: flex; align-items: center; padding: 6px 0; border-bottom: 1px solid #F5EEE5; }
    .sess-row:last-child { border-bottom: none; }
    .row-label { font-size: 11px; color: #A06838; font-weight: 700; width: 22px; text-align: center; flex-shrink: 0; }
    .row-key { font-size: 12px; color: #8C7B6C; width: 60px; flex-shrink: 0; }
    .row-val { font-size: 13px; font-weight: 700; color: #2A1F14; }
    .sign-off { font-size: 13px; color: #5C4A38; text-align: center; line-height: 1.7; padding: 4px 0 8px; }
    /* Footer */
    .footer { background: #FDFAF7; border-top: 2px solid #F0E8DC; padding: 12px 32px; text-align: center; }
    .footer p { font-size: 10px; color: #B0A090; line-height: 1.8; }
    .footer a { color: #A06838; text-decoration: none; font-weight: 600; }
    @media (max-width:600px) { .wrap { margin: 0; border-radius: 0; } .header, .body, .footer { padding-left: 20px; padding-right: 20px; } .urgency-bar { padding-left: 20px; padding-right: 20px; } }
  </style>
</head>
<body>
<div class="wrap">

  <!-- Header -->
  <div class="header">
    <div>
      <div class="studio-name">${studio.name}</div>
      <div class="header-label">Rappel de séance</div>
    </div>
    <div style="font-size:28px;line-height:1;">${discIcon}</div>
  </div>

  <!-- Bande urgence -->
  <div class="urgency-bar">${subjectLabel}</div>

  <!-- Corps -->
  <div class="body">
    <p class="greeting">Bonjour ${firstName} 👋</p>
    <p class="intro">Nous vous rappelons votre prochaine séance chez <strong>${studio.name}</strong>.</p>

    <div class="sess-card">
      <div class="sess-header">
        <span class="disc-icon">${discIcon}</span>
        <span class="disc-name">${discName}</span>
      </div>
      <div class="sess-rows">
        <div class="sess-row">
          <span class="row-label">📅</span>
          <span class="row-key">Date</span>
          <span class="row-val">${sessDate}</span>
        </div>
        ${sessTime ? `<div class="sess-row">
          <span class="row-label">🕐</span>
          <span class="row-key">Heure</span>
          <span class="row-val">${sessTime}${sess.duration_min ? ` <span style="color:#8C7B6C;font-weight:400;font-size:11px;">· ${sess.duration_min} min</span>` : ""}</span>
        </div>` : ""}
        ${sess.teacher ? `<div class="sess-row">
          <span class="row-label">👤</span>
          <span class="row-key">Coach</span>
          <span class="row-val">${sess.teacher}</span>
        </div>` : ""}
        ${sess.room ? `<div class="sess-row">
          <span class="row-label">📍</span>
          <span class="row-key">Salle</span>
          <span class="row-val">${sess.room}</span>
        </div>` : ""}
      </div>
    </div>

    <p class="sign-off">🌟 À très bientôt sur votre tapis !</p>
  </div>

  <!-- Footer -->
  <div class="footer">
    <p>${studio.name} · Géré avec <a href="https://fydelys.fr">Fydelys</a></p>
    <p style="margin-top:3px;font-size:9px;color:#C4B8A8;">Vous recevez ce message car vous êtes inscrit(e) à cette séance.</p>
  </div>

</div>
</body>
</html>`
}