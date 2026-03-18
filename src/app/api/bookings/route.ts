import { NextRequest, NextResponse } from "next/server"
import { createServiceSupabase } from "@/lib/supabase-server"
import { sendSMS, normalizePhone, smsConfirmation, smsWaitlist } from "@/lib/sms"

export const dynamic = "force-dynamic"

// POST /api/bookings — crée une réservation et envoie les emails de confirmation
export async function POST(req: NextRequest) {
  try {
    const { sessionId, memberId, studioId } = await req.json()
    if (!sessionId || !memberId || !studioId)
      return NextResponse.json({ error: "sessionId, memberId, studioId requis" }, { status: 400 })

    const db = createServiceSupabase()

    // Vérifier doublon
    const { data: existing } = await db.from("bookings")
      .select("id, status").eq("session_id", sessionId).eq("member_id", memberId)
      .neq("status", "cancelled").maybeSingle()
    if (existing) return NextResponse.json({ already: true, status: existing.status })

    // Compter les inscrits confirmés vs spots
    const [{ data: sess }, { count: confirmedCount }] = await Promise.all([
      db.from("sessions")
        .select("id, session_date, session_time, duration_min, teacher, room, spots, discipline_id, disciplines(name, icon)")
        .eq("id", sessionId).single(),
      db.from("bookings").select("id", { count: "exact", head: true })
        .eq("session_id", sessionId).eq("status", "confirmed")
    ])
    if (!sess) return NextResponse.json({ error: "Séance introuvable" }, { status: 404 })

    const isFull   = (confirmedCount || 0) >= (sess.spots || 999)
    const status   = isFull ? "waitlist" : "confirmed"

    // Créer la réservation
    const { data: booking, error: bookErr } = await db.from("bookings")
      .insert({ session_id: sessionId, member_id: memberId, status }).select().single()
    if (bookErr || !booking) return NextResponse.json({ error: bookErr?.message }, { status: 500 })

    // Charger les infos nécessaires pour les emails
    const [{ data: member }, { data: studio }] = await Promise.all([
      db.from("members").select("first_name, last_name, email, phone, sms_opt_in").eq("id", memberId).single(),
      db.from("studios").select("id, name, slug, email, reminder_hours_default, sms_enabled").eq("id", studioId).single(),
    ])

    // Envoyer les emails de confirmation si SendGrid configuré
    if (process.env.SENDGRID_API_KEY && member?.email && studio) {
      const disc = (sess as any).disciplines
      const discName = disc?.name || "Séance"
      const discIcon = disc?.icon || "🧘"
      const sessDate = new Date(sess.session_date).toLocaleDateString("fr-FR", { weekday:"long", day:"numeric", month:"long" })
      const sessTime = sess.session_time?.slice(0, 5) || ""
      const memberName = `${member.first_name || ""} ${member.last_name || ""}`.trim()
      const firstName  = member.first_name || memberName

      await Promise.allSettled([
        // 1. Email au membre
        sendEmail({
          to: member.email,
          subject: status === "waitlist"
            ? `⏳ Liste d'attente — ${discName} chez ${studio.name}`
            : `✅ Réservation confirmée — ${discName} chez ${studio.name}`,
          html: buildConfirmationEmail({ studio, sess, sessDate, sessTime, discName, discIcon, member: { name: memberName }, firstName, status }),
        }),
        // 2. Email à l'admin du studio
        studio.email && sendEmail({
          to: studio.email,
          subject: `📋 Nouvelle inscription — ${memberName} · ${discName} ${sessDate}`,
          html: buildAdminNotifEmail({ studio, sess, sessDate, sessTime, discName, discIcon, memberName, status }),
        }),
      ])
    }

    // Envoyer SMS si activé + crédits disponibles
    if (studio?.sms_enabled && member?.phone && member.sms_opt_in !== false) {
      // Vérifier solde crédits
      const { data: studioCredits } = await db.from("studios")
        .select("sms_credits_balance").eq("id", studioId).single()
      const balance = studioCredits?.sms_credits_balance ?? 0

      if (balance > 0) {
        const sessDate = new Date(sess.session_date).toLocaleDateString("fr-FR", { weekday:"short", day:"numeric", month:"short" })
        const sessTime = sess.session_time?.slice(0, 5) || ""
        const disc     = (sess as any).disciplines
        const discName = disc?.name || "Séance"
        const body = status === "waitlist"
          ? smsWaitlist({ studioName: studio.name, discName, sessDate, sessTime })
          : smsConfirmation({ studioName: studio.name, discName, sessDate, sessTime })
        const smsResult = await sendSMS({ to: member.phone, body })
        if (smsResult.ok) {
          // Décrémenter le solde
          await db.from("studios").update({
            sms_credits_balance: balance - 1
          }).eq("id", studioId)
        }
      } else {
        console.log(`[SMS] Studio ${studioId} — solde insuffisant (${balance} crédits)`)
      }
    }

    return NextResponse.json({ ok: true, bookingId: booking.id, status })
  } catch (err: any) {
    console.error("POST /api/bookings error:", err?.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: { "Authorization": `Bearer ${process.env.SENDGRID_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }], subject }],
      from: { email: "noreply@synq9.com", name: "Fydelys" },
      content: [{ type: "text/html", value: html }],
    }),
  })
  if (!res.ok) console.error("SendGrid error:", await res.text())
}

function buildConfirmationEmail({ studio, sess, sessDate, sessTime, discName, discIcon, member, firstName, status }: any) {
  const isWaitlist = status === "waitlist"
  const accentColor = isWaitlist ? "#C4922A" : "#4E8A58"
  const headerBg    = isWaitlist ? "#7C5C1E" : "#2A1F14"
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F4EFE8;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4EFE8;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #DDD5C8;box-shadow:0 4px 24px rgba(42,31,20,.08);">
        <tr><td style="background:${headerBg};padding:28px 32px;text-align:center;">
          <div style="font-size:24px;font-weight:800;color:#fff;letter-spacing:-0.5px;">${studio.name}</div>
          <div style="font-size:11px;color:rgba(255,255,255,.5);margin-top:6px;text-transform:uppercase;letter-spacing:1.5px;">${isWaitlist ? "⏳ Liste d'attente" : "✅ Réservation confirmée"}</div>
        </td></tr>
        <tr><td style="padding:32px 32px 8px;">
          <p style="font-size:16px;color:#2A1F14;font-weight:700;margin:0 0 12px;">Bonjour ${firstName} 👋</p>
          <p style="font-size:14px;color:#5C4A38;line-height:1.7;margin:0 0 24px;">
            ${isWaitlist
              ? `Vous avez été ajouté·e en <strong>liste d'attente</strong> pour la séance suivante. Nous vous préviendrons si une place se libère.`
              : `Votre réservation est <strong>confirmée</strong> ! On vous attend à la séance suivante :`}
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
        </td></tr>
        <tr><td style="padding:16px 32px 24px;border-top:1px solid #EDE4D8;text-align:center;">
          <p style="font-size:11px;color:#B0A090;margin:0;">${studio.name} · Géré avec <a href="https://fydelys.fr" style="color:#A06838;text-decoration:none;">Fydelys</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

function buildAdminNotifEmail({ studio, sess, sessDate, sessTime, discName, discIcon, memberName, status }: any) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F4EFE8;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4EFE8;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #DDD5C8;">
        <tr><td style="background:#2A1F14;padding:20px 28px;text-align:center;">
          <div style="font-size:18px;font-weight:800;color:#fff;">${studio.name}</div>
          <div style="font-size:11px;color:rgba(255,255,255,.5);margin-top:4px;text-transform:uppercase;letter-spacing:1px;">📋 Nouvelle inscription</div>
        </td></tr>
        <tr><td style="padding:24px 28px;">
          <p style="font-size:15px;color:#2A1F14;font-weight:700;margin:0 0 16px;">
            ${memberName} ${status === "waitlist" ? "a rejoint la liste d'attente" : "s'est inscrit·e"} pour :
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F2EA;border-radius:10px;border:1px solid #DDD5C8;">
            <tr><td style="padding:16px 20px;">
              <div style="font-size:16px;margin-bottom:8px;">${discIcon} <strong>${discName}</strong></div>
              <div style="font-size:13px;color:#5C4A38;">📅 ${sessDate}${sessTime ? ` · 🕐 ${sessTime}` : ""}${sess.teacher ? ` · 👤 ${sess.teacher}` : ""}</div>
            </td></tr>
          </table>
          <p style="font-size:12px;color:#8C7B6C;margin-top:16px;">
            Statut : <strong style="color:${status==="waitlist"?"#C4922A":"#4E8A58"}">${status === "waitlist" ? "⏳ Liste d'attente" : "✅ Confirmé"}</strong>
          </p>
        </td></tr>
        <tr><td style="padding:12px 28px 20px;border-top:1px solid #EDE4D8;text-align:center;">
          <p style="font-size:11px;color:#B0A090;margin:0;"><a href="https://${studio.slug}.fydelys.fr/planning" style="color:#A06838;">Voir le planning →</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}
