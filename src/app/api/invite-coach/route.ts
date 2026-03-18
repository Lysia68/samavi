import { NextResponse, type NextRequest } from "next/server"
import { createServiceSupabase } from "@/lib/supabase-server"
import { createServerClient } from "@supabase/ssr"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const { email, firstName, lastName, studioId: clientStudioId } = await request.json()

  if (!email) {
    return NextResponse.json({ error: "Email requis" }, { status: 400 })
  }

  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY

  const db = createServiceSupabase()

  // Récupérer le studio : priorité au studioId envoyé par le client
  // (évite les problèmes de cookies cross-subdomain)
  let studioIdToUse: string | null = clientStudioId || null

  if (!studioIdToUse) {
    // Fallback : lire depuis la session cookie
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return request.cookies.getAll() }, setAll() {} } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await db.from("profiles").select("studio_id").eq("id", user.id).single()
      studioIdToUse = profile?.studio_id || null
    }
  }

  if (!studioIdToUse) {
    return NextResponse.json({ error: "Studio introuvable" }, { status: 404 })
  }

  const { data: studio } = await db
    .from("studios")
    .select("id, name, slug, email")
    .eq("id", studioIdToUse)
    .single()

  if (!studio) {
    return NextResponse.json({ error: "Studio introuvable" }, { status: 404 })
  }

  const studioName = studio.name || "Votre studio"
  const studioSlug = studio.slug
  const studioEmail = studio.email || "noreply@synq9.com"

  // Insérer l'invitation en base (le callback en tiendra compte pour le rôle)
  // Un seul appel listUsers — réutilisé pour vérif doublon ET création
  const { data: { users: allUsers } } = await db.auth.admin.listUsers({ perPage: 1000 })
  const existingAuthUser = allUsers?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase())

  // Si l'user existe déjà avec un profil dans CE studio → erreur doublon
  if (existingAuthUser) {
    const { data: existingProfile } = await db.from("profiles")
      .select("id, role").eq("id", existingAuthUser.id).eq("studio_id", studio.id).single()
    if (existingProfile) {
      return NextResponse.json({ error: `${email} est déjà membre de ce studio (rôle: ${existingProfile.role})` }, { status: 409 })
    }
  }

  // Supprimer l'ancienne invitation si existante, puis réinsérer
  await db.from("invitations").delete().eq("email", email.toLowerCase()).eq("studio_id", studio.id)
  const { error: inviteErr } = await db.from("invitations").insert({
    email: email.toLowerCase(),
    studio_id: studio.id,
    role: "coach",
    used: false,
  })
  if (inviteErr) console.error("invitations insert error:", inviteErr)

  // Créer le user s'il n'existe pas encore
  if (!existingAuthUser) {
    const { error: createErr } = await db.auth.admin.createUser({
      email: email.toLowerCase(),
      email_confirm: false,
      app_metadata: { studio_id: studio.id, studio_slug: studioSlug },
      user_metadata: { role: "coach", first_name: firstName || "", last_name: lastName || "" },
    })
    if (createErr && !createErr.message?.includes("already registered")) {
      console.error("createUser coach error:", createErr)
      return NextResponse.json({ error: "Impossible de créer le compte coach" }, { status: 500 })
    }
  }

  // Générer le magic link via Supabase Admin API
  const { data: linkData, error: linkError } = await db.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: {
      redirectTo: `https://fydelys.fr/auth/confirm?tenant=${studioSlug}`,
    },
  })

  if (linkError || !linkData?.properties?.action_link) {
    console.error("generateLink error:", linkError)
    return NextResponse.json({ error: "Impossible de générer le lien" }, { status: 500 })
  }

  // Extraire token ou token_hash selon le format retourné par Supabase
  const actionUrl = new URL(linkData.properties.action_link)
  const tokenHash = actionUrl.searchParams.get("token_hash")
  const token     = actionUrl.searchParams.get("token")
  // Utiliser le lien Supabase natif en remplaçant juste le redirect_to
  const magicLinkUrl = tokenHash
    ? `https://fydelys.fr/auth/confirm?token_hash=${tokenHash}&type=magiclink&tenant=${studioSlug}`
    : token
      ? `${actionUrl.origin}${actionUrl.pathname}?token=${token}&type=magiclink&redirect_to=${encodeURIComponent(`https://fydelys.fr/auth/confirm?tenant=${studioSlug}`)}`
      : linkData.properties.action_link
  console.log("INVITE | magicLinkUrl:", magicLinkUrl)

  // Email brandé au nom du studio
  const coachFirstName = firstName || email.split("@")[0]

  const emailBody = {
    personalizations: [{
      to: [{ email, name: `${firstName || ""} ${lastName || ""}`.trim() || email }],
      subject: `Invitation à rejoindre ${studioName} ✦`,
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
              Bonjour ${coachFirstName} 👋
            </p>
            <p style="font-size:14px;color:#5C4A38;line-height:1.7;margin:0 0 20px;">
              Vous avez été invité(e) à rejoindre l'équipe de <strong>${studioName}</strong> en tant que coach.
              Cliquez sur le bouton ci-dessous pour accéder à votre espace — aucun mot de passe n'est nécessaire.
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
              Ce lien est valable <strong>7 jours</strong> et à usage unique.<br>
              Si vous n'attendiez pas cette invitation, vous pouvez ignorer cet email.
            </p>
          </td>
        </tr>

        <!-- Lien texte fallback -->
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

  // ── Fallback Supabase OTP si SendGrid non configuré ─────────────────────────
  if (!SENDGRID_API_KEY) {
    const { createClient } = await import("@supabase/supabase-js")
    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const redirectTo = `https://fydelys.fr/auth/confirm?tenant=${studioSlug}`
    const { error: otpErr } = await anonClient.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo }
    })
    if (otpErr) {
      console.error("OTP fallback error:", otpErr)
      return NextResponse.json({ error: "Erreur envoi email" }, { status: 500 })
    }
    return NextResponse.json({ ok: true, studioName, email, fallback: true })
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
    console.error("SendGrid invite error:", err)
    return NextResponse.json({ error: "Erreur envoi email" }, { status: 500 })
  }

  return NextResponse.json({ ok: true, studioName, email })
}