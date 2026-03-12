import { createServerClient } from "@supabase/ssr"
import { createServiceSupabase } from "@/lib/supabase-server"
import { NextResponse, type NextRequest } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code      = searchParams.get("code")
  const next      = searchParams.get("next") ?? "/dashboard"
  const isRegister = searchParams.get("register") === "1"
  const hostname  = request.headers.get("host") || ""

  const isApp      = hostname === "fydelys.fr" || hostname.includes("localhost")
  const tenantMatch = hostname.match(/^([a-z0-9-]+)\.fydelys\.fr/)
  // tenantParam DOIT être déclaré avant tenantSlug qui l'utilise
  const tenantParam = searchParams.get("tenant")
  // tenantSlug peut venir du hostname (sous-domaine) OU du param ?tenant= (callback sur fydelys.fr)
  const tenantSlug = (tenantMatch ? tenantMatch[1] : null) ?? tenantParam ?? null
  const isTenant   = !!tenantSlug

  const tokenHash  = searchParams.get("token_hash")
  const type       = searchParams.get("type")

  console.log("CALLBACK | url:", request.url, "| tenant:", tenantParam, "| tokenHash:", !!tokenHash, "| code:", !!code)

  // Supabase peut rediriger avec #access_token dans le hash (géré côté client)
  // ou avec ?code= ou ?token_hash= (géré ici)
  if (!code && !tokenHash) {
    // Pas de token dans l'URL — Supabase a peut-être mis le token dans le hash
    // On laisse le client gérer via la page /auth/confirm
    const confirmUrl = new URL("/auth/confirm", "https://fydelys.fr")
    if (tenantSlug) confirmUrl.searchParams.set("tenant", tenantSlug)
    return NextResponse.redirect(confirmUrl)
  }

  // ── Construire la réponse de redirection temporaire (sera remplacée) ──────
  // On a besoin d'une NextResponse pour y écrire les cookies manuellement
  const response = NextResponse.redirect(new URL("/dashboard", request.url))

  // ── Client Supabase qui écrit les cookies sur la response (pas cookieStore) ─
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            const opts = { ...options, path: "/" }
            // Cookie sur .fydelys.fr pour partage cross-subdomain
            if (!hostname.includes("localhost")) {
              opts.domain = ".fydelys.fr"
            }
            response.cookies.set(name, value, opts)
          })
        },
      },
    }
  )

  let data: any = null
  let error: any = null

  if (tokenHash) {
    const res = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: (type as any) || "magiclink",
    })
    data = res.data
    error = res.error
  } else if (code) {
    const res = await supabase.auth.exchangeCodeForSession(code)
    data = res.data
    error = res.error
  }

  if (error || !data?.user) {
    console.error("auth callback failed:", error?.message || "no_user", "| tokenHash:", !!tokenHash, "| code:", !!code)
    const loginUrl = new URL("/login", "https://fydelys.fr")
    loginUrl.searchParams.set("error", "lien_expire")
    return NextResponse.redirect(loginUrl)
  }

  // ── Session établie — logique DB ─────────────────────────────────────────
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.redirect(new URL("/?error=config", request.url))
  }

  const db = createServiceSupabase()
  const userId    = data.user.id
  const userEmail = data.user.email || ""

  // Profil existant → rediriger selon rôle
  const { data: existing } = await db
    .from("profiles").select("id,role,studio_id").eq("id", userId).single()

  if (existing) {
    if (existing.role === "superadmin") {
      response.headers.set("Location", "https://fydelys.fr/dashboard")
      return response
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
        response.headers.set("Location", `https://${slugToUse}.fydelys.fr/dashboard`)
        return response
      }
    }
    // Adhérent ou Coach existant → s'assurer que le membre existe + rediriger
    if (existing.role === "adherent" || existing.role === "coach") {
      let slugToUse: string | null = tenantSlug
      if (!slugToUse && existing.studio_id) {
        const { data: studio } = await db
          .from("studios").select("slug").eq("id", existing.studio_id).single()
        slugToUse = studio?.slug ?? null
      }
      // Créer le membre si manquant (cas reconnexion sans fiche membre)
      if (existing.role === "adherent" && existing.studio_id) {
        const { data: existingM } = await db.from("members")
          .select("id").eq("studio_id", existing.studio_id).eq("email", userEmail).single()
        if (!existingM) {
          await db.from("members").insert({
            studio_id: existing.studio_id, auth_user_id: userId,
            first_name: data.user.user_metadata?.first_name || "Nouveau",
            last_name:  data.user.user_metadata?.last_name  || "Membre",
            email: userEmail, status: "nouveau", credits: 0, credits_total: 0,
          })
        } else if (!existingM) {
          await db.from("members").update({ auth_user_id: userId })
            .eq("studio_id", existing.studio_id).eq("email", userEmail)
        }
      }
      if (slugToUse) {
        response.headers.set("Location", `https://${slugToUse}.fydelys.fr/dashboard`)
        return response
      }
    }
    response.headers.set("Location", new URL(next, request.url).toString())
    return response
  }

  // SuperAdmin première connexion
  if (userEmail === "info@lysia.fr") {
    await db.from("profiles").insert({ id: userId, role: "superadmin", first_name: "Super", last_name: "Admin" })
    response.headers.set("Location", "https://fydelys.fr/dashboard")
    return response
  }

  // Nouveau tenant via pending_registrations
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
        response.headers.set("Location", "https://fydelys.fr/?error=slug_taken")
        return response
      }

      const { data: studio, error: studioErr } = await db.from("studios").insert({
        name: r.studioName, slug: r.slug, city: r.city,
        postal_code: r.zip || null, address: r.address || null,
        email: userEmail, phone: r.phone || null, status: "actif",
      }).select().single()

      if (studioErr) console.error("Studio insert error:", JSON.stringify(studioErr))

      if (studio) {
        await db.from("profiles").insert({
          id: userId, role: "admin", studio_id: studio.id,
          first_name: r.firstName || "", last_name: r.lastName || "",
          is_coach: r.isCoach || false,
        })
        await db.rpc("seed_new_tenant", { p_studio_id: studio.id, p_type: r.type || "Multi" })
        await db.from("pending_registrations").delete().eq("email", userEmail)
        response.headers.set("Location", `https://${studio.slug}.fydelys.fr/dashboard`)
        return response
      }
    }

    console.error("no_pending | email:", userEmail)
    response.headers.set("Location", "https://fydelys.fr/?error=no_pending")
    return response
  }

  // Adhérent ou Coach sur sous-domaine
  if (isTenant) {
    const { data: studio } = await db
      .from("studios").select("id").eq("slug", tenantSlug).single()

    if (studio) {
      const { data: invite } = await db.from("invitations")
        .select("role").eq("email", userEmail).eq("studio_id", studio.id)
        .eq("used", false).single()

      // Fallback: lire le rôle depuis user_metadata si pas d'invitation en base
      const metaRole = data.user.user_metadata?.role
      const role = invite
        ? (invite.role as string)
        : (metaRole === "coach" ? "coach" : "adherent")

      const { error: profileErr } = await db.from("profiles").upsert({
        id: userId, role, studio_id: studio.id,
        first_name: data.user.user_metadata?.first_name || "",
        last_name:  data.user.user_metadata?.last_name  || "",
      }, { onConflict: "id" })
      if (profileErr) console.error("profile upsert error:", profileErr)

      if (invite) {
        await db.from("invitations").update({ used: true })
          .eq("email", userEmail).eq("studio_id", studio.id)
      }

      if (role === "adherent") {
        const { data: existingM } = await db.from("members")
          .select("id").eq("studio_id", studio.id).eq("email", userEmail).single()
        if (!existingM) {
          await db.from("members").insert({
            studio_id: studio.id, auth_user_id: userId,
            first_name: data.user.user_metadata?.first_name || "Nouveau",
            last_name:  data.user.user_metadata?.last_name  || "Membre",
            email: userEmail, status: "nouveau", credits: 0, credits_total: 0,
          })
        } else {
          await db.from("members").update({ auth_user_id: userId })
            .eq("studio_id", studio.id).eq("email", userEmail)
        }
      }
    }
  }

  // Si on connaît le tenant, rediriger vers son sous-domaine
  if (tenantSlug) {
    response.headers.set("Location", `https://${tenantSlug}.fydelys.fr/dashboard`)
  } else {
    response.headers.set("Location", new URL(next, request.url).toString())
  }
  return response
}