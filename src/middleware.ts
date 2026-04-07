import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || ""
  const { pathname, searchParams } = request.nextUrl

  // Geo-blocking : bloquer les IPs hors France (sauf localhost et assets)
  const country = request.headers.get("x-vercel-ip-country") || ""
  const ALLOWED_COUNTRIES = ["FR", "BE", "CH", "LU", "MC", "DE", ""] // France + voisins + vide (localhost/dev)
  if (country && !ALLOWED_COUNTRIES.includes(country) && !pathname.startsWith("/_next") && !pathname.startsWith("/api/stripe")) {
    return new NextResponse("Accès restreint à la France et pays limitrophes.", { status: 403 })
  }

  // ── Détecter le contexte domaine ─────────────────────────────────────────────
  const isApp      = hostname === "fydelys.fr" || hostname === "fydelys.fr:3000" || hostname === "localhost" || hostname === "localhost:3000"
  const isLocal    = hostname === "localhost:3000" || hostname === "localhost"
  const tenantSlug = (() => {
    if (isApp || isLocal) return null
    const match = hostname.match(/^([a-z0-9-]+)\.fydelys\.fr/)
    return match ? match[1] : null
  })()
  const isTenant = !!tenantSlug

  // Injecter le contexte dans les headers
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-tenant-slug",  tenantSlug || "")
  requestHeaders.set("x-is-app",       isApp ? "1" : "0")
  requestHeaders.set("x-is-tenant",    isTenant ? "1" : "0")
  requestHeaders.set("x-hostname",     hostname)

  let supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } })
  const setHeaders = (res: NextResponse) => {
    res.headers.set("x-tenant-slug",  tenantSlug || "")
    res.headers.set("x-is-app",       isApp ? "1" : "0")
    res.headers.set("x-is-tenant",    isTenant ? "1" : "0")
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } })
          setHeaders(supabaseResponse)
          cookiesToSet.forEach(({ name, value, options }) => {
            // Partager les cookies sur tous les sous-domaines .fydelys.fr
            const cookieOptions = { ...options }
            if (!hostname.includes("localhost")) {
              cookieOptions.domain = ".fydelys.fr"
            }
            supabaseResponse.cookies.set(name, value, cookieOptions)
          })
        },
      },
    }
  )

  // ── Intercepter ?code= sur la racine (Supabase confirmation email) ─────────
  // Supabase peut envoyer le code sur / au lieu de /auth/callback
  const codeParam = searchParams.get("code")
  const tokenHashParam = searchParams.get("token_hash")
  if ((codeParam || tokenHashParam) && (pathname === "/" || pathname === "" || pathname === "/login")) {
    const callbackUrl = new URL("/auth/callback", request.url)
    if (codeParam) callbackUrl.searchParams.set("code", codeParam)
    if (tokenHashParam) callbackUrl.searchParams.set("token_hash", tokenHashParam)
    const typeParam = searchParams.get("type")
    if (typeParam) callbackUrl.searchParams.set("type", typeParam)
    const registerParam = searchParams.get("register")
    if (registerParam) callbackUrl.searchParams.set("register", registerParam)
    const slugParam = searchParams.get("slug")
    if (slugParam) callbackUrl.searchParams.set("slug", slugParam)
    const tenantParam = searchParams.get("tenant")
    if (tenantParam) callbackUrl.searchParams.set("tenant", tenantParam)
    return NextResponse.redirect(callbackUrl)
  }

  // Helper pour créer un redirect qui préserve les cookies rafraîchis
  const safeRedirect = (url: string | URL) => {
    const res = NextResponse.redirect(url instanceof URL ? url : new URL(url, request.url))
    supabaseResponse.cookies.getAll().forEach(c => res.cookies.set(c.name, c.value))
    return res
  }

  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    // Refresh token invalide / expiré — on traite comme non-authentifié
  }
  const isProtected = pathname.startsWith("/dashboard") || pathname.startsWith("/planning") ||
                      pathname.startsWith("/members") || pathname.startsWith("/subscriptions") ||
                      pathname.startsWith("/payments") || pathname.startsWith("/disciplines") ||
                      pathname.startsWith("/settings") || pathname.startsWith("/aide")

  // Auth guard
  if (!user && isProtected) {
    // Sur fydelys.fr → redirect /login, sur tenant → redirect /
    const loginUrl = isApp ? "/login" : "/"
    return safeRedirect(new URL(loginUrl, request.url))
  }

  // SuperAdmin sur domaine tenant → rediriger vers fydelys.fr
  if (user && isTenant && isProtected) {
    const { data: profile } = await supabase
      .from("profiles").select("role, studio_id").eq("id", user.id).single()
    if (profile?.role === "superadmin") {
      return safeRedirect(new URL(`https://fydelys.fr/dashboard`, request.url))
    }

    // Bloquer les adhérents suspendus ou supprimés
    if (profile?.role === "adherent" && profile.studio_id) {
      const { data: memberCheck } = await supabase.from("members")
        .select("status, deleted_at").eq("studio_id", profile.studio_id).eq("auth_user_id", user.id).maybeSingle()
      if (memberCheck?.deleted_at || memberCheck?.status === "suspendu") {
        const errType = memberCheck?.deleted_at ? "compte_supprime" : "compte_suspendu"
        await supabase.auth.signOut()
        return safeRedirect(new URL(`/login?error=${errType}`, request.url))
      }
    }

    // ── Billing guard : vérifier l'accès du studio ──────────────────────────
    // (uniquement pour les admins sur pages protégées, hors /billing lui-même)
    if (profile?.role === "admin" && !pathname.startsWith("/billing")) {
      const { data: studio } = await supabase
        .from("studios")
        .select("billing_status, trial_ends_at")
        .eq("id", profile.studio_id)
        .single()

      if (studio) {
        const { billing_status, trial_ends_at } = studio
        const trialExpired = billing_status === "trialing" &&
          trial_ends_at && new Date(trial_ends_at) < new Date()
        const isBlocked = ["canceled","suspended"].includes(billing_status) || trialExpired

        if (isBlocked) {
          const billingUrl = new URL("/billing", request.url)
          billingUrl.searchParams.set("reason", trialExpired ? "trial_expired" : billing_status)
          return safeRedirect(billingUrl)
        }
      }
    }
  }

  // Sur fydelys.fr : / = landing publique, /login = auth
  // Sur slug.fydelys.fr : / redirige vers /dashboard si connecté
  // Sauf si ?preview=1 (aperçu site vitrine depuis Settings)
  const isPreview = searchParams.get("preview") === "1"
  if (user && pathname === "/" && isTenant && !isPreview) {
    return safeRedirect(new URL("/dashboard", request.url))
  }
  // Sur fydelys.fr : si connecté et va sur /login → redirect /dashboard
  // Sauf si ?force=1 (clic volontaire sur "Connexion" depuis la landing)
  const forceLogin = searchParams.get("force") === "1"
  if (user && pathname === "/login" && isApp && !forceLogin) {
    const { data: profile } = await supabase
      .from("profiles").select("role, studio_id").eq("id", user.id).single()
    if (profile?.role === "superadmin") {
      return safeRedirect(new URL("/dashboard", request.url))
    }
    if (profile?.role === "admin" && profile.studio_id) {
      const { data: studio } = await supabase
        .from("studios").select("slug").eq("id", profile.studio_id).single()
      if (studio?.slug) {
        return safeRedirect(new URL("https://" + studio.slug + ".fydelys.fr/dashboard"))
      }
    }
  }

  // Sur fydelys.fr /dashboard : admin doit être redirigé vers son sous-domaine
  if (user && pathname === "/dashboard" && isApp) {
    const { data: profile } = await supabase
      .from("profiles").select("role, studio_id").eq("id", user.id).single()
    if (profile?.role === "admin" && profile.studio_id) {
      const { data: studio } = await supabase
        .from("studios").select("slug").eq("id", profile.studio_id).single()
      if (studio?.slug) {
        return safeRedirect(new URL("https://" + studio.slug + ".fydelys.fr/dashboard"))
      }
    }
    // superadmin reste sur fydelys.fr/dashboard → ok
  }

  setHeaders(supabaseResponse)
  return supabaseResponse
}

export const config = {
  matcher: [
    // Exclure : fichiers statiques, images, ET /auth/callback (géré par la route elle-même)
    "/((?!_next/static|_next/image|favicon.ico|auth/callback|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}