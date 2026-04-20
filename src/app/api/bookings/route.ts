import { NextRequest, NextResponse } from "next/server"
import { createServiceSupabase } from "@/lib/supabase-server"
import { sendEmail } from "@/lib/email"
import { rateLimit, getIP } from "@/lib/rate-limit"
import { logActivity } from "@/lib/activity"

export const dynamic = "force-dynamic"

// GET /api/bookings?memberId=xxx&studioId=xxx  ou  ?sessionIds=id1,id2&studioId=xxx
export async function GET(req: NextRequest) {
  const memberId = req.nextUrl.searchParams.get("memberId")
  const sessionIds = req.nextUrl.searchParams.get("sessionIds")
  const studioId = req.nextUrl.searchParams.get("studioId")

  const db = createServiceSupabase()

  // Mode 1 : bookings d'un membre
  if (memberId && studioId) {
    const { data } = await db.from("bookings")
      .select("id, session_id, status")
      .eq("member_id", memberId)
      .in("status", ["confirmed", "waitlist"])
    const res1 = NextResponse.json({ bookings: data || [] })
    res1.headers.set("Cache-Control", "private, s-maxage=10, stale-while-revalidate=20")
    return res1
  }

  // Mode 2 : bookings de plusieurs sessions (pour le planning admin)
  if (sessionIds && studioId) {
    const ids = sessionIds.split(",").filter(Boolean)
    if (ids.length === 0) return NextResponse.json({ bookings: [] })
    const { data } = await db.from("bookings")
      .select("id, session_id, member_id, status, attended, cancelled_by, guest_name, host_member_id, members!bookings_member_id_fkey(id, first_name, last_name, email, phone, credits, credits_total, subscription_id, subscriptions(period))")
      .in("session_id", ids)
    const res2 = NextResponse.json({ bookings: data || [] })
    res2.headers.set("Cache-Control", "private, s-maxage=10, stale-while-revalidate=20")
    return res2
  }

  return NextResponse.json({ error: "(memberId ou sessionIds) + studioId requis" }, { status: 400 })
}

// POST /api/bookings — crée une réservation (membre ou invité) et envoie les emails de confirmation
export async function POST(req: NextRequest) {
  // Rate limit : max 30 bookings/min par IP
  const rl = rateLimit(getIP(req), { max: 30, windowSec: 60 })
  if (!rl.ok) return NextResponse.json({ error: "Trop de requêtes. Réessayez dans quelques instants." }, { status: 429 })

  try {
    const body = await req.json()
    const { sessionId, memberId, studioId, guestName, hostMemberId, force } = body
    const isGuest = !!guestName && !!hostMemberId

    if (!sessionId || !studioId || (!memberId && !isGuest))
      return NextResponse.json({ error: "sessionId, studioId et (memberId ou guestName+hostMemberId) requis" }, { status: 400 })

    const db = createServiceSupabase()

    // ── Guest booking ─────────────────────────────────────────────────
    if (isGuest) {
      // Vérifier doublon invité (même nom + même hôte + même séance)
      const { data: existingGuest } = await db.from("bookings")
        .select("id, status").eq("session_id", sessionId).eq("guest_name", guestName).eq("host_member_id", hostMemberId)
        .neq("status", "cancelled").maybeSingle()
      if (existingGuest) return NextResponse.json({ already: true, status: existingGuest.status })

      // Compter les inscrits confirmés vs spots
      const [{ data: sess }, { count: confirmedCount }] = await Promise.all([
        db.from("sessions").select("spots").eq("id", sessionId).single(),
        db.from("bookings").select("id", { count: "exact", head: true }).eq("session_id", sessionId).eq("status", "confirmed"),
      ])
      const isFull = (confirmedCount || 0) >= (sess?.spots || 999)
      const status = (isFull && !force) ? "waitlist" : "confirmed"

      const { data: booking, error } = await db.from("bookings")
        .insert({ session_id: sessionId, member_id: null, status, guest_name: guestName, host_member_id: hostMemberId })
        .select("id").single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      return NextResponse.json({ ok: true, bookingId: booking.id, status, guest: true })
    }

    // ── Regular member booking ────────────────────────────────────────
    // Vérifier doublon (y compris cancelled pour la contrainte unique)
    const { data: existing } = await db.from("bookings")
      .select("id, status").eq("session_id", sessionId).eq("member_id", memberId)
      .maybeSingle()
    if (existing && existing.status !== "cancelled") {
      return NextResponse.json({ already: true, status: existing.status })
    }
    // Supprimer l'ancienne réservation annulée pour permettre la ré-inscription
    if (existing && existing.status === "cancelled") {
      await db.from("bookings").delete().eq("id", existing.id)
    }

    // Charger studio + membre en parallèle pour vérification accès
    const [{ data: studioData }, { data: memberCredits }] = await Promise.all([
      db.from("studios").select("payment_mode").eq("id", studioId).maybeSingle(),
      db.from("members").select("credits, credits_total, status, subscription_id, frozen_until, subscriptions(period)").eq("id", memberId).single(),
    ])

    // Vérifier gel d'abonnement
    if (memberCredits?.frozen_until && new Date(memberCredits.frozen_until) >= new Date(new Date().toISOString().slice(0, 10))) {
      return NextResponse.json({ error: "Abonnement gelé", frozen_until: memberCredits.frozen_until }, { status: 403 })
    }

    const paymentMode = studioData?.payment_mode || "none"
    const subPeriod   = (memberCredits as any)?.subscriptions?.period
    const isUnlimited = subPeriod === "mois" || subPeriod === "trimestre" || subPeriod === "année"
    const hasCredits  = memberCredits && (memberCredits.credits_total ?? 0) > 0
    const creditsOk   = hasCredits && (memberCredits.credits ?? 0) > 0

    // Si le studio utilise les paiements, vérifier que le membre peut réserver
    // Les crédits sont déduits à la validation des présences, pas à la réservation
    // force=true (admin) bypass cette vérification
    if (paymentMode !== "none" && !force) {
      if (isUnlimited) {
        // Abonnement mensuel/illimité → OK
      } else if (creditsOk) {
        // A des crédits → OK
      } else {
        return NextResponse.json({ error: "Abonnement ou crédit requis pour réserver" }, { status: 402 })
      }
    }

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
    const status   = (isFull && !force) ? "waitlist" : "confirmed"

    // Créer la réservation
    const { data: booking, error: bookErr } = await db.from("bookings")
      .insert({ session_id: sessionId, member_id: memberId, status }).select().single()
    if (bookErr || !booking) {
      console.error("[bookings POST] insert error:", bookErr?.message, bookErr?.details, bookErr?.hint, { sessionId, memberId, status })
      return NextResponse.json({ error: bookErr?.message }, { status: 500 })
    }

    await logActivity(db, { memberId, studioId, action: "booking_created", actorRole: force ? "admin" : "adherent", details: { booking_id: booking.id, session_id: sessionId, status, session_date: sess.session_date, session_time: sess.session_time, discipline: (sess as any).disciplines?.name } })

    // Crédits déduits à la validation des présences (accordion.jsx), pas à la réservation

    // Email admin "cours complet" si cette inscription remplit la séance
    if (status === "confirmed") {
      const { count: newCount } = await db.from("bookings").select("id", { count: "exact", head: true })
        .eq("session_id", sessionId).eq("status", "confirmed")
      const spots = sess.spots || 999
      if ((newCount || 0) >= spots) {
        const [{ data: studioFull }, { data: sessFull }] = await Promise.all([
          db.from("studios").select("name, slug, email").eq("id", studioId).maybeSingle(),
          db.from("sessions").select("session_date, session_time, teacher, disciplines(name, icon)").eq("id", sessionId).single(),
        ])
        if (studioFull?.email) {
          const disc = (sessFull as any)?.disciplines
          const discName = disc?.name || "Séance"
          const discIcon = disc?.icon || ""
          const sessDate = new Date(sessFull.session_date).toLocaleDateString("fr-FR", { weekday:"long", day:"numeric", month:"long" })
          const sessTime = sessFull.session_time?.slice(0, 5) || ""
          sendEmail({
            to: studioFull.email,
            subject: `Cours complet — ${discName} ${sessDate} a ${sessTime}`,
            html: buildFullSessionEmail({ studio: studioFull, sess: sessFull, sessDate, sessTime, discName, discIcon, spots, count: newCount || spots }),
            fromName: studioFull.name,
          })
        }
      }
    }

    // Répondre immédiatement — notifications en arrière-plan (fire-and-forget)
    const response = NextResponse.json({ ok: true, bookingId: booking.id, status })

    // Notifications asynchrones (ne bloquent pas la réponse)
    ;(async () => {
      try {
        const [{ data: member }, { data: studio }] = await Promise.all([
          db.from("members").select("first_name, last_name, email, phone, sms_opt_in").eq("id", memberId).maybeSingle(),
          db.from("studios").select("id, name, slug, email, sms_enabled").eq("id", studioId).maybeSingle(),
        ])

        if (process.env.SENDGRID_API_KEY && member?.email && studio) {
          const disc = (sess as any).disciplines
          const discName = disc?.name || "Séance"
          const discIcon = disc?.icon || ""
          const sessDate = new Date(sess.session_date).toLocaleDateString("fr-FR", { weekday:"long", day:"numeric", month:"long" })
          const sessTime = sess.session_time?.slice(0, 5) || ""
          const memberName = `${member.first_name || ""} ${member.last_name || ""}`.trim()
          const firstName  = member.first_name || memberName

          const emails: Promise<any>[] = [
            sendEmail({
              to: member.email,
              subject: status === "waitlist"
                ? `Liste d'attente — ${discName} chez ${studio.name}`
                : `Réservation confirmée — ${discName} chez ${studio.name}`,
              html: buildConfirmationEmail({ studio, sess, sessDate, sessTime, discName, discIcon, member: { name: memberName }, firstName, status }),
              fromName: studio.name,
            }),
          ]
          if (studio.email) {
            emails.push(sendEmail({
              to: studio.email,
              subject: `Nouvelle inscription — ${memberName} · ${discName} ${sessDate}`,
              html: buildAdminNotifEmail({ studio, sess, sessDate, sessTime, discName, discIcon, memberName, status }),
              fromName: studio.name,
            }))
          }

          Promise.allSettled(emails)
        }

        // SMS réservé uniquement aux rappels de séance (cron/reminders)
      } catch (e: any) { console.error("[bookings] notification error:", e.message) }
    })()

    return response
  } catch (err: any) {
    console.error("POST /api/bookings error:", err?.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
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

function buildFullSessionEmail({ studio, sess, sessDate, sessTime, discName, discIcon, spots, count }: any) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F4EFE8;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4EFE8;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #DDD5C8;">
        <tr><td style="background:#2E6B3E;padding:20px 28px;text-align:center;">
          <div style="font-size:18px;font-weight:800;color:#fff;">${studio.name}</div>
          <div style="font-size:11px;color:rgba(255,255,255,.7);margin-top:4px;text-transform:uppercase;letter-spacing:1px;">Cours complet</div>
        </td></tr>
        <tr><td style="padding:24px 28px;text-align:center;">
          <div style="font-size:40px;margin-bottom:8px;">🎉</div>
          <p style="font-size:16px;color:#2A1F14;font-weight:700;margin:0 0 6px;">Felicitations !</p>
          <p style="font-size:14px;color:#5C4A38;line-height:1.6;margin:0 0 20px;">Votre cours est complet : <strong>${count}/${spots} places</strong> reservees.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F2EA;border-radius:10px;border:1px solid #DDD5C8;">
            <tr><td style="padding:16px 20px;">
              <div style="font-size:16px;margin-bottom:8px;">${discIcon} <strong>${discName}</strong></div>
              <div style="font-size:13px;color:#5C4A38;">📅 ${sessDate}${sessTime ? ` · 🕐 ${sessTime}` : ""}${sess.teacher ? ` · 👤 ${sess.teacher}` : ""}</div>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:12px 28px 20px;border-top:1px solid #EDE4D8;text-align:center;">
          <p style="font-size:11px;color:#B0A090;margin:0;"><a href="https://${studio.slug}.fydelys.fr/planning" style="color:#A06838;">Voir le planning →</a></p>
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