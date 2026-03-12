"use client"
import { useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"

export default function AuthConfirmPage() {
  useEffect(() => {
    const hash   = window.location.hash
    const params = new URLSearchParams(window.location.search)
    const tenant = params.get("tenant")

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

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(async ({ data, error }) => {
        if (error || !data?.user) {
          window.location.href = "/login?error=lien_expire"
          return
        }

        const user = data.user
        const tenantSlug = tenant || user.app_metadata?.studio_slug

        // Vérifier si profil existe
        const { data: profile } = await supabase
          .from("profiles").select("role, studio_id").eq("id", user.id).single()

        if (!profile && tenantSlug) {
          // Créer le profil coach/adhérent
          const { data: studio } = await supabase
            .from("studios").select("id").eq("slug", tenantSlug).single()

          if (studio) {
            const { data: invite } = await supabase
              .from("invitations").select("role")
              .eq("email", user.email!).eq("studio_id", studio.id)
              .eq("used", false).single()

            const role = invite?.role || user.user_metadata?.role || "adherent"

            await supabase.from("profiles").insert({
              id: user.id, role, studio_id: studio.id,
              first_name: user.user_metadata?.first_name || "",
              last_name:  user.user_metadata?.last_name  || "",
            })

            if (invite) {
              await supabase.from("invitations").update({ used: true })
                .eq("email", user.email!).eq("studio_id", studio.id)
            }

            if (role === "adherent") {
              await supabase.from("members").upsert({
                studio_id: studio.id, auth_user_id: user.id,
                first_name: user.user_metadata?.first_name || "Nouveau",
                last_name:  user.user_metadata?.last_name  || "Membre",
                email: user.email, status: "nouveau", credits: 0, credits_total: 0,
              }, { onConflict: "studio_id,email" })
            }
          }
        }

        // Rediriger vers le bon studio
        const slug = tenantSlug || profile?.studio_id && await supabase
          .from("studios").select("slug").eq("id", profile.studio_id).single()
          .then(r => r.data?.slug)

        if (slug) {
          window.location.href = `https://${slug}.fydelys.fr/dashboard`
        } else if (profile?.role === "admin" || profile?.role === "superadmin") {
          window.location.href = "https://fydelys.fr/dashboard"
        } else {
          window.location.href = "/login?error=studio_introuvable"
        }
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
