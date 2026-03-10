import { createServerSupabase, createServiceSupabase } from "@/lib/supabase-server"
import { NextResponse, type NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code       = searchParams.get("code")
  const next       = searchParams.get("next") ?? "/dashboard"
  const isRegister = searchParams.get("register") === "1"
  const hostname   = request.headers.get("host") || ""

  const isApp       = hostname === "fydelys.fr" || hostname.includes("localhost")
  const tenantMatch = hostname.match(/^([a-z0-9-]+)\.fydelys\.fr/)
  const tenantSlug  = tenantMatch ? tenantMatch[1] : null
  const isTenant    = !!tenantSlug && !isApp

  const tokenHash  = searchParams.get("token_hash")
  const type       = searchParams.get("type")
  // Implicit flow : Supabase peut passer access_token en query param
  const accessToken  = searchParams.get("access_token")
  const refreshToken = searchParams.get("refresh_token")

  if (!code && !tokenHash && !accessToken) return NextResponse.redirect(new URL("/", request.url))

  // anon client pour échanger le code/token → session cookie
  const supabase = await createServerSupabase()
  let data: any, error: any

  if (accessToken) {
    // Flux implicit : access_token passé en query param (pas de PKCE)
    const res = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken || "" })
    data = res.data; error = res.error
    if (error) console.error("setSession error:", JSON.stringify(error))
  } else if (tokenHash) {
    // Flux email confirmation (token_hash)
    const res = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: (type as any) || "signup" })
    data = res.data; error = res.error
  } else if (code) {
    // Flux magic link PKCE
    const res = await supabase.auth.exchangeCodeForSession(code)
    data = res.data; error = res.error
    if (error) {
      console.error("exchangeCodeForSession error:", JSON.stringify(error), "| code length:", code.length, "| hostname:", hostname)
    }
  }

  if (error || !data?.user) {
    const reason = error?.message || "no_user"
    console.error("auth callback failed:", reason, "| code:", !!code, "| tokenHash:", !!tokenHash)
    
    // Si erreur PKCE (code verifier manquant), rediriger vers login avec message
    if (reason.includes("code") || reason.includes("verif") || reason.includes("pkce")) {
      const loginUrl = new URL("/login", "https://fydelys.fr")
      loginUrl.searchParams.set("error", "lien_expire")
      return NextResponse.redirect(loginUrl)
    }
    
    // Dernier recours : vérifier si l'user est déjà connecté (code déjà utilisé)
    const { data: { user: existingUser } } = await supabase.auth.getUser()
    if (existingUser) {
      data = { user: existingUser }
      error = null
    } else {
      const loginUrl = new URL("/login", "https://fydelys.fr")
      loginUrl.searchParams.set("error", reason.slice(0, 100))
      return NextResponse.redirect(loginUrl)
    }
  }

  // service_role pour toutes les opérations DB (bypass RLS sans policy SELECT)
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("SUPABASE_SERVICE_ROLE_KEY manquante — callback ne peut pas fonctionner")
    return NextResponse.redirect(new URL("/?error=config", request.url))
  }
  const db = createServiceSupabase()

  const userId    = data.user.id
  const userEmail = data.user.email || ""

  // ── Profil existant → rediriger selon rôle ───────────────────────────────
  const { data: existing } = await db
    .from("profiles").select("id,role,studio_id").eq("id", userId).single()

  if (existing) {
    if (existing.role === "superadmin") {
      return NextResponse.redirect(new URL("https://fydelys.fr/dashboard"))
    }
    if (existing.role === "admin") {
      let slugToUse: string | null = null
      if (existing.studio_id) {
        const { data: studio } = await db
          .from("studios").select("slug").eq("id", existing.studio_id).single()
        slugToUse = studio?.slug ?? null
      }
      if (!slugToUse) {
        const { data: studio } = await db
          .from("studios").select("id,slug").eq("email", userEmail).single()
        if (studio) {
          await db.from("profiles").update({ studio_id: studio.id }).eq("id", userId)
          slugToUse = studio.slug
        }
      }
      if (slugToUse) {
        return NextResponse.redirect(new URL(`https://${slugToUse}.fydelys.fr/dashboard`))
      }
    }
    return NextResponse.redirect(new URL(next, request.url))
  }

  // ── SuperAdmin (première connexion) ──────────────────────────────────────
  if (userEmail === "info@lysia.fr") {
    await db.from("profiles").insert({ id:userId, role:"superadmin", first_name:"Super", last_name:"Admin" })
    return NextResponse.redirect(new URL("https://fydelys.fr/dashboard"))
  }

  // ── Nouveau tenant : détecter via pending_registrations ──────────────────
  // register=1 peut être perdu par Supabase → on vérifie directement en DB
  const { data: pendingCheck } = await db
    .from("pending_registrations").select("email").eq("email", userEmail).single()
  const isRegisterDetected = isRegister || !!pendingCheck

  if (isRegisterDetected) {
    const { data: pending } = await db
      .from("pending_registrations").select("data").eq("email", userEmail).single()

    if (pending?.data) {
      const r = pending.data as any

      const { data: exists } = await db
        .from("studios").select("slug").eq("slug", r.slug).single()
      if (exists) {
        return NextResponse.redirect(new URL("https://fydelys.fr/?error=slug_taken"))
      }

      const { data: studio, error: studioErr } = await db.from("studios").insert({
        name:        r.studioName,
        slug:        r.slug,
        city:        r.city,
        postal_code: r.zip || null,
        address:     r.address || null,
        email:       userEmail,
        phone:       r.phone || null,
        status:      "actif",
      }).select().single()

      if (studioErr) console.error("Studio insert error:", JSON.stringify(studioErr))

      if (studio) {
        await db.from("profiles").insert({
          id:         userId,
          role:       "admin",
          studio_id:  studio.id,
          first_name: r.firstName || "",
          last_name:  r.lastName  || "",
          is_coach:   r.isCoach   || false,
        })
        const { error: seedErr } = await db.rpc("seed_new_tenant", {
          p_studio_id: studio.id,
          p_type:      r.type || "Multi",
        })
        if (seedErr) console.error("Seed error:", JSON.stringify(seedErr))

        await db.from("pending_registrations").delete().eq("email", userEmail)
        return NextResponse.redirect(new URL(`https://${studio.slug}.fydelys.fr/dashboard`))
      }
    }

    // Log détaillé pour debug
    console.error("no_pending | email:", userEmail, "| hostname:", hostname, "| isRegister param:", isRegister, "| pendingCheck:", !!pendingCheck)
    // Tentative de récupération : chercher sans tenir compte de la casse
    const { data: pendingAll } = await db
      .from("pending_registrations").select("email,data").limit(20)
    const pendingMatch = pendingAll?.find(p => p.email?.toLowerCase() === userEmail.toLowerCase())
    if (pendingMatch?.data) {
      console.error("Found pending via case-insensitive match:", pendingMatch.email)
      const r = pendingMatch.data as any
      const { data: studio2 } = await db.from("studios").insert({
        name: r.studioName, slug: r.slug, city: r.city,
        postal_code: r.zip || null, address: r.address || null,
        email: pendingMatch.email, phone: r.phone || null, status: "actif",
      }).select().single()
      if (studio2) {
        await db.from("profiles").insert({
          id: userId, role: "admin", studio_id: studio2.id,
          first_name: r.firstName || "", last_name: r.lastName || "",
          is_coach: r.isCoach || false,
        })
        await db.rpc("seed_new_tenant", { p_studio_id: studio2.id, p_type: r.type || "Multi" })
        await db.from("pending_registrations").delete().eq("email", pendingMatch.email)
        return NextResponse.redirect(new URL(`https://${studio2.slug}.fydelys.fr/dashboard`))
      }
    }
    return NextResponse.redirect(new URL("https://fydelys.fr/?error=no_pending&email=" + encodeURIComponent(userEmail)))
  }

  // ── Adhérent ou Coach sur sous-domaine ───────────────────────────────────
  if (isTenant) {
    const { data: studio } = await db
      .from("studios").select("id").eq("slug", tenantSlug).single()

    if (studio) {
      const { data: invite } = await db.from("invitations")
        .select("role").eq("email", userEmail).eq("studio_id", studio.id)
        .eq("used", false).gt("expires_at", new Date().toISOString()).single()

      const role = invite ? (invite.role as string) : "adherent"

      await db.from("profiles").insert({
        id:         userId,
        role,
        studio_id:  studio.id,
        first_name: data.user.user_metadata?.first_name || "",
        last_name:  data.user.user_metadata?.last_name  || "",
      })

      if (invite) {
        await db.from("invitations").update({ used:true })
          .eq("email", userEmail).eq("studio_id", studio.id)
      }

      if (role === "adherent") {
        const { data: existingM } = await db.from("members")
          .select("id").eq("studio_id", studio.id).eq("email", userEmail).single()
        if (!existingM) {
          await db.from("members").insert({
            studio_id:    studio.id,
            auth_user_id: userId,
            first_name:   data.user.user_metadata?.first_name || "Nouveau",
            last_name:    data.user.user_metadata?.last_name  || "Membre",
            email:        userEmail,
            status:       "nouveau",
            credits:      0,
            credits_total: 0,
          })
        } else {
          await db.from("members").update({ auth_user_id: userId })
            .eq("studio_id", studio.id).eq("email", userEmail)
        }
      }
    }
  }

  return NextResponse.redirect(new URL(next, request.url))
}
