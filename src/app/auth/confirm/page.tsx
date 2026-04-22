"use client"
import { useEffect, useState } from "react"

export default function AuthConfirmPage() {
  const [status, setStatus] = useState("Connexion en cours…")
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    const hash      = window.location.hash
    const params    = new URLSearchParams(window.location.search)
    // Fallback : si pas de tenant en query, dériver du sous-domaine
    // (ex: yogalatestudio.fydelys.fr → "yogalatestudio")
    const subFromHost = (() => {
      const parts = window.location.hostname.split(".")
      if (parts.length >= 3 && parts[parts.length - 2] === "fydelys") return parts[0]
      return null
    })()
    const tenant    = params.get("tenant") || params.get("slug") || subFromHost
    const isRegister = params.get("register") === "1"
    const code      = params.get("code")
    const tokenHash = params.get("token_hash")
    const type      = params.get("type") || "magiclink"

    function redirectFinal(slug: string | null) {
      if (!slug) {
        window.location.href = "https://fydelys.fr/dashboard"
      } else {
        window.location.href = `https://${slug}.fydelys.fr/dashboard`
      }
    }

    async function callServerRoute(route: string, body: object) {
      const res = await fetch(route, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      })
      const result = await res.json()
      if (!res.ok || !result.ok) {
        setIsError(true)
        setStatus(`Erreur: ${result.error || "failed"}`)
        setTimeout(() => { window.location.href = "/login?error=lien_expire" }, 3000)
        return null
      }
      return result
    }

    // ── Flow 1 : ?token_hash= ────────────────────────────────────────────────
    if (tokenHash) {
      setStatus("Vérification token…")
      callServerRoute("/api/verify-token", { tokenHash, type, tenantSlug: tenant, isRegister, registerSlug: tenant })
        .then(result => {
          if (!result) return
          setStatus("Redirection…")
          redirectFinal(result.slug || tenant)
        })
      return
    }

    // ── Flow 2 : ?code= (PKCE) ───────────────────────────────────────────────
    if (code) {
      setStatus("Échange du code…")
      callServerRoute("/api/exchange-code", { code, tenantSlug: tenant })
        .then(result => {
          if (!result) return
          setStatus("Redirection…")
          const slug = result.slug || tenant
          redirectFinal(slug)
        })
      return
    }

    // ── Flow 3 : #access_token= (implicit) ──────────────────────────────────
    if (hash && hash.includes("access_token=")) {
      setStatus("Lecture du token…")
      const hp = new URLSearchParams(hash.replace("#", ""))
      const accessToken  = hp.get("access_token")
      const refreshToken = hp.get("refresh_token")
      if (!accessToken || !refreshToken) {
        setIsError(true)
        setStatus("Token manquant dans le hash")
        setTimeout(() => { window.location.href = "/login?error=lien_expire" }, 3000)
        return
      }
      callServerRoute("/api/verify-token", {
        accessToken, refreshToken, tenantSlug: tenant
      }).then(result => {
        if (!result) return
        setStatus("Redirection…")
        redirectFinal(result.slug || tenant)
      })
      return
    }

    // Aucun token
    setIsError(true)
    setStatus("Aucun token trouvé — lien expiré ou déjà utilisé")
    setTimeout(() => { window.location.href = "/login?error=lien_expire" }, 3000)
  }, [])

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#F4EFE8", fontFamily:"system-ui,sans-serif", padding:20 }}>
      <div style={{ textAlign:"center", maxWidth:500 }}>
        <div style={{ fontSize:32, marginBottom:16 }}>{isError ? "❌" : "✦"}</div>
        <div style={{ fontSize:16, color: isError ? "#C0392B" : "#5C4A38", fontWeight:600, marginBottom:8 }}>
          {status}
        </div>

        {isError && (
          <a href="/login" style={{ display:"inline-block", marginTop:20, fontSize:13, color:"#9A6030", textDecoration:"underline" }}>
            Retour à la connexion
          </a>
        )}
      </div>
    </div>
  )
}