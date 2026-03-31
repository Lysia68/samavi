import { createServerClient } from "@supabase/ssr"
import { createServiceSupabase } from "@/lib/supabase-server"
import { NextResponse, type NextRequest } from "next/server"

export const dynamic = "force-dynamic"

const DISC_DEFAULTS: Record<string, { name: string; icon: string }[]> = {
  Yoga:       [{ name: "Yoga Vinyasa", icon: "🧘" }, { name: "Yin Yoga", icon: "🌙" }, { name: "Méditation", icon: "☯" }],
  Pilates:    [{ name: "Pilates Mat", icon: "⚡" }, { name: "Pilates Réformateur", icon: "🏋" }, { name: "Stretching", icon: "🤸" }],
  Danse:      [{ name: "Danse Contemporaine", icon: "💃" }, { name: "Hip-Hop", icon: "🎵" }, { name: "Classique", icon: "🩰" }],
  Fitness:    [{ name: "HIIT", icon: "🔥" }, { name: "Cardio", icon: "❤️" }, { name: "Musculation", icon: "💪" }],
  Méditation: [{ name: "Méditation", icon: "☯" }, { name: "Yin Yoga", icon: "🌙" }, { name: "Yoga Vinyasa", icon: "🧘" }],
  Multi:      [{ name: "Yoga Vinyasa", icon: "🧘" }, { name: "Pilates Mat", icon: "⚡" }, { name: "Méditation", icon: "☯" }],
}

const DEFAULT_SUBSCRIPTIONS = [
  { name: "Séance à l'unité",  price: 25,  period: "séance",    description: "Idéal pour découvrir",                popular: false, color: "#6A8FAE" },
  { name: "Carnet 10 séances", price: 120, period: "carnet",    description: "Valable 6 mois, toutes disciplines",  popular: false, color: "#6B9E7A" },
  { name: "Mensuel illimité",  price: 89,  period: "mois",      description: "Accès illimité à toutes les séances", popular: true,  color: "#C4956A" },
  { name: "Trimestriel",       price: 240, period: "trimestre", description: "3 mois d'accès illimité, -10%",       popular: false, color: "#AE7A7A" },
]

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
  let userEmail = data.user.email || ""

  // Fallback : si l'email n'est pas dans la session, le récupérer depuis auth.users
  if (!userEmail) {
    const { data: authUser } = await db.auth.admin.getUserById(userId)
    userEmail = authUser?.user?.email || ""
    console.log("[auth/callback] Email fallback from admin API:", userEmail)
  }

  console.log("[auth/callback] userId:", userId, "userEmail:", userEmail, "isRegister:", isRegister, "registerSlug:", registerSlug)

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
      // Bloquer le login si membre suspendu ou supprimé
      const { data: memberCheck } = await db.from("members")
        .select("status, deleted_at").eq("studio_id", studio.id).eq("email", userEmail).maybeSingle()
      if (memberCheck?.deleted_at) {
        console.log("[auth/callback] Member deleted — blocking login for", userEmail)
        await supabase.auth.signOut()
        const blockedRes = NextResponse.redirect(new URL(`/login?error=compte_supprime`, `https://${tenantSlug}.fydelys.fr`))
        blockedRes.cookies.delete({ name: "sb-access-token", path: "/", domain: ".fydelys.fr" })
        blockedRes.cookies.delete({ name: "sb-refresh-token", path: "/", domain: ".fydelys.fr" })
        // Supprimer tous les cookies supabase
        request.cookies.getAll().forEach(c => {
          if (c.name.startsWith("sb-")) blockedRes.cookies.delete({ name: c.name, path: "/", domain: ".fydelys.fr" })
        })
        return blockedRes
      }
      if (memberCheck?.status === "suspendu") {
        console.log("[auth/callback] Member suspended — blocking login for", userEmail)
        await supabase.auth.signOut()
        const blockedRes = NextResponse.redirect(new URL(`/login?error=compte_suspendu`, `https://${tenantSlug}.fydelys.fr`))
        blockedRes.cookies.delete({ name: "sb-access-token", path: "/", domain: ".fydelys.fr" })
        blockedRes.cookies.delete({ name: "sb-refresh-token", path: "/", domain: ".fydelys.fr" })
        request.cookies.getAll().forEach(c => {
          if (c.name.startsWith("sb-")) blockedRes.cookies.delete({ name: c.name, path: "/", domain: ".fydelys.fr" })
        })
        return blockedRes
      }

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

      // Mettre à jour le display_name du user auth
      const displayName = [firstName, lastName].filter(Boolean).join(" ").trim()
      if (displayName) {
        await db.auth.admin.updateUserById(userId, { user_metadata: { display_name: displayName, first_name: firstName, last_name: lastName } })
      }

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
  console.log("[auth/callback] Checking pending_registrations for email:", JSON.stringify(userEmail), "length:", userEmail.length)
  const { data: pendingCheck, error: pendingError } = await db
    .from("pending_registrations").select("email").eq("email", userEmail).maybeSingle()
  console.log("[auth/callback] pendingCheck:", JSON.stringify(pendingCheck), "error:", pendingError?.message || "none")
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

        // Créer les disciplines choisies lors de l'onboarding (ou défaut par type)
        const discs = (r.disciplines && r.disciplines.length > 0)
          ? r.disciplines
          : (DISC_DEFAULTS[r.type] || DISC_DEFAULTS.Multi)
        for (const d of discs) {
          const { error: discErr } = await db.from("disciplines").insert({
            studio_id: studio.id, name: d.name, icon: d.icon || "🧘",
          })
          if (discErr) console.error("[auth/callback] Discipline insert error:", discErr.message)
        }
        console.log("[auth/callback] Disciplines créées:", discs.length, "pour", studio.slug)

        // Abonnements standard
        const { error: subErr } = await db.from("subscriptions").insert(
          DEFAULT_SUBSCRIPTIONS.map(s => ({ studio_id: studio.id, ...s }))
        )
        if (subErr) console.error("[auth/callback] Subscriptions insert error:", subErr.message)
        else console.log("[auth/callback] Subscriptions créées pour", studio.slug)

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