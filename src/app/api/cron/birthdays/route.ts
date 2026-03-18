import { NextResponse } from "next/server"
import { createServiceSupabase } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

// Appelé par Vercel Cron chaque matin : 0 7 * * *  (7h UTC = 8h Paris hiver, 9h été)
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const db = createServiceSupabase()
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY

  // Aujourd'hui en MM-DD pour matcher birth_date
  const today = new Date()
  const mm = String(today.getMonth() + 1).padStart(2, "0")
  const dd = String(today.getDate()).padStart(2, "0")
  const todayMD = `${mm}-${dd}` // ex: "03-13"

  // Charger tous les membres dont l'anniversaire est aujourd'hui
  // birth_date est stockée en YYYY-MM-DD, on filtre sur MM-DD via to_char côté Supabase
  // Alternative compatible : charger et filtrer côté JS
  const { data: members } = await db
    .from("members")
    .select("id, first_name, last_name, email, birth_date, studio_id, studios(name, slug, email)")
    .not("birth_date", "is", null)
    .not("email", "is", null)
    .eq("status", "Actif")

  if (!members?.length) return NextResponse.json({ ok: true, sent: 0 })

  // Filtrer côté JS sur MM-DD
  const birthdayMembers = members.filter((m: any) => {
    if (!m.birth_date) return false
    const parts = m.birth_date.split("-") // ["1980", "03", "13"]
    return parts.length >= 3 && `${parts[1]}-${parts[2]}` === todayMD
  })

  if (!birthdayMembers.length) {
    return NextResponse.json({ ok: true, sent: 0, message: "Aucun anniversaire aujourd'hui" })
  }

  let totalSent = 0
  const errors: string[] = []

  for (const member of birthdayMembers as any[]) {
    const studio = member.studios
    if (!studio) continue

    // Vérifier qu'on n'a pas déjà envoyé l'email aujourd'hui
    const todayStr = today.toISOString().slice(0, 10)
    const { data: existing } = await db
      .from("reminder_logs")
      .select("id")
      .eq("type", "birthday")
      .eq("studio_id", member.studio_id)
      .filter("metadata->>member_id", "eq", member.id)
      .filter("metadata->>date", "eq", todayStr)
      .maybeSingle()

    if (existing) continue

    const firstName = member.first_name || "cher membre"
    const age = member.birth_date
      ? today.getFullYear() - parseInt(member.birth_date.split("-")[0])
      : null

    if (SENDGRID_API_KEY) {
      const body = {
        personalizations: [{ to: [{ email: member.email }], subject: `🎂 Joyeux anniversaire ${firstName} !` }],
        from: { email: "noreply@synq9.com", name: studio.name },
        content: [{ type: "text/html", value: buildBirthdayEmail({ studio, member, firstName, age }) }]
      }
      const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: { "Authorization": `Bearer ${SENDGRID_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })
      if (!res.ok) {
        const e = await res.text()
        errors.push(`${member.email}: ${e}`)
        continue
      }
    } else {
      console.log(`[CRON birthdays] Simulé — ${studio.name} → ${firstName} ${member.last_name} (${member.email})`)
    }

    // Logger
    await db.from("reminder_logs").insert({
      session_id: null,
      studio_id: member.studio_id,
      type: "birthday",
      sent_count: 1,
      metadata: { member_id: member.id, date: todayStr }
    })

    totalSent++
  }

  return NextResponse.json({ ok: true, sent: totalSent, total_birthdays: birthdayMembers.length, errors })
}

function buildBirthdayEmail({ studio, member, firstName, age }: any) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F4EFE8;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4EFE8;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #DDD5C8;box-shadow:0 4px 24px rgba(42,31,20,.08);">
        <tr>
          <td style="background:#2A1F14;padding:28px 32px;text-align:center;">
            <div style="font-size:48px;margin-bottom:10px;">🎂</div>
            <div style="font-size:24px;font-weight:800;color:#fff;letter-spacing:-0.5px;">${studio.name}</div>
            <div style="font-size:11px;color:rgba(255,255,255,.45);margin-top:6px;text-transform:uppercase;letter-spacing:1.5px;">Joyeux anniversaire !</div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 32px 24px;text-align:center;">
            <p style="font-size:22px;color:#2A1F14;font-weight:800;margin:0 0 16px;">
              Joyeux anniversaire ${firstName} ! 🎉
            </p>
            ${age ? `<p style="font-size:15px;color:#A06838;font-weight:700;margin:0 0 16px;">${age} ans, c'est magnifique !</p>` : ""}
            <p style="font-size:14px;color:#5C4A38;line-height:1.8;margin:0 0 28px;">
              Toute l'équipe de <strong>${studio.name}</strong> vous souhaite une très belle journée, pleine de joie, d'énergie et de bien-être. 🌟
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF8F0;border-radius:12px;border:1px solid #DDD5C8;margin-bottom:24px;">
              <tr><td style="padding:20px 24px;text-align:center;">
                <div style="font-size:14px;color:#8C7B6C;line-height:1.7;">
                  Nous sommes heureux de vous compter parmi nos membres et espérons vous retrouver bientôt pour une séance qui vous ressemble. 🧘
                </div>
              </td></tr>
            </table>
            <p style="font-size:13px;color:#8C7B6C;line-height:1.7;margin:0 0 8px;">
              À très bientôt sur votre tapis !
            </p>
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
