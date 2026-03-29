"use client";

import React, { useState, useEffect, useContext, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { AppCtx } from "./context";
import { C } from "./theme";
import { DISCIPLINES, SESSIONS_DEMO } from "./demoData";
import { IcoChevron, IcoCalendar2, IcoCheck, IcoX, IcoMail, DISC_ICONS, IcoActivity, IcoUserPlus2 } from "./icons";
import { Card, SectionHead, Button, Field, DateLabel, Pill, DemoBanner, EmptyState } from "./ui";
import { DatePicker, TimePicker, DurationPicker, DaySelect } from "./pickers";
import { PlanningAccordion, stLbl, stStyle } from "./accordion";

// ── Multi-select dropdown disciplines ────────────────────────────────────────
function MultiDiscSelect({ label, value = [], onChange, options, placeholder = "Toutes les disciplines" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const toggle = id => {
    const sid = String(id);
    onChange(value.includes(sid) ? value.filter(v => v !== sid) : [...value, sid]);
  };
  const selected = options.filter(d => value.includes(String(d.id)));

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {label && <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: .8, marginBottom: 5 }}>{label}</div>}
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{ width: "100%", minHeight: 40, padding: "7px 12px", border: `1.5px solid ${open ? C.accent : C.border}`, borderRadius: 8, background: C.surface, cursor: "pointer", display: "flex", alignItems: "center", flexWrap: "wrap", gap: 5, textAlign: "left", boxSizing: "border-box", transition: "border-color .15s" }}>
        {selected.length === 0
          ? <span style={{ fontSize: 13, color: C.textMuted, flex: 1 }}>{placeholder}</span>
          : selected.map(d => (
              <span key={d.id} style={{ fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: `${d.color || C.accent}18`, color: d.color || C.accent, border: `1px solid ${d.color || C.accent}40`, display: "flex", alignItems: "center", gap: 4 }}>
                {d.icon} {d.name}
                <span onClick={e => { e.stopPropagation(); toggle(d.id); }} style={{ cursor: "pointer", fontSize: 11, lineHeight: 1 }}>✕</span>
              </span>
            ))
        }
        <span style={{ fontSize: 10, color: C.textMuted, marginLeft: "auto", flexShrink: 0 }}>▾</span>
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: C.surface, border: `1.5px solid ${C.accent}`, borderRadius: 10, zIndex: 200, boxShadow: "0 8px 24px rgba(0,0,0,.13)", overflow: "hidden", maxHeight: 240, overflowY: "auto" }}>
          {value.length > 0 && (
            <div style={{ padding: "7px 12px", borderBottom: `1px solid ${C.borderSoft}` }}>
              <button type="button" onClick={() => onChange([])} style={{ fontSize: 12, color: C.textMuted, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>✕ Tout désélectionner</button>
            </div>
          )}
          {options.map(d => {
            const active = value.includes(String(d.id));
            return (
              <div key={d.id} onClick={() => toggle(d.id)}
                style={{ padding: "9px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${C.borderSoft}`, background: active ? `${d.color || C.accent}10` : "transparent", transition: "background .1s" }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = C.surfaceWarm; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}>
                <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${active ? d.color || C.accent : C.border}`, background: active ? d.color || C.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .15s" }}>
                  {active && <span style={{ color: "#fff", fontSize: 11, fontWeight: 800 }}>✓</span>}
                </div>
                <span style={{ fontSize: 15 }}>{d.icon}</span>
                <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? d.color || C.accent : C.text }}>{d.name}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Single discipline dropdown ───────────────────────────────────────────────
function DiscSelect({ label, value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find(d => String(d.id) === String(value));

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {label && <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: .8, marginBottom: 5 }}>{label}</div>}
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{ width: "100%", padding: "9px 12px", border: `1.5px solid ${open ? C.accent : C.border}`, borderRadius: 8, background: C.surface, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, textAlign: "left", boxSizing: "border-box", transition: "border-color .15s" }}>
        {selected ? (
          <>
            <span style={{ width: 24, height: 24, borderRadius: 6, background: `${selected.color || C.accent}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{selected.icon || "🏃"}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text, flex: 1 }}>{selected.name}</span>
          </>
        ) : <span style={{ fontSize: 13, color: C.textMuted, flex: 1 }}>— Choisir —</span>}
        <span style={{ fontSize: 10, color: C.textMuted }}>▾</span>
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: C.surface, border: `1.5px solid ${C.accent}`, borderRadius: 10, zIndex: 200, boxShadow: "0 8px 24px rgba(0,0,0,.12)", overflow: "hidden", maxHeight: 220, overflowY: "auto" }}>
          {options.map(d => {
            const active = String(d.id) === String(value);
            return (
              <div key={d.id} onClick={() => { onChange(String(d.id)); setOpen(false); }}
                style={{ padding: "9px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${C.borderSoft}`, background: active ? `${d.color || C.accent}12` : "transparent" }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = C.surfaceWarm; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = active ? `${d.color || C.accent}12` : "transparent"; }}>
                <span style={{ width: 28, height: 28, borderRadius: 7, background: `${d.color || C.accent}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>{d.icon || "🏃"}</span>
                <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? d.color || C.accent : C.text, flex: 1 }}>{d.name}</span>
                {active && <span style={{ color: d.color || C.accent, fontSize: 13 }}>✓</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Session card ─────────────────────────────────────────────────────────────
function PlanningSessionCard({ sess, expandedId, bookings, discs, onToggle, onChangeStatus, onDelete, onCancel, onRestore, onAddBooking, onSendReminder, closures = [], isMobile = false, onConfirm, roomsList = [] }) {
  const allDiscs = discs?.length ? discs : DISCIPLINES;
  const disc = allDiscs.find(d => String(d.id) === String(sess.disciplineId)) || allDiscs[0] || { name: "Cours", color: C.accent, icon: "🧘" };
  const bl     = bookings[sess.id] || [];
  const booked = bl.length ? bl.filter(b => b.st === "confirmed").length : sess.booked;
  const wait   = bl.length ? bl.filter(b => b.st === "waitlist").length  : sess.waitlist;
  const pct    = booked / sess.spots;
  const isExp  = expandedId === sess.id;
  const isFull = booked >= sess.spots;

  // Calcul statut temporel
  const now = new Date();
  const sessStart = new Date(`${sess.date}T${sess.time}`);
  const sessEnd   = new Date(sessStart.getTime() + (sess.duration||60) * 60000);
  const isClosed = closures.some(c => sess.date >= c.date_start && sess.date <= c.date_end);
  const sessionStatus = sess.status === "cancelled" ? "cancelled"
    : isClosed ? "closed"
    : now < sessStart ? "upcoming"
    : now <= sessEnd  ? "ongoing"
    : "past";
  const displayStatus = (sessionStatus === "upcoming" && isFull) ? "full" : sessionStatus;
  const statusLabel = { upcoming:"À venir", full:"Complet", ongoing:"En cours", past:"Terminée", cancelled:"Annulée", closed:"Fermé — congés" };
  const statusStyle = {
    upcoming: { color:"#7C9EC8", bg:"#EEF4FA" },
    full:     { color:"#A85030", bg:"#FFF0F0"  },
    ongoing:  { color:C.ok,     bg:C.okBg    },
    past:     { color:"#6B5A47", bg:"#E8DDD0" },
    cancelled:{ color:C.warn,   bg:"#FFF5F5"  },
    closed:   { color:"#856404", bg:"#FFF3CD"  },
  }[displayStatus];

  return (
    <div style={{ border: `1.5px solid ${isExp ? C.accent : C.borderSoft}`, borderRadius: 14, overflow: "hidden", marginBottom: 8, boxShadow: isExp ? `0 2px 12px rgba(176,120,72,.13)` : "0 1px 3px rgba(0,0,0,.05)", transition: "all .2s" }}>
      <div onClick={() => onToggle(sess.id)}
        style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", cursor: "pointer", background: isExp ? C.accentBg : C.surface, transition: "background .15s", flexWrap: (isExp && isMobile) ? "wrap" : "nowrap" }}
        onMouseEnter={e => { if (!isExp) e.currentTarget.style.background = C.surfaceWarm; }}
        onMouseLeave={e => { if (!isExp) e.currentTarget.style.background = C.surface; }}>
        <div style={{ width: 4, height: 42, borderRadius: 3, background: disc.color, flexShrink: 0 }} />
        <div style={{ fontSize: 13, fontWeight: 800, color: C.accent, width: 40, flexShrink: 0 }}>{sess.time}</div>
        <div style={{ flex: 1, minWidth: 0, width: (isExp && isMobile) ? "calc(100% - 60px)" : "auto" }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ fontSize: 16 }}>{disc.icon}</span>{disc.name}
          </div>
          <div style={{ fontSize: 12, color: C.textSoft, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {sess.teacher && <><span style={{ fontWeight: 600 }}>{sess.teacher}</span> · </>}{sess.room} · {sess.duration}min
          </div>
          {(() => {
            const rd = (roomsList||[]).find(r => r.name === sess.room);
            if (!rd?.location && !rd?.address) return null;
            const loc = rd.location || rd.address;
            return (
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {rd.maps_url
                  ? <a href={rd.maps_url} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} style={{ color:C.accent, textDecoration:"none", fontWeight:600 }}>📍 {loc}</a>
                  : <>📍 {loc}</>
                }
              </div>
            );
          })()}
        </div>
        {(!isExp || !isMobile) && (
          <div style={{ flexShrink: 0, textAlign: "right", marginRight: 4 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: isFull ? C.warn : C.text }}>{booked}/{sess.spots}</div>
            <div style={{ width: 48, height: 4, background: C.bgDeep, borderRadius: 3, marginTop: 4 }}>
              <div style={{ height: "100%", width: `${Math.min(pct * 100, 100)}%`, background: isFull ? C.warn : pct > .75 ? C.accent : C.ok, borderRadius: 3 }} />
            </div>
            {wait > 0 && <div style={{ fontSize: 11, color: C.accent, fontWeight: 700, marginTop: 2 }}>+{wait} att.</div>}
          </div>
        )}
        {/* Boutons actions inline (séance expanded) */}
        {isExp && (
          <div onClick={e => e.stopPropagation()} style={{ display: "flex", gap: 4, flexShrink: 0, ...(isMobile ? { width:"100%", paddingTop:6, borderTop:`1px solid ${C.borderSoft}`, marginTop:2 } : {}) }}>
            {sess.status !== "cancelled" && onCancel && (
              <button onClick={() => onCancel(sess.id)} title="Annuler cette séance"
                style={{ display:"flex", alignItems:"center", gap:4, fontSize: 12, padding: "5px 9px", borderRadius: 8, border: `1px solid #EFC8BC`, background: "#FFF5F5", color: C.warn, cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" }}>
                ⚠ Annuler
              </button>
            )}
            {sess.status === "cancelled" && onCancel && (
              <button onClick={() => onConfirm
                ? onConfirm("Rétablir cette séance ?", () => onRestore && onRestore(sess.id))
                : onRestore && onRestore(sess.id)
              } title="Rétablir la séance"
                style={{ display:"flex", alignItems:"center", gap:4, fontSize: 12, padding: "5px 9px", borderRadius: 8, border: `1px solid #B8DFC4`, background: C.okBg, color: C.ok, cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" }}>
                ↩ Rétablir
              </button>
            )}
            {onDelete && (
              <button onClick={() => onConfirm
                ? onConfirm("Supprimer cette séance ?", () => onDelete(sess.id), { subMsg:"Cette action est irréversible.", danger:true })
                : onDelete(sess.id)
              } title="Supprimer définitivement"
                style={{ display:"flex", alignItems:"center", gap:4, fontSize: 12, padding: "5px 9px", borderRadius: 8, border: `1px solid #EFC8BC`, background: "#FDE8E8", color: "#A85030", cursor: "pointer", fontWeight: 600, whiteSpace:"nowrap" }}>
                ✕ Supprimer
              </button>
            )}
          </div>
        )}
        <span style={{ flexShrink: 0, display: "inline-flex", transition: "transform .2s", transform: isExp ? "rotate(180deg)" : "none" }}><IcoChevron s={16} c={C.textMuted} /></span>
      </div>
      <div style={{ padding:"4px 14px 5px", display:"flex", alignItems:"center", gap:5, background:statusStyle.bg, borderTop:`1.5px solid ${statusStyle.color}44` }}>
        {sessionStatus === "ongoing"   && <span style={{ width:7, height:7, borderRadius:"50%", background:C.ok, display:"inline-block", animation:"pulse 1.2s ease-in-out infinite" }}/>}
        {sessionStatus === "cancelled" && <span style={{ fontSize:12 }}>⚠</span>}
        {sessionStatus === "closed"    && <span style={{ fontSize:12 }}>🔒</span>}
        {displayStatus === "full"      && <span style={{ fontSize:12 }}>🔒</span>}
        <span style={{ fontSize:11, fontWeight:700, color:statusStyle.color, letterSpacing:.3, textTransform:"uppercase" }}>{statusLabel[displayStatus]}</span>
        {sessionStatus === "past" && (() => {
          const bl = bookings[sess.id] || [];
          const confirmed = bl.filter(b => b.st === "confirmed");
          const present  = confirmed.filter(b => b.attended === true).length;
          const absent   = confirmed.filter(b => b.attended === false).length;
          const pending  = confirmed.length - present - absent;
          if (confirmed.length === 0) return null;
          return (
            <span style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:6 }}>
              {present > 0 && (
                <span style={{ fontSize:11, fontWeight:700, padding:"1px 7px", borderRadius:10, background:C.okBg, color:C.ok }}>
                  ✓ {present} présent{present>1?"s":""}
                </span>
              )}
              {absent > 0 && (
                <span style={{ fontSize:11, fontWeight:700, padding:"1px 7px", borderRadius:10, background:C.warnBg, color:C.warn }}>
                  ✗ {absent} absent{absent>1?"s":""}
                </span>
              )}
              {pending > 0 && (
                <span style={{ fontSize:11, fontWeight:700, padding:"1px 7px", borderRadius:10, background:"#FEF3C7", color:"#92400E" }}>
                  ⏳ {pending} en attente
                </span>
              )}
            </span>
          );
        })()}
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
      {isExp && (
        <PlanningAccordion sess={sess} sessId={sess.id} bookings={bookings}
          onChangeStatus={onChangeStatus} onAddBooking={onAddBooking} onSendReminder={onSendReminder} />
      )}
    </div>
  );
}

// ── Modale inscrire adhérent ou invité ───────────────────────────────────────
function BookingModal({ sessId, sessions, studioId, bookings, setBookings, setSessions, onClose }) {
  const [mode, setMode] = useState("member"); // "member" | "guest"
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(null);
  const [selected, setSelected] = useState([]); // multi-select members
  const inp = useRef(null);
  // Guest form
  const [guestName, setGuestName] = useState("");
  const [hostId, setHostId] = useState(null);
  const [hostName, setHostName] = useState("");
  const [hostSearch, setHostSearch] = useState("");
  const [hostResults, setHostResults] = useState([]);
  const [savedGuests, setSavedGuests] = useState([]); // invités enregistrés du membre hôte
  const [saveGuest, setSaveGuest] = useState(true); // sauvegarder le nouvel invité

  useEffect(() => { setTimeout(() => inp.current?.focus(), 80); }, []);

  // Charger les invités enregistrés quand un hôte est sélectionné
  useEffect(() => {
    if (!hostId) { setSavedGuests([]); return; }
    createClient().from("member_guests").select("id, name, phone")
      .eq("member_id", hostId).order("name")
      .then(({ data }) => setSavedGuests(data || []));
  }, [hostId]);

  async function search(v) {
    setQ(v);
    if (!v || v.length < 2) { setResults([]); return; }
    setLoading(true);
    const { data } = await createClient().from("members")
      .select("id, first_name, last_name, email, phone")
      .eq("studio_id", studioId)
      .or(`first_name.ilike.%${v}%,last_name.ilike.%${v}%,email.ilike.%${v}%`)
      .limit(8);
    if (!data || data.length === 0) {
      try {
        const res = await fetch(`/api/members?studioId=${studioId}&search=${encodeURIComponent(v)}`);
        const json = await res.json();
        setResults(json.members || []);
      } catch { setResults([]); }
    } else {
      setResults(data);
    }
    setLoading(false);
  }

  async function searchHost(v) {
    setHostSearch(v);
    if (!v || v.length < 2) { setHostResults([]); return; }
    const { data } = await createClient().from("members")
      .select("id, first_name, last_name, email")
      .eq("studio_id", studioId)
      .or(`first_name.ilike.%${v}%,last_name.ilike.%${v}%,email.ilike.%${v}%`)
      .limit(6);
    setHostResults(data || []);
  }

  function toggleSelect(member) {
    const already = (bookings[sessId] || []).some(b => b.memberId === member.id && b.st !== "cancelled");
    if (already) return; // déjà inscrit
    setSelected(prev => prev.some(m => m.id === member.id) ? prev.filter(m => m.id !== member.id) : [...prev, member]);
  }

  async function confirmSelected() {
    const toBook = selected.length > 0 ? selected : [];
    if (!toBook.length || confirming) return;
    setConfirming(true);
    let booked = 0;
    const newBookings = [];
    for (const member of toBook) {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ sessionId: sessId, memberId: member.id, studioId, force: true }),
      });
      const data = await res.json();
      if (data.ok) {
        booked += data.status === "confirmed" ? 1 : 0;
        newBookings.push({ id: data.bookingId, memberId: member.id, st: data.status, attended: null,
          name: `${member.first_name || ""} ${member.last_name || ""}`.trim(),
          email: member.email || "", phone: member.phone || "" });
      }
    }
    if (newBookings.length > 0) {
      setBookings(prev => ({ ...prev, [sessId]: [...(prev[sessId] || []), ...newBookings] }));
      setSessions(prev => prev.map(s => s.id === sessId ? { ...s, booked: s.booked + booked } : s));
    }
    setConfirming(false);
    setDone(newBookings.length > 0 ? `${newBookings.length} inscrit${newBookings.length > 1 ? "s" : ""}` : "already");
  }

  // Raccourci : clic direct si pas encore en mode multi-select
  async function confirm(member) {
    if (confirming) return;
    const already = (bookings[sessId] || []).some(b => b.memberId === member.id && b.st !== "cancelled");
    if (already) { setDone("already"); return; }
    setSelected([member]);
    setConfirming(true);
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ sessionId: sessId, memberId: member.id, studioId, force: true }),
    });
    const data = await res.json();
    setConfirming(false);
    if (data.already) { setDone("already"); return; }
    if (data.ok) {
      const nb = { id: data.bookingId, memberId: member.id, st: data.status, attended: null,
        name: `${member.first_name || ""} ${member.last_name || ""}`.trim(),
        email: member.email || "", phone: member.phone || "" };
      setBookings(prev => ({ ...prev, [sessId]: [...(prev[sessId] || []), nb] }));
      setSessions(prev => prev.map(s => s.id === sessId ? { ...s, booked: s.booked + (data.status === "confirmed" ? 1 : 0) } : s));
      setDone(data.status);
    }
    setSelected([]);
  }

  async function confirmGuest(name) {
    const finalName = (name || guestName).trim();
    if (!finalName || !hostId || confirming) return;
    setConfirming(true);
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ sessionId: sessId, studioId, guestName: finalName, hostMemberId: hostId, force: true }),
    });
    const data = await res.json();
    setConfirming(false);
    if (data.ok) {
      if (saveGuest && !savedGuests.some(g => g.name.toLowerCase() === finalName.toLowerCase())) {
        createClient().from("member_guests").insert({ member_id: hostId, studio_id: studioId, name: finalName })
          .then(() => setSavedGuests(prev => [...prev, { id: Date.now(), name: finalName }]));
      }
      const nb = { id: data.bookingId, memberId: null, st: data.status, attended: null,
        name: `${finalName} (invité)`,
        email: "", phone: "", isGuest: true, hostMemberId: hostId };
      setBookings(prev => ({ ...prev, [sessId]: [...(prev[sessId] || []), nb] }));
      setSessions(prev => prev.map(s => s.id === sessId ? { ...s, booked: s.booked + (data.status === "confirmed" ? 1 : 0) } : s));
      setDone(data.status);
    }
  }

  const tabStyle = (active) => ({
    flex: 1, padding: "8px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer",
    background: active ? C.accent : "transparent", color: active ? "#fff" : C.textMuted,
  });

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={onClose}>
      <div style={{ background: C.surface, borderRadius: 18, padding: 24, width: "100%", maxWidth: 420, boxShadow: "0 12px 48px rgba(0,0,0,.2)" }}
        onClick={e => e.stopPropagation()}>
        {done ? (
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>{done === "already" ? "⚠" : done === "confirmed" ? "OK" : "..."}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 6 }}>
              {done === "already" ? "Déjà inscrit" : done === "confirmed" ? "Inscrit avec succès" : done?.includes("inscrit") ? done : "Ajouté en liste d'attente"}
            </div>
            <div style={{ fontSize: 13, color: C.textSoft, marginBottom: 18 }}>
              {done === "already" ? "Ce membre est déjà inscrit à cette séance." : done === "confirmed" ? "La réservation est confirmée." : done?.includes("inscrit") ? "Les réservations sont confirmées." : "La séance est complète, en attente."}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setDone(null); setQ(""); setResults([]); setSelected([]); setGuestName(""); setHostId(null); setHostName(""); setHostSearch(""); setHostResults([]); }} style={{ flex: 1, padding: "9px", borderRadius: 9, border: `1px solid ${C.border}`, background: C.surfaceWarm, color: C.textSoft, fontSize: 14, cursor: "pointer", fontWeight: 600 }}>Inscrire un autre</button>
              <button onClick={onClose} style={{ flex: 1, padding: "9px", borderRadius: 9, border: "none", background: C.accent, color: "#fff", fontSize: 14, cursor: "pointer", fontWeight: 700 }}>Fermer</button>
            </div>
          </div>
        ) : (
          <>
            {/* Tabs : Adhérent / Invité */}
            <div style={{ display: "flex", gap: 4, background: C.bg, borderRadius: 10, padding: 3, marginBottom: 16 }}>
              <button style={tabStyle(mode === "member")} onClick={() => setMode("member")}>Membre</button>
              <button style={tabStyle(mode === "guest")} onClick={() => setMode("guest")}>Invité d'un membre</button>
            </div>

            {confirming && (
              <div style={{ textAlign:"center", padding:"24px 0" }}>
                <div style={{ width:32, height:32, border:`3px solid ${C.border}`, borderTopColor:C.accent, borderRadius:"50%", animation:"spin .6s linear infinite", margin:"0 auto 12px" }}/>
                <div style={{ fontSize:14, color:C.textSoft, fontWeight:600 }}>Inscription en cours...</div>
                <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
              </div>
            )}

            {!confirming && mode === "member" ? (
              <>
                <div style={{ fontSize: 13, color: C.textSoft, marginBottom: 12 }}>Recherchez par nom ou email</div>
                <div style={{ position: "relative", marginBottom: 10 }}>
                  <input ref={inp} placeholder="Nom, prénom ou email…" value={q} onChange={e => search(e.target.value)}
                    style={{ width: "100%", padding: "10px 36px 10px 14px", borderRadius: 9, border: `1.5px solid ${C.border}`, fontSize: 14, outline: "none", boxSizing: "border-box", background: "#FDFAF7" }} />
                  {loading && <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 16 }}>...</span>}
                  {q && !loading && <span onClick={() => { setQ(""); setResults([]); }} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 16, cursor: "pointer", color: C.textMuted }}>x</span>}
                </div>
                {/* Sélection en cours */}
                {selected.length > 0 && (
                  <div style={{ marginBottom: 10, display:"flex", flexWrap:"wrap", gap:6 }}>
                    {selected.map(m => (
                      <span key={m.id} style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"4px 10px", borderRadius:20, background:C.accentBg, border:`1px solid ${C.accent}40`, fontSize:12, fontWeight:600, color:C.accent }}>
                        {m.first_name} {m.last_name}
                        <span onClick={()=>setSelected(prev=>prev.filter(x=>x.id!==m.id))} style={{ cursor:"pointer", fontSize:14, lineHeight:1 }}>x</span>
                      </span>
                    ))}
                  </div>
                )}
                {results.length > 0 && (
                  <div style={{ borderRadius: 10, border: `1px solid ${C.borderSoft}`, overflow: "hidden", marginBottom: 10, maxHeight:240, overflowY:"auto" }}>
                    {results.map(m => {
                      const isSel = selected.some(s => s.id === m.id);
                      const alreadyBooked = (bookings[sessId] || []).some(b => b.memberId === m.id && b.st !== "cancelled");
                      return (
                        <div key={m.id} onClick={() => alreadyBooked ? null : toggleSelect(m)}
                          style={{ padding: "10px 14px", cursor: alreadyBooked ? "default" : "pointer", borderBottom: `1px solid ${C.borderSoft}`, transition: "background .1s",
                            background: isSel ? C.accentBg : alreadyBooked ? "#FAFAF8" : "transparent", opacity: alreadyBooked ? 0.5 : 1,
                            display:"flex", alignItems:"center", gap:10, userSelect:"none", outline:"none" }}>
                          <div style={{ width:18, height:18, borderRadius:4, border:`1.5px solid ${isSel ? C.accent : C.border}`, background:isSel ? C.accent : "transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, pointerEvents:"none" }}>
                            {isSel && <span style={{ color:"#fff", fontSize:12, fontWeight:700 }}>✓</span>}
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{m.first_name} {m.last_name}</div>
                            <div style={{ fontSize: 12, color: C.textMuted }}>{m.email}{m.phone ? " · " + m.phone : ""}{alreadyBooked ? " · déjà inscrit" : ""}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {selected.length >= 1 && (
                  <button onClick={selected.length === 1 ? ()=>confirm(selected[0]) : confirmSelected}
                    style={{ width:"100%", padding:"10px", borderRadius:9, border:"none", background:C.accent, color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer", marginBottom:8 }}>
                    Valider
                  </button>
                )}
                {q.length >= 2 && !loading && results.length === 0 && (
                  <div style={{ fontSize: 13, color: C.textMuted, textAlign: "center", padding: "14px 0" }}>Aucun membre trouvé</div>
                )}
              </>
            ) : (
              <>
                <div style={{ fontSize: 13, color: C.textSoft, marginBottom: 12 }}>L'invité accompagne un membre. Le crédit sera déduit du membre hôte.</div>

                {/* 1. Membre hôte d'abord */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: .8, marginBottom: 5 }}>Membre hôte * <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(crédit déduit)</span></div>
                  {hostId ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 9, border: `1.5px solid ${C.accent}`, background: C.accentBg }}>
                      <div style={{ flex: 1, fontSize: 14, fontWeight: 700, color: C.accent }}>{hostName}</div>
                      <button onClick={() => { setHostId(null); setHostName(""); setHostSearch(""); setSavedGuests([]); }} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, fontSize: 14 }}>x</button>
                    </div>
                  ) : (
                    <>
                      <input value={hostSearch} onChange={e => searchHost(e.target.value)} placeholder="Rechercher le membre hôte…"
                        style={{ width: "100%", padding: "10px 14px", borderRadius: 9, border: `1.5px solid ${C.border}`, fontSize: 14, outline: "none", boxSizing: "border-box", background: "#FDFAF7" }} />
                      {hostResults.length > 0 && (
                        <div style={{ borderRadius: 10, border: `1px solid ${C.borderSoft}`, overflow: "hidden", marginTop: 6 }}>
                          {hostResults.map(m => (
                            <div key={m.id} onClick={() => { setHostId(m.id); setHostName(`${m.first_name} ${m.last_name}`.trim()); setHostSearch(""); setHostResults([]); }}
                              style={{ padding: "8px 14px", cursor: "pointer", borderBottom: `1px solid ${C.borderSoft}`, transition: "background .1s" }}
                              onMouseEnter={e => e.currentTarget.style.background = C.accentBg}
                              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{m.first_name} {m.last_name}</div>
                              <div style={{ fontSize: 11, color: C.textMuted }}>{m.email}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* 2. Invités enregistrés (quick pick) */}
                {hostId && savedGuests.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: .8, marginBottom: 6 }}>Invités de {hostName.split(" ")[0]}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {savedGuests.map(g => (
                        <button key={g.id} onClick={() => confirmGuest(g.name)}
                          style={{ padding: "7px 14px", borderRadius: 20, border: `1.5px solid ${C.accent}40`, background: C.accentBg, color: C.accent, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                          {g.name}
                        </button>
                      ))}
                    </div>
                    <div style={{ fontSize: 11, color: C.textMuted, marginTop: 6 }}>Cliquez pour inscrire directement</div>
                  </div>
                )}

                {/* 3. Ou saisir un nouvel invité */}
                {hostId && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: .8, marginBottom: 5 }}>
                      {savedGuests.length > 0 ? "Ou ajouter un nouvel invité" : "Nom de l'invité *"}
                    </div>
                    <input value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="Prénom Nom"
                      style={{ width: "100%", padding: "10px 14px", borderRadius: 9, border: `1.5px solid ${C.border}`, fontSize: 14, outline: "none", boxSizing: "border-box", background: "#FDFAF7" }} />
                    {guestName.trim() && (
                      <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, fontSize: 12, color: C.textSoft, cursor: "pointer" }}>
                        <input type="checkbox" checked={saveGuest} onChange={e => setSaveGuest(e.target.checked)}
                          style={{ accentColor: C.accent, width: 16, height: 16 }} />
                        Mémoriser cet invité pour {hostName.split(" ")[0]}
                      </label>
                    )}
                  </div>
                )}

                {hostId && guestName.trim() && (
                  <button onClick={() => confirmGuest()}
                    style={{ width: "100%", padding: "10px", borderRadius: 9, border: "none", background: C.accent, color: "#fff", fontSize: 14, cursor: "pointer", fontWeight: 700 }}>
                    Inscrire {guestName.trim()}
                  </button>
                )}
              </>
            )}
            {!confirming && <button onClick={onClose} style={{ marginTop: 8, width: "100%", padding: "9px", borderRadius: 9, border: `1px solid ${C.border}`, background: "transparent", color: C.textSoft, fontSize: 14, cursor: "pointer" }}>Annuler</button>}
          </>
        )}
      </div>
    </div>
  );
}

// ── Planning principal ───────────────────────────────────────────────────────

// ── Modal de confirmation custom ────────────────────────────────────────────
function ConfirmModal({ msg, subMsg = null, danger = false, onConfirm, onCancel }) {
  return (
    <div onClick={onCancel}
      style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.45)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div onClick={e=>e.stopPropagation()}
        style={{ background:"#fff", borderRadius:16, padding:"28px 28px 22px", maxWidth:380, width:"100%", boxShadow:"0 8px 40px rgba(0,0,0,.18)" }}>
        <div style={{ fontSize:16, fontWeight:800, color:"#1A1009", marginBottom:subMsg?8:20 }}>{msg}</div>
        {subMsg && <div style={{ fontSize:13, color:"#7A6652", marginBottom:20, lineHeight:1.5 }}>{subMsg}</div>}
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
          <button onClick={onCancel}
            style={{ padding:"8px 18px", borderRadius:9, border:"1.5px solid #DDD", background:"#fff", color:"#7A6652", fontSize:13, fontWeight:700, cursor:"pointer" }}>
            Annuler
          </button>
          <button onClick={onConfirm}
            style={{ padding:"8px 18px", borderRadius:9, border:"none", background:danger?"#EF4444":"#B07848", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}

function Planning({ isMobile }) {
  const { discs, studioId } = useContext(AppCtx);
  const [sessions, setSessions]       = useState([]);
  const [dbLoading, setDbLoading]     = useState(true);
  const todayRef = useRef(null);
  const today    = new Date().toISOString().slice(0, 10);
  const [bookings, setBookings]       = useState({});
  const [expandedId, setExpandedId]   = useState(null);
  const [filterDiscs, setFilterDiscs] = useState([]); // multi-select
  const [showAdd, setShowAdd]         = useState(false);
  const [nS, setNS] = useState({ disciplineId: "", teacher: "", date: "", time: "09:00", duration: 60, spots: 12, level: "Tous niveaux", room: "Studio A" });
  const [coachesList, setCoachesList] = useState([]);
  const [recMode, setRecMode]         = useState(false);
  const [recFrom, setRecFrom]         = useState("");
  const [recTo, setRecTo]             = useState("");
  const [recSlots, setRecSlots]       = useState([]);
  const [recPreview, setRecPreview]   = useState([]);
  const [recFilterDisc, setRecFilterDisc] = useState(null);
  const [isDemoData, setIsDemoData]   = useState(false);
  const [bookingModal, setBookingModal] = useState(null);
  const [roomsList, setRoomsList]     = useState([]);
  const [closures, setClosures]       = useState([]);
  const [showClosures, setShowClosures] = useState(false);
  const [closureForm, setClosureForm] = useState({ label:"Fermeture", date_start:"", date_end:"", single:true });
  const [closureEdit, setClosureEdit] = useState(null); // null | closure obj
  const [localDiscs, setLocalDiscs]   = useState([]);
  const [discsLoading, setDiscsLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState(null); // { msg, subMsg, danger, onConfirm }
  const [planToast, setPlanToast]     = useState(null); // { msg, ok }
  const p = isMobile ? 12 : 28;

  function showPlanToast(msg, ok=true) {
    setPlanToast({ msg, ok });
    setTimeout(() => setPlanToast(null), 3500);
  }
  function openConfirm(msg, onConfirm, opts={}) {
    setConfirmModal({ msg, subMsg: opts.subMsg||null, danger: opts.danger||false, onConfirm: () => { setConfirmModal(null); onConfirm(); } });
  }

  // ── Helpers fermetures ──────────────────────────────────────────────────────
  function isDateClosed(dateStr) {
    return closures.some(c => dateStr >= c.date_start && dateStr <= c.date_end);
  }
  function getClosureForDate(dateStr) {
    return closures.find(c => dateStr >= c.date_start && dateStr <= c.date_end);
  }
  async function saveClosure(form, editId) {
    const sb = createClient();
    const payload = {
      studio_id: studioId,
      label: form.label || "Fermeture",
      date_start: form.date_start,
      date_end: form.single ? form.date_start : form.date_end,
    };
    if (editId) {
      const { data, error } = await sb.from("studio_closures").update(payload).eq("id", editId).select().single();
      if (error) { showPlanToast("Erreur : " + (error.message || "impossible de modifier"), false); return; }
      if (data) setClosures(prev => prev.map(c => c.id === editId ? data : c).sort((a,b) => a.date_start.localeCompare(b.date_start)));
      showPlanToast("Fermeture modifiée");
    } else {
      const { data, error } = await sb.from("studio_closures").insert(payload).select().single();
      if (error) { showPlanToast("Erreur : " + (error.message || "table manquante — exécutez le SQL de création"), false); return; }
      if (data) setClosures(prev => [...prev, data].sort((a,b) => a.date_start.localeCompare(b.date_start)));
      showPlanToast("Fermeture ajoutée");
    }
  }
  async function deleteClosure(id) {
    const { error } = await createClient().from("studio_closures").delete().eq("id", id);
    if (error) { showPlanToast("Erreur suppression : " + error.message, false); return; }
    setClosures(prev => prev.filter(c => c.id !== id));
    showPlanToast("Fermeture supprimée");
  }

  const DAY_NUM = { Lun: 1, Mar: 2, Mer: 3, Jeu: 4, Ven: 5, Sam: 6, Dim: 0 };
  // Préférer la source qui a les slots — évite le flash vide quand discs arrive sans slots
  const effectiveDiscs = (() => {
    const hasSlots = (arr) => arr?.some(d => d.slots?.length > 0);
    if (hasSlots(discs)) return discs;
    if (hasSlots(localDiscs)) return localDiscs;
    return discs?.length ? discs : localDiscs;
  })();
  const allDiscOptions = (effectiveDiscs.length ? effectiveDiscs : DISCIPLINES).map(d => ({ id: String(d.id), name: d.name, icon: d.icon, color: d.color }));

  // Si le context discs arrive avec des slots, l'utiliser directement
  // Ne PAS vider localDiscs si discs n'a pas de slots — sinon race condition
  useEffect(() => {
    if (discs?.length && discs.some(d => d.slots?.length > 0)) {
      setLocalDiscs([]);
      setDiscsLoading(false);
    }
  }, [discs]); // eslint-disable-line react-hooks/exhaustive-deps

  // Charger disciplines + coachs en parallèle dès que studioId est dispo
  // Inclut les discs du context si déjà chargées, sinon fetch direct
  useEffect(() => {
    if (!studioId) return;
    const sb = createClient();
    // Toujours charger les disciplines depuis Supabase pour éviter race condition au premier rendu
    sb.from("disciplines").select("id,name,icon,color,slots").eq("studio_id", studioId).order("created_at")
      .then(({ data }) => { setLocalDiscs(data?.length ? data.map(d => ({ ...d, slots: d.slots || [] })) : []); setDiscsLoading(false); });
    // Coachs — via /api/team (service role) pour contourner RLS profiles
    fetch(`/api/team?studioId=${studioId}`)
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        if (json?.coaches?.length) {
          setCoachesList(
            json.coaches
              .filter(c => c.is_coach || c.role === "coach")
              .map(c => ({ id: c.id, name: `${c.fn || ""} ${c.ln || ""}`.trim() }))
              .filter(c => c.name)
          );
        }
      })
      .catch(e => console.error("load coaches", e));
    // Salles
    sb.from("rooms").select("id, name, capacity, color, location, address, maps_url").eq("studio_id", studioId).order("name")
      .then(({ data }) => { if (data?.length) setRoomsList(data); });
    // Fermetures
    sb.from("studio_closures").select("*").eq("studio_id", studioId).order("date_start")
      .then(({ data }) => { if (data) setClosures(data); });
  }, [studioId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Charger sessions + bookings
  useEffect(() => {
    if (!studioId) return;
    setDbLoading(true);
    const sb = createClient();
    // Fenêtre J-7 → J+60
    const d7  = new Date(); d7.setDate(d7.getDate() - 7);
    const d60 = new Date(); d60.setDate(d60.getDate() + 60);
    const fromDate = d7.toISOString().slice(0,10);
    const toDate   = d60.toISOString().slice(0,10);
    sb.from("sessions")
      .select("id, discipline_id, teacher, room, level, session_date, session_time, duration_min, spots, status")
      .eq("studio_id", studioId).gte("session_date", fromDate).lte("session_date", toDate)
      .order("session_date").order("session_time")
      .then(async ({ data, error }) => {
        if (error) { setDbLoading(false); return; }
        if (!data || data.length === 0) { setSessions(SESSIONS_DEMO); setIsDemoData(true); setDbLoading(false); return; }
        const mapped = data.map(s => ({
          id: s.id, disciplineId: s.discipline_id,
          teacher: s.teacher || "", room: s.room || "Studio A", level: s.level || "Tous niveaux",
          date: s.session_date, time: s.session_time?.slice(0, 5) || "09:00",
          duration: s.duration_min || 60, spots: s.spots || 12,
          status: s.status || "scheduled", booked: 0, waitlist: 0,
        }));
        // Charger bookings via API (service role) pour éviter les problèmes RLS
        let bkData = [];
        try {
          const ids = mapped.map(s => s.id);
          const res = await fetch(`/api/bookings?sessionIds=${ids.join(",")}&studioId=${studioId}`);
          const json = await res.json();
          bkData = json.bookings || [];
        } catch {
          // Fallback client direct si API échoue
          const { data } = await sb.from("bookings")
            .select("id, session_id, member_id, status, attended, guest_name, host_member_id, members!bookings_member_id_fkey(id, first_name, last_name, email, phone, credits, credits_total, subscription_id, subscriptions(period))")
            .in("session_id", mapped.map(s => s.id));
          bkData = data || [];
        }
        // Après chargement des bookings, filtrer les séances passées sans présences à valider
        const now = new Date();
        const map = {};
        (bkData || []).forEach(b => {
          if (!map[b.session_id]) map[b.session_id] = [];
          const isGuest = !!b.guest_name;
          map[b.session_id].push({
            id: b.id, memberId: b.member_id, st: b.status, attended: b.attended ?? null,
            name: isGuest ? `${b.guest_name} (invité)` : b.members ? `${b.members.first_name || ""} ${b.members.last_name || ""}`.trim() : "—",
            email: b.members?.email || "", phone: b.members?.phone || "",
            credits: b.members?.credits ?? null, total: b.members?.credits_total ?? null,
            subPeriod: b.members?.subscriptions?.period || null,
            isGuest, hostMemberId: b.host_member_id || null,
          });
        });
        setBookings(map);
        const sessionsWithCounts = mapped.map(s => ({
          ...s,
          booked:   (map[s.id] || []).filter(b => b.st === "confirmed").length,
          waitlist: (map[s.id] || []).filter(b => b.st === "waitlist").length,
        }));
        // Garder séances futures + séances passées avec présences non validées
        const filtered = sessionsWithCounts.filter(s => {
          const [sy,sm,sd] = s.date.split("-").map(Number);
          const [sh,smi]   = s.time.split(":").map(Number);
          const sessEnd = new Date(sy, sm-1, sd, sh+Math.ceil(s.duration/60), smi);
          if (sessEnd > now) return true; // future ou en cours
          const pending = (map[s.id] || []).some(b => b.st === "confirmed" && b.attended === null);
          return pending; // passée mais présences à valider
        });
        setSessions(filtered);
        setDbLoading(false);
      });
  }, [studioId]);

  // Scroll vers aujourd'hui après chargement
  useEffect(() => {
    if (!dbLoading && todayRef.current) {
      setTimeout(() => {
        todayRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [dbLoading]);

  // Preview récurrence — filtre les doublons avec les séances existantes
  useEffect(() => {
    if (!recMode || !recFrom || !recTo || recSlots.length === 0) { setRecPreview([]); return; }
    const from = new Date(recFrom); from.setHours(0, 0, 0, 0);
    const toRaw = new Date(recTo); toRaw.setHours(23, 59, 59, 0);
    const maxTo = new Date(from); maxTo.setMonth(maxTo.getMonth() + 3);
    const to = toRaw > maxTo ? maxTo : toRaw;
    if (from > to) { setRecPreview([]); return; }
    // Index des séances existantes pour dédoublonner
    const existingKeys = new Set(sessions.map(s => `${s.date}|${s.time}|${s.disciplineId}`));
    const generated = [];
    recSlots.forEach(slot => {
      const targetDay = DAY_NUM[slot.day];
      const cur = new Date(from);
      while (cur.getDay() !== targetDay) cur.setDate(cur.getDate() + 1);
      while (cur <= to) {
        const date = `${cur.getFullYear()}-${String(cur.getMonth()+1).padStart(2,"0")}-${String(cur.getDate()).padStart(2,"0")}`;
        const key = `${date}|${slot.time}|${slot.disciplineId}`;
        if (!existingKeys.has(key)) {
          generated.push({
            id: Date.now() + Math.random(),
            disciplineId: slot.disciplineId,
            teacher: slot.teacher || nS.teacher || "",
            date, time: slot.time, duration: slot.duration || 60,
            spots: nS.spots || 12, level: nS.level || "Tous niveaux", room: nS.room || "Studio A",
            booked: 0, waitlist: 0,
          });
        }
        cur.setDate(cur.getDate() + 7);
      }
    });
    generated.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
    setRecPreview(generated);
  }, [recMode, recFrom, recTo, recSlots, nS.teacher, nS.spots, nS.level, nS.room, sessions]);

  const filtered = filterDiscs.length
    ? sessions.filter(s => filterDiscs.includes(String(s.disciplineId)))
    : sessions;
  const dates = [...new Set(filtered.map(s => s.date))].sort();

  // Construire la timeline enrichie : jours séances + plages fermetures intercalées
  const timeline = (() => {
    const items = [];
    // Add all session days
    dates.forEach(d => items.push({ type:"day", date:d }));
    // Add ALL closures (not filtered by session window — affiche même sans séances)
    closures.forEach(c => {
      items.push({ type:"closure", date:c.date_start, closure:c });
    });
    // Sort: closures appear before sessions of same date
    items.sort((a,b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      if (a.type === "closure" && b.type === "day") return -1;
      return 1;
    });
    // Deduplicate closures with same id (cas plages multi-jours)
    const seen = new Set();
    return items.filter(item => {
      if (item.type !== "closure") return true;
      const key = item.closure.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  })();

  // Actions sessions
  const addSession = async () => {
    if (!nS.date || !studioId) return;
    const tempId = `tmp-${Date.now()}`;
    setSessions(prev => [...prev, { id: tempId, ...nS, disciplineId: nS.disciplineId || null, booked: 0, waitlist: 0 }]);
    setShowAdd(false);
    setNS({ disciplineId: "", teacher: "", date: "", time: "09:00", duration: 60, spots: 12, level: "Tous niveaux", room: "Studio A" });
    const { data, error } = await createClient().from("sessions").insert({
      studio_id: studioId, discipline_id: nS.disciplineId || null,
      teacher: nS.teacher || "", room: nS.room || "Studio A", level: nS.level || "Tous niveaux",
      session_date: nS.date, session_time: nS.time,
      duration_min: parseInt(nS.duration) || 60, spots: parseInt(nS.spots) || 12,
      status: "scheduled",
    }).select("id").single();
    if (error) { setSessions(prev => prev.filter(s => s.id !== tempId)); openConfirm("❌ " + error.message, ()=>{}, {subMsg:"Vérifiez les champs et réessayez."}); }
    else if (data?.id) {
      if (isDemoData) { setSessions([{ id: data.id, ...nS, booked: 0, waitlist: 0 }]); setIsDemoData(false); }
      else setSessions(prev => prev.map(s => s.id === tempId ? { ...s, id: data.id } : s));
    }
  };

  const deleteSession = async id => {
    const sb = createClient();
    const { count } = await sb.from("bookings").select("id", { count:"exact", head:true })
      .eq("session_id", id).eq("status", "confirmed");
    if (count && count > 0) {
      openConfirm(`Impossible de supprimer`, ()=>{}, {subMsg:`${count} réservation${count>1?"s confirmées":" confirmée"}. Annulez-les d'abord.`});
      return;
    }
    setSessions(prev => prev.filter(s => s.id !== id));
    // Supprimer les bookings restants (annulés/waitlist) puis la session
    await sb.from("bookings").delete().eq("session_id", id);
    await sb.from("sessions").delete().eq("id", id);
  };

  const cancelSession = id => {
    openConfirm("Annuler cette séance ?", async () => {
      setSessions(prev => prev.map(s => s.id === id ? { ...s, status: "cancelled" } : s));
      const sb = createClient();
      const [sessRes, bookRes] = await Promise.all([
        sb.from("sessions").update({ status: "cancelled" }).eq("id", id),
        sb.from("bookings").update({ status: "cancelled" }).eq("session_id", id).in("status", ["confirmed", "waitlist"]),
      ]);
      if (sessRes.error) {
        setSessions(prev => prev.map(s => s.id === id ? { ...s, status: "scheduled" } : s));
        showPlanToast("Erreur lors de l'annulation", false);
      }
    }, { subMsg: "Les inscrits verront la séance comme annulée.", danger: true });
  };

  const restoreSession = async id => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, status: "scheduled" } : s));
    const { error } = await createClient().from("sessions").update({ status: "scheduled" }).eq("id", id);
    if (error) {
      setSessions(prev => prev.map(s => s.id === id ? { ...s, status: "cancelled" } : s));
      showPlanToast("Erreur lors du rétablissement", false);
    }
  };

  const addRecurringSessions = async () => {
    if (!recPreview.length || !studioId) return;
    const rows = recPreview.map(s => ({
      studio_id: studioId, discipline_id: s.disciplineId || null,
      teacher: s.teacher || "", room: s.room || "Studio A", level: s.level || "Tous niveaux",
      session_date: s.date, session_time: s.time,
      duration_min: parseInt(s.duration) || 60, spots: parseInt(s.spots) || 12,
      status: "scheduled",
    }));
    const { data: inserted, error } = await createClient().from("sessions").insert(rows).select("*");
    if (error) { console.error("insert recurring", error); showPlanToast("Erreur lors de la création", false); return; }
    // Ajouter les séances insérées (avec vrais IDs) à l'UI
    const newSessions = (inserted || []).map(s => ({
      id: s.id, disciplineId: s.discipline_id, teacher: s.teacher, room: s.room, level: s.level,
      date: s.session_date, time: s.session_time?.slice(0,5) || s.session_time, duration: s.duration_min, spots: s.spots,
      status: s.status, booked: 0, waitlist: 0,
    }));
    const sort = arr => [...arr].sort((a,b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
    if (isDemoData) { setSessions(sort(newSessions)); setIsDemoData(false); }
    else setSessions(prev => sort([...prev, ...newSessions]));
    setShowAdd(false); setRecMode(false);
    setRecFrom(""); setRecTo(""); setRecSlots([]); setRecPreview([]);
    showPlanToast(`${newSessions.length} séance${newSessions.length > 1 ? "s créées" : " créée"}`, true);
  };

  const handleChangeStatus = async (bid, sid, ns) => {
    setBookings(prev => {
      const nb = { ...prev };
      nb[sid] = (nb[sid] || []).map(b => b.id === bid ? { ...b, st: ns } : b);
      return nb;
    });

    // Si annulation d'un confirmé → API cancel (promeut waitlist + restitue crédit)
    if (ns === "cancelled") {
      const res = await fetch("/api/bookings/cancel", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: bid }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBookings(prev => {
          const nb = { ...prev };
          nb[sid] = (nb[sid] || []).map(b => b.id === bid ? { ...b, st: "confirmed" } : b);
          return nb;
        });
      } else if (data.promoted) {
        // Rafraîchir les bookings pour voir le promu
        showPlanToast(`${data.promoted} promu(e) depuis la liste d'attente`, true);
        // Recharger les bookings de cette session
        const sb = createClient();
        const { data: fresh } = await sb.from("bookings")
          .select("id, member_id, status, members!bookings_member_id_fkey(first_name, last_name, email, phone)")
          .eq("session_id", sid);
        if (fresh) {
          setBookings(prev => ({
            ...prev,
            [sid]: fresh.map(b => ({ id: b.id, memberId: b.member_id, st: b.status, name: `${b.members?.first_name||""} ${b.members?.last_name||""}`.trim(), email: b.members?.email, phone: b.members?.phone })),
          }));
        }
      }
    } else {
      const { error } = await createClient().from("bookings").update({ status: ns }).eq("id", bid);
      if (error) {
        console.error("update booking status", error);
        setBookings(prev => {
          const nb = { ...prev };
          const old = ns === "confirmed" ? "cancelled" : "waitlist";
          nb[sid] = (nb[sid] || []).map(b => b.id === bid ? { ...b, st: old } : b);
          return nb;
        });
      }
    }
  };

  const handleSendReminder = async sessId => {
    const sess = sessions.find(s => s.id === sessId);
    const bl = (bookings[sessId] || []).filter(b => b.st === "confirmed");
    if (!bl.length) { setPlanToast({msg:"Aucun inscrit confirmé pour cette séance.", ok:false}); setTimeout(()=>setPlanToast(null),3000); return; return; }
    try {
      const res = await fetch("/api/send-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessId, studioId, members: bl.map(b => ({ email: b.email, name: b.name })), sess }),
      });
      if (res.ok) { setPlanToast({msg:`Rappel envoyé à ${bl.length} inscrit${bl.length > 1 ? "s" : ""}`, ok:true}); setTimeout(()=>setPlanToast(null),3500); };
    } catch (e) { console.error("reminder", e); }
  };

  return (
    <div>
      {isDemoData && <DemoBanner />}

      {/* ── Modal confirmation custom ── */}
      {confirmModal && (
        <ConfirmModal
          msg={confirmModal.msg}
          subMsg={confirmModal.subMsg}
          danger={confirmModal.danger}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}

      {/* ── Toast Planning ── */}
      {planToast && (
        <div style={{ position:"fixed", bottom:90, left:"50%", transform:"translateX(-50%)", zIndex:9000,
          padding:"10px 20px", borderRadius:10, background:planToast.ok?"#065F46":"#991B1B",
          color:"#fff", fontSize:13, fontWeight:700, boxShadow:"0 4px 20px rgba(0,0,0,.2)", whiteSpace:"nowrap",
          animation:"fadeInUp .2s ease" }}>
          {planToast.ok ? "✓" : "✗"} {planToast.msg}
        </div>
      )}

      {/* Modale booking */}
      {/* ── Modal Fermetures ── */}
      {showClosures && (
        <div style={{ position:"fixed", inset:0, background:"rgba(42,31,20,.5)", zIndex:600, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
          onClick={e=>{ if(e.target===e.currentTarget){ setShowClosures(false); setClosureEdit(null); setClosureForm({label:"Fermeture",date_start:"",date_end:"",single:true}); }}}>
          <div style={{ background:C.surface, borderRadius:16, padding:24, width:"100%", maxWidth:500, maxHeight:"85vh", overflowY:"auto", boxShadow:"0 24px 60px rgba(0,0,0,.2)" }}>
            <div style={{ fontSize:16, fontWeight:800, color:C.text, marginBottom:4 }}>🔒 Jours de fermeture</div>
            <div style={{ fontSize:13, color:C.textMuted, marginBottom:18 }}>Configurez les jours isolés ou plages de congés.</div>

            {/* Formulaire ajout / édition */}
            <div style={{ background:C.bg, borderRadius:10, padding:14, marginBottom:16 }}>
              <div style={{ fontSize:12, fontWeight:700, color:C.accent, marginBottom:10, textTransform:"uppercase", letterSpacing:.5 }}>
                {closureEdit ? "Modifier la fermeture" : "Ajouter une fermeture"}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr", gap:10 }}>
                <div style={{ gridColumn:"1/-1" }}>
                  <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, marginBottom:4, textTransform:"uppercase" }}>Label</div>
                  <input value={closureForm.label} onChange={e=>setClosureForm(f=>({...f,label:e.target.value}))}
                    placeholder="Ex: Vacances d'été"
                    style={{ width:"100%", padding:"8px 11px", border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:13, outline:"none", boxSizing:"border-box", color:C.text, background:C.surfaceWarm, fontFamily:"inherit" }}
                    onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/>
                </div>
                <div style={{ gridColumn:"1/-1", display:"flex", gap:8, alignItems:"center" }}>
                  <label style={{ display:"flex", alignItems:"center", gap:6, fontSize:13, color:C.textMid, cursor:"pointer" }}>
                    <input type="radio" checked={closureForm.single} onChange={()=>setClosureForm(f=>({...f,single:true}))} style={{ accentColor:C.accent }}/>
                    Jour isolé
                  </label>
                  <label style={{ display:"flex", alignItems:"center", gap:6, fontSize:13, color:C.textMid, cursor:"pointer" }}>
                    <input type="radio" checked={!closureForm.single} onChange={()=>setClosureForm(f=>({...f,single:false}))} style={{ accentColor:C.accent }}/>
                    Plage de dates
                  </label>
                </div>
                <div>
                  <DatePicker label={closureForm.single?"Date":"Du"} value={closureForm.date_start} onChange={v=>setClosureForm(f=>({...f,date_start:v}))}/>
                </div>
                {!closureForm.single && (
                  <div>
                    <DatePicker label="Au" value={closureForm.date_end} minDate={closureForm.date_start} onChange={v=>setClosureForm(f=>({...f,date_end:v}))}/>
                  </div>
                )}
              </div>
              <div style={{ display:"flex", gap:8, marginTop:12, justifyContent:"flex-end" }}>
                {closureEdit && (
                  <button onClick={()=>{ setClosureEdit(null); setClosureForm({label:"Fermeture",date_start:"",date_end:"",single:true}); }}
                    style={{ padding:"7px 14px", borderRadius:8, border:`1px solid ${C.border}`, background:C.bg, color:C.textMid, fontSize:12, fontWeight:600, cursor:"pointer" }}>
                    Annuler
                  </button>
                )}
                <button
                  disabled={!closureForm.date_start || (!closureForm.single && !closureForm.date_end)}
                  onClick={async()=>{
                    await saveClosure(closureForm, closureEdit?.id||null);
                    setClosureEdit(null);
                    setClosureForm({label:"Fermeture",date_start:"",date_end:"",single:true});
                  }}
                  style={{ padding:"7px 16px", borderRadius:8, border:"none", background:closureForm.date_start?C.accent:"#ccc", color:"white", fontSize:12, fontWeight:700, cursor:closureForm.date_start?"pointer":"not-allowed" }}>
                  {closureEdit ? "Enregistrer" : "Ajouter"}
                </button>
              </div>
            </div>

            {/* Liste des fermetures */}
            {closures.length === 0 ? (
              <div style={{ textAlign:"center", padding:"20px 0", color:C.textMuted, fontSize:13 }}>Aucune fermeture configurée</div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {closures.map(c => {
                  const isSingle = c.date_start === c.date_end;
                  const fmt = d => new Date(d+"T12:00").toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"});
                  return (
                    <div key={c.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:9, background:C.bg, border:`1px solid ${C.borderSoft}` }}>
                      <span style={{ fontSize:16 }}>🔒</span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{c.label}</div>
                        <div style={{ fontSize:12, color:C.textMuted, marginTop:1 }}>
                          {isSingle ? fmt(c.date_start) : `${fmt(c.date_start)} → ${fmt(c.date_end)}`}
                        </div>
                      </div>
                      <button onClick={()=>{ setClosureEdit(c); setClosureForm({label:c.label,date_start:c.date_start,date_end:c.date_end,single:c.date_start===c.date_end}); }}
                        style={{ fontSize:11, padding:"4px 10px", borderRadius:6, border:`1px solid ${C.border}`, background:C.surface, color:C.textMid, cursor:"pointer", fontWeight:600 }}>
                        Modifier
                      </button>
                      <button onClick={()=>deleteClosure(c.id)}
                        style={{ fontSize:11, padding:"4px 8px", borderRadius:6, border:"1px solid #EFC8BC", background:C.warnBg, color:C.warn, cursor:"pointer", fontWeight:600 }}>
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ marginTop:16, textAlign:"right" }}>
              <button onClick={()=>{ setShowClosures(false); setClosureEdit(null); setClosureForm({label:"Fermeture",date_start:"",date_end:"",single:true}); }}
                style={{ padding:"8px 20px", borderRadius:8, border:"none", background:C.accent, color:"white", fontSize:13, fontWeight:700, cursor:"pointer" }}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {bookingModal && (
        <BookingModal
          sessId={bookingModal}
          sessions={sessions}
          studioId={studioId}
          bookings={bookings}
          setBookings={setBookings}
          setSessions={setSessions}
          onClose={() => setBookingModal(null)}
        />
      )}

      <div style={{ padding: p }}>

        {/* ── Barre filtre + bouton add ── */}
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end", marginBottom: 18, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200, maxWidth: 380 }}>
            <MultiDiscSelect
              placeholder="Toutes les disciplines"
              value={filterDiscs}
              onChange={setFilterDiscs}
              options={allDiscOptions}
            />
          </div>
          {filterDiscs.length > 0 && (
            <button onClick={() => setFilterDiscs([])}
              style={{ fontSize: 12, padding: "6px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.textMuted, cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" }}>
              ✕ Réinitialiser
            </button>
          )}
          <div style={{ marginLeft: "auto", display:"flex", gap:8, flexShrink: 0, alignItems:"center" }}>
            <button onClick={() => setShowClosures(true)}
              style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, padding:"7px 13px", borderRadius:8, border:`1.5px solid ${C.border}`, background:closures.length>0?C.warnBg:C.surface, color:closures.length>0?C.warn:C.textMid, cursor:"pointer", fontWeight:600, whiteSpace:"nowrap" }}>
              🔒 Fermetures{closures.length>0?` (${closures.length})`:""}
            </button>
            <Button sm variant="primary" onClick={() => {
              const allD = effectiveDiscs.length ? effectiveDiscs : DISCIPLINES;
              if (!showAdd && allD.length > 0 && !nS.disciplineId) setNS(prev => ({ ...prev, disciplineId: String(allD[0].id) }));
              setShowAdd(!showAdd);
            }}>＋ Séance</Button>
          </div>
        </div>

        {/* ── Formulaire ajout ── */}
        {showAdd && (
          <Card style={{ marginBottom: 18, borderTop: `3px solid ${C.accent}` }}>
            {/* Toggle mode */}
            <div style={{ display: "flex", gap: 6, marginBottom: 18, background: C.bgDeep, borderRadius: 10, padding: 4 }}>
              {[[false, "📅 Séance unique"], [true, "🔁 Récurrence"]].map(([mode, label]) => (
                <button key={String(mode)} type="button" onClick={() => setRecMode(mode)}
                  style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "none", background: recMode === mode ? C.surface : "transparent", color: recMode === mode ? C.accent : C.textMuted, fontSize: 13, fontWeight: recMode === mode ? 700 : 500, cursor: "pointer", boxShadow: recMode === mode ? "0 1px 4px rgba(0,0,0,.08)" : "none", transition: "all .15s" }}>
                  {label}
                </button>
              ))}
            </div>

            {/* ── Séance unique ── */}
            {!recMode && (
              <>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: .6, marginBottom: 14 }}>Nouvelle séance</div>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: isMobile ? 10 : 14, alignItems: "flex-end" }}>
                  <DiscSelect label="Discipline" value={nS.disciplineId}
                    options={allDiscOptions}
                    onChange={v => {
                      const disc = effectiveDiscs.find(d => String(d.id) === v);
                      const slot = disc?.slots?.[0];
                      setNS({ ...nS, disciplineId: v, ...(slot ? { time: slot.time, duration: slot.duration || 60 } : {}) });
                    }} />
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: .8, marginBottom: 5 }}>Coach</div>
                    <select value={nS.teacher} onChange={e => setNS({ ...nS, teacher: e.target.value })}
                      style={{ width: "100%", padding: "9px 12px", border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.text, background: C.surface, outline: "none", boxSizing: "border-box" }}>
                      <option value="">— Coach —</option>
                      {coachesList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <DatePicker label="Date" value={nS.date} onChange={v => setNS({ ...nS, date: v })} />
                  {nS.date && isDateClosed(nS.date) && (
                    <div style={{ gridColumn:"1/-1", display:"flex", alignItems:"center", gap:8, padding:"8px 12px", borderRadius:8, background:"#FFF3CD", border:"1px solid #F0C030", color:"#856404", fontSize:12, fontWeight:600 }}>
                      🔒 Ce jour est marqué comme fermé ({getClosureForDate(nS.date)?.label || "Fermeture"}) — vous pouvez quand même créer la séance.
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: .8, marginBottom: 5 }}>Heure</div>
                    <TimePicker value={nS.time} onChange={v => setNS({ ...nS, time: v })} />
                  </div>
                  <Field label="Durée (min)" type="number" value={nS.duration} onChange={v => setNS({ ...nS, duration: v })} />
                  <div>
                    <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:.8, marginBottom:5 }}>Salle</div>
                    {roomsList.length > 0 ? (
                      <select value={nS.room} onChange={e => {
                        const room = roomsList.find(r => r.name === e.target.value);
                        setNS(prev => ({ ...prev, room: e.target.value, spots: room ? room.capacity : prev.spots }));
                      }} style={{ width:"100%", padding:"9px 12px", border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:14, outline:"none", background:C.surfaceWarm, color:C.text, cursor:"pointer" }}>
                        <option value="">— Choisir une salle —</option>
                        {roomsList.map(r => (
                          <option key={r.id} value={r.name}>{r.name} ({r.capacity} places)</option>
                        ))}
                      </select>
                    ) : (
                      <input value={nS.room} onChange={e => setNS({ ...nS, room: e.target.value })} placeholder="Studio A"
                        style={{ width:"100%", padding:"9px 12px", border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:14, outline:"none", background:C.surfaceWarm, color:C.text, boxSizing:"border-box" }}/>
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:.8, marginBottom:5 }}>Places</div>
                    <input type="number" min={1} value={nS.spots} onChange={e => setNS({ ...nS, spots: parseInt(e.target.value)||1 })}
                      style={{ width:"100%", padding:"9px 12px", border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:14, outline:"none", background:C.surfaceWarm, color:C.text, boxSizing:"border-box" }}/>
                    {nS.room && roomsList.find(r => r.name === nS.room) && nS.spots !== roomsList.find(r => r.name === nS.room).capacity && (
                      <div style={{ fontSize:11, color:C.textMuted, marginTop:3 }}>
                        Capacité salle : {roomsList.find(r => r.name === nS.room).capacity} — modifié manuellement
                      </div>
                    )}
                  </div>
                  <Field label="Niveau" value={nS.level} onChange={v => setNS({ ...nS, level: v })} opts={["Tous niveaux", "Débutant", "Intermédiaire", "Avancé"]} />
                </div>
                <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
                  <Button variant="primary" onClick={addSession} disabled={!nS.date}>✦ Créer la séance</Button>
                  <Button variant="ghost" onClick={() => setShowAdd(false)}>Annuler</Button>
                </div>
              </>
            )}

            {/* ── Récurrence ── */}
            {recMode && (() => {
              const allSlotsRaw = effectiveDiscs.flatMap(d =>
                (d.slots || []).map((s, i) => ({
                  key: `${d.id}-${i}`, disciplineId: d.id, discName: d.name,
                  discColor: d.color || C.accent, discIcon: d.icon || "🏃",
                  day: s.day, time: s.time, duration: s.duration || 60, teacher: "",
                }))
              );
              const visibleSlots = recFilterDisc ? allSlotsRaw.filter(s => s.disciplineId === recFilterDisc) : allSlotsRaw;
              const isSelected = k => recSlots.some(s => s.key === k);
              const dayLabel = d => ({ Lun: "Lundi", Mar: "Mardi", Mer: "Mercredi", Jeu: "Jeudi", Ven: "Vendredi", Sam: "Samedi", Dim: "Dimanche" }[d] || d);
              const toggleSlot = slot => {
                setRecSlots(prev => isSelected(slot.key)
                  ? prev.filter(s => s.key !== slot.key)
                  : [...prev, { ...slot, teacher: nS.teacher }]);
              };
              const updateSlotCoach = (key, teacher) => setRecSlots(prev => prev.map(s => s.key === key ? { ...s, teacher } : s));
              const removePreview = id => setRecPreview(prev => prev.filter(s => s.id !== id));
              const updatePreviewCoach = (id, teacher) => setRecPreview(prev => prev.map(s => s.id === id ? { ...s, teacher } : s));

              return (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: .6, marginBottom: 16 }}>Générer des séances récurrentes</div>

                  {/* Étape 1 — Créneaux */}
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: C.textMuted, textTransform: "uppercase", letterSpacing: .8 }}>1 · Créneaux à inclure</div>
                        {visibleSlots.length > 0 && (() => {
                          const allSel = visibleSlots.every(s => isSelected(s.key));
                          return (
                            <button onClick={() => {
                              if (allSel) setRecSlots(prev => prev.filter(s => !visibleSlots.some(sl => sl.key === s.key)));
                              else { const toAdd = visibleSlots.filter(s => !isSelected(s.key)).map(s => ({ ...s, teacher: nS.teacher })); setRecSlots(prev => [...prev, ...toAdd]); }
                            }} style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 8, border: `1.5px solid ${allSel ? C.accent : C.border}`, background: allSel ? C.accentLight : "transparent", color: allSel ? C.accentDark : C.textMid, cursor: "pointer" }}>
                              {allSel ? "✓ Tout désélectionner" : "Tout sélectionner"}
                            </button>
                          );
                        })()}
                      </div>
                      {/* Filtre disc */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                        <button onClick={() => setRecFilterDisc(null)}
                          style={{ padding: "4px 10px", borderRadius: 20, border: `1.5px solid ${!recFilterDisc ? C.accent : C.border}`, background: !recFilterDisc ? C.accentLight : "transparent", color: !recFilterDisc ? C.accentDark : C.textMid, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                          Toutes
                        </button>
                        {effectiveDiscs.filter(d => (d.slots || []).length > 0).map(d => {
                          const act = recFilterDisc === d.id;
                          return (
                            <button key={d.id} onClick={() => setRecFilterDisc(act ? null : d.id)}
                              style={{ padding: "4px 10px", borderRadius: 20, border: `1.5px solid ${act ? d.color || C.accent : C.border}`, background: act ? `${d.color || C.accent}18` : "transparent", color: act ? d.color || C.accent : C.textMid, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                              {d.icon} {d.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {discsLoading ? (
                      <div style={{ padding: 14, background: "#FFF8F0", borderRadius: 10, border: `1px dashed ${C.border}`, fontSize: 13, color: C.textSoft }}>
                        ⏳ Chargement des créneaux…
                      </div>
                    ) : allSlotsRaw.length === 0 ? (
                      <div style={{ padding: 14, background: "#FFF8F0", borderRadius: 10, border: `1px dashed ${C.border}`, fontSize: 13, color: C.textSoft }}>
                        ℹ Aucun créneau configuré. Allez dans <strong>Disciplines</strong> pour définir les horaires.
                      </div>
                    ) : visibleSlots.length === 0 ? (
                      <div style={{ padding: 14, background: "#FFF8F0", borderRadius: 10, border: `1px dashed ${C.border}`, fontSize: 13, color: C.textSoft }}>
                        ℹ Aucun créneau pour cette discipline.
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {visibleSlots.map(slot => {
                          const sel = isSelected(slot.key);
                          const selSlot = recSlots.find(s => s.key === slot.key);
                          const sc = slot.discColor || C.accent;
                          return (
                            <div key={slot.key} style={{ borderRadius: 12, border: `2px solid ${sel ? sc : C.border}`, background: sel ? `${sc}0C` : C.surface, overflow: "hidden", transition: "all .15s" }}>
                              <div onClick={() => toggleSlot(slot)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer" }}>
                                <div style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${sel ? sc : C.border}`, background: sel ? sc : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s" }}>
                                  {sel && <span style={{ color: "#fff", fontSize: 12, fontWeight: 800 }}>✓</span>}
                                </div>
                                <span style={{ width: 30, height: 30, borderRadius: 8, background: `${sc}20`, border: `1.5px solid ${sc}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>{slot.discIcon}</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 13, fontWeight: 700, color: sel ? sc : C.text }}>{slot.discName}</div>
                                  <div style={{ fontSize: 11, color: C.textSoft, marginTop: 1 }}><span style={{ fontWeight: 600 }}>{dayLabel(slot.day)}</span> · {slot.time} · {slot.duration}min</div>
                                </div>
                                {sel && <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 8, background: sc, color: "#fff", flexShrink: 0 }}>✓</span>}
                              </div>
                              {sel && (
                                <div style={{ borderTop: `1px solid ${sc}30`, padding: "7px 14px 9px", display: "flex", alignItems: "center", gap: 10, background: `${sc}08` }}>
                                  <span style={{ fontSize: 11, fontWeight: 700, color: sc, flexShrink: 0, textTransform: "uppercase", letterSpacing: .5 }}>Coach</span>
                                  <select value={selSlot?.teacher || ""} onChange={e => updateSlotCoach(slot.key, e.target.value)}
                                    style={{ flex: 1, padding: "5px 10px", border: `1.5px solid ${sc}50`, borderRadius: 7, fontSize: 12, color: C.text, background: C.surface, outline: "none" }}>
                                    <option value="">— Défaut ({nS.teacher || "non défini"}) —</option>
                                    {coachesList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                  </select>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Étape 2 — Paramètres */}
                  <div style={{ fontSize: 11, fontWeight: 800, color: C.textMuted, textTransform: "uppercase", letterSpacing: .8, marginBottom: 10 }}>2 · Paramètres</div>
                  <div style={{ display: "grid", gridTemplateColumns: `repeat(${isMobile ? 2 : 4}, 1fr)`, gap: 12, marginBottom: 20, alignItems: "flex-end" }}>
                    <div style={{ gridColumn: "span 2" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: .8, marginBottom: 5 }}>Coach par défaut</div>
                      <select value={nS.teacher} onChange={e => { const t = e.target.value; setNS(s => ({ ...s, teacher: t })); setRecSlots(prev => prev.map(s => !s.teacher ? { ...s, teacher: t } : s)); }}
                        style={{ width: "100%", padding: "9px 12px", border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.text, background: C.surface, outline: "none", boxSizing: "border-box" }}>
                        <option value="">— Choisir un coach —</option>
                        {coachesList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:.8, marginBottom:5 }}>Salle</div>
                      {roomsList.length > 0 ? (
                        <select value={nS.room} onChange={e => {
                          const room = roomsList.find(r => r.name === e.target.value);
                          setNS(prev => ({ ...prev, room: e.target.value, spots: room ? room.capacity : prev.spots }));
                        }} style={{ width:"100%", padding:"9px 12px", border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:14, outline:"none", background:C.surfaceWarm, color:C.text, cursor:"pointer" }}>
                          <option value="">— Choisir une salle —</option>
                          {roomsList.map(r => (
                            <option key={r.id} value={r.name}>{r.name} ({r.capacity} places)</option>
                          ))}
                        </select>
                      ) : (
                        <input value={nS.room} onChange={e => setNS({ ...nS, room: e.target.value })} placeholder="Studio A"
                          style={{ width:"100%", padding:"9px 12px", border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:14, outline:"none", background:C.surfaceWarm, color:C.text, boxSizing:"border-box" }}/>
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:.8, marginBottom:5 }}>Places</div>
                      <input type="number" min={1} value={nS.spots} onChange={e => setNS({ ...nS, spots: parseInt(e.target.value)||1 })}
                        style={{ width:"100%", padding:"9px 12px", border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:14, outline:"none", background:C.surfaceWarm, color:C.text, boxSizing:"border-box" }}/>
                    </div>
                  </div>

                  {/* Étape 3 — Période */}
                  <div style={{ fontSize: 11, fontWeight: 800, color: C.textMuted, textTransform: "uppercase", letterSpacing: .8, marginBottom: 10 }}>3 · Période <span style={{ fontSize: 10, fontWeight: 600, color: C.warn, marginLeft: 6 }}>max 3 mois</span></div>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 20, alignItems: "flex-end" }}>
                    <DatePicker label="Du" value={recFrom} onChange={v => setRecFrom(v)} />
                    <DatePicker label="Au" value={recTo} onChange={v => {
                      if (recFrom) {
                        const max = new Date(recFrom); max.setMonth(max.getMonth() + 3);
                        const chosen = new Date(v);
                        setRecTo(chosen > max ? max.toISOString().slice(0, 10) : v);
                      } else setRecTo(v);
                    }} minDate={recFrom} maxDate={recFrom ? (() => { const d = new Date(recFrom); d.setMonth(d.getMonth() + 3); return d.toISOString().slice(0, 10); })() : undefined} />
                  </div>

                  {/* Prévisualisation */}
                  {recPreview.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: C.textMuted, textTransform: "uppercase", letterSpacing: .8 }}>4 · Séances générées</div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#3A6E46", background: "#EAF5EC", border: "1px solid #A8D5B0", borderRadius: 6, padding: "2px 8px" }}>
                          {recPreview.length} séance{recPreview.length > 1 ? "s" : ""}
                        </span>
                      </div>
                      <div style={{ maxHeight: 260, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4, paddingRight: 2 }}>
                        {recPreview.map(s => {
                          const disc = effectiveDiscs.find(d => d.id === s.disciplineId) || DISCIPLINES[0];
                          const label = new Date(s.date).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
                          return (
                            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: "#F8FBF8", border: "1px solid #D4E8D6", borderRadius: 9 }}>
                              <span style={{ fontSize: 14, flexShrink: 0 }}>{disc?.icon || "🏃"}</span>
                              <span style={{ fontSize: 12, fontWeight: 600, color: "#2A5E38", flex: "0 0 150px", whiteSpace: "nowrap" }}>{label} · {s.time} · {s.duration}min</span>
                              <select value={s.teacher || ""} onChange={e => updatePreviewCoach(s.id, e.target.value)}
                                style={{ flex: 1, padding: "4px 8px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12, color: C.text, background: "#fff", outline: "none", minWidth: 0 }}>
                                <option value="">— coach —</option>
                                {coachesList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                              </select>
                              <button onClick={() => removePreview(s.id)}
                                style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 5px", color: "#F87171", fontSize: 15, lineHeight: 1, flexShrink: 0 }}>✕</button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 10 }}>
                    <Button variant="primary" onClick={addRecurringSessions} disabled={recPreview.length === 0}>
                      ✦ Créer {recPreview.length > 0 ? `${recPreview.length} séance${recPreview.length > 1 ? "s" : ""}` : "les séances"}
                    </Button>
                    <Button variant="ghost" onClick={() => setShowAdd(false)}>Annuler</Button>
                  </div>
                </div>
              );
            })()}
          </Card>
        )}

        {/* ── Liste séances ── */}
        {dbLoading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: C.textMuted, fontSize: 15 }}>⏳ Chargement…</div>
        ) : timeline.length === 0 ? (
          <EmptyState icon="📅" title="Aucune séance" sub={filterDiscs.length ? "Aucune séance pour cette discipline" : "Commencez par créer une séance !"} />
        ) : timeline.map((item, idx) => {
          if (item.type === "closure") return (
            <div key={"cl-"+item.closure.id} style={{ display:"flex", alignItems:"center", gap:10, margin:"4px 0 12px", padding:"10px 16px", background:"#FFFBEB", borderRadius:12, border:"1.5px solid #FDE68A" }}>
              <span style={{ fontSize:18 }}>🔒</span>
              <div>
                <div style={{ fontSize:13, fontWeight:800, color:"#92400E" }}>{item.closure.label || "Fermeture studio"}</div>
                <div style={{ fontSize:12, color:"#B45309", marginTop:1 }}>
                  {item.closure.date_start === item.closure.date_end
                    ? new Date(item.closure.date_start + "T12:00:00").toLocaleDateString("fr-FR", { weekday:"long", day:"numeric", month:"long" })
                    : `Du ${new Date(item.closure.date_start + "T12:00:00").toLocaleDateString("fr-FR", { day:"numeric", month:"long" })} au ${new Date(item.closure.date_end + "T12:00:00").toLocaleDateString("fr-FR", { day:"numeric", month:"long" })}`
                  }
                </div>
              </div>
            </div>
          );
          const isPast  = item.date < today;
          const isToday = item.date === today;
          return (
            <div key={item.date}
              ref={isToday ? todayRef : null}
              style={{ marginBottom: 22, opacity: isPast ? 0.45 : 1, transition: "opacity .2s" }}>
              <DateLabel date={item.date} />
              {filtered.filter(s => s.date === item.date).map(s => (
                <PlanningSessionCard key={s.id} sess={s} expandedId={expandedId} bookings={bookings} discs={effectiveDiscs} closures={closures} isMobile={isMobile} onConfirm={openConfirm} roomsList={roomsList}
                  onToggle={id => setExpandedId(prev => prev === id ? null : id)}
                  onChangeStatus={handleChangeStatus}
                  onAddBooking={id => setBookingModal(id)}
                  onSendReminder={handleSendReminder}
                  onDelete={deleteSession}
                  onCancel={cancelSession}
                  onRestore={restoreSession}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { Planning, PlanningSessionCard };