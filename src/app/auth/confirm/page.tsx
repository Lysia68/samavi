"use client"
import { useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"

export default function AuthConfirmPage() {
  useEffect(() => {
    const hash   = window.location.hash
    const params = new URLSearchParams(window.location.search)
    const tenant     = params.get("tenant")
    const tokenHash  = params.get("token_hash")
    const type       = params.get("type") || "magiclink"

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    async function handleSession(user: any) {
      const tenantSlug = tenant || user.app_metadata?.studio_slug
      if (!tenantSlug) {
        window.location.href = "https://fydelys.fr/dashboard"
        return
      }
      const res = await fetch("/api/create-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          userMetadata: user.user_metadata,
          tenantSlug,
        }),
      })
      const result = await res.json()
      const slug = result.slug || tenantSlug
      window.location.href = `https://${slug}.fydelys.fr/dashboard`
    }

    // ── Flow 1 : token_hash dans les query params (renvoyé par callback serveur) ──
    if (tokenHash) {
      supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as any })
        .then(async ({ data, error }) => {
          if (error || !data?.user) {
            window.location.href = "/login?error=lien_expire"
            return
          }
          await handleSession(data.user)
        })
      return
    }

    // ── Flow 2 : access_token dans le #hash (ancien flow implicit) ──────────
    if (!hash || !hash.includes("access_token=")) {
      window.location.href = "/login?error=lien_expire"
      return
    }

    const hp = new URLSearchParams(hash.replace("#", ""))
    const accessToken  = hp.get("access_token")
    const refreshToken = hp.get("refresh_token")

    if (!accessToken || !refreshToken) {
      window.location.href = "/login?error=lien_expire"
      return
    }

    supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(async ({ data, error }) => {
        if (error || !data?.user) {
          window.location.href = "/login?error=lien_expire"
          return
        }
        await handleSession(data.user)
      })
  }, [])

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#F4EFE8", fontFamily:"system-ui,sans-serif" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:32, marginBottom:16 }}>✦</div>
        <div style={{ fontSize:16, color:"#5C4A38", fontWeight:600 }}>Connexion en cours…</div>
        <div style={{ fontSize:13, color:"#B0A090", marginTop:8 }}>Vous allez être redirigé automatiquement.</div>
      </div>
    </div>
  )
}