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
function PlanningSessionCard({ sess, expandedId, bookings, discs, onToggle, onChangeStatus, onDelete, onCancel, onRestore, onAddBooking, onSendReminder }) {
  const allDiscs = discs?.length ? discs : DISCIPLINES;
  const disc = allDiscs.find(d => String(d.id) === String(sess.disciplineId)) || allDiscs[0] || { name: "Cours", color: C.accent, icon: "🧘" };
  const bl     = bookings[sess.id] || [];
  const booked = bl.length ? bl.filter(b => b.st === "confirmed").length : sess.booked;
  const wait   = bl.length ? bl.filter(b => b.st === "waitlist").length  : sess.waitlist;
  const pct    = booked / sess.spots;
  const isExp  = expandedId === sess.id;
  const isFull = booked >= sess.spots;

  return (
    <div style={{ border: `1.5px solid ${isExp ? C.accent : C.borderSoft}`, borderRadius: 14, overflow: "hidden", marginBottom: 8, boxShadow: isExp ? `0 2px 12px rgba(176,120,72,.13)` : "0 1px 3px rgba(0,0,0,.05)", transition: "all .2s" }}>
      <div onClick={() => onToggle(sess.id)}
        style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", cursor: "pointer", background: isExp ? C.accentBg : C.surface, transition: "background .15s" }}
        onMouseEnter={e => { if (!isExp) e.currentTarget.style.background = C.surfaceWarm; }}
        onMouseLeave={e => { if (!isExp) e.currentTarget.style.background = C.surface; }}>
        <div style={{ width: 4, height: 42, borderRadius: 3, background: disc.color, flexShrink: 0 }} />
        <div style={{ fontSize: 13, fontWeight: 800, color: C.accent, width: 40, flexShrink: 0 }}>{sess.time}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ fontSize: 16 }}>{disc.icon}</span>{disc.name}
          </div>
          <div style={{ fontSize: 12, color: C.textSoft, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {sess.teacher && <><span style={{ fontWeight: 600 }}>{sess.teacher}</span> · </>}{sess.room} · {sess.duration}min
          </div>
        </div>
        <div style={{ flexShrink: 0, textAlign: "right", marginRight: 4 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: isFull ? C.warn : C.text }}>{booked}/{sess.spots}</div>
          <div style={{ width: 48, height: 4, background: C.bgDeep, borderRadius: 3, marginTop: 4 }}>
            <div style={{ height: "100%", width: `${Math.min(pct * 100, 100)}%`, background: isFull ? C.warn : pct > .75 ? C.accent : C.ok, borderRadius: 3 }} />
          </div>
          {wait > 0 && <div style={{ fontSize: 11, color: C.accent, fontWeight: 700, marginTop: 2 }}>+{wait} att.</div>}
        </div>
        {/* Boutons actions inline (séance expanded) */}
        {isExp && (
          <div onClick={e => e.stopPropagation()} style={{ display: "flex", gap: 5, flexShrink: 0 }}>
            <button onClick={() => onAddBooking && onAddBooking(sess.id)}
              title="Inscrire un adhérent"
              style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, padding: "5px 10px", borderRadius: 8, border: `1px solid #DFC0A0`, background: C.accentBg, color: C.accentDark, cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" }}>
              <IcoUserPlus2 s={13} c={C.accentDark} /> Inscrire
            </button>
            <button onClick={() => onSendReminder && onSendReminder(sess.id)}
              title="Envoyer rappel"
              style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, padding: "5px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surfaceWarm, color: C.textSoft, cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" }}>
              <IcoMail s={13} c={C.textSoft} /> Rappel
            </button>
            {sess.status !== "cancelled" && onCancel && (
              <button onClick={() => onCancel(sess.id)}
                style={{ fontSize: 12, padding: "5px 10px", borderRadius: 8, border: `1px solid #EFC8BC`, background: "#FFF5F5", color: C.warn, cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" }}>
                ⚠ Annuler séance
              </button>
            )}
            {sess.status === "cancelled" && onCancel && (
              <button onClick={async () => {
                if (!window.confirm("Remettre cette séance en planifiée ?")) return;
                onRestore && onRestore(sess.id);
              }} style={{ fontSize: 12, padding: "5px 10px", borderRadius: 8, border: `1px solid #B8DFC4`, background: C.okBg, color: C.ok, cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" }}>
                ↩ Rétablir
              </button>
            )}
            {onDelete && (
              <button onClick={() => { if (window.confirm("Supprimer définitivement cette séance ?")) onDelete(sess.id); }}
                style={{ fontSize: 12, padding: "5px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.textMuted, cursor: "pointer", fontWeight: 600 }}>
                ✕
              </button>
            )}
          </div>
        )}
        <span style={{ flexShrink: 0, display: "inline-flex", transition: "transform .2s", transform: isExp ? "rotate(180deg)" : "none" }}><IcoChevron s={16} c={C.textMuted} /></span>
      </div>
      {sess.status === "cancelled" && (
        <div style={{ background: "#FFF5F5", padding: "4px 14px", fontSize: 12, color: C.warn, fontWeight: 600 }}>⚠ Séance annulée</div>
      )}
      {isExp && (
        <PlanningAccordion sess={sess} sessId={sess.id} bookings={bookings}
          onChangeStatus={onChangeStatus} onAddBooking={onAddBooking} onSendReminder={onSendReminder} />
      )}
    </div>
  );
}

// ── Modale inscrire adhérent ─────────────────────────────────────────────────
function BookingModal({ sessId, sessions, studioId, bookings, setBookings, setSessions, onClose }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null);
  const inp = useRef(null);

  useEffect(() => { setTimeout(() => inp.current?.focus(), 80); }, []);

  async function search(v) {
    setQ(v);
    if (!v || v.length < 2) { setResults([]); return; }
    setLoading(true);
    const { data } = await createClient().from("members")
      .select("id, first_name, last_name, email, phone")
      .eq("studio_id", studioId)
      .or(`first_name.ilike.%${v}%,last_name.ilike.%${v}%,email.ilike.%${v}%`)
      .limit(8);
    setResults(data || []);
    setLoading(false);
  }

  async function confirm(member) {
    const sess = sessions.find(s => s.id === sessId);
    if (!sess || !member) return;
    const already = (bookings[sessId] || []).some(b => b.memberId === member.id && b.st !== "cancelled");
    if (already) { setDone("already"); return; }
    const isFull = (bookings[sessId] || []).filter(b => b.st === "confirmed").length >= sess.spots;
    const { data, error } = await createClient().from("bookings").insert({
      session_id: sessId, member_id: member.id,
      status: isFull ? "waitlist" : "confirmed",
    }).select().single();
    if (!error && data) {
      const nb = { id: data.id, memberId: member.id, st: data.status, attended: null,
        name: `${member.first_name || ""} ${member.last_name || ""}`.trim(),
        email: member.email || "", phone: member.phone || "" };
      setBookings(prev => ({ ...prev, [sessId]: [...(prev[sessId] || []), nb] }));
      setSessions(prev => prev.map(s => s.id === sessId ? { ...s, booked: s.booked + (data.status === "confirmed" ? 1 : 0) } : s));
      setDone(data.status);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={onClose}>
      <div style={{ background: C.surface, borderRadius: 18, padding: 24, width: "100%", maxWidth: 420, boxShadow: "0 12px 48px rgba(0,0,0,.2)" }}
        onClick={e => e.stopPropagation()}>
        {done ? (
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>{done === "already" ? "⚠️" : done === "confirmed" ? "✅" : "⏳"}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 6 }}>
              {done === "already" ? "Déjà inscrit" : done === "confirmed" ? "Inscrit avec succès" : "Ajouté en liste d'attente"}
            </div>
            <div style={{ fontSize: 13, color: C.textSoft, marginBottom: 18 }}>
              {done === "already" ? "Cet adhérent est déjà inscrit à cette séance." : done === "confirmed" ? "La réservation est confirmée." : "La séance est complète, l'adhérent est en attente."}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setDone(null); setQ(""); setResults([]); }} style={{ flex: 1, padding: "9px", borderRadius: 9, border: `1px solid ${C.border}`, background: C.surfaceWarm, color: C.textSoft, fontSize: 14, cursor: "pointer", fontWeight: 600 }}>Inscrire un autre</button>
              <button onClick={onClose} style={{ flex: 1, padding: "9px", borderRadius: 9, border: "none", background: C.accent, color: "#fff", fontSize: 14, cursor: "pointer", fontWeight: 700 }}>Fermer</button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 17, fontWeight: 800, color: C.text, marginBottom: 4 }}>Inscrire un adhérent</div>
            <div style={{ fontSize: 13, color: C.textSoft, marginBottom: 16 }}>Recherchez par nom ou email</div>
            <div style={{ position: "relative", marginBottom: 10 }}>
              <input ref={inp} placeholder="Nom, prénom ou email…" value={q} onChange={e => search(e.target.value)}
                style={{ width: "100%", padding: "10px 36px 10px 14px", borderRadius: 9, border: `1.5px solid ${C.border}`, fontSize: 14, outline: "none", boxSizing: "border-box", background: "#FDFAF7" }} />
              {loading && <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 16 }}>⏳</span>}
              {q && !loading && <span onClick={() => { setQ(""); setResults([]); }} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 16, cursor: "pointer", color: C.textMuted }}>✕</span>}
            </div>
            {results.length > 0 && (
              <div style={{ borderRadius: 10, border: `1px solid ${C.borderSoft}`, overflow: "hidden", marginBottom: 10 }}>
                {results.map(m => (
                  <div key={m.id} onClick={() => confirm(m)}
                    style={{ padding: "10px 14px", cursor: "pointer", borderBottom: `1px solid ${C.borderSoft}`, transition: "background .1s" }}
                    onMouseEnter={e => e.currentTarget.style.background = C.accentBg}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{m.first_name} {m.last_name}</div>
                    <div style={{ fontSize: 12, color: C.textMuted }}>{m.email}{m.phone ? " · " + m.phone : ""}</div>
                  </div>
                ))}
              </div>
            )}
            {q.length >= 2 && !loading && results.length === 0 && (
              <div style={{ fontSize: 13, color: C.textMuted, textAlign: "center", padding: "14px 0" }}>Aucun adhérent trouvé</div>
            )}
            <button onClick={onClose} style={{ marginTop: 6, width: "100%", padding: "9px", borderRadius: 9, border: `1px solid ${C.border}`, background: "transparent", color: C.textSoft, fontSize: 14, cursor: "pointer" }}>Annuler</button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Planning principal ───────────────────────────────────────────────────────
function Planning({ isMobile }) {
  const { discs, studioId } = useContext(AppCtx);
  const [sessions, setSessions]       = useState([]);
  const [dbLoading, setDbLoading]     = useState(true);
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
  const [localDiscs, setLocalDiscs]   = useState([]);
  const p = isMobile ? 12 : 28;

  const DAY_NUM = { Lun: 1, Mar: 2, Mer: 3, Jeu: 4, Ven: 5, Sam: 6, Dim: 0 };
  const effectiveDiscs = discs?.length ? discs : localDiscs;
  const allDiscOptions = (effectiveDiscs.length ? effectiveDiscs : DISCIPLINES).map(d => ({ id: String(d.id), name: d.name, icon: d.icon, color: d.color }));

  // Charger disciplines si context vide
  useEffect(() => {
    if (!studioId || discs?.length) return;
    createClient().from("disciplines").select("id,name,icon,color,slots").eq("studio_id", studioId).order("created_at")
      .then(({ data }) => { if (data?.length) setLocalDiscs(data.map(d => ({ ...d, slots: d.slots || [] }))); });
  }, [studioId, discs?.length]);

  // Charger coachs
  useEffect(() => {
    if (!studioId) return;
    createClient().from("profiles").select("id, first_name, last_name").eq("studio_id", studioId).in("role", ["coach", "admin"])
      .then(({ data }) => {
        if (data?.length) setCoachesList(data.map(c => ({ id: c.id, name: `${c.first_name || ""} ${c.last_name || ""}`.trim() })).filter(c => c.name));
      });
  }, [studioId]);

  // Charger sessions + bookings
  useEffect(() => {
    if (!studioId) return;
    setDbLoading(true);
    const sb = createClient();
    sb.from("sessions").select("id, discipline_id, teacher, room, level, session_date, session_time, duration_min, spots, status")
      .eq("studio_id", studioId).order("session_date").order("session_time")
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
        const { data: bkData } = await sb.from("bookings")
          .select("id, session_id, member_id, status, attended, members(first_name, last_name, email, phone)")
          .in("session_id", mapped.map(s => s.id));
        const map = {};
        (bkData || []).forEach(b => {
          if (!map[b.session_id]) map[b.session_id] = [];
          map[b.session_id].push({
            id: b.id, memberId: b.member_id, st: b.status, attended: b.attended ?? null,
            name: b.members ? `${b.members.first_name || ""} ${b.members.last_name || ""}`.trim() : "—",
            email: b.members?.email || "", phone: b.members?.phone || "",
          });
        });
        setBookings(map);
        setSessions(mapped.map(s => ({
          ...s,
          booked:   (map[s.id] || []).filter(b => b.st === "confirmed").length,
          waitlist: (map[s.id] || []).filter(b => b.st === "waitlist").length,
        })));
        setDbLoading(false);
      });
  }, [studioId]);

  // Preview récurrence
  useEffect(() => {
    if (!recMode || !recFrom || !recTo || recSlots.length === 0) { setRecPreview([]); return; }
    const from = new Date(recFrom); from.setHours(0, 0, 0, 0);
    const toRaw = new Date(recTo); toRaw.setHours(23, 59, 59, 0);
    const maxTo = new Date(from); maxTo.setMonth(maxTo.getMonth() + 3);
    const to = toRaw > maxTo ? maxTo : toRaw;
    if (from > to) { setRecPreview([]); return; }
    const generated = [];
    recSlots.forEach(slot => {
      const targetDay = DAY_NUM[slot.day];
      const cur = new Date(from);
      while (cur.getDay() !== targetDay) cur.setDate(cur.getDate() + 1);
      while (cur <= to) {
        generated.push({
          id: Date.now() + Math.random(),
          disciplineId: slot.disciplineId,
          teacher: slot.teacher || nS.teacher || "",
          date: cur.toISOString().slice(0, 10),
          time: slot.time, duration: slot.duration || 60,
          spots: nS.spots || 12, level: nS.level || "Tous niveaux", room: nS.room || "Studio A",
          booked: 0, waitlist: 0,
        });
        cur.setDate(cur.getDate() + 7);
      }
    });
    generated.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
    setRecPreview(generated);
  }, [recMode, recFrom, recTo, recSlots, nS.teacher, nS.spots, nS.level, nS.room]);

  const filtered = filterDiscs.length
    ? sessions.filter(s => filterDiscs.includes(String(s.disciplineId)))
    : sessions;
  const dates = [...new Set(filtered.map(s => s.date))].sort();

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
    if (error) { setSessions(prev => prev.filter(s => s.id !== tempId)); alert("❌ " + error.message); }
    else if (data?.id) {
      if (isDemoData) { setSessions([{ id: data.id, ...nS, booked: 0, waitlist: 0 }]); setIsDemoData(false); }
      else setSessions(prev => prev.map(s => s.id === tempId ? { ...s, id: data.id } : s));
    }
  };

  const deleteSession = async id => {
    setSessions(prev => prev.filter(s => s.id !== id));
    await createClient().from("sessions").delete().eq("id", id);
  };

  const cancelSession = async id => {
    if (!window.confirm("Annuler cette séance ? Les inscrits verront la séance comme annulée.")) return;
    setSessions(prev => prev.map(s => s.id === id ? { ...s, status: "cancelled" } : s));
    const { error } = await createClient().from("sessions").update({ status: "cancelled" }).eq("id", id);
    if (error) {
      setSessions(prev => prev.map(s => s.id === id ? { ...s, status: "scheduled" } : s));
      alert("❌ Erreur lors de l'annulation. La séance a été restaurée.");
    }
  };

  const restoreSession = async id => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, status: "scheduled" } : s));
    const { error } = await createClient().from("sessions").update({ status: "scheduled" }).eq("id", id);
    if (error) {
      setSessions(prev => prev.map(s => s.id === id ? { ...s, status: "cancelled" } : s));
      alert("❌ Erreur lors du rétablissement.");
    }
  };

  const addRecurringSessions = async () => {
    if (!recPreview.length || !studioId) return;
    setSessions(prev => [...prev, ...recPreview]);
    setShowAdd(false); setRecMode(false);
    setRecFrom(""); setRecTo(""); setRecSlots([]); setRecPreview([]);
    const rows = recPreview.map(s => ({
      studio_id: studioId, discipline_id: s.disciplineId || null,
      teacher: s.teacher || "", room: s.room || "Studio A", level: s.level || "Tous niveaux",
      session_date: s.date, session_time: s.time,
      duration_min: parseInt(s.duration) || 60, spots: parseInt(s.spots) || 12,
      status: "scheduled",
    }));
    const { error } = await createClient().from("sessions").insert(rows);
    if (error) console.error("insert recurring", error);
    else if (isDemoData) { setSessions(recPreview); setIsDemoData(false); }
  };

  const handleChangeStatus = (bid, sid, ns) => {
    setBookings(prev => {
      const nb = { ...prev };
      nb[sid] = (nb[sid] || []).map(b => b.id === bid ? { ...b, st: ns } : b);
      return nb;
    });
  };

  const handleSendReminder = async sessId => {
    const sess = sessions.find(s => s.id === sessId);
    const bl = (bookings[sessId] || []).filter(b => b.st === "confirmed");
    if (!bl.length) { alert("Aucun inscrit confirmé pour cette séance."); return; }
    try {
      const res = await fetch("/api/send-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessId, studioId, members: bl.map(b => ({ email: b.email, name: b.name })), sess }),
      });
      if (res.ok) alert(`✅ Rappel envoyé à ${bl.length} inscrit${bl.length > 1 ? "s" : ""}.`);
    } catch (e) { console.error("reminder", e); }
  };

  return (
    <div>
      {isDemoData && <DemoBanner />}

      {/* Modale booking */}
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
          <div style={{ marginLeft: "auto", flexShrink: 0 }}>
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
                <div style={{ display: "grid", gridTemplateColumns: `repeat(${isMobile ? 2 : 4}, 1fr)`, gap: 14 }}>
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
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: .8, marginBottom: 5 }}>Heure</div>
                    <TimePicker value={nS.time} onChange={v => setNS({ ...nS, time: v })} />
                  </div>
                  <Field label="Durée (min)" type="number" value={nS.duration} onChange={v => setNS({ ...nS, duration: v })} />
                  <Field label="Places" type="number" value={nS.spots} onChange={v => setNS({ ...nS, spots: v })} />
                  <Field label="Niveau" value={nS.level} onChange={v => setNS({ ...nS, level: v })} opts={["Tous niveaux", "Débutant", "Intermédiaire", "Avancé"]} />
                  <Field label="Salle" value={nS.room} onChange={v => setNS({ ...nS, room: v })} placeholder="Studio A" />
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

                    {allSlotsRaw.length === 0 ? (
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
                  <div style={{ display: "grid", gridTemplateColumns: `repeat(${isMobile ? 2 : 4}, 1fr)`, gap: 12, marginBottom: 20 }}>
                    <div style={{ gridColumn: "span 2" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: .8, marginBottom: 5 }}>Coach par défaut</div>
                      <select value={nS.teacher} onChange={e => { const t = e.target.value; setNS(s => ({ ...s, teacher: t })); setRecSlots(prev => prev.map(s => !s.teacher ? { ...s, teacher: t } : s)); }}
                        style={{ width: "100%", padding: "9px 12px", border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.text, background: C.surface, outline: "none", boxSizing: "border-box" }}>
                        <option value="">— Choisir un coach —</option>
                        {coachesList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                    <Field label="Places" type="number" value={nS.spots} onChange={v => setNS({ ...nS, spots: v })} />
                    <Field label="Salle" value={nS.room} onChange={v => setNS({ ...nS, room: v })} placeholder="Studio A" />
                  </div>

                  {/* Étape 3 — Période */}
                  <div style={{ fontSize: 11, fontWeight: 800, color: C.textMuted, textTransform: "uppercase", letterSpacing: .8, marginBottom: 10 }}>3 · Période <span style={{ fontSize: 10, fontWeight: 600, color: C.warn, marginLeft: 6 }}>max 3 mois</span></div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
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
        ) : dates.length === 0 ? (
          <EmptyState icon="📅" title="Aucune séance" sub={filterDiscs.length ? "Aucune séance pour cette discipline" : "Commencez par créer une séance !"} />
        ) : dates.map(date => (
          <div key={date} style={{ marginBottom: 22 }}>
            <DateLabel date={date} />
            {filtered.filter(s => s.date === date).map(s => (
              <PlanningSessionCard key={s.id} sess={s} expandedId={expandedId} bookings={bookings} discs={effectiveDiscs}
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
        ))}
      </div>
    </div>
  );
}

export { Planning, PlanningSessionCard };