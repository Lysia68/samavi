"use client"
export const dynamic = "force-dynamic"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import type { Member, Subscription } from "@/lib/types"

const C = {
  bg:"#F4EFE8", surface:"#FFFFFF", warm:"#FBF8F4", border:"#DDD5C8", borderSoft:"#EAE4DA",
  accent:"#B07848", accentBg:"#F5EBE0", accentDk:"#8C5E38",
  text:"#2A1F14", textMid:"#5C4A38", textSoft:"#8C7B6C", textMuted:"#B0A090",
  ok:"#4E8A58", okBg:"#E6F2E8", warn:"#A85030", warnBg:"#F5EAE6", info:"#3A6E90", infoBg:"#E6EFF5",
}

const statusMap: Record<string, [string, string]> = {
  actif:[C.ok,C.okBg], suspendu:[C.warn,C.warnBg], nouveau:[C.info,C.infoBg]
}
function Tag({ s }: { s: string }) {
  const [c, bg] = statusMap[s] || [C.textMuted, C.bg]
  return <span style={{ background: bg, color: c, padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 600 }}>{s.charAt(0).toUpperCase()+s.slice(1)}</span>
}

export default function MembersPage() {
  const supabase = createClient()
  const [members, setMembers] = useState<Member[]>([])
  const [subs, setSubs] = useState<Subscription[]>([])
  const [studioId, setStudioId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Member | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "", subscription_id: "", status: "nouveau" })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase.from("profiles").select("studio_id").eq("id", user.id).single()
      if (!profile?.studio_id) return
      setStudioId(profile.studio_id)

      const [mRes, sRes] = await Promise.all([
        supabase.from("members").select("*, subscription:subscriptions(*)").eq("studio_id", profile.studio_id).order("created_at", { ascending: false }),
        supabase.from("subscriptions").select("*").eq("studio_id", profile.studio_id).eq("active", true),
      ])
      if (mRes.data) setMembers(mRes.data as any)
      if (sRes.data) setSubs(sRes.data)
      setLoading(false)
    }
    load()
  }, [])

  const filtered = members.filter(m => `${m.first_name} ${m.last_name} ${m.email}`.toLowerCase().includes(search.toLowerCase()))

  async function addMember() {
    if (!form.first_name || !form.email || !studioId) return
    setSaving(true)
    const { data, error } = await supabase.from("members").insert({
      ...form, studio_id: studioId, subscription_id: form.subscription_id || null,
    }).select("*, subscription:subscriptions(*)").single()
    if (!error && data) {
      setMembers([data as any, ...members])
      setShowAdd(false)
      setForm({ first_name: "", last_name: "", email: "", phone: "", subscription_id: "", status: "nouveau" })
    }
    setSaving(false)
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from("members").update({ status }).eq("id", id)
    setMembers(members.map(m => m.id === id ? { ...m, status: status as any } : m))
    if (selected?.id === id) setSelected({ ...selected, status: status as any })
  }

  async function deleteMember(id: string) {
    if (!confirm("Supprimer cet adhérent ?")) return
    await supabase.from("members").delete().eq("id", id)
    setMembers(members.filter(m => m.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  return (
    <div className="p-3 md:p-7">
      {/* Toolbar */}
      <div className="flex gap-2 mb-4 items-center">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍  Rechercher…"
          style={{ flex: 1, padding: "9px 12px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, outline: "none", color: C.text, background: "#FBF8F4", fontFamily: "Inter, sans-serif" }}
          onFocus={e => e.currentTarget.style.borderColor = C.accent}
          onBlur={e => e.currentTarget.style.borderColor = C.border} />
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary whitespace-nowrap">＋ Adhérent</button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderTop: `3px solid ${C.accent}`, borderRadius: 12, padding: 18, marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>Nouvel adhérent</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[["Prénom","first_name","Prénom"],["Nom","last_name","Nom"],["Email","email","email@..."],["Téléphone","phone","06..."]].map(([lbl,key,ph]) => (
              <div key={key}>
                <label className="field-label">{lbl}</label>
                <input value={(form as any)[key]} onChange={e => setForm({...form,[key]:e.target.value})} placeholder={ph} className="field-input"/>
              </div>
            ))}
            <div>
              <label className="field-label">Abonnement</label>
              <select value={form.subscription_id} onChange={e => setForm({...form,subscription_id:e.target.value})} className="field-input">
                <option value="">Choisir…</option>
                {subs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={addMember} disabled={saving} className="btn-primary">{saving ? "Création…" : "Créer"}</button>
            <button onClick={() => setShowAdd(false)} className="btn-ghost">Annuler</button>
          </div>
        </div>
      )}

      {/* List */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 32, textAlign: "center", color: C.textMuted }}>Chargement…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: C.textMuted, fontSize: 14 }}>Aucun adhérent trouvé</div>
        ) : filtered.map(m => (
          <div key={m.id}>
            <div onClick={() => setSelected(selected?.id === m.id ? null : m)}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", borderBottom: `1px solid ${C.borderSoft}`, cursor: "pointer", background: selected?.id === m.id ? C.accentBg : "transparent", transition: "background .15s" }}
              onMouseEnter={e => { if (selected?.id !== m.id) e.currentTarget.style.background = C.bg }}
              onMouseLeave={e => { if (selected?.id !== m.id) e.currentTarget.style.background = "transparent" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.accentBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: C.accent, flexShrink: 0 }}>
                {m.first_name?.[0]}{m.last_name?.[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.first_name} {m.last_name}</div>
                <div style={{ fontSize: 11, color: C.textSoft, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{(m as any).subscription?.name || m.email}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                <Tag s={m.status} />
                {m.credits > 0 && <span style={{ fontSize: 9, color: C.info, background: C.infoBg, padding: "1px 6px", borderRadius: 10 }}>{m.credits} crédits</span>}
              </div>
            </div>

            {/* Detail panel */}
            {selected?.id === m.id && (
              <div style={{ padding: 16, borderBottom: `1px solid ${C.border}`, background: "#FDFBF9" }}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                  {[["Email",m.email],["Téléphone",m.phone||"—"],["Abonnement",(m as any).subscription?.name||"—"],["Crédits",m.credits > 0 ? `${m.credits} séances` : "Illimité"]].map(([l,v]) => (
                    <div key={l} style={{ background: C.bg, borderRadius: 8, padding: "9px 12px", border: `1px solid ${C.border}` }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>{l}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {m.status === "actif"
                    ? <button onClick={() => updateStatus(m.id, "suspendu")} className="btn-danger text-xs py-1.5 px-3">Suspendre</button>
                    : <button onClick={() => updateStatus(m.id, "actif")} className="btn-ghost text-xs py-1.5 px-3">Réactiver</button>
                  }
                  <button onClick={() => deleteMember(m.id)} className="btn-danger text-xs py-1.5 px-3">Supprimer</button>
                  <button className="btn-ghost text-xs py-1.5 px-3">Historique séances</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ textAlign: "right", marginTop: 10, fontSize: 12, color: C.textMuted }}>
        {filtered.length} adhérent{filtered.length > 1 ? "s" : ""}
      </div>
    </div>
  )
}
