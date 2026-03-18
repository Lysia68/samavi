"use client";
import { getFieldStyle } from "./fieldStyles";

import React, { useState } from "react";

// Helper pour éviter les erreurs TypeScript sur les styles CSS
const css = (/** @type {import("react").CSSProperties} */ s) => s;
import { C, statusMap } from "./theme";
import { DISCIPLINES } from "./demoData";
import { IcoLogOut } from "./icons";

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div onClick={e=>e.target===e.currentTarget&&onCancel()}
      style={{ position:"fixed", inset:0, background:"rgba(42,31,20,.45)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div style={{ background:"#FDFAF7", border:"1.5px solid #DDD5C8", borderRadius:16, padding:"28px 28px 24px", maxWidth:340, width:"100%", boxShadow:"0 24px 48px rgba(42,31,20,.15)", textAlign:"center" }}>
        <div style={{ fontSize:32, marginBottom:14 }}>🚪</div>
        <div style={{ fontSize:16, fontWeight:700, color:"#2A1F14", marginBottom:8 }}>Déconnexion</div>
        <div style={{ fontSize:14, color:"#8C7B6C", lineHeight:1.6, marginBottom:24 }}>{message}</div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onCancel}
            style={{ flex:1, padding:"10px", background:"transparent", border:"1.5px solid #DDD5C8", borderRadius:9, color:"#8C7B6C", fontSize:14, fontWeight:600, cursor:"pointer" }}>
            Annuler
          </button>
          <button onClick={onConfirm}
            style={{ flex:1, padding:"10px", background:"linear-gradient(145deg,#B88050,#9A6030)", border:"none", borderRadius:9, color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer" }}>
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}

function Tag({ s }) {
  const [color, bg] = statusMap[s] || [C.textMuted, C.bgDeep];
  return <span style={{ background:bg, color, padding:"4px 12px", borderRadius:20, fontSize:13, fontWeight:600, letterSpacing:0.3 }}>{s.charAt(0).toUpperCase()+s.slice(1)}</span>;
}

function Pill({ children, color=C.textSoft, bg=C.bgDeep }) {
  return <span style={{ background:bg, color, padding:"3px 10px", borderRadius:12, fontSize:13, fontWeight:500 }}>{children}</span>;
}

function Button({ children, onClick, variant="primary", sm, block }) {
  const base = { display:"inline-flex", alignItems:"center", justifyContent:"center", gap:6, padding:sm?"6px 14px":"10px 22px", borderRadius:8, cursor:"pointer", fontSize:sm?14:15, fontWeight:600, letterSpacing:0.3, whiteSpace:"nowrap", transition:"all 0.18s", width:block?"100%":undefined, border:"none" };
  const variants = {
    primary:   { ...base, background:C.accent,       color:"#fff",       boxShadow:"0 2px 8px rgba(176,120,72,.25)" },
    secondary: { ...base, background:C.surface,      color:C.text,       border:`1.5px solid ${C.border}` },
    ghost:     { ...base, background:"transparent",  color:C.textMid,    border:`1.5px solid ${C.border}` },
    danger:    { ...base, background:C.surface,      color:C.warn,       border:`1.5px solid #E0C8C0` },
    accent:    { ...base, background:C.accentBg,     color:C.accentDark, border:`1.5px solid #DFC0A0` },
  };
  return <button onClick={onClick} style={variants[variant]||variants.primary} onMouseEnter={e=>e.currentTarget.style.opacity=".85"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>{children}</button>;
}

function FieldLabel({ children }) {
  return <div style={{ fontSize:13, fontWeight:600, color:C.textSoft, letterSpacing:0.8, textTransform:"uppercase", marginBottom:6 }}>{children}</div>;
}

function Field({ label, value, onChange, type="text", placeholder, opts, error }) {
  const baseStyle = getFieldStyle({ error, border: C.border, text: C.text, surfaceWarm: C.surfaceWarm })
  const selectStyle = getFieldStyle({ error, border: C.border, text: C.text, surfaceWarm: C.surfaceWarm, height: 42 })
  return (
    <div>
      {label && <FieldLabel>{label}</FieldLabel>}
      {opts
        ? <select value={value} onChange={e=>onChange(e.target.value)} style={selectStyle}>{opts.map(o=><option key={o.v??o} value={o.v??o}>{o.l??o}</option>)}</select>
        : <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={baseStyle}
            onFocus={e=>e.target.style.borderColor=error?"#C43A3A":C.accent}
            onBlur={e=>e.target.style.borderColor=error?"#C43A3A":C.border}/>
      }
    </div>
  );
}

function Card({ children, style, noPad }) {
  return <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:noPad?0:18, overflow:noPad?"hidden":undefined, ...style }}>{children}</div>;
}

function SectionHead({ children, action }) {
  return (
    <div style={{ padding:"12px 16px", borderBottom:`1.5px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", background:C.surfaceWarm }}>
      <span style={{ fontSize:15, fontWeight:700, color:C.text, letterSpacing:0.2 }}>{children}</span>
      {action}
    </div>
  );
}

function DateLabel({ date }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
      <div style={{ width:20, height:2, background:C.accent, borderRadius:1 }}/>
      <span style={{ fontSize:13, fontWeight:700, color:C.accent, textTransform:"uppercase", letterSpacing:0.2 }}>
        {new Date(date).toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})}
      </span>
    </div>
  );
}

const NAV = [
  {key:"dashboard",     label:"Tableau de bord"},
  {key:"planning",      label:"Planning"},
  {key:"members",       label:"Adhérents"},
  {key:"subscriptions", label:"Abonnements"},
  {key:"payments",      label:"Paiements"},
  {key:"disciplines",   label:"Disciplines"},
  {key:"settings",      label:"Paramètres"},
  {key:"aide",          label:"Aide"},
];

function SessionRow({ sess, isMobile }) {
  const disc = DISCIPLINES.find(d=>d.id===sess.disciplineId)||DISCIPLINES[0];
  const pct = sess.booked/sess.spots;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:isMobile?8:14, padding:isMobile?"10px 14px":"14px 20px", borderBottom:`1px solid ${C.borderSoft}` }}>
      <div style={{ fontSize:isMobile?15:16, fontWeight:700, color:C.accent, width:isMobile?34:38, flexShrink:0, letterSpacing:-0.2 }}>{sess.time}</div>
      <div style={{ width:3, height:isMobile?30:36, background:disc.color, borderRadius:2, flexShrink:0 }}/>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:isMobile?15:16, fontWeight:700, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{disc.name}</div>
        <div style={{ fontSize:isMobile?15:16, color:C.textSoft, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{sess.teacher} · {sess.room}</div>
      </div>
      <div style={{ flexShrink:0, textAlign:"right" }}>
        <div style={{ fontSize:isMobile?14:15, fontWeight:700, color:pct>=1?C.warn:C.text }}>{sess.booked}/{sess.spots}</div>
        <div style={{ width:isMobile?44:54, height:3, background:C.bgDeep, borderRadius:2, marginTop:3 }}>
          <div style={{ height:"100%", width:`${Math.min(pct*100,100)}%`, background:pct>=1?C.warn:pct>.75?C.accent:C.ok, borderRadius:2 }}/>
        </div>
        {sess.waitlist>0 && <span style={{ fontSize:12, color:C.accent, fontWeight:600 }}>+{sess.waitlist}</span>}
      </div>
    </div>
  );
}

function MemberRow({ m, onSelect, selected }) {
  return (
    <div onClick={()=>onSelect(m)}
      style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 16px", borderBottom:`1px solid ${C.borderSoft}`, cursor:"pointer", background:selected?C.accentLight:"transparent", transition:"background .15s" }}
      onMouseEnter={e=>{if(!selected)e.currentTarget.style.background=C.bg;}}
      onMouseLeave={e=>{if(!selected)e.currentTarget.style.background="transparent";}}>
      <div style={{ width:38, height:38, borderRadius:"50%", background:C.accentBg, border:`1.5px solid #DFC0A0`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700, color:C.accent, flexShrink:0 }}>{m.avatar}</div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:16, fontWeight:700, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{m.firstName} {m.lastName}</div>
        <div style={{ fontSize:13, color:C.textSoft, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", display:"flex", alignItems:"center", gap:8, marginTop:1 }}>
          {m.email && <span style={{display:"flex",alignItems:"center",gap:3}}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/></svg>
            <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:160}}>{m.email}</span>
          </span>}
          {m.phone && <span style={{display:"flex",alignItems:"center",gap:3,flexShrink:0}}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.06 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            {m.phone}
          </span>}
        </div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:5, flexShrink:0 }}>
        <Tag s={m.status}/>
        {m.credits>0 && <Pill color={C.info} bg={C.infoBg}>{m.credits} crédits</Pill>}
      </div>
    </div>
  );
}

function KpiCard({ icon, label, value, delta, accentColor, isMobile }) {
  if (isMobile) return (
    <Card style={{ padding:"12px 14px" }}>
      {/* Icône + delta sur la même ligne */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
        <div style={{ width:30, height:30, borderRadius:8, background:C.bg, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{icon}</div>
        {delta && <span style={{ fontSize:11, color:accentColor||C.ok, fontWeight:700, background:C.bg, padding:"2px 7px", borderRadius:10 }}>↑ {delta}</span>}
      </div>
      {/* Valeur */}
      <div style={{ fontSize:22, fontWeight:800, color:C.text, lineHeight:1, marginBottom:3 }}>{value}</div>
      {/* Label */}
      <div style={{ fontSize:12, color:C.textSoft, fontWeight:500, lineHeight:1.3 }}>{label}</div>
    </Card>
  );
  return (
    <Card style={{ padding:"18px 20px" }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:10 }}>
        <div style={{ width:40, height:40, borderRadius:10, background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, border:`1.5px solid ${C.border}` }}>{icon}</div>
        {delta && <span style={{ fontSize:12, color:accentColor||C.ok, fontWeight:700, background:C.bg, padding:"2px 8px", borderRadius:10 }}>↑ {delta}</span>}
      </div>
      <div style={{ fontSize:28, fontWeight:800, color:C.text, lineHeight:1, marginBottom:4 }}>{value}</div>
      <div style={{ fontSize:13, color:C.textSoft, fontWeight:500 }}>{label}</div>
    </Card>
  );
}




// ── EMPTY STATE générique ────────────────────────────────────────────────────
function EmptyState({ icon="📋", title, sub }) {
  return (
    <div style={{ padding:"48px 24px", textAlign:"center" }}>
      <div style={{ fontSize:36, marginBottom:12 }}>{icon}</div>
      <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:6 }}>{title}</div>
      {sub && <div style={{ fontSize:13, color:C.textSoft, lineHeight:1.6, maxWidth:320, margin:"0 auto" }}>{sub}</div>}
    </div>
  );
}

function DemoBanner() {
  const [hidden, setHidden] = React.useState(false);
  if (hidden) return null;
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, padding:"8px 16px", background:"#FEF3C7", borderBottom:"1.5px solid #F59E0B", fontSize:13, color:"#92400E" }}>
      <span>⚠️ <strong>Données de démonstration</strong> — Ces données illustrent l'interface. Elles seront automatiquement remplacées par vos vraies données dès votre premier enregistrement.</span>
      <button onClick={()=>setHidden(true)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:16, color:"#92400E", flexShrink:0 }}>✕</button>
    </div>
  );
}

function creditColor(credits, total) {
  if (credits === null) return { color:"#5C8A6A", bg:"#E8F5EE" };
  const pct = credits / total;
  if (pct <= 0.15) return { color:"#C0392B", bg:"#FDECEA" };
  if (pct <= 0.35) return { color:"#D46A1A", bg:"#FDF0E6" };
  if (pct <= 0.6)  return { color:"#B07848", bg:"#F5EBE0" };
  return { color:"#3A7A50", bg:"#E4F4EC" };
}

function CreditBadge({ credits, total, sub, subPeriod }) {
  const UNLIMITED_PERIODS = ["mois", "trimestre", "année", "annuel", "annee"];
  const isUnlimited = credits === null || (subPeriod && UNLIMITED_PERIODS.includes(subPeriod.toLowerCase()));
  if (isUnlimited) {
    return (
      <div style={{ display:"flex", alignItems:"center", gap:5 }}>
        <span style={{ fontSize:13, color:"#5C8A6A", fontWeight:700, background:"#E8F5EE", padding:"3px 9px", borderRadius:10, whiteSpace:"nowrap" }}>∞ illimité</span>
        <span style={{ fontSize:13, color:C.textMuted, whiteSpace:"nowrap" }}>{sub}</span>
      </div>
    );
  }
  const { color, bg } = creditColor(credits, total);
  const pct = credits / total;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
      <div style={{ width:40, height:3, background:"#EAE4DA", borderRadius:2, overflow:"hidden", flexShrink:0 }}>
        <div style={{ height:"100%", width:`${pct*100}%`, background:color, borderRadius:2 }}/>
      </div>
      <span style={{ fontSize:14, fontWeight:800, color, background:bg, padding:"2px 8px", borderRadius:10, whiteSpace:"nowrap" }}>
        {credits}/{total}
      </span>
    </div>
  );
}

export { ConfirmModal, Tag, Pill, Button, FieldLabel, Field, Card, SectionHead, DateLabel, SessionRow, MemberRow, KpiCard, EmptyState, DemoBanner, creditColor, CreditBadge };
