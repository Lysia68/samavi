import { createServerClient } from "@supabase/ssr"
import { createServiceSupabase } from "@/lib/supabase-server"
import { NextResponse, type NextRequest } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
  const { searchParams } = new URL(request.url)
  const code         = searchParams.get("code")
  const next         = searchParams.get("next") ?? "/dashboard"
  const isRegister   = searchParams.get("register") === "1"
  const registerSlug = searchParams.get("slug") || null
  const hostname     = request.headers.get("host") || ""

  const isApp        = hostname === "fydelys.fr" || hostname.includes("localhost")
  const tenantMatch  = hostname.match(/^([a-z0-9-]+)\.fydelys\.fr/)
  const tenantParam  = searchParams.get("tenant")
  const tenantSlug   = (tenantMatch ? tenantMatch[1] : null) ?? tenantParam ?? null
  const isTenant     = !!tenantSlug

  const tokenHash    = searchParams.get("token_hash")
  const type         = searchParams.get("type")

  const urlShort = request.url.replace(/token_hash=[^&]+/, "token_hash=***")
  console.log("[CB]", urlShort.slice(0, 200))
  console.log("[CB] reg:", isRegister, "slug:", registerSlug, "tenant:", tenantSlug, "hash:", !!tokenHash, "code:", !!code)

  // ── Cas 1 : ni code ni token_hash → page de confirmation ─────────────────
  if (!code && !tokenHash) {
    const confirmUrl = new URL("/auth/confirm", "https://fydelys.fr")
    if (tenantSlug) confirmUrl.searchParams.set("tenant", tenantSlug)
    if (isRegister)  confirmUrl.searchParams.set("register", "1")
    if (registerSlug) confirmUrl.searchParams.set("slug", registerSlug)
    return NextResponse.redirect(confirmUrl)
  }

  // ── Cas 2 : token_hash depuis fydelys.fr avec tenant= ─────────────────────
  if (tokenHash && isApp) {
    // Extraire register + slug depuis redirect_to si présent
    const redirectTo = searchParams.get("redirect_to") || ""
    let finalIsRegister = isRegister
    let finalSlug = registerSlug || tenantSlug
    if (redirectTo) {
      try {
        const rParams = new URL(redirectTo).searchParams
        if (rParams.get("register") === "1") finalIsRegister = true
        if (rParams.get("slug")) finalSlug = rParams.get("slug")
        if (rParams.get("tenant")) finalSlug = finalSlug || rParams.get("tenant")
      } catch {}
    }
    const confirmUrl = new URL("/auth/confirm", "https://fydelys.fr")
    confirmUrl.searchParams.set("token_hash", tokenHash)
    confirmUrl.searchParams.set("type", type || "magiclink")
    if (finalSlug)       confirmUrl.searchParams.set("tenant", finalSlug)
    if (finalIsRegister) confirmUrl.searchParams.set("register", "1")
    if (finalSlug)       confirmUrl.searchParams.set("slug", finalSlug)
    console.log("[auth/callback] → confirm register:", finalIsRegister, "slug:", finalSlug)
    return NextResponse.redirect(confirmUrl)
  }

  // ── Cas 3 : code ou token_hash sur le bon domaine (sous-domaine direct) ──
  const response = NextResponse.redirect(new URL("/dashboard", request.url))

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            const opts = { ...options, path: "/" }
            if (!hostname.includes("localhost")) opts.domain = ".fydelys.fr"
            response.cookies.set(name, value, opts)
          })
        },
      },
    }
  )

  let data: any = null
  let error: any = null

  if (tokenHash) {
    const res = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: (type as any) || "magiclink" })
    data = res.data; error = res.error
  } else if (code) {
    const res = await supabase.auth.exchangeCodeForSession(code)
    data = res.data; error = res.error
  }

  if (error || !data?.user) {
    console.error("auth callback failed:", error?.message || "no_user")
    const loginUrl = new URL("/login", "https://fydelys.fr")
    loginUrl.searchParams.set("error", "lien_expire")
    return NextResponse.redirect(loginUrl)
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.redirect(new URL("/?error=config", request.url))
  }

  const db = createServiceSupabase()
  const userId    = data.user.id
  const userEmail = data.user.email || ""

  // Profil existant → rediriger selon rôle
  const { data: existing } = await db
    .from("profiles").select("id,role,studio_id").eq("id", userId).single()

  // Si profil admin existant avec studio → rediriger directement (même si isRegister)
  if (existing && existing.role === "admin" && existing.studio_id) {
    const { data: studio } = await db.from("studios").select("slug").eq("id", existing.studio_id).single()
    if (studio?.slug) {
      response.headers.set("Location", `https://${studio.slug}.fydelys.fr/dashboard`)
      return response
    }
  }

  if (existing && !isRegister) {
    // Admin sans studio mais avec pending_registration → traiter comme inscription
    if (existing.role === "admin" && !existing.studio_id) {
      const { data: pendingForAdmin } = await db
        .from("pending_registrations").select("email").eq("email", userEmail).maybeSingle()
      if (pendingForAdmin) {
        console.log("[auth/callback] Admin sans studio + pending found → treating as register")
        // Ne pas return ici, laisser tomber dans le bloc isRegisterDetected plus bas
      } else {
        // Pas de pending → continuer normalement
        // (admin orphelin sans rien à créer)
      }
    }
    if (existing.role === "superadmin") {
      response.headers.set("Location", "https://fydelys.fr/dashboard")
      return response
    }
    if (existing.role === "admin") {
      let slugToUse: string | null = null
      if (existing.studio_id) {
        const { data: studio } = await db.from("studios").select("slug").eq("id", existing.studio_id).single()
        slugToUse = studio?.slug ?? null
      }
      if (!slugToUse) {
        const { data: studio } = await db.from("studios").select("id,slug").eq("email", userEmail).single()
        if (studio) {
          await db.from("profiles").update({ studio_id: studio.id }).eq("id", userId)
          slugToUse = studio.slug
        }
      }
      if (slugToUse) {
        response.headers.set("Location", `https://${slugToUse}.fydelys.fr/dashboard`)
        return response
      }
      // Admin sans studio et sans pending → on ne bloque pas, on continue vers le bloc pending ci-dessous
    }
    if (existing.role === "adherent" || existing.role === "coach") {
      let slugToUse: string | null = tenantSlug
      if (!slugToUse && existing.studio_id) {
        const { data: studio } = await db.from("studios").select("slug").eq("id", existing.studio_id).single()
        slugToUse = studio?.slug ?? null
      }
      if (existing.role === "adherent" && existing.studio_id) {
        const { data: existingM } = await db.from("members")
          .select("id").eq("studio_id", existing.studio_id).eq("email", userEmail).single()
        if (!existingM) {
          await db.from("members").insert({
            studio_id: existing.studio_id, auth_user_id: userId,
            first_name: data.user.user_metadata?.first_name || "Nouveau",
            last_name:  data.user.user_metadata?.last_name  || "Membre",
            email: userEmail, status: "nouveau", credits: 0, credits_total: 0,
            profile_complete: false,
          })
        } else {
          await db.from("members").update({ auth_user_id: userId })
            .eq("studio_id", existing.studio_id).eq("email", userEmail)
        }
      }
      if (slugToUse) {
        response.headers.set("Location", `https://${slugToUse}.fydelys.fr/dashboard`)
        return response
      }
    }
    // Ne PAS return ici si admin sans studio → laisser tomber dans le bloc pending_registrations
    if (!(existing.role === "admin" && !existing.studio_id)) {
      response.headers.set("Location", new URL(next, request.url).toString())
      return response
    }
    console.log("[auth/callback] Admin sans studio, checking pending_registrations...")
  }

  // SuperAdmin première connexion
  if (userEmail === "info@lysia.fr") {
    await db.from("profiles").insert({ id: userId, role: "superadmin", first_name: "Super", last_name: "Admin" })
    response.headers.set("Location", "https://fydelys.fr/dashboard")
    return response
  }

  // Adhérent ou Coach sur sous-domaine — PRIORITÉ sur tout le reste
  // Si on est sur un sous-domaine, c'est TOUJOURS un adhérent/coach, jamais un nouveau tenant
  if (isTenant) {
    console.log("[auth/callback] isTenant flow — slug:", tenantSlug, "email:", userEmail)
    const { data: studio } = await db
      .from("studios").select("id").eq("slug", tenantSlug).single()

    if (studio) {
      const { data: invite } = await db.from("invitations")
        .select("role").eq("email", userEmail).eq("studio_id", studio.id)
        .eq("used", false).single()

      const metaRole = data.user.user_metadata?.role
      const role = invite
        ? (invite.role as string)
        : (metaRole === "coach" ? "coach" : "adherent")

      console.log("[auth/callback] Creating profile role:", role, "for", userEmail)

      let firstName = data.user.user_metadata?.first_name || ""
      let lastName  = data.user.user_metadata?.last_name  || ""

      if (!firstName || !lastName) {
        const { data: memberRow } = await db.from("members")
          .select("first_name, last_name")
          .eq("studio_id", studio.id).eq("email", userEmail).single()
        if (memberRow) {
          firstName = memberRow.first_name || firstName
          lastName  = memberRow.last_name  || lastName
        }
      }

      const { error: profileErr } = await db.from("profiles").upsert({
        id: userId, role, studio_id: studio.id,
        first_name: firstName, last_name: lastName,
      }, { onConflict: "id" })
      if (profileErr) console.error("[auth/callback] profile upsert error:", profileErr)
      else console.log("[auth/callback] Profile created:", role, "studio_id:", studio.id)

      if (invite) {
        await db.from("invitations").update({ used: true })
          .eq("email", userEmail).eq("studio_id", studio.id)
      }

      if (role === "adherent") {
        const { data: existingM } = await db.from("members")
          .select("id").eq("studio_id", studio.id).eq("email", userEmail).single()
        if (!existingM) {
          const { error: mErr } = await db.from("members").insert({
            studio_id: studio.id, auth_user_id: userId,
            first_name: firstName || "Nouveau",
            last_name:  lastName  || "Membre",
            email: userEmail, status: "nouveau", credits: 0, credits_total: 0,
            profile_complete: false,
          })
          if (mErr) console.error("[auth/callback] member insert error:", mErr)
          else console.log("[auth/callback] Member created for", userEmail)
        } else {
          await db.from("members").update({ auth_user_id: userId })
            .eq("studio_id", studio.id).eq("email", userEmail)
          console.log("[auth/callback] Member updated auth_user_id for", userEmail)
        }
      }

      response.headers.set("Location", `https://${tenantSlug}.fydelys.fr/dashboard`)
      return response
    }

    console.error("[auth/callback] Studio not found for slug:", tenantSlug)
    response.headers.set("Location", `https://${tenantSlug}.fydelys.fr/login?error=studio_not_found`)
    return response
  }

  // Nouveau tenant via pending_registrations (fydelys.fr uniquement)
  const { data: pendingCheck } = await db
    .from("pending_registrations").select("email").eq("email", userEmail).maybeSingle()
  const isRegisterDetected = isRegister || !!pendingCheck

  if (isRegisterDetected) {
    const { data: pending } = await db
      .from("pending_registrations").select("data").eq("email", userEmail).maybeSingle()
    if (pending?.data) {
      const r = pending.data as any
      console.log("[auth/callback] pending data:", JSON.stringify({ firstName: r.firstName, lastName: r.lastName, slug: r.slug }))
      const { data: exists } = await db.from("studios").select("slug").eq("slug", r.slug).maybeSingle()
      if (exists) {
        response.headers.set("Location", "https://fydelys.fr/?error=slug_taken")
        return response
      }
      const trialEnd = new Date(); trialEnd.setDate(trialEnd.getDate() + 30)
      const { data: studio, error: studioErr } = await db.from("studios").insert({
        name: r.studioName, slug: r.slug, city: r.city,
        postal_code: r.zip || null, address: r.address || null,
        email: userEmail, phone: r.phone || null, status: "actif",
        billing_status: "trialing",
        trial_ends_at: trialEnd.toISOString().slice(0, 10),
        plan_started_at: new Date().toISOString(),
        plan_slug: r.plan?.toLowerCase() || "essentiel",
        payment_mode: "none",
      }).select().single()
      console.log("[auth/callback] Studio insert:", studioErr ? studioErr.message : studio?.id)
      if (studioErr) console.error("Studio insert error:", JSON.stringify(studioErr))
      if (studio) {
        const { error: profileErr } = await db.from("profiles").upsert({
          id: userId, role: "admin", studio_id: studio.id,
          first_name: r.firstName || "", last_name: r.lastName || "",
          is_coach: r.isCoach || false,
        }, { onConflict: "id" })
        if (profileErr) console.error("[auth/callback] Profile upsert error:", profileErr.message)
        else console.log("[auth/callback] Profile admin créé pour", userId)
        const { error: seedErr } = await db.rpc("seed_new_tenant", {
          p_studio_id: studio.id,
          p_type:      r.type || "Multi",
        })
        if (seedErr) console.error("[auth/callback] Seed error:", seedErr.message)
        else console.log("[auth/callback] Seed OK for", studio.slug)
        await db.from("pending_registrations").delete().eq("email", userEmail)
        response.headers.set("Location", `https://${studio.slug}.fydelys.fr/dashboard`)
        return response
      }
    }
    console.error("no_pending | email:", userEmail)
    response.headers.set("Location", "https://fydelys.fr/?error=no_pending")
    return response
  }



  if (tenantSlug) {
    response.headers.set("Location", `https://${tenantSlug}.fydelys.fr/dashboard`)
  } else {
    response.headers.set("Location", new URL(next, request.url).toString())
  }
  return response
  } catch (err: any) {
    console.error("[auth/callback] uncaught error:", err.message, err.stack?.slice(0,200))
    return NextResponse.redirect(new URL("/?error=callback_error", "https://fydelys.fr"))
  }
}