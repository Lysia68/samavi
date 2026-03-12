"use client";

import React, { useState, useEffect, useContext } from "react";
import { createClient } from "@/lib/supabase";
import { AppCtx } from "./context";
import { C } from "./theme";
import { DISCIPLINES, SESSIONS_INIT, BOOKINGS_INIT, SESSIONS_DEMO } from "./demoData";
import { IcoChevron, IcoCalendar, IcoCheck, IcoX, IcoMail, DISC_ICONS } from "./icons";
import { Card, SectionHead, Button, Field, DateLabel, Pill, DemoBanner, EmptyState } from "./ui";
import { DatePicker, TimePicker, DurationPicker, DaySelect } from "./pickers";
import { PlanningAccordion, stLbl, stStyle } from "./accordion";


function PlanningSessionCard({ sess, expandedId, bookings, discs, onToggle, onChangeStatus, onDelete, onCancel }) {
  const allDiscs = discs?.length ? discs : DISCIPLINES;
  const disc = allDiscs.find(d=>String(d.id)===String(sess.disciplineId)) || allDiscs[0] || { name:"Cours", color:C.accent, icon:"🧘" };
  const bl     = bookings[sess.id]||[];
  const booked = bl.length ? bl.filter(b=>b.st==="confirmed").length : sess.booked;
  const wait   = bl.length ? bl.filter(b=>b.st==="waitlist").length  : sess.waitlist;
  const pct    = booked/sess.spots;
  const isExp  = expandedId===sess.id;

  return (
    <div style={{ border:`1px solid ${isExp?C.accent:C.border}`, borderRadius:12, overflow:"hidden", marginBottom:8, boxShadow:isExp?`0 0 0 3px rgba(176,120,72,.1)`:"none", transition:"all .2s" }}>
      <div
        onClick={()=>onToggle(sess.id)}
        style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 13px", cursor:"pointer", background:isExp?C.accentBg:C.surface, transition:"background .15s" }}
        onMouseEnter={e=>{ if(!isExp) e.currentTarget.style.background=C.surfaceWarm; }}
        onMouseLeave={e=>{ if(!isExp) e.currentTarget.style.background=C.surface; }}>
        <div style={{ width:3, height:32, borderRadius:2, background:disc.color, flexShrink:0 }}/>
        <div style={{ fontSize:13, fontWeight:700, color:C.accent, width:36, flexShrink:0 }}>{sess.time}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:15, fontWeight:700, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{disc.name}</div>
          <div style={{ fontSize:13, color:C.textSoft, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{sess.teacher} · {sess.room} · {sess.duration}min</div>
        </div>
        <div style={{ flexShrink:0, textAlign:"right", marginRight:4 }}>
          <div style={{ fontSize:14, fontWeight:700, color:pct>=1?C.warn:C.text }}>{booked}/{sess.spots}</div>
          <div style={{ width:44, height:3, background:C.bgDeep, borderRadius:2, marginTop:3 }}>
            <div style={{ height:"100%", width:`${Math.min(pct*100,100)}%`, background:pct>=1?C.warn:pct>.75?C.accent:C.ok, borderRadius:2 }}/>
          </div>
          {wait>0 && <div style={{ fontSize:11, color:C.accent, fontWeight:700, marginTop:1 }}>+{wait} att.</div>}
        </div>
        <span style={{ flexShrink:0, display:"inline-flex", transition:"transform .2s", transform:isExp?"rotate(180deg)":"none" }}><IcoChevron s={16} c={C.textMuted}/></span>
        {/* Actions rapides — visibles au hover ou si expanded */}
        {isExp && (
          <div onClick={e=>e.stopPropagation()} style={{ display:"flex", gap:4, flexShrink:0 }}>
            {sess.status !== "cancelled" && onCancel && (
              <button onClick={()=>onCancel(sess.id)}
                style={{ fontSize:11, padding:"3px 8px", borderRadius:6, border:`1px solid ${C.border}`, background:C.surface, color:C.textMuted, cursor:"pointer", fontWeight:600 }}>
                Annuler
              </button>
            )}
            {onDelete && (
              <button onClick={()=>{ if(window.confirm("Supprimer cette séance définitivement ?")) onDelete(sess.id); }}
                style={{ fontSize:11, padding:"3px 8px", borderRadius:6, border:`1px solid #EFC8BC`, background:"#FFF5F5", color:C.warn, cursor:"pointer", fontWeight:600 }}>
                ✕
              </button>
            )}
          </div>
        )}
      </div>
      {sess.status === "cancelled" && (
        <div style={{ background:"#FFF5F5", padding:"4px 14px", fontSize:12, color:C.warn, fontWeight:600 }}>⚠ Séance annulée</div>
      )}
      {isExp && <PlanningAccordion sessId={sess.id} bookings={bookings} onChangeStatus={onChangeStatus}/>}
    </div>
  );
}

// ── DASHBOARD SESSION CARD (réutilise PlanningAccordion) ─────────────────────

function Planning({ isMobile }) {
  const { discs, studioId } = useContext(AppCtx);
  const [sessions, setSessions] = useState([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [bookings, setBookings] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const [fd, setFd] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [nS, setNS] = useState({ disciplineId:"", teacher:"", date:"", time:"09:00", duration:60, spots:12, level:"Tous niveaux", room:"Studio A" });
  const [coachesList, setCoachesList] = useState([]);
  // Mode récurrence
  const [recMode, setRecMode] = useState(false); // false = séance unique, true = récurrence
  const [recFrom, setRecFrom] = useState("");
  const [recTo, setRecTo]     = useState("");
  const [recSlots, setRecSlots] = useState([]); // créneaux sélectionnés [{day,time,duration,disciplineId}]
  const [recPreview, setRecPreview] = useState([]); // dates générées prévisualisées
  const [recFilterDisc, setRecFilterDisc] = useState(null); // filtre discipline étape 1
  const [isDemoData, setIsDemoData] = useState(false);
  const p = isMobile?12:28;

  // Utilitaire : convertir "Lun/Mar/…" → numéro JS getDay()
  const DAY_NUM = { Lun:1, Mar:2, Mer:3, Jeu:4, Ven:5, Sam:6, Dim:0 };

  // Charger la liste des coachs (utilise studioId du context)
  useEffect(() => {
    if (!studioId) return;
    createClient().from("profiles")
      .select("id, first_name, last_name")
      .eq("studio_id", studioId)
      .in("role", ["coach", "admin"])
      .then(({ data: coaches }) => {
        if (coaches) setCoachesList(coaches.map(c => ({ id: c.id, name: `${c.first_name || ""} ${c.last_name || ""}`.trim() })));
      });
  }, []);

  // Charger les sessions dès que studioId est disponible dans le context
  useEffect(() => {
    if (!studioId) return;
    setDbLoading(true);
    createClient().from("sessions")
      .select("id, discipline_id, teacher, room, level, session_date, session_time, duration_min, spots, status")
      .eq("studio_id", studioId).order("session_date").order("session_time")
      .then(({ data, error }) => {
        if (error) console.error("load sessions", error);
        else if (data && data.length > 0) setSessions(data.map(s => ({
          id: s.id, disciplineId: s.discipline_id,
          teacher: s.teacher || "", room: s.room || "Studio A", level: s.level || "Tous niveaux",
          date: s.session_date, time: s.session_time?.slice(0,5) || "09:00",
          duration: s.duration_min || 60, spots: s.spots || 12,
          status: s.status || "scheduled", booked: 0, waitlist: 0,
        })));
        // Données démo si base vide
        else if (!error && (!data || data.length === 0)) { setSessions(SESSIONS_DEMO); setIsDemoData(true); }
        setDbLoading(false);
      });
  }, [studioId]);

  // Recalcule le preview quand les paramètres récurrence changent
  useEffect(() => {
    if (!recMode || !recFrom || !recTo || recSlots.length === 0) { setRecPreview([]); return; }
    const from = new Date(recFrom); from.setHours(0,0,0,0);
    const to   = new Date(recTo);   to.setHours(23,59,59,0);
    if (from > to) { setRecPreview([]); return; }
    const generated = [];
    recSlots.forEach(slot => {
      const targetDay = DAY_NUM[slot.day];
      const cur = new Date(from);
      // Avancer jusqu'au bon jour de la semaine
      while (cur.getDay() !== targetDay) cur.setDate(cur.getDate() + 1);
      while (cur <= to) {
        generated.push({
          id: Date.now() + Math.random(),
          disciplineId: slot.disciplineId,
          teacher: slot.teacher || nS.teacher || "",
          date: cur.toISOString().slice(0,10),
          time: slot.time,
          duration: slot.duration || 60,
          spots: nS.spots || 12,
          level: nS.level || "Tous niveaux",
          room: nS.room || "Studio A",
          booked: 0, waitlist: 0,
        });
        cur.setDate(cur.getDate() + 7); // semaine suivante
      }
    });
    generated.sort((a,b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
    setRecPreview(generated);
  }, [recMode, recFrom, recTo, recSlots, nS.teacher, nS.spots, nS.level, nS.room]);

  const filtered = fd ? sessions.filter(s=>s.disciplineId===fd) : sessions;

  const dates = [...new Set(filtered.map(s=>s.date))].sort();

  const addSession = async () => {
    if (!nS.date || !studioId) return;
    const sess = { ...nS, disciplineId: nS.disciplineId || null };
    const tempId = `tmp-${Date.now()}`;
    setSessions(prev => [...prev, { id:tempId, ...sess, booked:0, waitlist:0 }]);
    setShowAdd(false);
    setNS({ disciplineId:"", teacher:"", date:"", time:"09:00", duration:60, spots:12, level:"Tous niveaux", room:"Studio A" });
    try {
      const sb = createClient();
      console.log("INSERT session — studioId:", studioId, "disciplineId:", sess.disciplineId, "date:", sess.date);
      const { data, error } = await sb.from("sessions").insert({
        studio_id: studioId, discipline_id: sess.disciplineId || null,
        teacher: sess.teacher || "", room: sess.room || "Studio A", level: sess.level || "Tous niveaux",
        session_date: sess.date, session_time: sess.time,
        duration_min: parseInt(sess.duration) || 60, spots: parseInt(sess.spots) || 12,
        status: "scheduled",
      }).select("id").single();
      if (error) {
        console.error("insert session ERROR — code:", error.code, "msg:", error.message, "hint:", error.hint);
        setSessions(prev=>prev.filter(s=>s.id!==tempId));
        alert("❌ Erreur Supabase:\n" + error.message + "\nCode: " + error.code + (error.hint ? "\nHint: " + error.hint : ""));
      } else if (data?.id) {
        if (isDemoData) {
          setSessions([{ id:data.id, ...sess, booked:0, waitlist:0 }]);
          setIsDemoData(false);
        } else {
          setSessions(prev => prev.map(s => s.id===tempId ? {...s, id:data.id} : s));
        }
      }
    } catch(e) { console.error("insert session", e); setSessions(prev=>prev.filter(s=>s.id!==tempId)); }
  };

  const deleteSession = async (id) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    if (!studioId) return;
    try { await createClient().from("sessions").delete().eq("id", id); }
    catch(e) { console.error("delete session", e); }
  };

  const cancelSession = async (id) => {
    setSessions(prev => prev.map(s => s.id===id ? {...s, status:"cancelled"} : s));
    if (!studioId) return;
    try { await createClient().from("sessions").update({ status:"cancelled" }).eq("id", id); }
    catch(e) { console.error("cancel session", e); }
  };

  const addRecurringSessions = async () => {
    if (recPreview.length === 0 || !studioId) return;
    setSessions(prev => [...prev, ...recPreview]);
    setShowAdd(false); setRecMode(false);
    setRecFrom(""); setRecTo(""); setRecSlots([]); setRecPreview([]);
    try {
      const rows = recPreview.map(s => ({
        studio_id: studioId, discipline_id: s.disciplineId || null,
        teacher: s.teacher || "", room: s.room || "Studio A", level: s.level || "Tous niveaux",
        session_date: s.date, session_time: s.time,
        duration_min: parseInt(s.duration) || 60, spots: parseInt(s.spots) || 12,
        status: "scheduled",
      }));
      const { error } = await createClient().from("sessions").insert(rows);
      if (error) console.error("insert recurring", error);
      else if (isDemoData) {
        // Remplacer les démos par les vraies données récurrentes
        setSessions(recPreview);
        setIsDemoData(false);
      }
    } catch(e) { console.error("insert recurring", e); }
  };

  const handleToggle = (id) => setExpandedId(prev => prev===id ? null : id);

  const handleChangeStatus = (bid, sid, ns) => {
    setBookings(prev => {
      const nb = { ...prev };
      nb[sid] = (nb[sid]||[]).map(b => b.id===bid ? { ...b, st:ns } : b);
      return nb;
    });
  };

  const handleAddBooking = (sessId) => {
    const name = prompt("Nom de l'adhérent à inscrire :");
    if (!name) return;
    const [fn, ...rest] = name.trim().split(" ");
    const ln = rest.join(" ") || "—";
    setBookings(prev => {
      const nb = { ...prev };
      nb[sessId] = [...(nb[sessId]||[]), { id:Date.now(), fn, ln, st:"confirmed", phone:"", credits:0, total:10, sub:"Mensuel illimité" }];
      return nb;
    });
  };

  const handleSendReminder = (sessId) => {
    const sess = sessions.find(s=>s.id===sessId);
    const count = (bookings[sessId]||[]).filter(b=>b.st==="confirmed").length;
    alert(`✉ Rappel envoyé à ${count} adhérent${count>1?"s":""} pour la séance ${sess?.time||""}`);
  };

  return (
    <div>
      {isDemoData && <DemoBanner/>}
      <div style={{ padding:p }}>
      <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:4, marginBottom:18, alignItems:"center", WebkitOverflowScrolling:"touch" }}>
        <Button sm variant={fd===null?"primary":"ghost"} onClick={()=>setFd(null)}>Toutes</Button>
        {(discs||DISCIPLINES).map(d=>{ const Ico=DISC_ICONS[d.id]; return <Button key={d.id} sm variant={fd===d.id?"primary":"ghost"} onClick={()=>setFd(d.id)}><span style={{display:"flex",alignItems:"center",gap:5}}>{Ico&&<Ico s={13} c={fd===d.id?C.surface:d.color}/>}{d.name}</span></Button>; })}
        <div style={{ marginLeft:"auto", flexShrink:0 }}><Button sm variant="primary" onClick={()=>{
          const allD = discs||DISCIPLINES;
          if (!showAdd && allD.length > 0 && !nS.disciplineId) {
            setNS(prev => ({ ...prev, disciplineId: String(allD[0].id) }));
          }
          setShowAdd(!showAdd);
        }}>＋ Séance</Button></div>
      </div>

      {showAdd && (
        <Card style={{ marginBottom:18, borderTop:`3px solid ${C.accent}` }}>
          {/* Toggle séance unique / récurrence */}
          <div style={{ display:"flex", gap:6, marginBottom:18 }}>
            <button onClick={()=>setRecMode(false)}
              style={{ flex:1, padding:"8px", borderRadius:8, border:`1.5px solid ${recMode?C.border:C.accent}`, background:recMode?"none":C.accentLight, color:recMode?C.textMuted:C.accent, fontSize:13, fontWeight:recMode?400:700, cursor:"pointer" }}>
              📅 Séance unique
            </button>
            <button onClick={()=>setRecMode(true)}
              style={{ flex:1, padding:"8px", borderRadius:8, border:`1.5px solid ${recMode?C.accent:C.border}`, background:recMode?C.accentLight:"none", color:recMode?C.accent:C.textMuted, fontSize:13, fontWeight:recMode?700:400, cursor:"pointer" }}>
              🔁 Récurrence
            </button>
          </div>

          {/* ── MODE SÉANCE UNIQUE ── */}
          {!recMode && (
            <>
              <div style={{ fontSize:13, fontWeight:700, color:C.accent, textTransform:"uppercase", letterSpacing:.5, marginBottom:14 }}>Créer une séance</div>
              <div style={{ display:"grid", gridTemplateColumns:`repeat(${isMobile?2:4},1fr)`, gap:14 }}>
                <Field label="Discipline" value={nS.disciplineId} onChange={v=>{
                  const allD = discs||DISCIPLINES;
                  const disc = allD.find(d=>String(d.id)===String(v));
                  const slot = disc?.slots?.[0];
                  setNS({...nS, disciplineId:v, ...(slot?{time:slot.time, duration:slot.duration||60}:{})});
                }} opts={(discs||DISCIPLINES).map(d=>({v:String(d.id),l:d.name}))}/>
                <div>
                  <label style={{fontSize:11,fontWeight:700,color:C.textMuted,textTransform:"uppercase",letterSpacing:.8,display:"block",marginBottom:5}}>Professeur</label>
                  <select value={nS.teacher} onChange={e=>setNS({...nS,teacher:e.target.value})}
                    style={{width:"100%",padding:"9px 12px",border:`1.5px solid ${C.border}`,borderRadius:8,fontSize:14,color:C.text,background:C.surface,outline:"none",boxSizing:"border-box"}}>
                    <option value="">— Choisir un coach —</option>
                    {coachesList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    {coachesList.length === 0 && <option disabled>Aucun coach configuré</option>}
                  </select>
                </div>
                <DatePicker label="Date" value={nS.date} onChange={v=>setNS({...nS,date:v})}/>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:C.textMuted,textTransform:"uppercase",letterSpacing:.8,marginBottom:5}}>Heure</div>
                  <TimePicker value={nS.time} onChange={v=>setNS({...nS,time:v})}/>
                </div>
                <Field label="Durée (min)" type="number" value={nS.duration} onChange={v=>setNS({...nS,duration:v})}/>
                <Field label="Places" type="number" value={nS.spots} onChange={v=>setNS({...nS,spots:v})}/>
                <Field label="Niveau" value={nS.level} onChange={v=>setNS({...nS,level:v})} opts={["Tous niveaux","Débutant","Intermédiaire","Avancé"]}/>
                <Field label="Salle" value={nS.room} onChange={v=>setNS({...nS,room:v})} placeholder="Studio A"/>
              </div>
              <div style={{ marginTop:16, display:"flex", gap:10 }}>
                <Button variant="primary" onClick={addSession}>Créer la séance</Button>
                <Button variant="ghost" onClick={()=>setShowAdd(false)}>Annuler</Button>
              </div>
            </>
          )}

          {/* ── MODE RÉCURRENCE ── */}
          {recMode && (() => {
            // Utiliser les discs du context (modifiés dans DisciplinesPage)
            const allSlotsRaw = (discs||[]).flatMap(d =>
              (d.slots||[]).map((s,i) => ({ key:`${d.id}-${i}`, disciplineId:d.id, discName:d.name, discColor:d.color||C.accent, discIcon:d.icon||"🏃", day:s.day, time:s.time, duration:s.duration||60, teacher:"" }))
            );
            // Filtre par discipline
            const allSlots = recFilterDisc ? allSlotsRaw.filter(s=>s.disciplineId===recFilterDisc) : allSlotsRaw;
            const isSelected = (k) => recSlots.some(s=>s.key===k);
            const dayLabel = (d) => ({Lun:"Lundi",Mar:"Mardi",Mer:"Mercredi",Jeu:"Jeudi",Ven:"Vendredi",Sam:"Samedi",Dim:"Dimanche"}[d]||d);

            // Sélectionner/désélectionner un créneau
            const toggleSlot = (slot) => {
              setRecSlots(prev => isSelected(slot.key)
                ? prev.filter(s=>s.key!==slot.key)
                : [...prev, {...slot, teacher: nS.teacher}]
              );
            };

            // Changer le coach d'un créneau sélectionné
            const updateSlotCoach = (key, teacher) => {
              setRecSlots(prev => prev.map(s => s.key===key ? {...s, teacher} : s));
            };

            // Supprimer une séance précise dans le preview
            const removePreviewItem = (previewId) => {
              setRecPreview(prev => prev.filter(s => s.id !== previewId));
            };

            // Changer le coach d'une séance précise dans le preview
            const updatePreviewCoach = (previewId, teacher) => {
              setRecPreview(prev => prev.map(s => s.id===previewId ? {...s, teacher} : s));
            };

            return (
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:C.accent, textTransform:"uppercase", letterSpacing:.5, marginBottom:14 }}>Générer des séances récurrentes</div>

                {/* ── ÉTAPE 1 : Créneaux ── */}
                <div style={{ marginBottom:4 }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:.8 }}>
                      1 · Créneaux à inclure
                    </div>
                    {allSlotsRaw.length > 0 && (
                      <select value={recFilterDisc||""} onChange={e=>setRecFilterDisc(e.target.value?Number(e.target.value):null)}
                        style={{ fontSize:12, padding:"5px 10px", border:`1.5px solid ${C.border}`, borderRadius:8, background:C.surface, color:C.text, outline:"none", cursor:"pointer", maxWidth:160 }}>
                        <option value="">Toutes les disciplines</option>
                        {(discs||[]).filter(d=>(d.slots||[]).length>0).map(d=>(
                          <option key={d.id} value={d.id}>{d.icon||""} {d.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  {allSlotsRaw.length === 0 ? (
                    <div style={{ padding:"14px", background:"#FFF8F0", borderRadius:10, border:`1px dashed ${C.border}`, fontSize:13, color:C.textSoft, marginBottom:12 }}>
                      {recFilterDisc
                        ? <>ℹ Aucun créneau pour cette discipline. Allez dans <strong>Disciplines</strong> pour en ajouter.</>
                        : <>ℹ Aucun créneau configuré. Allez dans <strong>Disciplines</strong> pour définir les horaires.</>
                      }
                    </div>
                  ) : (
                    <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:16 }}>
                      {allSlots.map(slot => {
                        const sel = isSelected(slot.key);
                        const selSlot = recSlots.find(s=>s.key===slot.key);
                        return (
                          <div key={slot.key} style={{ borderRadius:10, border:`1.5px solid ${sel?C.accent:C.border}`, background:sel?C.accentLight:C.surface, overflow:"hidden", transition:"all .15s" }}>
                            {/* Ligne principale — clic pour sélectionner */}
                            <div onClick={()=>toggleSlot(slot)}
                              style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", cursor:"pointer" }}>
                              <div style={{ width:20, height:20, borderRadius:5, border:`2px solid ${sel?C.accent:C.border}`, background:sel?C.accent:"transparent", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                                {sel && <span style={{color:"#fff",fontSize:12,lineHeight:1}}>✓</span>}
                              </div>
                              <span style={{fontSize:15}}>{slot.discIcon}</span>
                              <div style={{flex:1}}>
                                <div style={{ fontSize:13, fontWeight:700, color:sel?C.accent:C.text }}>{slot.discName}</div>
                                <div style={{ fontSize:11, color:C.textSoft }}>{dayLabel(slot.day)} · {slot.time} · {slot.duration} min</div>
                              </div>
                            </div>
                            {/* Coach par créneau — visible seulement si sélectionné */}
                            {sel && (
                              <div style={{ borderTop:`1px solid ${C.border}`, padding:"8px 14px 10px", display:"flex", alignItems:"center", gap:10, background:"rgba(160,104,56,.04)" }}>
                                <span style={{fontSize:11,fontWeight:700,color:C.textMuted,flexShrink:0,textTransform:"uppercase",letterSpacing:.6}}>Coach</span>
                                <select value={selSlot?.teacher||""} onChange={e=>updateSlotCoach(slot.key, e.target.value)}
                                  style={{flex:1,padding:"6px 10px",border:`1.5px solid ${C.border}`,borderRadius:7,fontSize:13,color:C.text,background:C.surface,outline:"none"}}>
                                  <option value="">— Coach par défaut ({nS.teacher||"non défini"}) —</option>
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

                {/* ── ÉTAPE 2 : Coach par défaut + paramètres ── */}
                <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:.8, marginBottom:8 }}>2 · Paramètres</div>
                <div style={{ display:"grid", gridTemplateColumns:`repeat(${isMobile?2:4},1fr)`, gap:12, marginBottom:16 }}>
                  <div style={{ gridColumn:"span 2" }}>
                    <label style={{fontSize:11,fontWeight:700,color:C.textMuted,textTransform:"uppercase",letterSpacing:.8,display:"block",marginBottom:5}}>Coach par défaut</label>
                    <select value={nS.teacher} onChange={e=>{
                        const t = e.target.value;
                        setNS(s=>({...s,teacher:t}));
                        // Appliquer aux créneaux sans coach spécifique
                        setRecSlots(prev=>prev.map(s=>(!s.teacher)?{...s,teacher:t}:s));
                      }}
                      style={{width:"100%",padding:"9px 12px",border:`1.5px solid ${C.border}`,borderRadius:8,fontSize:14,color:C.text,background:C.surface,outline:"none",boxSizing:"border-box"}}>
                      <option value="">— Choisir un coach —</option>
                      {coachesList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <Field label="Places" type="number" value={nS.spots} onChange={v=>setNS({...nS,spots:v})}/>
                  <Field label="Salle" value={nS.room} onChange={v=>setNS({...nS,room:v})} placeholder="Studio A"/>
                </div>

                {/* ── ÉTAPE 3 : Période ── */}
                <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:.8, marginBottom:8 }}>3 · Période</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20 }}>
                  <DatePicker label="Du" value={recFrom} onChange={v=>setRecFrom(v)}/>
                  <DatePicker label="Au" value={recTo} onChange={v=>setRecTo(v)} minDate={recFrom}/>
                </div>

                {/* ── PRÉVISUALISATION éditable ── */}
                {recPreview.length > 0 && (
                  <div style={{ marginBottom:16 }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:.8 }}>
                        4 · Séances générées
                      </div>
                      <span style={{ fontSize:12, fontWeight:700, color:"#3A6E46", background:"#EAF5EC", border:"1px solid #A8D5B0", borderRadius:6, padding:"2px 8px" }}>
                        {recPreview.length} séance{recPreview.length>1?"s":""}
                      </span>
                    </div>
                    <div style={{ maxHeight:280, overflowY:"auto", display:"flex", flexDirection:"column", gap:4, paddingRight:2 }}>
                      {recPreview.map((s) => {
                        const disc = DISCIPLINES.find(d=>d.id===s.disciplineId)||DISCIPLINES[0];
                        const d = new Date(s.date);
                        const label = d.toLocaleDateString("fr-FR",{weekday:"short",day:"numeric",month:"short"});
                        return (
                          <div key={s.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 10px", background:"#F8FBF8", border:"1px solid #D4E8D6", borderRadius:8 }}>
                            <span style={{fontSize:13,flexShrink:0}}>{disc.icon}</span>
                            <span style={{fontSize:12,fontWeight:600,color:"#2A5E38",flex:"0 0 160px",whiteSpace:"nowrap"}}>{label} · {s.time} · {s.duration}min</span>
                            {/* Coach modifiable par séance */}
                            <select value={s.teacher||""} onChange={e=>updatePreviewCoach(s.id, e.target.value)}
                              style={{flex:1,padding:"4px 8px",border:`1px solid ${C.border}`,borderRadius:6,fontSize:12,color:C.text,background:"#fff",outline:"none",minWidth:0}}>
                              <option value="">— coach —</option>
                              {coachesList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </select>
                            {/* Bouton supprimer */}
                            <button onClick={()=>removePreviewItem(s.id)}
                              style={{background:"none",border:"none",cursor:"pointer",padding:"2px 4px",color:"#F87171",fontSize:16,lineHeight:1,flexShrink:0}}
                              title="Supprimer cette séance">
                              ✕
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div style={{ display:"flex", gap:10 }}>
                  <Button variant="primary" onClick={addRecurringSessions} disabled={recPreview.length===0}>
                    ✦ Créer {recPreview.length>0?`${recPreview.length} séance${recPreview.length>1?"s":""}`:"les séances"}
                  </Button>
                  <Button variant="ghost" onClick={()=>setShowAdd(false)}>Annuler</Button>
                </div>
              </div>
            );
          })()}
        </Card>
      )}

      {dates.map(date=>(
        <div key={date} style={{ marginBottom:22 }}>
          <DateLabel date={date}/>
          {filtered.filter(s=>s.date===date).map(s=>(
            <PlanningSessionCard
              key={s.id}
              sess={s}
              expandedId={expandedId}
              bookings={bookings}
              discs={discs}
              onToggle={handleToggle}
              onChangeStatus={handleChangeStatus}
              onAddBooking={handleAddBooking}
              onSendReminder={handleSendReminder}
              onDelete={deleteSession}
              onCancel={cancelSession}
            />
          ))}
        </div>
      ))}
    </div>
    </div>
  );
}


export { Planning, PlanningSessionCard };