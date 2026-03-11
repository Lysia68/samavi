"use client"
export const dynamic = "force-dynamic"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import dynamicImport from "next/dynamic"

const FydelysV4 = dynamicImport(() => import("@/components/FydelysV4"), { ssr: false })

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  // Instance stable : évite les "Lock broken by steal" causés par la recréation du client à chaque render
  const supabase = useState(() => createClient())[0]
  const [initialRole, setInitialRole]           = useState<string | null>(null)
  const [studioSlug, setStudioSlug]             = useState<string>("")
  const [coachName, setCoachName]               = useState<string>("")
  const [coachDisciplines, setCoachDisciplines] = useState<any[]>([])
  const [billingStatus, setBillingStatus]       = useState<string>("trialing")
  const [trialEndsAt, setTrialEndsAt]           = useState<string | null>(null)
  const [studioName, setStudioName]             = useState<string>("")
  const [planName, setPlanName]                 = useState<string>("")
  const [membersCount, setMembersCount]         = useState<number>(0)
  const [userName, setUserName]                 = useState<string>("")
  const [userRole, setUserRole]                 = useState<string>("")

  useEffect(() => {
    const run = async () => {
    const hostname    = window.location.hostname
    const isAppHost   = hostname === "fydelys.fr" || hostname === "localhost" || hostname === "localhost:3000"
    const tenantMatch = hostname.match(/^([a-z0-9-]+)\.fydelys\.fr/)
    const slug        = tenantMatch ? tenantMatch[1] : ""
    setStudioSlug(slug)

    // Essayer d'abord getSession (cookie local), puis getUser (réseau) en fallback
    let user: any = null
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      user = session.user
    } else {
      // Fallback : getUser fait un appel réseau — plus fiable si cookie mal lu
      const { data: { user: u } } = await supabase.auth.getUser()
      user = u
    }

    if (!user) {
      const cookieNames = document.cookie.split(";").map(c=>c.trim().split("=")[0]).filter(c=>c.includes("sb-")||c.includes("supabase")).join(",")
      console.error("NO_SESSION | hostname:", hostname, "| auth cookies:", cookieNames || "AUCUN")
      // Petit délai pour laisser le temps au cookie de s'établir
      await new Promise(r => setTimeout(r, 500))
      const { data: { session: s2 } } = await supabase.auth.getSession()
      if (!s2?.user) {
        window.location.href = "/"
        return
      }
      user = s2.user
    }

    ;(async () => {

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, studio_id, first_name, last_name, is_coach")
        .eq("id", user.id)
        .single()

      const role = profile?.role || "adherent"

      // Nom + disciplines pour les coachs
      if (role === "coach" || profile?.is_coach) {
        const fullName = `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim()
        setCoachName(fullName)
        const { data: discLinks } = await supabase
          .from("coach_disciplines")
          .select("discipline_id, disciplines(id, name, icon, color)")
          .eq("profile_id", user.id)
        if (discLinks) {
          setCoachDisciplines(discLinks.map((r: any) => r.disciplines).filter(Boolean))
        }
      }

      if (isAppHost) {
        if (role === "superadmin") {
          setInitialRole("superadmin")
        } else if (role === "admin") {
          const { data: studio } = await supabase
            .from("studios").select("slug").eq("id", profile?.studio_id).single()
          if (studio?.slug) {
            window.location.href = `https://${studio.slug}.fydelys.fr/dashboard`
          } else {
            setInitialRole("admin")
          }
        } else {
          router.push("/")
        }
      } else if (slug) {
        if (role === "superadmin") {
          window.location.href = "https://fydelys.fr/dashboard"
          return
        }
        // Nom de l'utilisateur
        const fullName = `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim()
        setUserName(fullName)
        setUserRole(role)

        // Charger les données studio pour admin/coach/adhérent
        if (profile?.studio_id) {
          const { data: studioData } = await supabase
            .from("studios")
            .select("name, billing_status, trial_ends_at, plan_slug")
            .eq("id", profile.studio_id)
            .single()
          if (studioData) {
            setStudioName(studioData.name || "")
            setBillingStatus(studioData.billing_status || "trialing")
            setTrialEndsAt(studioData.trial_ends_at || null)
            setPlanName(studioData.plan_slug || "Essentiel")
          }
          // Nombre de membres actifs
          const { count } = await supabase
            .from("members")
            .select("id", { count: "exact", head: true })
            .eq("studio_id", profile.studio_id)
            .eq("status", "actif")
          setMembersCount(count || 0)
        }
        setInitialRole(role)
      } else {
        setInitialRole(role)
      }
    })()
    }
    run()
  }, [])

  // Loading — pas de window ici, on utilise le state isApp
  if (!initialRole) return (
    <div style={{
      minHeight: "100vh",
      background: "#F4EFE8",
      display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <div style={{ fontFamily: "Arial", color: "#A06838", fontSize: 16, fontWeight: 600 }}>
        Chargement…
      </div>
    </div>
  )

  return (
    <FydelysV4
      initialRole={initialRole}
      studioSlug={studioSlug}
      studioName={studioName}
      planName={planName}
      membersCount={membersCount}
      userName={userName}
      userRole={userRole}
      coachName={coachName}
      coachDisciplines={coachDisciplines}
      billingStatus={billingStatus}
      trialEndsAt={trialEndsAt}
      onSignOut={async () => {
        await supabase.auth.signOut()
        window.location.href = "https://fydelys.fr"
      }}
    />
  )
}
