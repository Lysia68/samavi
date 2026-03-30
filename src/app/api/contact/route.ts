import { NextResponse, type NextRequest } from "next/server"
import { sendEmail } from "@/lib/email"

export async function POST(request: NextRequest) {
  const { name, email, studio, subject, message, phone, activity } = await request.json()

  if (!name || !email || !message) {
    return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 })
  }

  const row = (label: string, value: string) => value ? `<tr><td style="padding:6px 0;font-size:13px;color:#8C7B6C;font-weight:600;width:100px;">${label}</td><td style="padding:6px 0;font-size:14px;color:#2A1F14;">${value}</td></tr>` : ""

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#F4EFE8;border-radius:12px;">
      <div style="font-size:22px;font-weight:800;color:#2A1F14;margin-bottom:4px;">Fyde<span style="color:#A06838">lys</span></div>
      <div style="font-size:12px;color:#8C7B6C;margin-bottom:24px;text-transform:uppercase;letter-spacing:1px;">Demande de renseignement</div>
      <div style="background:#fff;border-radius:10px;padding:20px;border:1px solid #DDD5C8;">
        <table style="width:100%;border-collapse:collapse;">
          ${row("Nom", name)}
          ${row("Email", `<a href="mailto:${email}" style="color:#A06838">${email}</a>`)}
          ${row("Studio", studio || "")}
          ${row("Téléphone", phone || "")}
          ${row("Activité", activity || "")}
          ${row("Sujet", subject || "")}
        </table>
        <hr style="border:none;border-top:1px solid #EDE4D8;margin:16px 0;"/>
        <div style="font-size:13px;color:#8C7B6C;font-weight:600;margin-bottom:8px;">Message</div>
        <div style="font-size:14px;color:#2A1F14;line-height:1.7;white-space:pre-wrap;">${message}</div>
      </div>
      <div style="font-size:11px;color:#B0A090;margin-top:16px;text-align:center;">Fydelys · Lysia SAS · Répondre directement à ${email}</div>
    </div>
  `

  const result = await sendEmail({
    to: { email: "info@lysia.fr", name: "Lysia Support" },
    subject: `[Fydelys Support] ${subject || "Demande d'aide"} — ${studio || email}`,
    html,
    fromName: "Fydelys Support",
    replyTo: { email, name },
  })

  if (!result.ok) return NextResponse.json({ error: "Erreur envoi email" }, { status: 500 })
  return NextResponse.json({ ok: true })
}
