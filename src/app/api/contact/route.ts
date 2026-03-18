import { NextResponse, type NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  const { name, email, studio, subject, message } = await request.json()

  if (!name || !email || !message) {
    return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 })
  }

  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
  if (!SENDGRID_API_KEY) {
    return NextResponse.json({ error: "Config email manquante" }, { status: 500 })
  }

  const body = {
    personalizations: [{
      to: [{ email: "info@lysia.fr", name: "Lysia Support" }],
      subject: `[Fydelys Support] ${subject || "Demande d'aide"} — ${studio || email}`,
    }],
    from: { email: "no-reply@fydelys.fr", name: "Fydelys Support" },
    reply_to: { email, name },
    content: [{
      type: "text/html",
      value: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#F4EFE8;border-radius:12px;">
          <div style="font-size:22px;font-weight:800;color:#2A1F14;margin-bottom:4px;">Fyde<span style="color:#A06838">lys</span></div>
          <div style="font-size:12px;color:#8C7B6C;margin-bottom:24px;text-transform:uppercase;letter-spacing:1px;">Demande de support</div>
          <div style="background:#fff;border-radius:10px;padding:20px;border:1px solid #DDD5C8;">
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:6px 0;font-size:13px;color:#8C7B6C;font-weight:600;width:100px;">Nom</td><td style="padding:6px 0;font-size:14px;color:#2A1F14;">${name}</td></tr>
              <tr><td style="padding:6px 0;font-size:13px;color:#8C7B6C;font-weight:600;">Email</td><td style="padding:6px 0;font-size:14px;color:#2A1F14;"><a href="mailto:${email}" style="color:#A06838">${email}</a></td></tr>
              ${studio ? `<tr><td style="padding:6px 0;font-size:13px;color:#8C7B6C;font-weight:600;">Studio</td><td style="padding:6px 0;font-size:14px;color:#2A1F14;">${studio}</td></tr>` : ""}
              <tr><td style="padding:6px 0;font-size:13px;color:#8C7B6C;font-weight:600;">Sujet</td><td style="padding:6px 0;font-size:14px;color:#2A1F14;">${subject || "—"}</td></tr>
            </table>
            <hr style="border:none;border-top:1px solid #EDE4D8;margin:16px 0;"/>
            <div style="font-size:13px;color:#8C7B6C;font-weight:600;margin-bottom:8px;">Message</div>
            <div style="font-size:14px;color:#2A1F14;line-height:1.7;white-space:pre-wrap;">${message}</div>
          </div>
          <div style="font-size:11px;color:#B0A090;margin-top:16px;text-align:center;">Fydelys · Lysia SAS · Répondre directement à ${email}</div>
        </div>
      `
    }]
  }

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${SENDGRID_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error("SendGrid error:", err)
    return NextResponse.json({ error: "Erreur envoi email" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
