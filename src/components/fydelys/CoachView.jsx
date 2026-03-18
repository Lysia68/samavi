"use client";

import React, { useState, useEffect, useContext } from "react";
import { createClient } from "@/lib/supabase";
import { AppCtx } from "./context";
import { C } from "./theme";
import { SESSIONS_INIT, BOOKINGS_INIT, DISCIPLINES, MY_COACH_NAME, COACH_NAV_KEYS, ADH_NAV_KEYS } from "./demoData";
import { IcoBookOpen, IcoGraduate, IcoAward, IcoLogOut, IcoActivity, IcoCalendar2, IcoUsers2, IcoBarChart2, IcoCreditCard2, IcoChevron, IcoHeart , IcoSearch } from "./icons";
import { Card, SectionHead, Button, Tag, Pill, EmptyState, DemoBanner } from "./ui";
import { PlanningAccordion } from "./accordion";



function CoachView({ onSwitch, isMobile, coachName = MY_COACH_NAME, coachDisciplines = [], studioName = "", studioId = "" }) {
  const COACH_NAV     = COACH_NAV_KEYS.map((n,i) => ({ ...n, icon:[IcoBookOpen,IcoGraduate,IcoAward][i] }));
  const ADH_NAV       = ADH_NAV_KEYS.map((n,i) => ({ ...n, icon:[IcoCalendar2,IcoUsers2,IcoBarChart2,IcoCreditCard2][i] }));
  const ADH_MOBILE_NAV = ADH_NAV;
  const [page, setPage]  = useState("planning");
  const [toast, setToast] = useState(null);
  const showToast = (msg, ok=true) => { setToast({msg,ok}); setTimeout(()=>setToast(null),3000); };
  const p = isMobile ? 16 : 28;

  const handleSignOut = async () => {
    const sb = createClient();
    await sb.auth.signOut();
    window.location.href = "/login";
  };

  // Séances du coach — chargées depuis Supabase
  const [sessions, setSessions] = useState([]);
  const [bookings, setBookings] = useState({}); // { sessionId: [{fn,ln,email,st}] }
  const [dbLoading, setDbLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    if (!studioId || !coachName) return;
    const sb = createClient();
    setDbLoading(true);

    // Charger les séances de ce coach sur 90 jours passés + futur
    const from90 = new Date(); from90.setDate(from90.getDate() - 90);
    const dateFrom = from90.toISOString().split("T")[0];

    sb.from("sessions")
      .select("id, discipline_id, teacher, room, level, session_date, session_time, duration_min, spots, status")
      .eq("studio_id", studioId)
      .eq("teacher", coachName)
      .gte("session_date", dateFrom)
      .order("session_date", { ascending: true })
      .order("session_time", { ascending: true })
      .then(async ({ data: sessData }) => {
        if (!sessData?.length) { setSessions([]); setDbLoading(false); return; }

        const mapped = sessData.map(s => ({
          id: s.id,
          disciplineId: s.discipline_id,
          teacher: s.teacher,
          room: s.room || "",
          level: s.level || "",
          date: s.session_date,
          time: s.session_time?.slice(0,5) || "",
          duration: s.duration_min || 60,
          spots: s.spots || 10,
          status: s.status || "scheduled",
          booked: 0,
          waitlist: 0,
        }));

        // Charger les bookings pour ces séances
        const ids = mapped.map(s => s.id);
        const { data: bkData } = await sb.from("bookings")
          .select("session_id, status, members(first_name, last_name, email, phone)")
          .in("session_id", ids);

        const bkMap = {};
        (bkData || []).forEach(b => {
          if (!bkMap[b.session_id]) bkMap[b.session_id] = [];
          bkMap[b.session_id].push({
            fn: b.members?.first_name || "",
            ln: b.members?.last_name || "",
            email: b.members?.email || "",
            phone: b.members?.phone || "",
            st: b.status,
          });
        });

        // Enrichir les sessions avec compteurs
        const enriched = mapped.map(s => ({
          ...s,
          booked: (bkMap[s.id] || []).filter(b => b.st === "confirmed").length,
          waitlist: (bkMap[s.id] || []).filter(b => b.st === "waitlist").length,
        }));

        setSessions(enriched);
        setBookings(bkMap);
        setDbLoading(false);
      })
      .catch(e => { console.error("CoachView load error", e); setDbLoading(false); });
  }, [studioId, coachName]);

  const initials = coachName.split(" ").map(n=>n[0]).join("").toUpperCase();
  const totalStudents = sessions.reduce((sum,s)=>sum+s.booked, 0);
  const today = new Date().toISOString().split("T")[0];
  const nextSession = [...sessions]
    .filter(s=>s.date >= today && s.status !== "cancelled")
    .sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time))[0];

  // ── Nav bar ──────────────────────────────────────────────────────────────────
  const NavBar = () => (
    isMobile ? (
      <div style={{ position:"fixed", bottom:0, left:0, right:0, background:C.surface, borderTop:`1px solid ${C.border}`, display:"flex", zIndex:100, paddingBottom:"env(safe-area-inset-bottom)" }}>
        {COACH_NAV.map(n=>{
          const Ic = n.icon;
          const active = page === n.key;
          return (
            <button key={n.key} onClick={()=>setPage(n.key)}
              style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"10px 0", background:"none", border:"none", cursor:"pointer", gap:3 }}>
              <Ic s={20} c={active ? C.accent : C.textMuted}/>
              <span style={{ fontSize:10, fontWeight:active?700:500, color:active?C.accent:C.textMuted }}>{n.label}</span>
            </button>
          );
        })}
      </div>
    ) : (
      <div style={{ width:220, minHeight:"100vh", background:C.surface, borderRight:`1px solid ${C.border}`, display:"flex", flexDirection:"column", flexShrink:0 }}>
        {/* Logo */}
        <div style={{ padding:"24px 20px 20px", borderBottom:`1px solid ${C.borderSoft}` }}>
          <div style={{ fontSize:17, fontWeight:800, color:C.text, letterSpacing:-0.4, lineHeight:1.2 }}>
            {studioName || <span>Fyde<span style={{ color:C.accent }}>lys</span></span>}
          </div>
          <div style={{ fontSize:10, color:C.textMuted, fontWeight:500, marginTop:4 }}>
            Propulsé par <a href="https://fydelys.fr" target="_blank" rel="noopener" style={{ color:C.accent, textDecoration:"none", fontWeight:600 }}>Fydelys.fr</a>
          </div>
        </div>
        {/* Profil mini */}
        <div style={{ padding:"16px 20px", borderBottom:`1px solid ${C.borderSoft}`, display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:38, height:38, borderRadius:"50%", background:`linear-gradient(135deg,${C.accent},${C.accentDark})`, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:14, fontWeight:700, flexShrink:0 }}>{initials}</div>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:C.text, lineHeight:1.2 }}>{coachName}</div>
            <div style={{ fontSize:11, color:C.textMuted, display:"flex", alignItems:"center", gap:3 }}><IcoAward s={11} c={C.textMuted}/> Coach</div>
          </div>
        </div>
        {/* Nav links */}
        <nav style={{ padding:"12px 10px", flex:1 }}>
          {COACH_NAV.map(n=>{
            const Ic = n.icon;
            const active = page === n.key;
            return (
              <button key={n.key} onClick={()=>setPage(n.key)}
                style={{ display:"flex", alignItems:"center", gap:10, width:"100%", padding:"10px 12px", borderRadius:10, border:"none", background:active?C.accentLight:"transparent", color:active?C.accentDark:C.textMid, fontWeight:active?700:500, fontSize:14, cursor:"pointer", marginBottom:2, textAlign:"left" }}>
                <Ic s={18} c={active?C.accent:C.textMuted}/>
                {n.label}
              </button>
            );
          })}
        </nav>
        {/* Déconnexion */}
        <div style={{ padding:"12px 10px", borderTop:`1px solid ${C.borderSoft}` }}>
          <button onClick={handleSignOut}
            style={{ display:"flex", alignItems:"center", gap:10, width:"100%", padding:"10px 12px", borderRadius:10, border:"none", background:"transparent", color:C.textMuted, fontSize:14, cursor:"pointer" }}>
            <IcoLogOut s={18} c={C.textMuted}/>
            Se déconnecter
          </button>
        </div>
      </div>
    )
  );

  // ── Header ────────────────────────────────────────────────────────────────────
  const Header = ({ title, sub }) => (
    <div style={{ padding:`${p}px ${p}px 0`, marginBottom:20 }}>
      {isMobile && (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
          <div>
            <div style={{ fontSize:15, fontWeight:800, color:C.text, letterSpacing:-0.3, lineHeight:1.1 }}>{studioName || <span>Fyde<span style={{ color:C.accent }}>lys</span></span>}</div>
            <div style={{ fontSize:9, color:C.textMuted }}>via <span style={{ color:C.accent, fontWeight:600 }}>Fydelys</span></div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <button onClick={handleSignOut} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:8, padding:"6px 8px", cursor:"pointer", display:"flex", alignItems:"center" }}>
              <IcoLogOut s={16} c={C.textMuted}/>
            </button>
            <div style={{ width:32, height:32, borderRadius:"50%", background:C.accentLight, display:"flex", alignItems:"center", justifyContent:"center", color:C.accent, fontSize:13, fontWeight:700 }}>{initials}</div>
          </div>
        </div>
      )}
      <div style={{ fontSize:isMobile?20:24, fontWeight:800, color:C.text, letterSpacing:-0.5 }}>{title}</div>
      {sub && <div style={{ fontSize:13, color:C.textSoft, marginTop:3 }}>{sub}</div>}
    </div>
  );

  // ── VUE PLANNING COACH ─────────────────────────────────────────────────────
  function CoachPlanning() {
    const grouped = sessions.reduce((acc,s)=>{
      (acc[s.date]=acc[s.date]||[]).push(s); return acc;
    }, {});
    const dates = Object.keys(grouped).sort();

    const fillColor = (booked, spots) => {
      const pct = booked / spots;
      if (pct >= 1)    return C.warn;
      if (pct >= 0.75) return C.ok;
      return C.accent;
    };

    return (
      <>
        <Header title="Mes cours" sub={dbLoading ? "Chargement…" : `${sessions.filter(s=>s.date>=today).length} séance${sessions.filter(s=>s.date>=today).length!==1?"s":""} à venir`}/>
        {dbLoading && <div style={{textAlign:"center",padding:"32px 0",color:C.textMuted,fontSize:13}}>Chargement des séances…</div>}
        {!dbLoading && sessions.length === 0 && <div style={{textAlign:"center",padding:"32px 0",color:C.textMuted,fontSize:14}}>Aucune séance assignée.</div>}

        {/* KPIs rapides */}
        <div style={{ padding:`0 ${p}px`, display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:20 }}>
          {[
            { label:"Séances", value:sessions.length, ico:<IcoBookOpen s={18} c={C.accent}/>, color:C.accent, bg:C.accentLight },
            { label:"Inscrits total", value:totalStudents, ico:<IcoGraduate s={18} c={C.ok}/>, color:C.ok, bg:C.okBg },
            { label:"Prochain cours", value:nextSession ? nextSession.time : "—", ico:<IcoActivity s={18} c={C.info}/>, color:C.info, bg:C.infoBg },
          ].map(k=>(
            <div key={k.label} style={{ background:k.bg, borderRadius:12, padding:"12px 10px", border:`1px solid ${k.color}22` }}>
              <div style={{ fontSize:20, marginBottom:4 }}>{k.ico}</div>
              <div style={{ fontSize:isMobile?18:22, fontWeight:800, color:k.color, lineHeight:1 }}>{k.value}</div>
              <div style={{ fontSize:10, color:C.textMuted, marginTop:3 }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* Liste séances par date */}
        <div style={{ padding:`0 ${p}px ${isMobile?90:p}px` }}>
          {dates.length === 0 && (
            <div style={{ textAlign:"center", padding:"48px 16px", color:C.textMuted }}>
              <div style={{ marginBottom:12, display:"flex", justifyContent:"center" }}><IcoBookOpen s={36} c={C.textMuted}/></div>
              <div style={{ fontSize:16, fontWeight:600, color:C.textSoft }}>Aucun cours planifié</div>
            </div>
          )}
          {dates.map(date=>(
            <div key={date} style={{ marginBottom:20 }}>
              <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>
                {new Date(date).toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})}
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {grouped[date].sort((a,b)=>a.time.localeCompare(b.time)).map(s=>{
                  const disc = DISCIPLINES.find(d=>d.id===s.disciplineId);
                  const pct  = Math.round(s.booked/s.spots*100);
                  const fc   = fillColor(s.booked, s.spots);
                  return (
                    <div key={s.id} onClick={()=>setSelectedSession(s)}
                      style={{ background:C.surface, borderRadius:12, padding:"14px 16px", border:`1px solid ${C.border}`, cursor:"pointer", display:"flex", alignItems:"center", gap:14 }}
                      onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent}
                      onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                      {/* Heure */}
                      <div style={{ textAlign:"center", minWidth:44, flexShrink:0 }}>
                        <div style={{ fontSize:16, fontWeight:800, color:C.text }}>{s.time}</div>
                        <div style={{ fontSize:10, color:C.textMuted }}>{s.duration}min</div>
                      </div>
                      {/* Barre séparatrice colorée */}
                      <div style={{ width:3, height:40, borderRadius:2, background:disc?.color||C.accent, flexShrink:0 }}/>
                      {/* Infos */}
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:14, fontWeight:700, color:C.text }}>{disc?.name || "Cours"}</div>
                        <div style={{ fontSize:12, color:C.textSoft }}>{s.room} · {s.level}</div>
                      </div>
                      {/* Taux remplissage */}
                      <div style={{ textAlign:"right", flexShrink:0 }}>
                        <div style={{ fontSize:15, fontWeight:800, color:fc }}>{s.booked}/{s.spots}</div>
                        <div style={{ width:56, height:4, background:C.bgDeep, borderRadius:2, marginTop:4, overflow:"hidden" }}>
                          <div style={{ height:"100%", width:`${pct}%`, background:fc, borderRadius:2 }}/>
                        </div>
                        {s.waitlist>0 && <div style={{ fontSize:10, color:C.warn, marginTop:2 }}>+{s.waitlist} liste att.</div>}
                      </div>
                      <div style={{ color:C.textMuted, fontSize:12 }}>›</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Modal détail séance + inscrits */}
        {selectedSession && (() => {
          const s    = selectedSession;
          const disc = DISCIPLINES.find(d=>d.id===s.disciplineId);
          const bks  = bookings[s.id] || [];
          const confirmed = bks.filter(b=>b.st==="confirmed");
          const waiting   = bks.filter(b=>b.st==="waitlist");
          return (
            <div onClick={e=>e.target===e.currentTarget&&setSelectedSession(null)}
              style={{ position:"fixed", inset:0, background:"rgba(42,31,20,.45)", zIndex:800, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
              <div style={{ background:C.surface, borderRadius:20, width:"100%", maxWidth:500, maxHeight:"88vh", overflowY:"auto", boxShadow:"0 24px 56px rgba(42,31,20,.18)" }}>
                {/* En-tête */}
                <div style={{ padding:"20px 22px 16px", borderBottom:`1px solid ${C.borderSoft}`, position:"sticky", top:0, background:C.surface, zIndex:1 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                    <div>
                      <div style={{ fontSize:18, fontWeight:800, color:C.text }}>{disc?.name}</div>
                      <div style={{ fontSize:13, color:C.textSoft, marginTop:2 }}>
                        {new Date(s.date).toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})} · {s.time} · {s.duration} min
                      </div>
                      <div style={{ fontSize:12, color:C.textMuted, marginTop:1 }}>{s.room} · {s.level}</div>
                    </div>
                    <button onClick={()=>setSelectedSession(null)} style={{ background:C.bgDeep, border:`1px solid ${C.border}`, borderRadius:8, padding:"4px 10px", cursor:"pointer", color:C.textSoft, fontSize:15 }}>✕</button>
                  </div>
                  {/* Barre remplissage */}
                  <div style={{ marginTop:12, padding:"10px 14px", background:C.accentLight, borderRadius:10, display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, color:C.textSoft, marginBottom:5 }}>Remplissage</div>
                      <div style={{ height:6, background:C.bgDeep, borderRadius:3, overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${Math.min(100,Math.round(s.booked/s.spots*100))}%`, background:s.booked>=s.spots?C.warn:C.ok, borderRadius:3 }}/>
                      </div>
                    </div>
                    <div style={{ fontSize:18, fontWeight:800, color:C.text, flexShrink:0 }}>{s.booked}/{s.spots}</div>
                  </div>
                </div>

                {/* Liste inscrits confirmés */}
                <div style={{ padding:"16px 22px" }}>
                  <div style={{ fontSize:13, fontWeight:700, color:C.textMid, marginBottom:10 }}>
                    ✅ Inscrits confirmés ({confirmed.length})
                  </div>
                  {confirmed.length === 0 && (
                    <div style={{ padding:"16px 0", color:C.textMuted, fontSize:13 }}>Aucun inscrit pour l'instant</div>
                  )}
                  {confirmed.map((b,i)=>(
                    <div key={b.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 0", borderBottom:i<confirmed.length-1?`1px solid ${C.borderSoft}`:"none" }}>
                      <div style={{ width:32, height:32, borderRadius:"50%", background:C.accentLight, display:"flex", alignItems:"center", justifyContent:"center", color:C.accent, fontSize:12, fontWeight:700, flexShrink:0 }}>
                        {(b.fn[0]||"")+( b.ln[0]||"")}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{b.fn} {b.ln}</div>
                        <div style={{ fontSize:11, color:C.textMuted, display:"flex", alignItems:"center", gap:8, marginTop:2, flexWrap:"wrap" }}>
                          {b.phone && <span style={{ display:"flex", alignItems:"center", gap:3 }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.06 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                            {b.phone}
                          </span>}
                          {b.email && <span style={{ display:"flex", alignItems:"center", gap:3 }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/></svg>
                            {b.email}
                          </span>}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Liste d'attente */}
                  {waiting.length > 0 && (
                    <>
                      <div style={{ fontSize:13, fontWeight:700, color:C.textMid, marginTop:18, marginBottom:10 }}>
                        ⏳ Liste d'attente ({waiting.length})
                      </div>
                      {waiting.map((b,i)=>(
                        <div key={b.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 0", borderBottom:i<waiting.length-1?`1px solid ${C.borderSoft}`:"none", opacity:.7 }}>
                          <div style={{ width:32, height:32, borderRadius:"50%", background:"#F5EBE0", display:"flex", alignItems:"center", justifyContent:"center", color:C.warn, fontSize:12, fontWeight:700, flexShrink:0 }}>
                            {(b.fn[0]||"")+(b.ln[0]||"")}
                          </div>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{b.fn} {b.ln}</div>
                            <div style={{ fontSize:11, color:C.textMuted }}>{b.sub}</div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </>
    );
  }

  // ── VUE INSCRITS COACH ────────────────────────────────────────────────────
  function CoachStudents() {
    // Tous les inscrits uniques sur les séances du coach
    const allStudents = Object.entries(bookings)
      .filter(([sid]) => sessions.some(s=>String(s.id)===String(sid)))
      .flatMap(([sid, bks]) => bks.filter(b=>b.st==="confirmed").map(b=>({...b, sessionId:sid})))

    const uniqueEmails = new Set();
    const unique = allStudents.filter(b=>{
      const key = `${b.fn}${b.ln}`;
      if(uniqueEmails.has(key)) return false;
      uniqueEmails.add(key); return true;
    });

    const [search, setSearch] = useState("");
    const filtered = unique.filter(b=>`${b.fn} ${b.ln}`.toLowerCase().includes(search.toLowerCase()));

    return (
      <>
        <Header title="Mes inscrits" sub={`${unique.length} élève${unique.length>1?"s":""} uniques sur mes cours`}/>
        <div style={{ padding:`0 ${p}px ${isMobile?90:p}px` }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher un élève…"
            style={{ width:"100%", padding:"10px 14px", border:`1.5px solid ${C.border}`, borderRadius:10, fontSize:14, outline:"none", color:C.text, background:C.surface, boxSizing:"border-box", marginBottom:16 }}/>
          {filtered.map((b,i)=>{
            const nbSessions = allStudents.filter(x=>`${x.fn}${x.ln}`===`${b.fn}${b.ln}`).length;
            return (
              <div key={`${b.fn}${b.ln}`} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", background:C.surface, borderRadius:12, border:`1px solid ${C.border}`, marginBottom:8 }}>
                <div style={{ width:38, height:38, borderRadius:"50%", background:C.accentLight, display:"flex", alignItems:"center", justifyContent:"center", color:C.accent, fontSize:14, fontWeight:700, flexShrink:0 }}>
                  {(b.fn[0]||"")+(b.ln[0]||"")}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:C.text }}>{b.fn} {b.ln}</div>
                  <div style={{ fontSize:12, color:C.textMuted, display:"flex", alignItems:"center", gap:8, marginTop:2, flexWrap:"wrap" }}>
                    {b.phone && <span style={{ display:"flex", alignItems:"center", gap:3 }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.06 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                      {b.phone}
                    </span>}
                    {b.email && <span style={{ display:"flex", alignItems:"center", gap:3 }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/></svg>
                      {b.email}
                    </span>}
                  </div>
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:C.accent }}>{nbSessions}</div>
                  <div style={{ fontSize:10, color:C.textMuted }}>séance{nbSessions>1?"s":""}</div>
                </div>
              </div>
            );
          })}
          {filtered.length===0 && <div style={{ textAlign:"center", padding:"32px", color:C.textMuted }}>Aucun résultat pour « {search} »</div>}
        </div>
      </>
    );
  }

  // ── VUE PROFIL COACH ──────────────────────────────────────────────────────
  function CoachProfile() {
    const totalHours = sessions.reduce((sum,s)=>sum+s.duration, 0);
    const avgFill = sessions.length
      ? Math.round(sessions.reduce((sum,s)=>sum+s.booked/s.spots*100, 0) / sessions.length)
      : 0;
    return (
      <>
        <Header title="Mon profil"/>
        <div style={{ padding:`0 ${p}px ${isMobile?90:p}px` }}>
          {/* Carte profil */}
          <div style={{ background:C.surface, borderRadius:16, border:`1px solid ${C.border}`, overflow:"hidden", marginBottom:16 }}>
            <div style={{ height:60, background:`linear-gradient(135deg,${C.accentLight},${C.accentBg})` }}/>
            <div style={{ padding:"0 20px 20px", marginTop:-24 }}>
              <div style={{ width:48, height:48, borderRadius:"50%", background:`linear-gradient(135deg,${C.accent},${C.accentDark})`, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:18, fontWeight:800, border:`3px solid ${C.surface}` }}>{initials}</div>
              <div style={{ fontSize:20, fontWeight:800, color:C.text, marginTop:10 }}>{coachName}</div>
              <div style={{ fontSize:13, color:C.textMuted, marginTop:2, display:"flex", alignItems:"center", gap:4 }}><IcoAward s={13} c={C.textMuted}/> Coach · Fydelys Studio</div>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
            {[
              { label:"Séances planifiées", value:sessions.length, ico:<IcoBookOpen s={18} c={C.accent}/>, color:C.accent, bg:C.accentLight },
              { label:"Élèves suivis",       value:totalStudents,   ico:<IcoGraduate s={18} c={C.ok}/>, color:C.ok,     bg:C.okBg },
              { label:"Heures de cours",     value:`${Math.round(totalHours/60)}h`, icon:"⏱", color:C.info, bg:C.infoBg },
              { label:"Taux remplissage",    value:`${avgFill}%`,   ico:<IcoBarChart2 s={18} c={C.accent}/>, color:C.accent, bg:C.accentLight },
            ].map(k=>(
              <div key={k.label} style={{ background:k.bg, borderRadius:12, padding:"14px", border:`1px solid ${k.color}22` }}>
                <div style={{ fontSize:22, marginBottom:6 }}>{k.ico}</div>
                <div style={{ fontSize:24, fontWeight:800, color:k.color, lineHeight:1 }}>{k.value}</div>
                <div style={{ fontSize:11, color:C.textMuted, marginTop:4 }}>{k.label}</div>
              </div>
            ))}
          </div>

          {/* Disciplines affectées par l'admin */}
          <div style={{ background:C.surface, borderRadius:14, border:`1px solid ${C.border}`, padding:"16px 18px" }}>
            <div style={{ fontSize:13, fontWeight:700, color:C.textMid, marginBottom:12 }}>Mes disciplines</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {coachDisciplines.length > 0
                ? coachDisciplines.map(disc => (
                    <span key={disc.id} style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"6px 14px", borderRadius:20, background:`${disc.color}18`, border:`1.5px solid ${disc.color}40`, fontSize:13, fontWeight:600, color:disc.color }}>
                      {disc.icon} {disc.name}
                    </span>
                  ))
                // Fallback : disciplines inférées depuis les séances
                : [...new Set(sessions.map(s=>s.disciplineId))].map(id => {
                    const disc = DISCIPLINES.find(d=>d.id===id);
                    return disc ? (
                      <span key={id} style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"6px 14px", borderRadius:20, background:`${disc.color}18`, border:`1.5px solid ${disc.color}40`, fontSize:13, fontWeight:600, color:disc.color }}>
                        {disc.icon} {disc.name}
                      </span>
                    ) : null;
                  })
              }
              {coachDisciplines.length===0 && sessions.length===0 && (
                <span style={{ color:C.textMuted, fontSize:13 }}>Aucune discipline affectée — contactez l'administrateur</span>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── Rendu principal ────────────────────────────────────────────────────────
  const CurrentPage = { planning:CoachPlanning, students:CoachStudents, profile:CoachProfile }[page] || CoachPlanning;

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:C.bg }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing:border-box; font-family:-apple-system,'Inter',sans-serif; }
        body { margin:0; }
      `}</style>
      {!isMobile && <NavBar/>}
      <div style={{ flex:1, overflowY:"auto" }}>
        {toast && (
          <div style={{ position:"fixed", top:20, right:20, zIndex:900, display:"flex", alignItems:"center", gap:8, padding:"11px 18px", background:toast.ok?C.ok:C.warn, borderRadius:10, color:"white", fontSize:14, fontWeight:600, boxShadow:"0 8px 24px rgba(0,0,0,.12)" }}>
            {toast.msg}
          </div>
        )}
        <CurrentPage/>
      </div>
      {isMobile && <NavBar/>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ADHÉRENT VIEW  — reprend exactement les styles C.* du v3
// ══════════════════════════════════════════════════════════════════════════════


export { CoachView };