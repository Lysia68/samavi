"use client";

import React, { useState } from "react";
import { C } from "./theme";
import { IcoCheck, IcoX, IcoUndo, IcoUserPlus2, IcoMail, IcoPhone, IcoClipboard, IcoUsers } from "./icons";
import { CreditBadge } from "./ui";
import { createClient } from "@/lib/supabase";

export function stLbl(s) { return s==="confirmed"?"Confirmé":s==="waitlist"?"En attente":"Annulé"; }
export function stStyle(s) {
  if (s==="confirmed") return { color:C.ok,    background:C.okBg    };
  if (s==="waitlist")  return { color:C.accent, background:C.accentBg };
  return { color:C.warn, background:C.warnBg };
}

function AttendanceRow({ b, onMark }) {
  const [loading, setLoading] = useState(false);
  async function mark(val) { setLoading(true); await onMark(b.id, val); setLoading(false); }
  const isPresent = b.attended === true;
  const isAbsent  = b.attended === false;
  const isPending = b.attended === null || b.attended === undefined;
  return (
    <div style={{ padding:"10px 13px", borderBottom:`1px solid ${C.borderSoft}`, display:"flex", alignItems:"center", gap:9, opacity:loading?.6:1, transition:"background .1s" }}
      onMouseEnter={e=>e.currentTarget.style.background="#F5F0EA"}
      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
      <div style={{ width:30, height:30, borderRadius:"50%", background:C.accentBg, border:`1px solid #DFC0A0`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:C.accent, flexShrink:0 }}>
        {b.name?.[0]?.toUpperCase() || "?"}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:14, fontWeight:700, color:C.text, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{b.name || "—"}</div>
        <div style={{ fontSize:12, color:C.textMuted }}>{b.email}</div>
      </div>
      {isPresent && <span style={{ fontSize:12, fontWeight:700, padding:"2px 9px", borderRadius:20, color:C.ok,      background:C.okBg,    whiteSpace:"nowrap" }}>✓ Présent</span>}
      {isAbsent  && <span style={{ fontSize:12, fontWeight:700, padding:"2px 9px", borderRadius:20, color:C.warn,    background:C.warnBg,  whiteSpace:"nowrap" }}>✗ Absent</span>}
      {isPending && <span style={{ fontSize:12, fontWeight:600, padding:"2px 9px", borderRadius:20, color:C.textMuted, background:"#EDE9E3", whiteSpace:"nowrap" }}>⏳ En attente</span>}
      <div style={{ display:"flex", gap:5, flexShrink:0, flexWrap:"wrap", justifyContent:"flex-end", maxWidth:160 }}>
        {isPresent ? (
          <button onClick={()=>mark(null)} disabled={loading} title="Annuler présence"
            style={{ display:"flex", alignItems:"center", gap:4, fontSize:12, padding:"4px 10px", borderRadius:7, fontWeight:600, border:`1px solid ${C.border}`, color:C.textSoft, background:C.surface, cursor:"pointer", whiteSpace:"nowrap" }}>
            <IcoUndo s={12} c={C.textSoft}/> Corriger
          </button>
        ) : isAbsent ? (
          <>
            <button onClick={()=>mark(true)} disabled={loading}
              style={{ display:"flex", alignItems:"center", gap:4, fontSize:12, padding:"4px 10px", borderRadius:7, fontWeight:600, border:`1px solid #B8DFC4`, color:C.ok, background:C.okBg, cursor:"pointer", whiteSpace:"nowrap" }}>
              <IcoCheck s={12} c={C.ok}/> Présent
            </button>
            <button onClick={()=>mark(null)} disabled={loading} title="Réinitialiser"
              style={{ display:"flex", alignItems:"center", gap:4, fontSize:12, padding:"4px 8px", borderRadius:7, fontWeight:600, border:`1px solid ${C.border}`, color:C.textSoft, background:C.surface, cursor:"pointer" }}>
              <IcoUndo s={12} c={C.textSoft}/>
            </button>
          </>
        ) : (
          <>
            <button onClick={()=>mark(true)} disabled={loading}
              style={{ display:"flex", alignItems:"center", gap:4, fontSize:12, padding:"4px 10px", borderRadius:7, fontWeight:600, border:`1px solid #B8DFC4`, color:C.ok, background:C.okBg, cursor:"pointer", whiteSpace:"nowrap" }}>
              <IcoCheck s={12} c={C.ok}/> Présent
            </button>
            <button onClick={()=>mark(false)} disabled={loading}
              style={{ display:"flex", alignItems:"center", gap:4, fontSize:12, padding:"4px 10px", borderRadius:7, fontWeight:600, border:`1px solid #EFC8BC`, color:C.warn, background:C.warnBg, cursor:"pointer", whiteSpace:"nowrap" }}>
              <IcoX s={12} c={C.warn}/> Absent
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export function PlanningAccordion({ sess, sessId, bookings, onChangeStatus, onAddBooking, onSendReminder, onAttendanceChange }) {
  const bl   = bookings[sessId] || [];
  const conf = bl.filter(b=>b.st==="confirmed");
  const wait = bl.filter(b=>b.st==="waitlist");
  const canc = bl.filter(b=>b.st==="cancelled");

  const now = new Date();
  const isPast = sess ? (() => {
    const [y,m,d] = (sess.date||"").split("-").map(Number);
    const [h,min] = (sess.time||"00:00").split(":").map(Number);
    const end = new Date(y, m-1, d, h, min);
    end.setMinutes(end.getMinutes() + (sess.duration || 60));
    return now > end;
  })() : false;

  const [tab, setTab] = useState("reservations");
  const [attended, setAttended] = useState(() => {
    const map = {};
    bl.forEach(b => { map[b.id] = b.attended ?? null; });
    return map;
  });

  const presentCount = Object.values(attended).filter(v=>v===true).length;
  const absentCount  = Object.values(attended).filter(v=>v===false).length;
  const pendingCount = conf.length - presentCount - absentCount;

  async function handleMark(bookingId, val) {
    const sb = createClient();
    const { error } = await sb.from("bookings").update({ attended: val }).eq("id", bookingId);
    if (!error) {
      const prevVal = attended[bookingId];
      setAttended(prev => ({ ...prev, [bookingId]: val }));
      onAttendanceChange && onAttendanceChange(bookingId, val);

      // Déduction crédits : présent → -1 crédit / annulation présence → +1 crédit
      const booking = conf.find(b => b.id === bookingId);
      // Abonnements récurrents (mois/trimestre/année) = crédits illimités, pas de déduction
      const UNLIMITED_PERIODS = ["mois", "trimestre", "année", "annuel", "annee", "monthly", "yearly"];
      const isUnlimited = booking?.subPeriod && UNLIMITED_PERIODS.includes(booking.subPeriod.toLowerCase());

      if (!isUnlimited && booking?.memberId && booking?.credits !== null && booking?.credits !== undefined) {
        if (val === true && prevVal !== true) {
          // Marquer présent → déduire 1 crédit si credits > 0
          if (booking.credits > 0) {
            await sb.from("members").update({ credits: booking.credits - 1 }).eq("id", booking.memberId);
          }
        } else if (val !== true && prevVal === true) {
          // Annuler présence → restituer 1 crédit
          await sb.from("members").update({ credits: booking.credits + 1 }).eq("id", booking.memberId);
        }
      }
    }
  }

  async function handleValidateAll() {
    const toMark = conf.filter(b => attended[b.id] === null || attended[b.id] === undefined);
    if (!toMark.length) return;
    const sb = createClient();
    const ids = toMark.map(b => b.id);
    const { error } = await sb.from("bookings").update({ attended: true }).in("id", ids);
    if (!error) {
      setAttended(prev => { const n={...prev}; ids.forEach(id=>{n[id]=true;}); return n; });
      // Déduire 1 crédit par membre présent (si crédits > 0)
      const UNLIMITED_PERIODS = ["mois", "trimestre", "année", "annuel", "annee", "monthly", "yearly"];
      for (const b of toMark) {
        const isUnlimited = b.subPeriod && UNLIMITED_PERIODS.includes(b.subPeriod.toLowerCase());
        if (!isUnlimited && b.memberId && b.credits > 0) {
          await sb.from("members").update({ credits: b.credits - 1 }).eq("id", b.memberId);
        }
      }
    }
  }

  if (!bl.length) return (
    <div style={{ padding:"20px", textAlign:"center", color:C.textMuted, fontSize:15, borderTop:`1px solid ${C.borderSoft}`, background:"#FDFAF7" }}>
      Aucune réservation pour cette séance
    </div>
  );

  return (
    <div style={{ borderTop:`1px solid ${C.borderSoft}`, background:"#FDFAF7" }}>

      {isPast && (
        <div style={{ display:"flex", borderBottom:`1px solid ${C.borderSoft}`, background:"#F7F3EE" }}>
          {[{key:"reservations",label:"Réservations",Icon:IcoClipboard},{key:"presences",label:"Présences",Icon:IcoUsers}].map(({key,label,Icon})=>(
            <button key={key} onClick={()=>setTab(key)}
              style={{ flex:1, padding:"9px 0", fontSize:13, fontWeight:700, border:"none", cursor:"pointer", background:"transparent",
                color: tab===key ? C.accent : C.textMuted,
                borderBottom: tab===key ? `2px solid ${C.accent}` : "2px solid transparent" }}>
              <span style={{display:"flex",alignItems:"center",gap:5,justifyContent:"center"}}>
                <Icon s={13} c={tab===key ? C.accent : C.textMuted}/> {label}
              </span>
              {key==="presences" && pendingCount>0 && (
                <span style={{ marginLeft:5, fontSize:11, padding:"1px 6px", borderRadius:10, background:C.accentBg, color:C.accent }}>{pendingCount}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {tab==="reservations" && (
        <>
          <div style={{ display:"flex", gap:5, padding:"8px 13px 0", flexWrap:"wrap" }}>
            <span style={{ fontSize:12, fontWeight:700, padding:"2px 9px", borderRadius:20, color:C.ok, background:C.okBg }}>{conf.length} confirmé{conf.length>1?"s":""}</span>
            {wait.length>0 && <span style={{ fontSize:12, fontWeight:700, padding:"2px 9px", borderRadius:20, color:C.accent, background:C.accentBg }}>{wait.length} en attente</span>}
            {canc.length>0 && <span style={{ fontSize:12, fontWeight:700, padding:"2px 9px", borderRadius:20, color:C.warn, background:C.warnBg }}>{canc.length} annulé{canc.length>1?"s":""}</span>}
          </div>
          {bl.map(b => (
            <div key={b.id}
              style={{ padding:"10px 13px", borderBottom:`1px solid ${C.borderSoft}`, opacity:b.st==="cancelled"?.45:1, transition:"background .1s" }}
              onMouseEnter={e=>e.currentTarget.style.background="#F5F0EA"}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:6 }}>
                <div style={{ width:30, height:30, borderRadius:"50%", background:C.accentBg, border:`1px solid #DFC0A0`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:C.accent, flexShrink:0 }}>{b.name?.[0]?.toUpperCase()}</div>
                <div style={{ fontSize:15, fontWeight:700, color:C.text, flex:1 }}>{b.name}</div>
                <CreditBadge credits={b.credits} total={b.total} sub={b.sub} subPeriod={b.subPeriod}/>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8, paddingLeft:39 }}>
                <span style={{ padding:"3px 10px", borderRadius:20, fontSize:13, fontWeight:600, whiteSpace:"nowrap", flexShrink:0, ...stStyle(b.st) }}>{stLbl(b.st)}</span>
                {b.phone && (
                  <a href={`tel:${b.phone}`} title={b.phone}
                    style={{ display:"flex", alignItems:"center", gap:4, fontSize:12, color:C.textSoft, textDecoration:"none", padding:"3px 8px", borderRadius:7, border:`1px solid ${C.borderSoft}`, background:C.surface, flexShrink:0, whiteSpace:"nowrap" }}>
                    <IcoPhone s={12} c={C.textMuted}/> {b.phone}
                  </a>
                )}
                <div style={{ flex:1 }}/>
                <div style={{ flexShrink:0 }}>
                  {b.st==="waitlist"  && <button onClick={()=>onChangeStatus(b.id,sessId,"confirmed")} style={{ display:"flex",alignItems:"center",gap:5, fontSize:12, padding:"4px 12px", borderRadius:7, fontWeight:600, border:`1px solid #B8DFC4`, color:C.ok,   background:C.okBg,   cursor:"pointer", whiteSpace:"nowrap" }}><IcoCheck s={13} c={C.ok}/>Confirmer</button>}
                  {b.st==="confirmed" && <button onClick={()=>onChangeStatus(b.id,sessId,"cancelled")} style={{ display:"flex",alignItems:"center",gap:5, fontSize:12, padding:"4px 12px", borderRadius:7, fontWeight:600, border:`1px solid #EFC8BC`, color:C.warn, background:C.warnBg, cursor:"pointer", whiteSpace:"nowrap" }}><IcoX s={13} c={C.warn}/>Annuler</button>}
                  {b.st==="cancelled" && <button onClick={()=>onChangeStatus(b.id,sessId,"confirmed")} style={{ display:"flex",alignItems:"center",gap:5, fontSize:12, padding:"4px 12px", borderRadius:7, fontWeight:600, border:`1px solid #B8CED8`, color:C.info, background:C.infoBg, cursor:"pointer", whiteSpace:"nowrap" }}><IcoUndo s={13} c={C.info}/>Remettre</button>}
                </div>
              </div>
            </div>
          ))}
          <div style={{ padding:"8px 13px 10px", display:"flex", gap:7, flexWrap:"wrap", alignItems:"center", justifyContent:"space-between" }}>
            <button onClick={()=>onAddBooking&&onAddBooking(sessId)} style={{ display:"flex",alignItems:"center",gap:6, fontSize:12, padding:"5px 12px", borderRadius:8, fontWeight:600, border:`1px solid #DFC0A0`, color:C.accentDark, background:C.accentBg, cursor:"pointer" }}><IcoUserPlus2 s={14} c={C.accentDark}/>Inscrire un adhérent</button>
            {isPast && pendingCount>0 && (
              <button onClick={handleValidateAll}
                style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, padding:"5px 12px", borderRadius:8, fontWeight:600, border:`1px solid #B8DFC4`, color:C.ok, background:C.okBg, cursor:"pointer" }}>
                <IcoCheck s={12} c={C.ok}/> Tous présents
              </button>
            )}
          </div>
        </>
      )}

      {tab==="presences" && isPast && (
        <>
          <div style={{ display:"flex", gap:5, padding:"8px 13px", flexWrap:"wrap", alignItems:"center" }}>
            <span style={{ fontSize:12, fontWeight:700, padding:"2px 9px", borderRadius:20, color:C.ok, background:C.okBg }}>{presentCount} présent{presentCount>1?"s":""}</span>
            {absentCount>0 && <span style={{ fontSize:12, fontWeight:700, padding:"2px 9px", borderRadius:20, color:C.warn, background:C.warnBg }}>{absentCount} absent{absentCount>1?"s":""}</span>}
            {pendingCount>0 && <span style={{ fontSize:12, fontWeight:700, padding:"2px 9px", borderRadius:20, color:C.textMuted, background:"#EDE9E3" }}>{pendingCount} en attente</span>}
            <div style={{ flex:1 }}/>

          </div>
          {conf.length===0
            ? <div style={{ padding:"20px", textAlign:"center", color:C.textMuted, fontSize:14 }}>Aucun membre confirmé</div>
            : conf.map(b => (
                <AttendanceRow key={b.id} b={{ ...b, attended: attended[b.id] }} onMark={handleMark}/>
              ))
          }
        </>
      )}
    </div>
  );
}