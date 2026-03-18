import { NextResponse, type NextRequest } from "next/server"
import { createServiceSupabase } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

// Route utilisée pour envoyer un magic link brandé au nom du studio
// au lieu de laisser Supabase envoyer son email générique "Fydelys"
export async function POST(request: NextRequest) {
  const { email, tenantSlug } = await request.json()

  if (!email || !tenantSlug) {
    return NextResponse.json({ error: "email et tenantSlug requis" }, { status: 400 })
  }

  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY

  // ── Fallback : si SendGrid non configuré, on utilise Supabase OTP directement ──
  if (!SENDGRID_API_KEY) {
    const db = createServiceSupabase()
    const { data: studio } = await db.from("studios").select("id").eq("slug", tenantSlug).single()
    const redirectTo = `https://fydelys.fr/auth/confirm?tenant=${tenantSlug}`
    // Créer le compte si besoin
    if (studio) {
      const { data: existingUsers } = await db.auth.admin.listUsers()
      const userExists = existingUsers?.users?.some((u: any) => u.email === email)
      if (!userExists) {
        await db.auth.admin.createUser({
          email,
          email_confirm: false,
          app_metadata: { studio_id: studio.id, studio_slug: tenantSlug },
          user_metadata: { role: "adherent" },
        })
      }
    }
    // Supabase envoie son propre magic link
    const { createClient } = await import("@supabase/supabase-js")
    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { error: otpErr } = await anonClient.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo }
    })
    if (otpErr) {
      console.error("OTP fallback error:", otpErr)
      return NextResponse.json({ error: "Erreur envoi email" }, { status: 500 })
    }
    return NextResponse.json({ ok: true, fallback: true })
  }

  const db = createServiceSupabase()

  // Récupérer le nom du studio depuis le slug
  const { data: studio } = await db
    .from("studios")
    .select("id, name, email")
    .eq("slug", tenantSlug)
    .single()

  if (!studio) {
    return NextResponse.json({ error: "Studio introuvable" }, { status: 404 })
  }

  const studioName = studio.name || "Votre studio"
  const studioEmail = studio.email || "noreply@synq9.com"

  // Vérifier si l'utilisateur existe par email (listUsers paginé)
  const { data: { users } } = await db.auth.admin.listUsers({ perPage: 1000 })
  const existingUser = users?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase())

  if (!existingUser) {
    const { error: createErr } = await db.auth.admin.createUser({
      email: email.toLowerCase(),
      email_confirm: false,
      app_metadata: { studio_id: studio.id, studio_slug: tenantSlug },
      user_metadata: { role: "adherent" },
    })
    if (createErr && !createErr.message?.includes("already registered")) {
      console.error("createUser error:", createErr)
      return NextResponse.json({ error: "Impossible de créer le compte" }, { status: 500 })
    }
  } else {
    // Mettre à jour app_metadata si studio_id manquant
    if (!existingUser.app_metadata?.studio_id) {
      await db.auth.admin.updateUserById(existingUser.id, {
        app_metadata: { ...existingUser.app_metadata, studio_id: studio.id, studio_slug: tenantSlug }
      })
    }
  }

  // Générer le magic link via Supabase Admin
  const { data: linkData, error: linkError } = await db.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: {
      redirectTo: `https://fydelys.fr/auth/confirm?tenant=${tenantSlug}`,
    },
  })

  if (linkError || !linkData?.properties?.action_link) {
    console.error("generateLink error:", linkError)
    return NextResponse.json({ error: "Impossible de générer le lien" }, { status: 500 })
  }

  // Logger pour diagnostiquer ce que retourne generateLink
  console.log("generateLink properties:", JSON.stringify(linkData.properties))

  const actionUrl = new URL(linkData.properties.action_link)
  const tokenHash = actionUrl.searchParams.get("token_hash")
  const hashedToken = (linkData.properties as any).hashed_token
  console.log("tokenHash from URL:", tokenHash, "| hashed_token:", hashedToken)

  const magicLinkUrl = tokenHash
    ? `https://fydelys.fr/auth/confirm?token_hash=${tokenHash}&type=magiclink&tenant=${tenantSlug}`
    : hashedToken
      ? `https://fydelys.fr/auth/confirm?token_hash=${hashedToken}&type=magiclink&tenant=${tenantSlug}`
      : linkData.properties.action_link

  // Email brandé au nom du studio
  const emailBody = {
    personalizations: [{
      to: [{ email }],
      subject: `Votre lien de connexion — ${studioName}`,
    }],
    from: { email: "noreply@synq9.com", name: studioName },
    reply_to: { email: studioEmail, name: studioName },
    content: [{
      type: "text/html",
      value: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F4EFE8;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4EFE8;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #DDD5C8;box-shadow:0 4px 24px rgba(42,31,20,.08);">

                <!-- Header studio -->
        <tr>
          <td style="background:#2A1F14;padding:28px 32px;text-align:center;">
            <img src="https://fydelys.fr/logo-email.png" alt="Fydelys" width="40" height="40" style="display:block;margin:0 auto 10px;border-radius:10px;" onerror="this.style.display='none'"/>
            <div style="font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">
              ${studioName}
            </div>
            <div style="font-size:11px;color:rgba(255,255,255,.45);margin-top:6px;text-transform:uppercase;letter-spacing:1.5px;">
              Connexion sécurisée
            </div>
          </td>
        </tr>

        <!-- Corps -->
        <tr>
          <td style="padding:32px 32px 24px;">
            <p style="font-size:16px;color:#2A1F14;font-weight:700;margin:0 0 12px;">
              Bonjour 👋
            </p>
            <p style="font-size:14px;color:#5C4A38;line-height:1.7;margin:0 0 24px;">
              Voici votre lien de connexion à l'espace membre de <strong>${studioName}</strong>.
              Cliquez sur le bouton ci-dessous — aucun mot de passe n'est nécessaire.
            </p>

                        <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
              <tr>
                <td align="center" bgcolor="#9A6030" style="border-radius:12px;">
                  <a href="${magicLinkUrl}"
                    style="display:inline-block;padding:14px 32px;background-color:#9A6030;color:#ffffff;text-decoration:none;border-radius:12px;font-size:15px;font-weight:700;letter-spacing:-0.2px;font-family:Arial,sans-serif;">
                    Accéder à mon espace &rarr;
                  </a>
                </td>
              </tr>
            </table>

            <p style="font-size:12px;color:#8C7B6C;line-height:1.6;margin:0;">
              Ce lien est valable <strong>1 heure</strong> et à usage unique.<br>
              Si vous n'avez pas demandé ce lien, vous pouvez ignorer cet email.
            </p>
          </td>
        </tr>

        <!-- Lien fallback -->
        <tr>
          <td style="padding:0 32px 24px;">
            <div style="background:#F8F3EE;border-radius:8px;padding:12px 14px;border:1px solid #EDE4D8;">
              <p style="font-size:11px;color:#8C7B6C;margin:0 0 4px;">Lien si le bouton ne fonctionne pas :</p>
              <p style="font-size:11px;color:#A06838;margin:0;word-break:break-all;">${magicLinkUrl}</p>
            </div>
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
    console.error("SendGrid magic link error:", err)
    return NextResponse.json({ error: "Erreur envoi email" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}