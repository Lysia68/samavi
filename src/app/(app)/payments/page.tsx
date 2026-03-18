"use client"
export const dynamic = "force-dynamic"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import type { Payment } from "@/lib/types"

const C = {
  bg:"#F4EFE8", surface:"#FFFFFF", warm:"#FBF8F4", border:"#DDD5C8", borderSoft:"#EAE4DA",
  accent:"#B07848", accentBg:"#F5EBE0",
  text:"#2A1F14", textMid:"#5C4A38", textSoft:"#8C7B6C", textMuted:"#B0A090",
  ok:"#4E8A58", okBg:"#E6F2E8", warn:"#A85030", warnBg:"#F5EAE6", info:"#3A6E90", infoBg:"#E6EFF5",
}

const statusMap: Record<string, [string,string]> = {
  payé: [C.ok, C.okBg], impayé: [C.warn, C.warnBg], remboursé: [C.info, C.infoBg]
}
function Tag({ s }: { s: string }) {
  const [c, bg] = statusMap[s] || [C.textMuted, C.bg]
  return <span style={{ background: bg, color: c, padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 600 }}>{s.charAt(0).toUpperCase()+s.slice(1)}</span>
}

export default function PaymentsPage() {
  const supabase = createClient()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase.from("profiles").select("studio_id").eq("id", user.id).single()
      if (!profile?.studio_id) return
      const { data } = await supabase.from("member_payments")
        .select("*, member:members(first_name, last_name), subscription:subscriptions(name)")
        .eq("studio_id", profile.studio_id)
        .order("payment_date", { ascending: false })
      if (data) setPayments(data as any)
      setLoading(false)
    }
    load()
  }, [])

  const total = payments.filter(p => p.status === "payé").reduce((s, p) => s + Number(p.amount), 0)
  const unpaid = payments.filter(p => p.status === "impayé").reduce((s, p) => s + Number(p.amount), 0)

  async function markPaid(id: string) {
    await supabase.from("member_payments").update({ status: "payé" }).eq("id", id)
    setPayments(payments.map(p => p.id === id ? { ...p, status: "payé" as any } : p))
  }

  return (
    <div className="p-3 md:p-7">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: "Encaissé", value: `${total.toLocaleString("fr-FR")} €`, c: C.ok },
          { label: "Impayés",  value: `${unpaid.toLocaleString("fr-FR")} €`, c: C.warn },
          { label: "Transactions", value: payments.length, c: C.info },
        ].map(s => (
          <div key={s.label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.c, fontFamily: "Inter, sans-serif" }}>{loading ? "…" : s.value}</div>
            <div style={{ fontSize: 10, color: C.textSoft, fontWeight: 600, marginTop: 3, textTransform: "uppercase", letterSpacing: 0.8 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* List */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 32, textAlign: "center", color: C.textMuted }}>Chargement…</div>
        ) : payments.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: C.textMuted, fontSize: 14 }}>Aucun paiement enregistré</div>
        ) : payments.map(p => {
          const m = (p as any).member
          return (
            <div key={p.id}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderBottom: `1px solid ${C.borderSoft}` }}
              onMouseEnter={e => e.currentTarget.style.background = C.bg}
              onMouseLeave={e => e.currentTarget.style.background = ""}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {m ? `${m.first_name} ${m.last_name}` : "—"}
                </div>
                <div style={{ fontSize: 11, color: C.textSoft, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {(p as any).subscription?.name} · {new Date(p.payment_date).toLocaleDateString("fr-FR")}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: C.accent }}>{Number(p.amount).toLocaleString("fr-FR")} €</span>
                <Tag s={p.status} />
                {p.status === "impayé" && (
                  <button onClick={() => markPaid(p.id)} className="btn-primary text-xs py-1 px-2.5">Marquer payé</button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
