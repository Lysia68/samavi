import React, { useState, useEffect, useCallback, useContext } from "react";
import { createClient } from "@/lib/supabase";
import { AppCtx } from "./context";
import { C } from "./theme";

function toISO(d) { return d.toISOString().slice(0, 10); }

function formatDate(dateStr) {
  return new Date(dateStr + "T12:00").toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });
}

function actionColor(action) {
  if (action.startsWith("credit_add") || action === "credit_restore") return { bg: "#E8F5E9", icon: "➕" };
  if (action === "credit_deduct" || action === "credit_manual")       return { bg: "#FEE2E2", icon: "➖" };
  if (action === "booking_attended")   return { bg: "#E8F5E9", icon: "✓" };
  if (action === "booking_absent")     return { bg: "#FEE2E2", icon: "✕" };
  if (action === "booking_cancelled")  return { bg: "#FEF3E2", icon: "⊘" };
  if (action === "booking_created")    return { bg: "#E3F2FD", icon: "📅" };
  if (action === "payment")            return { bg: "#FDF4E3", icon: "💶" };
  if (action === "subscription_change") return { bg: "#F3E5F5", icon: "🔄" };
  if (action === "member_created")     return { bg: "#E8F5E9", icon: "👤" };
  if (action === "member_deleted" || action === "member_suspended") return { bg: "#FEE2E2", icon: "🗑" };
  if (action === "member_frozen")      return { bg: "#E3F2FD", icon: "❄" };
  return { bg: "#F5F5F5", icon: "•" };
}

function actionLabel(action, details) {
  const d = details || {};
  switch (action) {
    case "credit_add":        return `+${d.amount || "?"} crédit${(d.amount || 0) > 1 ? "s" : ""}${d.label ? ` — ${d.label}` : d.source === "admin_gift" ? " (offert)" : ""}`;
    case "credit_deduct":     return `−1 crédit${d.reason === "attendance" ? " (présence validée)" : d.reason === "attendance_bulk" ? " (validation groupée)" : ""}`;
    case "credit_restore":    return `+1 crédit restitué${d.reason === "attendance_undone" ? " (présence annulée)" : ""}`;
    case "credit_manual":     return `Ajustement manuel des crédits (${d.from ?? "?"} → ${d.to ?? "?"})`;
    case "booking_created":   return `Réservation — ${d.session_date || ""} ${d.session_time?.slice(0, 5) || ""}${d.discipline ? ` · ${d.discipline}` : ""}`;
    case "booking_attended":  return `Présence validée — ${d.session_date || ""}`;
    case "booking_absent":    return `Marqué absent — ${d.session_date || ""}`;
    case "booking_cancelled": return `Réservation annulée${d.by ? ` par ${d.by}` : ""} — ${d.session_date || ""}`;
    case "payment":           return `Paiement ${d.amount ? `${d.amount} €` : ""}${d.type ? ` · ${d.type}` : ""}${d.notes ? ` — ${d.notes}` : ""}`;
    case "subscription_change": return `Abonnement changé → ${d.name || "—"}${d.price ? ` (${d.price}€)` : ""}`;
    case "member_created":    return `Membre créé`;
    case "member_updated":    return `Membre modifié`;
    case "member_deleted":    return `Membre supprimé`;
    case "member_suspended":  return `Membre suspendu`;
    case "member_reactivated": return `Membre réactivé`;
    case "member_frozen":     return `Compte gelé jusqu'au ${d.to || "?"}`;
    case "member_unfrozen":   return `Compte dégelé`;
    default: return action;
  }
}

function KpiCard({ label, value, color, bg, sub }) {
  return (
    <div style={{ background: bg || C.surface, border: `1.5px solid ${color || C.border}40`, borderRadius: 12, padding: "16px 20px", minWidth: 120, flex: 1 }}>
      <div style={{ fontSize: 28, fontWeight: 800, color: color || C.text, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: C.textSoft, marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export function Historique({ isMobile }) {
  const { studioId } = useContext(AppCtx);
  const [sessions, setSessions]     = useState([]);
  const [disciplines, setDisciplines] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [bookings, setBookings]     = useState({});
  const [activeTab, setActiveTab]   = useState("seances"); // "seances" | "compta" | "activite"
  const [compta, setCompta]         = useState(null); // { year, months: [{month,amount,count,avg}] }
  const [comptaYear, setComptaYear] = useState(new Date().getFullYear());
  const [activity, setActivity]     = useState(null); // null=loading, [...]=data
  const [activityFilter, setActivityFilter] = useState("all"); // all | credit | booking | payment | member

  const today = toISO(new Date());
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1); return toISO(d);
  });
  const [dateTo, setDateTo]       = useState(today);
  const [filterDisc, setFilterDisc] = useState("all");

  // Charger disciplines
  useEffect(() => {
    if (!studioId) return;
    createClient().from("disciplines").select("id, name, icon, color")
      .eq("studio_id", studioId).order("name")
      .then(({ data }) => { if (data) setDisciplines(data); });
  }, [studioId]);

  // Charger l'activité
  useEffect(() => {
    if (!studioId || activeTab !== "activite") return;
    setActivity(null);
    const params = new URLSearchParams({ studioId, limit: "200", from: dateFrom, to: dateTo });
    fetch(`/api/activity?${params}`)
      .then(r => r.json())
      .then(json => setActivity(json?.activity || []))
      .catch(() => setActivity([]));
  }, [studioId, activeTab, dateFrom, dateTo]);

  // Charger comptabilité
  useEffect(() => {
    if (!studioId || activeTab !== "compta") return;
    const sb = createClient();
    Promise.all([
      sb.from("member_payments").select("amount, status, payment_date, member_id")
        .eq("studio_id", studioId).gte("payment_date", `${comptaYear}-01-01`).lte("payment_date", `${comptaYear}-12-31`),
      sb.from("sessions").select("id, session_date, spots, status")
        .eq("studio_id", studioId).gte("session_date", `${comptaYear}-01-01`).lte("session_date", `${comptaYear}-12-31`).neq("status", "cancelled"),
      sb.from("bookings").select("session_id, status")
        .in("status", ["confirmed"]),
    ]).then(([payRes, sessRes, bkRes]) => {
      const payData = payRes.data || [];
      const sessData = sessRes.data || [];
      const bkData = bkRes.data || [];
      // Bookings par session
      const bkMap = {};
      bkData.forEach(b => { bkMap[b.session_id] = (bkMap[b.session_id] || 0) + 1; });

      const MOIS = ["Janv.","Févr.","Mars","Avr.","Mai","Juin","Juil.","Août","Sept.","Oct.","Nov.","Déc."];
      const months = MOIS.map((label, i) => {
        const m = String(i + 1).padStart(2, "0");
        const prefix = `${comptaYear}-${m}`;
        // Paiements
        const payments = payData.filter(p => p.payment_date?.startsWith(prefix) && p.status === "payé");
        const amount = payments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
        const nbPayments = payments.length;
        // Séances
        const monthSessions = sessData.filter(s => s.session_date?.startsWith(prefix));
        const nbSessions = monthSessions.length;
        const totalSpots = monthSessions.reduce((s, x) => s + (x.spots || 0), 0);
        const totalBooked = monthSessions.reduce((s, x) => s + (bkMap[x.id] || 0), 0);
        const fillRate = totalSpots > 0 ? Math.round(totalBooked / totalSpots * 100) : 0;
        return { label, amount, nbPayments, nbSessions, fillRate };
      });
      const total = months.reduce((s, m) => s + m.amount, 0);
      const totalPayments = months.reduce((s, m) => s + m.nbPayments, 0);
      const totalSessions = months.reduce((s, m) => s + m.nbSessions, 0);
      setCompta({ year: comptaYear, months, total, totalPayments, totalSessions });
    });
  }, [studioId, comptaYear, activeTab]);

  // Charger sessions historique
  const loadSessions = useCallback(async () => {
    if (!studioId) return;
    setLoading(true);
    setExpandedId(null);

    let query = createClient().from("sessions")
      .select("id, session_date, session_time, duration_min, teacher, room, level, spots, status, discipline_id, disciplines(name, icon, color)")
      .eq("studio_id", studioId)
      .lte("session_date", today)
      .gte("session_date", dateFrom)
      .lte("session_date", dateTo)
      .order("session_date", { ascending: false })
      .order("session_time", { ascending: true })
      .limit(200);

    if (filterDisc !== "all") query = query.eq("discipline_id", filterDisc);

    const { data: rawData } = await query;
    if (!rawData) { setLoading(false); return; }

    // Filtrer les séances d'aujourd'hui pas encore terminées
    const now = new Date();
    const data = rawData.filter(s => {
      if (s.session_date !== today) return true;
      const [h, m] = (s.session_time || "00:00").split(":").map(Number);
      const endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m + (s.duration_min || 60));
      return now > endTime;
    });

    const ids = data.map(s => s.id);
    if (ids.length > 0) {
      const { data: bkData } = await createClient().from("bookings")
        .select("session_id, status, attended")
        .in("session_id", ids);

      const counts = {};
      (bkData || []).forEach(b => {
        if (!counts[b.session_id]) counts[b.session_id] = { confirmed: 0, attended: 0, absent: 0 };
        if (b.status === "confirmed") {
          counts[b.session_id].confirmed++;
          if (b.attended === true)  counts[b.session_id].attended++;
          if (b.attended === false) counts[b.session_id].absent++;
        }
      });
      setSessions(data.map(s => ({
        ...s,
        disc: s.disciplines,
        confirmed: counts[s.id]?.confirmed || 0,
        attended:  counts[s.id]?.attended  || 0,
        absent:    counts[s.id]?.absent    || 0,
      })));
    } else {
      setSessions([]);
    }
    setLoading(false);
  }, [studioId, dateFrom, dateTo, filterDisc, today]);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  async function toggleSession(id) {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    if (bookings[id]) return;
    const { data } = await createClient().from("bookings")
      .select("id, status, attended, members!bookings_member_id_fkey(first_name, last_name, email)")
      .eq("session_id", id).eq("status", "confirmed").order("created_at");
    if (data) setBookings(prev => ({ ...prev, [id]: data }));
  }

  async function toggleAttended(bookingId, sessId, current) {
    const newVal = current !== true;
    await createClient().from("bookings").update({ attended: newVal }).eq("id", bookingId);
    setBookings(prev => ({
      ...prev,
      [sessId]: (prev[sessId] || []).map(b => b.id === bookingId ? { ...b, attended: newVal } : b),
    }));
    setSessions(prev => prev.map(s => {
      if (s.id !== sessId) return s;
      const bk = (bookings[sessId] || []).map(b => b.id === bookingId ? { ...b, attended: newVal } : b);
      return {
        ...s,
        attended: bk.filter(b => b.attended === true).length,
        absent:   bk.filter(b => b.attended === false).length,
      };
    }));
  }

  // Stats globales
  const totalSessions  = sessions.length;
  const totalConfirmed = sessions.reduce((s, x) => s + x.confirmed, 0);
  const totalAttended  = sessions.reduce((s, x) => s + x.attended, 0);
  const avgFill        = totalSessions > 0
    ? Math.round(sessions.reduce((s, x) => s + (x.spots > 0 ? x.confirmed / x.spots : 0), 0) / totalSessions * 100)
    : 0;

  // Grouper par date
  const grouped = sessions.reduce((acc, s) => {
    (acc[s.session_date] = acc[s.session_date] || []).push(s);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const p = isMobile ? 12 : 24;

  return (
    <div style={{ padding: p, maxWidth: 860, margin: "0 auto" }}>

      {/* ── Titre + Tabs ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 12 }}>Historique</div>
        <div style={{ display: "flex", gap: 4, background: C.bg, borderRadius: 10, padding: 3 }}>
          {[{key:"seances",label:"Séances"},{key:"compta",label:"Comptabilité"},{key:"activite",label:"Activité"}].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              style={{ flex: 1, padding: "8px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer",
                background: activeTab === t.key ? C.accent : "transparent", color: activeTab === t.key ? "#fff" : C.textMuted }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Comptabilité ── */}
      {activeTab === "compta" && (
        <div>
          {/* Sélecteur année */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <select value={comptaYear} onChange={e => setComptaYear(parseInt(e.target.value))}
              style={{ fontSize: 14, padding: "8px 14px", border: `1.5px solid ${C.border}`, borderRadius: 8, color: C.text, background: C.surfaceWarm, fontWeight: 600 }}>
              {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: C.accent }}>{compta ? compta.total.toLocaleString("fr-FR", {minimumFractionDigits:2, maximumFractionDigits:2}) + " €" : "—"}</div>
              <div style={{ fontSize: 12, color: C.textSoft }}>CA cumul — année {comptaYear}</div>
            </div>
          </div>

          {/* Tableau mensuel */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 0.8fr 0.8fr 0.8fr", padding: "10px 16px", background: C.bg, borderBottom: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase" }}>Mois</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", textAlign: "right" }}>Montant</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", textAlign: "right" }}>Paiements</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", textAlign: "right" }}>Séances</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", textAlign: "right" }}>Remplissage</div>
            </div>
            {compta ? compta.months.map((m, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 0.8fr 0.8fr 0.8fr", padding: "10px 16px", borderBottom: `1px solid ${C.borderSoft}`, background: m.amount > 0 ? "#FDFAF7" : C.surface }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{m.label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: m.amount > 0 ? C.ok : C.textMuted, textAlign: "right" }}>{m.amount.toLocaleString("fr-FR", {minimumFractionDigits:2})} €</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: m.nbPayments > 0 ? C.text : C.textMuted, textAlign: "right" }}>{m.nbPayments}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: m.nbSessions > 0 ? C.text : C.textMuted, textAlign: "right" }}>{m.nbSessions}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: m.fillRate > 0 ? (m.fillRate >= 75 ? C.ok : C.accent) : C.textMuted, textAlign: "right" }}>{m.fillRate > 0 ? m.fillRate + " %" : "—"}</div>
              </div>
            )) : (
              <div style={{ padding: 20, textAlign: "center", color: C.textMuted, fontSize: 13 }}>Chargement...</div>
            )}
            {compta && (
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 0.8fr 0.8fr 0.8fr", padding: "12px 16px", background: C.accentBg, borderTop: `2px solid ${C.accent}` }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: C.accentDark }}>TOTAL</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: C.accent, textAlign: "right" }}>{compta.total.toLocaleString("fr-FR", {minimumFractionDigits:2})} €</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.accentDark, textAlign: "right" }}>{compta.totalPayments}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.accentDark, textAlign: "right" }}>{compta.totalSessions}</div>
                <div style={{ fontSize: 13, color: C.accentDark, textAlign: "right" }}>—</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Activité ── */}
      {activeTab === "activite" && (
        <div>
          {/* Filtres période + type */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: "uppercase" }}>DU</label>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                  style={{ padding: "7px 10px", border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.text, background: C.surfaceWarm }}/>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: "uppercase" }}>AU</label>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                  style={{ padding: "7px 10px", border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.text, background: C.surfaceWarm }}/>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: "uppercase" }}>TYPE</label>
                <select value={activityFilter} onChange={e => setActivityFilter(e.target.value)}
                  style={{ padding: "7px 10px", border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.text, background: C.surfaceWarm }}>
                  <option value="all">Tout</option>
                  <option value="credit">Crédits</option>
                  <option value="booking">Réservations</option>
                  <option value="payment">Paiements</option>
                  <option value="member">Membres</option>
                </select>
              </div>
            </div>
          </div>

          {activity === null && <div style={{ textAlign: "center", padding: 40, color: C.textMuted }}>Chargement…</div>}
          {activity?.length === 0 && <div style={{ textAlign: "center", padding: 40, color: C.textMuted, fontSize: 14 }}>Aucune activité sur cette période</div>}
          {activity?.length > 0 && (() => {
            const filtered = activity.filter(a => {
              if (activityFilter === "all") return true;
              if (activityFilter === "credit")  return a.action.startsWith("credit_");
              if (activityFilter === "booking") return a.action.startsWith("booking_");
              if (activityFilter === "payment") return a.action === "payment";
              if (activityFilter === "member")  return a.action.startsWith("member_") || a.action === "subscription_change";
              return true;
            });
            // Grouper par jour
            const byDay = {};
            filtered.forEach(a => {
              const d = a.created_at.slice(0, 10);
              if (!byDay[d]) byDay[d] = [];
              byDay[d].push(a);
            });
            const days = Object.keys(byDay).sort((a, b) => b.localeCompare(a));
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {days.map(day => (
                  <div key={day}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", padding: "6px 10px", background: C.bg, borderRadius: 16, display: "inline-block", marginBottom: 8 }}>
                      {formatDate(day)}
                    </div>
                    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
                      {byDay[day].map(a => {
                        const time = a.created_at.slice(11, 16);
                        const memberName = a.members ? `${a.members.first_name || ""} ${a.members.last_name || ""}`.trim() : "—";
                        const label = actionLabel(a.action, a.details);
                        const color = actionColor(a.action);
                        return (
                          <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderBottom: `1px solid ${C.borderSoft}` }}>
                            <div style={{ fontSize: 11, color: C.textMuted, fontVariantNumeric: "tabular-nums", minWidth: 40 }}>{time}</div>
                            <div style={{ width: 28, height: 28, borderRadius: 8, background: color.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{color.icon}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{memberName}</div>
                              <div style={{ fontSize: 12, color: C.textSoft, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</div>
                            </div>
                            <div style={{ fontSize: 11, color: C.textMuted, background: C.bg, padding: "2px 8px", borderRadius: 10, flexShrink: 0 }}>{a.actor_role || "—"}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {activeTab === "seances" && <>
      {/* ── Filtres ── */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: C.textSoft, textTransform: "uppercase", letterSpacing: 0.8 }}>Du</label>
            <input type="date" value={dateFrom} max={dateTo}
              onChange={e => setDateFrom(e.target.value)}
              style={{ fontSize: 13, padding: "6px 10px", border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, background: C.bg }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: C.textSoft, textTransform: "uppercase", letterSpacing: 0.8 }}>Au</label>
            <input type="date" value={dateTo} max={today}
              onChange={e => setDateTo(e.target.value)}
              style={{ fontSize: 13, padding: "6px 10px", border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, background: C.bg }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: C.textSoft, textTransform: "uppercase", letterSpacing: 0.8 }}>Discipline</label>
            <select value={filterDisc} onChange={e => setFilterDisc(e.target.value)}
              style={{ fontSize: 13, padding: "6px 10px", border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, background: C.bg, minWidth: 160 }}>
              <option value="all">Toutes</option>
              {disciplines.map(d => (
                <option key={d.id} value={d.id}>{d.icon} {d.name}</option>
              ))}
            </select>
          </div>
        </div>
        {/* Raccourcis */}
        <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
          {[
            { label: "7 jours",  days: 7   },
            { label: "30 jours", days: 30  },
            { label: "3 mois",   days: 90  },
            { label: "1 an",     days: 365 },
          ].map(p => {
            const d = new Date(); d.setDate(d.getDate() - p.days);
            const from = toISO(d);
            const active = dateFrom === from && dateTo === today;
            return (
              <button key={p.label}
                onClick={() => { setDateFrom(from); setDateTo(today); }}
                style={{ fontSize: 12, padding: "5px 12px", borderRadius: 8, border: `1px solid ${active ? C.accent : C.border}`, background: active ? C.accentBg : C.surface, color: active ? C.accentDark : C.textSoft, cursor: "pointer", fontWeight: 600 }}>
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── KPIs ── */}
      {!loading && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
          <KpiCard label="Séances" value={totalSessions} color={C.accent} bg={C.accentBg} />
          <KpiCard label="Inscrits" value={totalConfirmed} color={C.info} bg={C.infoBg} sub="confirmés" />
          <KpiCard label="Présences" value={totalAttended} color={C.ok} bg={C.okBg} sub="validées" />
          <KpiCard
            label="Taux de remplissage" value={`${avgFill}%`}
            color={avgFill > 75 ? C.ok : avgFill > 40 ? C.accent : C.warn}
            bg={avgFill > 75 ? C.okBg : avgFill > 40 ? C.accentBg : C.warnBg}
          />
        </div>
      )}

      {/* ── Liste ── */}
      {loading ? (
        <div style={{ padding: 48, textAlign: "center", color: C.textMuted, fontSize: 14 }}>Chargement…</div>
      ) : sessions.length === 0 ? (
        <div style={{ padding: 48, textAlign: "center", color: C.textMuted }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.textSoft }}>Aucune séance sur cette période</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>Modifiez les filtres pour élargir la recherche</div>
        </div>
      ) : (
        sortedDates.map(date => (
          <div key={date} style={{ marginBottom: 24 }}>
            {/* Entête jour */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.textMid, background: C.bgDeep, padding: "4px 12px", borderRadius: 20 }}>
                {formatDate(date)}
              </div>
              <div style={{ flex: 1, height: 1, background: C.borderSoft }} />
              <span style={{ fontSize: 11, color: C.textMuted }}>{grouped[date].length} séance{grouped[date].length > 1 ? "s" : ""}</span>
            </div>

            {/* Séances du jour */}
            {grouped[date].map(s => {
              const isExp = expandedId === s.id;
              const bk = bookings[s.id] || [];
              const attendPct = s.confirmed > 0 ? Math.round(s.attended / s.confirmed * 100) : 0;
              const fillPct   = s.spots > 0 ? Math.round(s.confirmed / s.spots * 100) : 0;

              return (
                <div key={s.id} style={{ border: `1.5px solid ${isExp ? C.accent : C.borderSoft}`, borderRadius: 12, overflow: "hidden", marginBottom: 8, boxShadow: isExp ? `0 2px 12px rgba(160,104,56,.12)` : "0 1px 3px rgba(0,0,0,.04)" }}>

                  {/* Ligne principale */}
                  <div onClick={() => toggleSession(s.id)}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", cursor: "pointer", background: isExp ? C.accentBg : C.surface }}>
                    <div style={{ width: 4, height: 40, borderRadius: 3, background: s.disc?.color || C.accent, flexShrink: 0 }} />
                    <div style={{ fontSize: 14, fontWeight: 800, color: C.accent, width: 42, flexShrink: 0 }}>
                      {s.session_time?.slice(0, 5)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                        <span style={{ fontSize: 15 }}>{s.disc?.icon || "🧘"}</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{s.disc?.name || "Séance"}</span>
                        {s.status === "cancelled" && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: C.warn, background: C.warnBg, padding: "2px 8px", borderRadius: 12 }}>Annulée</span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: C.textSoft }}>{s.teacher} · {s.room} · {s.duration_min} min</div>
                    </div>
                    {/* Stats mini */}
                    <div style={{ display: "flex", gap: isMobile ? 10 : 20, flexShrink: 0, alignItems: "center" }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: fillPct >= 100 ? C.warn : C.text }}>{s.confirmed}/{s.spots}</div>
                        <div style={{ fontSize: 10, color: C.textMuted }}>inscrits</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: s.attended > 0 ? C.ok : C.textMuted }}>{s.attended}</div>
                        <div style={{ fontSize: 10, color: C.textMuted }}>présents</div>
                      </div>
                      {!isMobile && s.confirmed > 0 && (
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 14, fontWeight: 800, color: attendPct >= 80 ? C.ok : attendPct >= 50 ? C.accent : C.warn }}>{attendPct}%</div>
                          <div style={{ fontSize: 10, color: C.textMuted }}>présence</div>
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: C.textMuted, transform: isExp ? "rotate(180deg)" : "none", transition: "transform .2s" }}>▼</div>
                  </div>

                  {/* Accordéon inscrits */}
                  {isExp && (
                    <div style={{ borderTop: `1px solid ${C.borderSoft}`, background: C.surfaceWarm }}>
                      {bk.length === 0 ? (
                        <div style={{ padding: "16px", textAlign: "center", color: C.textMuted, fontSize: 13 }}>
                          {s.confirmed === 0 ? "Aucun inscrit" : "Chargement…"}
                        </div>
                      ) : (
                        <>
                          <div style={{ padding: "10px 16px 4px", fontSize: 11, fontWeight: 700, color: C.textSoft, textTransform: "uppercase", letterSpacing: 0.8 }}>
                            Inscrits — cliquer pour valider la présence
                          </div>
                          {bk.map(b => {
                            const m = b.members;
                            const attended = b.attended === true;
                            const absent   = b.attended === false;
                            return (
                              <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 16px", borderBottom: `1px solid ${C.borderSoft}` }}>
                                <div style={{ width: 30, height: 30, borderRadius: "50%", background: attended ? C.okBg : C.accentBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: attended ? C.ok : C.accent, flexShrink: 0 }}>
                                  {m?.first_name?.[0]}{m?.last_name?.[0]}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{m?.first_name} {m?.last_name}</div>
                                  {!isMobile && <div style={{ fontSize: 11, color: C.textSoft }}>{m?.email}</div>}
                                </div>
                                {attended && <span style={{ fontSize: 11, fontWeight: 700, color: C.ok, background: C.okBg, padding: "3px 10px", borderRadius: 12 }}>✓ Présent</span>}
                                {absent   && <span style={{ fontSize: 11, fontWeight: 700, color: C.warn, background: C.warnBg, padding: "3px 10px", borderRadius: 12 }}>✗ Absent</span>}
                                {b.attended === null && <span style={{ fontSize: 11, color: C.textMuted, background: C.bgDeep, padding: "3px 10px", borderRadius: 12 }}>—</span>}
                                <button onClick={() => toggleAttended(b.id, s.id, b.attended)}
                                  style={{ fontSize: 11, padding: "4px 10px", borderRadius: 8, border: `1px solid ${attended ? C.border : C.ok}`, background: attended ? C.surface : C.okBg, color: attended ? C.textSoft : C.ok, cursor: "pointer", fontWeight: 600, flexShrink: 0 }}>
                                  {attended ? "Absent" : "✓ Présent"}
                                </button>
                              </div>
                            );
                          })}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))
      )}
      </>}
    </div>
  );
}