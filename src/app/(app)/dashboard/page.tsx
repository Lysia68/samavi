"use client"
export const dynamic = "force-dynamic"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import type { Session, Member } from "@/lib/types"

const C = {
  bg:"#F4EFE8", surface:"#FFFFFF", border:"#DDD5C8", borderSoft:"#EAE4DA",
  accent:"#B07848", accentBg:"#F5EBE0",
  text:"#2A1F14", textMid:"#5C4A38", textSoft:"#8C7B6C", textMuted:"#B0A090",
  ok:"#4E8A58", okBg:"#E6F2E8", warn:"#A85030", warnBg:"#F5EAE6", info:"#3A6E90", infoBg:"#E6EFF5",
}

function KpiCard({ icon, label, value, delta, color, loading }: any) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12 }}>
      {/* Mobile: compact horizontal */}
      <div className="flex md:hidden items-center gap-2.5 p-3">
        <div style={{ width: 34, height: 34, borderRadius: 8, background: C.bg, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>{icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: C.text, lineHeight: 1.1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{loading ? "…" : value}</div>
          <div style={{ fontSize: 10, color: C.textSoft, fontWeight: 500, marginTop: 2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{label}</div>
        </div>
        <div style={{ fontSize: 10, color, fontWeight: 700, flexShrink: 0 }}>↑ {delta}</div>
      </div>
      {/* Desktop: vertical */}
      <div className="hidden md:flex items-start gap-3.5 p-5">
        <div style={{ width: 44, height: 44, borderRadius: 10, background: C.bg, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{icon}</div>
        <div>
          <div style={{ fontSize: 26, fontWeight: 800, color: C.text, lineHeight: 1.1 }}>{loading ? "…" : value}</div>
          <div style={{ fontSize: 12, color: C.textSoft, fontWeight: 500, marginTop: 4 }}>{label}</div>
          <div style={{ fontSize: 11, color, fontWeight: 700, marginTop: 4 }}>↑ {delta}</div>
        </div>
      </div>
    </div>
  )
}

function statusTag(status: string) {
  const map: Record<string, [string, string]> = {
    actif:    [C.ok, C.okBg], suspendu: [C.warn, C.warnBg], nouveau: [C.info, C.infoBg],
    payé:     [C.ok, C.okBg], impayé:   [C.warn, C.warnBg],
  }
  const [color, bg] = map[status] || [C.textMuted, C.bg]
  return (
    <span style={{ background: bg, color, padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 600 }}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

export default function DashboardPage() {
  const supabase = createClient()
  const [kpis, setKpis] = useState<any>(null)
  const [todaySessions, setTodaySessions] = useState<Session[]>([])
  const [recentMembers, setRecentMembers] = useState<Member[]>([])
  const [unpaidAmt, setUnpaidAmt] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase.from("profiles").select("studio_id").eq("id", user.id).single()
      if (!profile?.studio_id) return

      const studioId = profile.studio_id
      const today = new Date().toISOString().split("T")[0]

      const [kpiRes, sessRes, membRes, payRes] = await Promise.all([
        supabase.from("studio_kpis").select("*").eq("studio_id", studioId).single(),
        supabase.from("sessions")
          .select("*, discipline:disciplines(*)")
          .eq("studio_id", studioId).eq("session_date", today)
          .order("session_time"),
        supabase.from("members")
          .select("*, subscription:subscriptions(name)")
          .eq("studio_id", studioId)
          .order("created_at", { ascending: false }).limit(3),
        supabase.from("member_payments")
          .select("amount").eq("studio_id", studioId).eq("status", "impayé"),
      ])

      // Enrich sessions with booking counts
      if (sessRes.data) {
        const enriched = await Promise.all(sessRes.data.map(async (s: any) => {
          const { count: booked } = await supabase.from("bookings").select("*", { count: "exact", head: true }).eq("session_id", s.id).eq("status", "confirmed")
          const { count: waitlist } = await supabase.from("bookings").select("*", { count: "exact", head: true }).eq("session_id", s.id).eq("status", "waitlist")
          return { ...s, booked: booked || 0, waitlist: waitlist || 0 }
        }))
        setTodaySessions(enriched)
      }

      if (kpiRes.data) setKpis(kpiRes.data)
      if (membRes.data) setRecentMembers(membRes.data as any)
      if (payRes.data) setUnpaidAmt(payRes.data.reduce((s: number, p: any) => s + Number(p.amount), 0))
      setLoading(false)
    }
    load()
  }, [])

  const DISCIPLINES_COLOR: Record<string, string> = {}

  return (
    <div className="p-3 md:p-7">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3.5 mb-3 md:mb-5">
        <KpiCard icon="👥" label="Adhérents actifs" value={kpis?.active_members ?? "—"} delta="+8 ce mois" color={C.ok} loading={loading} />
        <KpiCard icon="📅" label="Séances ce mois"  value={kpis?.sessions_this_month ?? "—"} delta="+12" color="#6B9E7A" loading={loading} />
        <KpiCard icon="📊" label="Taux remplissage" value="76 %" delta="+4 pts" color="#6A8FAE" loading={loading} />
        <KpiCard icon="💳" label="CA du mois" value={kpis ? `${Number(kpis.revenue_this_month).toLocaleString("fr-FR")} €` : "—"} delta="+18 %" color={C.accent} loading={loading} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 md:gap-4">
        {/* Séances du jour */}
        <div className="md:col-span-3" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FBF8F4" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Séances du jour</span>
            <span style={{ fontSize: 11, color: C.textMuted, background: C.bg, padding: "3px 10px", borderRadius: 20, border: `1px solid ${C.border}` }}>
              {new Date().toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
            </span>
          </div>
          {loading ? (
            <div style={{ padding: 24, textAlign: "center", color: C.textMuted, fontSize: 13 }}>Chargement…</div>
          ) : todaySessions.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: C.textMuted, fontSize: 13 }}>Aucune séance aujourd'hui</div>
          ) : todaySessions.map((sess: any) => {
            const pct = sess.spots > 0 ? sess.booked / sess.spots : 0
            return (
              <div key={sess.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: `1px solid ${C.borderSoft}` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, width: 36, flexShrink: 0 }}>{sess.session_time?.slice(0, 5)}</div>
                <div style={{ width: 3, height: 30, background: sess.discipline?.color || C.accent, borderRadius: 2, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sess.discipline?.name || "Séance"}</div>
                  <div style={{ fontSize: 11, color: C.textSoft, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sess.teacher} · {sess.room}</div>
                </div>
                <div style={{ flexShrink: 0, textAlign: "right" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: pct >= 1 ? C.warn : C.text }}>{sess.booked}/{sess.spots}</div>
                  <div style={{ width: 44, height: 3, background: "#EDE6DC", borderRadius: 2, marginTop: 3 }}>
                    <div style={{ height: "100%", width: `${Math.min(pct * 100, 100)}%`, background: pct >= 1 ? C.warn : pct > .75 ? C.accent : C.ok, borderRadius: 2 }} />
                  </div>
                  {sess.waitlist > 0 && <span style={{ fontSize: 10, color: C.accent, fontWeight: 600 }}>+{sess.waitlist}</span>}
                </div>
              </div>
            )
          })}
        </div>

        <div className="md:col-span-2 flex flex-col gap-3">
          {/* Alertes */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, fontSize: 13, fontWeight: 700, color: C.text, background: "#FBF8F4" }}>⚠ Alertes</div>
            {[
              { label: "Impayés",             value: `${unpaidAmt} €`,   c: C.warn, bg: C.warnBg },
              { label: "Abonnements expirant",value: "3",                 c: C.accent, bg: C.accentBg },
              { label: "Liste d'attente",     value: "6 membres",        c: C.info, bg: C.infoBg },
            ].map(a => (
              <div key={a.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: `1px solid ${C.borderSoft}` }}>
                <span style={{ fontSize: 12, color: C.textMid }}>{a.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: a.c, background: a.bg, padding: "2px 10px", borderRadius: 12 }}>{a.value}</span>
              </div>
            ))}
          </div>

          {/* Derniers inscrits */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", flex: 1 }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, fontSize: 13, fontWeight: 700, color: C.text, background: "#FBF8F4" }}>Derniers inscrits</div>
            {loading ? (
              <div style={{ padding: 20, textAlign: "center", color: C.textMuted, fontSize: 13 }}>Chargement…</div>
            ) : recentMembers.map(m => (
              <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: `1px solid ${C.borderSoft}` }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.accentBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: C.accent, flexShrink: 0 }}>
                  {m.first_name?.[0]}{m.last_name?.[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.first_name} {m.last_name}</div>
                  <div style={{ fontSize: 10, color: C.textSoft, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{(m as any).subscription?.name || "—"}</div>
                </div>
                {statusTag(m.status)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
