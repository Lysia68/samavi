"use client"
export const dynamic = "force-dynamic"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"

const C = {
  bg:"#F4EFE8", surface:"#FFFFFF", warm:"#FBF8F4", border:"#DDD5C8", borderSoft:"#EAE4DA",
  accent:"#B07848", accentBg:"#F5EBE0", accentDk:"#8C5E38",
  text:"#2A1F14", textMid:"#5C4A38", textSoft:"#8C7B6C", textMuted:"#B0A090",
  ok:"#4E8A58", okBg:"#E6F2E8", warn:"#A85030", warnBg:"#F5EAE6", info:"#3A6E90", infoBg:"#E6EFF5",
}

const STATUS_LABEL: Record<string, string> = {
  confirmed: "Confirmé",
  waitlist:  "En attente",
  cancelled: "Annulé",
}
const STATUS_COLOR: Record<string, [string,string]> = {
  confirmed: [C.ok,   C.okBg],
  waitlist:  [C.accent, C.accentBg],
  cancelled: [C.warn, C.warnBg],
}

function Tag({ s }: { s: string }) {
  const [c, bg] = STATUS_COLOR[s] || [C.textMuted, C.bg]
  return (
    <span style={{ background: bg, color: c, padding: "2px 9px", borderRadius: 20, fontSize: 10, fontWeight: 600, whiteSpace: "nowrap" }}>
      {STATUS_LABEL[s] || s}
    </span>
  )
}

const DAYS = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"]
const MONTHS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"]

function getWeekDates(baseDate: Date) {
  const d = new Date(baseDate)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(d)
    dd.setDate(d.getDate() + i)
    return dd
  })
}

function toISO(d: Date) {
  return d.toISOString().split("T")[0]
}

export default function PlanningPage() {
  const supabase = createClient()
  const [studioId, setStudioId] = useState<string | null>(null)
  const [sessions, setSessions] = useState<any[]>([])
  const [disciplines, setDisciplines] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [weekBase, setWeekBase] = useState(new Date())
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [bookings, setBookings] = useState<Record<string, any[]>>({})
  const [loadingBookings, setLoadingBookings] = useState<string | null>(null)
  const [view, setView] = useState<"week" | "list">("week")

  const weekDates = getWeekDates(weekBase)
  const weekStart = weekDates[0]
  const weekEnd   = weekDates[6]

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase.from("profiles").select("studio_id").eq("id", user.id).single()
      if (!profile?.studio_id) return
      setStudioId(profile.studio_id)

      const [sessRes, discRes] = await Promise.all([
        supabase.from("sessions")
          .select("*, discipline:disciplines(*)")
          .eq("studio_id", profile.studio_id)
          .gte("session_date", toISO(weekStart))
          .lte("session_date", toISO(weekEnd))
          .order("session_date").order("session_time"),
        supabase.from("disciplines").select("*").eq("studio_id", profile.studio_id),
      ])

      // Enrich with booking counts
      if (sessRes.data) {
        const enriched = await Promise.all(sessRes.data.map(async (s: any) => {
          const { count: confirmed } = await supabase.from("bookings")
            .select("*", { count: "exact", head: true }).eq("session_id", s.id).eq("status", "confirmed")
          const { count: waitlist } = await supabase.from("bookings")
            .select("*", { count: "exact", head: true }).eq("session_id", s.id).eq("status", "waitlist")
          return { ...s, booked: confirmed || 0, waitlist: waitlist || 0 }
        }))
        setSessions(enriched)
      }
      if (discRes.data) setDisciplines(discRes.data)
      setLoading(false)
    }
    load()
  }, [weekBase])

  async function loadBookings(sessionId: string) {
    if (bookings[sessionId]) return
    setLoadingBookings(sessionId)
    const { data } = await supabase.from("bookings")
      .select("*, member:members(first_name, last_name, email, phone)")
      .eq("session_id", sessionId)
      .order("status").order("created_at")
    if (data) setBookings(prev => ({ ...prev, [sessionId]: data }))
    setLoadingBookings(null)
  }

  function toggleSession(id: string) {
    if (expandedId === id) {
      setExpandedId(null)
    } else {
      setExpandedId(id)
      loadBookings(id)
    }
  }

  async function changeStatus(bookingId: string, sessionId: string, newStatus: string) {
    await supabase.from("bookings").update({ status: newStatus }).eq("id", bookingId)
    setBookings(prev => ({
      ...prev,
      [sessionId]: prev[sessionId].map(b => b.id === bookingId ? { ...b, status: newStatus } : b)
    }))
    // Update session counts
    setSessions(prev => prev.map(s => {
      if (s.id !== sessionId) return s
      const b = bookings[sessionId] || []
      const confirmed = b.filter(x => x.id === bookingId ? newStatus === "confirmed" : x.status === "confirmed").length
      const waitlist  = b.filter(x => x.id === bookingId ? newStatus === "waitlist"  : x.status === "waitlist").length
      return { ...s, booked: confirmed, waitlist }
    }))
  }

  function prevWeek() { const d = new Date(weekBase); d.setDate(d.getDate() - 7); setWeekBase(d); setExpandedId(null) }
  function nextWeek() { const d = new Date(weekBase); d.setDate(d.getDate() + 7); setWeekBase(d); setExpandedId(null) }
  function goToday()  { setWeekBase(new Date()); setExpandedId(null) }

  const todayStr = toISO(new Date())

  const sessionsForDay = (d: Date) =>
    sessions.filter(s => s.session_date === toISO(d))

  function SessionCard({ sess }: { sess: any }) {
    const disc = sess.discipline
    const pct  = sess.spots > 0 ? sess.booked / sess.spots : 0
    const isExpanded = expandedId === sess.id
    const bList = bookings[sess.id] || []
    const confirmed = bList.filter(b => b.status === "confirmed")
    const waiting   = bList.filter(b => b.status === "waitlist")
    const cancelled = bList.filter(b => b.status === "cancelled")

    return (
      <div style={{
        border: `1px solid ${isExpanded ? C.accent : C.border}`,
        borderRadius: 12, overflow: "hidden", marginBottom: 8,
        boxShadow: isExpanded ? `0 0 0 3px rgba(176,120,72,.1)` : "none",
        transition: "all .2s",
      }}>
        {/* Header row — clickable */}
        <div
          onClick={() => toggleSession(sess.id)}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "11px 14px", cursor: "pointer",
            background: isExpanded ? C.accentBg : C.surface,
            transition: "background .15s",
          }}
          onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = "#FBF8F4" }}
          onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = C.surface }}
        >
          {/* Color bar */}
          <div style={{ width: 3, height: 34, borderRadius: 2, background: disc?.color || C.accent, flexShrink: 0 }} />

          {/* Time */}
          <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, width: 34, flexShrink: 0 }}>
            {sess.session_time?.slice(0,5)}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {disc?.name || "Séance"}
            </div>
            <div style={{ fontSize: 11, color: C.textSoft, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {sess.teacher} · {sess.room} · {sess.duration_min}min
            </div>
          </div>

          {/* Counters */}
          <div style={{ flexShrink: 0, textAlign: "right", marginRight: 6 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: pct >= 1 ? C.warn : C.text }}>
              {sess.booked}/{sess.spots}
            </div>
            <div style={{ width: 44, height: 3, background: "#EDE6DC", borderRadius: 2, marginTop: 3 }}>
              <div style={{ height: "100%", width: `${Math.min(pct*100,100)}%`, background: pct>=1 ? C.warn : pct>.75 ? C.accent : C.ok, borderRadius: 2 }} />
            </div>
            {sess.waitlist > 0 && (
              <div style={{ fontSize: 9, color: C.accent, fontWeight: 700, marginTop: 2 }}>+{sess.waitlist} att.</div>
            )}
          </div>

          {/* Chevron */}
          <div style={{ fontSize: 12, color: C.textMuted, flexShrink: 0, transition: "transform .2s", transform: isExpanded ? "rotate(180deg)" : "none" }}>
            ▼
          </div>
        </div>

        {/* ACCORDION */}
        {isExpanded && (
          <div style={{ borderTop: `1px solid ${C.borderSoft}`, background: "#FDFAF7" }}>
            {loadingBookings === sess.id ? (
              <div style={{ padding: "20px", textAlign: "center", color: C.textMuted, fontSize: 13 }}>
                Chargement des inscrits…
              </div>
            ) : bList.length === 0 ? (
              <div style={{ padding: "20px 16px", textAlign: "center", color: C.textMuted, fontSize: 13 }}>
                Aucune réservation pour cette séance
              </div>
            ) : (
              <div>
                {/* Section tabs summary */}
                <div style={{ display: "flex", gap: 6, padding: "10px 14px 0", flexWrap: "wrap" }}>
                  {[
                    { label: `${confirmed.length} confirmé${confirmed.length>1?"s":""}`, c: C.ok, bg: C.okBg },
                    ...(waiting.length > 0   ? [{ label: `${waiting.length} en attente`,  c: C.accent, bg: C.accentBg }] : []),
                    ...(cancelled.length > 0 ? [{ label: `${cancelled.length} annulé${cancelled.length>1?"s":""}`, c: C.warn, bg: C.warnBg }] : []),
                  ].map(s => (
                    <span key={s.label} style={{ fontSize: 10, fontWeight: 700, color: s.c, background: s.bg, padding: "3px 9px", borderRadius: 20 }}>
                      {s.label}
                    </span>
                  ))}
                </div>

                {/* Booking rows */}
                {bList.map((b: any) => {
                  const m = b.member
                  return (
                    <div key={b.id} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "9px 14px",
                      borderBottom: `1px solid ${C.borderSoft}`,
                      opacity: b.status === "cancelled" ? 0.5 : 1,
                    }}>
                      {/* Avatar */}
                      <div style={{
                        width: 30, height: 30, borderRadius: "50%",
                        background: C.accentBg, border: `1px solid #DFC0A0`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 10, fontWeight: 700, color: C.accent, flexShrink: 0,
                      }}>
                        {m?.first_name?.[0]}{m?.last_name?.[0]}
                      </div>

                      {/* Name + email */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {m?.first_name} {m?.last_name}
                        </div>
                        <div style={{ fontSize: 10, color: C.textSoft, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {m?.email}
                        </div>
                      </div>

                      {/* Status tag */}
                      <Tag s={b.status} />

                      {/* Actions */}
                      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                        {b.status === "waitlist" && (
                          <button
                            onClick={() => changeStatus(b.id, sess.id, "confirmed")}
                            style={{ fontSize: 10, padding: "3px 8px", background: C.okBg, color: C.ok, border: `1px solid #B8DFC4`, borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>
                            ✓ Confirmer
                          </button>
                        )}
                        {b.status === "confirmed" && (
                          <button
                            onClick={() => changeStatus(b.id, sess.id, "cancelled")}
                            style={{ fontSize: 10, padding: "3px 8px", background: C.warnBg, color: C.warn, border: `1px solid #EFC8BC`, borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>
                            ✕ Annuler
                          </button>
                        )}
                        {b.status === "cancelled" && (
                          <button
                            onClick={() => changeStatus(b.id, sess.id, "confirmed")}
                            style={{ fontSize: 10, padding: "3px 8px", background: C.infoBg, color: C.info, border: `1px solid #B8CED8`, borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>
                            ↩ Remettre
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}

                {/* Footer actions */}
                <div style={{ padding: "10px 14px", display: "flex", gap: 8 }}>
                  <button style={{ fontSize: 11, padding: "5px 12px", background: C.accentBg, color: "#8C5E38", border: `1px solid #DFC0A0`, borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>
                    + Inscrire un adhérent
                  </button>
                  <button style={{ fontSize: 11, padding: "5px 12px", background: "#FBF8F4", color: C.textSoft, border: `1px solid ${C.border}`, borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>
                    📧 Envoyer rappel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-3 md:p-7">
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "6px 10px" }}>
          <button onClick={prevWeek} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: C.textSoft, padding: "0 4px" }}>‹</button>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.text, minWidth: 160, textAlign: "center" }}>
            {weekStart.getDate()} {MONTHS[weekStart.getMonth()].slice(0,3)} — {weekEnd.getDate()} {MONTHS[weekEnd.getMonth()].slice(0,3)} {weekEnd.getFullYear()}
          </span>
          <button onClick={nextWeek} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: C.textSoft, padding: "0 4px" }}>›</button>
        </div>
        <button onClick={goToday} style={{ fontSize: 12, padding: "7px 14px", background: C.accentBg, color: "#8C5E38", border: `1px solid #DFC0A0`, borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>
          Aujourd'hui
        </button>
        <div style={{ marginLeft: "auto", display: "flex", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
          {(["week","list"] as const).map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: "6px 14px", fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer",
              background: view === v ? C.accent : "transparent",
              color: view === v ? "#fff" : C.textSoft,
              transition: "all .15s",
            }}>{v === "week" ? "Semaine" : "Liste"}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: C.textMuted }}>Chargement…</div>
      ) : view === "week" ? (
        /* WEEK VIEW */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
          {weekDates.map((d, i) => {
            const isToday = toISO(d) === todayStr
            const daySessions = sessionsForDay(d)
            return (
              <div key={i}>
                {/* Day header */}
                <div style={{
                  textAlign: "center", marginBottom: 8,
                  padding: "6px 4px", borderRadius: 8,
                  background: isToday ? C.accent : "transparent",
                }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: isToday ? "rgba(255,255,255,.8)" : C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    {DAYS[i]}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: isToday ? "#fff" : C.text, lineHeight: 1.2 }}>
                    {d.getDate()}
                  </div>
                </div>
                {/* Sessions */}
                {daySessions.length === 0 ? (
                  <div style={{ height: 40, border: `1px dashed ${C.borderSoft}`, borderRadius: 8 }} />
                ) : (
                  daySessions.map(s => {
                    const disc = s.discipline
                    const pct  = s.spots > 0 ? s.booked / s.spots : 0
                    const isExp = expandedId === s.id
                    return (
                      <div key={s.id}
                        onClick={() => toggleSession(s.id)}
                        style={{
                          background: isExp ? C.accentBg : C.surface,
                          border: `1px solid ${isExp ? C.accent : C.borderSoft}`,
                          borderLeft: `3px solid ${disc?.color || C.accent}`,
                          borderRadius: 8, padding: "6px 8px",
                          marginBottom: 4, cursor: "pointer",
                          transition: "all .15s",
                        }}
                        onMouseEnter={e => { if (!isExp) e.currentTarget.style.background = "#FBF8F4" }}
                        onMouseLeave={e => { if (!isExp) e.currentTarget.style.background = C.surface }}
                      >
                        <div style={{ fontSize: 10, fontWeight: 700, color: C.accent }}>{s.session_time?.slice(0,5)}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {disc?.name || "Séance"}
                        </div>
                        <div style={{ fontSize: 10, color: C.textSoft }}>{s.booked}/{s.spots}</div>
                        <div style={{ width: "100%", height: 2, background: "#EDE6DC", borderRadius: 1, marginTop: 3 }}>
                          <div style={{ height: "100%", width: `${Math.min(pct*100,100)}%`, background: pct>=1 ? C.warn : C.ok, borderRadius: 1 }} />
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <div>
          {weekDates.map((d, i) => {
            const daySessions = sessionsForDay(d)
            const isToday = toISO(d) === todayStr
            return (
              <div key={i} style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <div style={{
                    fontSize: 12, fontWeight: 700, color: isToday ? "#fff" : C.textMid,
                    background: isToday ? C.accent : "#EDE6DC",
                    padding: "4px 12px", borderRadius: 20,
                  }}>
                    {DAYS[i]} {d.getDate()} {MONTHS[d.getMonth()].slice(0,3)}
                    {isToday && " · Aujourd'hui"}
                  </div>
                  <div style={{ flex: 1, height: 1, background: C.borderSoft }} />
                  <span style={{ fontSize: 11, color: C.textMuted }}>{daySessions.length} séance{daySessions.length > 1 ? "s" : ""}</span>
                </div>
                {daySessions.length === 0 ? (
                  <div style={{ fontSize: 12, color: C.textMuted, padding: "8px 0 8px 12px" }}>Aucune séance</div>
                ) : (
                  daySessions.map(s => <SessionCard key={s.id} sess={s} />)
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Accordéon global en vue semaine */}
      {view === "week" && expandedId && (() => {
        const sess = sessions.find(s => s.id === expandedId)
        if (!sess) return null
        return (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8 }}>
              Détail · {sess.discipline?.name} · {new Date(sess.session_date).toLocaleDateString("fr-FR", { weekday:"long", day:"numeric", month:"long" })} à {sess.session_time?.slice(0,5)}
            </div>
            <SessionCard sess={sess} />
          </div>
        )
      })()}
    </div>
  )
}
