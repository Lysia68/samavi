"use client";

import React, { useState } from "react";
import { C } from "./theme";
import { IcoYoga, NAV_ICONS, IcoLogOut } from "./icons";

// ── Pill & ConfirmModal inline (évite la dépendance layout→ui) ────────────────
function Pill({ children, color, bg }) {
  return <span style={{ background:bg||C.bg, color:color||C.textSoft, padding:"3px 10px", borderRadius:12, fontSize:13, fontWeight:500 }}>{children}</span>;
}

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

const NAV = [
  {key:"dashboard",     label:"Tableau de bord"},
  {key:"planning",      label:"Planning"},
  {key:"historique",    label:"Historique"},
  {key:"members",       label:"Membres"},
  {key:"subscriptions", label:"Abonnements"},
  {key:"payments",      label:"Paiements"},
  {key:"disciplines",   label:"Disciplines"},
  {key:"settings",      label:"Paramètres"},
  {key:"aide",          label:"Aide"},
];

function Sidebar({ active, onNav, studioName = "Mon studio", planName = "Essentiel", membersCount = 0, userName = "", userRole = "Admin", trialEndsAt = null, billingStatus = "active" }) {
  const TRIAL_DAYS = 15;
  const trialDaysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000))
    : null;
  const isTrialing  = billingStatus === "trialing" && trialDaysLeft !== null;
  const isPastDue   = billingStatus === "past_due";
  const trialPct    = isTrialing ? Math.max(0, Math.min(100, Math.round(((TRIAL_DAYS - trialDaysLeft) / TRIAL_DAYS) * 100))) : 0;
  const trialColor  = trialDaysLeft !== null && trialDaysLeft <= 3 ? "#E05A38" : trialDaysLeft !== null && trialDaysLeft <= 7 ? "#C4922A" : "#4E8A58";

  return (
    <aside style={{ width:220, background:C.surface, borderRight:`1.5px solid ${C.border}`, minHeight:"100vh", display:"flex", flexDirection:"column", flexShrink:0 }}>
      <div style={{ padding:"24px 20px 18px" }}>
        <div style={{ fontSize:24, fontWeight:700, color:C.text, letterSpacing:-0.3, lineHeight:1 }}>Fyde<span style={{ color:C.accent }}>lys</span></div>
        <div style={{ fontSize:12, color:C.textMuted, letterSpacing:0.2, textTransform:"uppercase", marginTop:4 }}>Studio Manager</div>
      </div>
      <div style={{ margin:"0 12px 12px", padding:"10px 12px", background:C.accentLight, borderRadius:10, border:`1.5px solid ${C.border}`, display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:34, height:34, borderRadius:8, background:C.accentBg, border:`1.5px solid #DFC0A0`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><IcoYoga s={18} c={C.accent}/></div>
        <div>
          <div style={{ fontSize:15, fontWeight:700, color:C.text }}>{studioName || "Mon studio"}</div>
          <div style={{ fontSize:12, color:C.textSoft }}>{planName ? planName.charAt(0).toUpperCase()+planName.slice(1) : "Essentiel"} · {membersCount} membre{membersCount!==1?"s":""}</div>
        </div>
      </div>
      {/* Barre de progression essai */}
      {isTrialing && (
        <div style={{ margin:"0 12px 10px", padding:"10px 12px", background:trialDaysLeft<=3?"#FEF0EC":"#FDFAF5", borderRadius:9, border:`1px solid ${trialDaysLeft<=3?"#F5C2B5":"rgba(196,146,42,.25)"}` }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
            <div style={{ fontSize:11, fontWeight:700, color:trialColor }}>
              {trialDaysLeft > 0 ? `⏳ ${trialDaysLeft}j d'essai restant${trialDaysLeft>1?"s":""}` : "⚠ Essai terminé"}
            </div>
            <div style={{ fontSize:10, color:C.textMuted }}>{TRIAL_DAYS - trialDaysLeft}/{TRIAL_DAYS}j</div>
          </div>
          <div style={{ height:5, borderRadius:3, background:"#EAE4DA", overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${trialPct}%`, background:trialColor, borderRadius:3, transition:"width .3s" }}/>
          </div>
          <a href="/billing" style={{ display:"block", marginTop:7, fontSize:11, fontWeight:700, color:"#fff", background:trialColor, padding:"5px 0", borderRadius:6, textAlign:"center", textDecoration:"none" }}>
            Activer mon abonnement
          </a>
        </div>
      )}

      {/* Bandeau période d'attente */}
      {isPastDue && (
        <div style={{ margin:"0 12px 10px", padding:"10px 12px", background:"#FEF0EC", borderRadius:9, border:"1px solid #F5C2B5" }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#E05A38", marginBottom:5 }}>⚠ Paiement en attente</div>
          <div style={{ fontSize:11, color:C.textSoft, marginBottom:7, lineHeight:1.5 }}>Votre abonnement est en attente de paiement. Régularisez pour continuer.</div>
          <a href="/billing" style={{ display:"block", fontSize:11, fontWeight:700, color:"#fff", background:"#E05A38", padding:"5px 0", borderRadius:6, textAlign:"center", textDecoration:"none" }}>
            Régulariser
          </a>
        </div>
      )}

      <nav style={{ flex:1 }}>
        {NAV.map(item => (
          <button key={item.key} onClick={()=>onNav(item.key)}
            style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"11px 20px", background:active===item.key?C.accentLight:"none", border:"none", cursor:"pointer", color:active===item.key?C.accent:C.textMid, fontSize:15, fontWeight:active===item.key?700:500, borderLeft:`3px solid ${active===item.key?C.accent:"transparent"}`, textAlign:"left", transition:"all .15s" }}
            onMouseEnter={e=>{if(active!==item.key){e.currentTarget.style.background=C.bg;e.currentTarget.style.color=C.text;}}}
            onMouseLeave={e=>{if(active!==item.key){e.currentTarget.style.background="none";e.currentTarget.style.color=C.textMid;}}}>
            {(() => { const Ico = NAV_ICONS[item.key]; return Ico ? <Ico s={18} c={active===item.key?C.accent:C.textMuted}/> : null; })()}
            {item.label}
          </button>
        ))}
      </nav>
      <div style={{ padding:"14px 20px", borderTop:`1.5px solid ${C.border}`, display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:32, height:32, borderRadius:"50%", background:C.accentBg, border:`1.5px solid #DFC0A0`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:C.accent, flexShrink:0 }}>
          {userName ? userName.split(" ").map(n=>n[0]).join("").toUpperCase().slice(0,2) : "?"}
        </div>
        <div>
          <div style={{ fontSize:14, fontWeight:600, color:C.text }}>{userName || "Utilisateur"}</div>
          <div style={{ fontSize:12, color:C.textMuted }}>{userRole === "admin" ? "Admin" : userRole === "coach" ? "Coach" : userRole === "adherent" ? "Membre" : "Admin"}</div>
        </div>
      </div>
      <div style={{ padding:"5px 20px 8px", textAlign:"center" }}>
        <span style={{ fontSize:10, color:C.textMuted, fontFamily:"monospace", letterSpacing:0.2 }}>
          {`Fydelys v.${(process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA||"dev000").slice(0,7)} | ${process.env.NEXT_PUBLIC_BUILD_DATE||"--/--/----"}`}
        </span>
      </div>
    </aside>
  );
}

const MOBILE_NAV = [
  {key:"dashboard",  label:"Accueil"},
  {key:"planning",   label:"Planning"},
  {key:"historique", label:"Historique"},
  {key:"members",    label:"Membres"},
  {key:"settings",   label:"Plus"},
];

function BottomNav({ active, onNav }) {
  return (
    <nav style={{ position:"fixed", bottom:0, left:0, right:0, background:C.surface, borderTop:`1px solid ${C.border}`, display:"flex", zIndex:200, height:62, boxShadow:"0 -2px 16px rgba(42,31,20,.07)" }}>
      {MOBILE_NAV.map(item => {
        const isA = active===item.key;
        return (
          <button key={item.key} onClick={()=>onNav(item.key)}
            style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:2, background:"none", border:"none", cursor:"pointer", color:isA?C.accent:C.textMuted, fontSize:12, fontWeight:isA?700:400, transition:"color .15s", padding:"6px 0 4px", position:"relative" }}>
            {isA && <div style={{ position:"absolute", top:0, left:"50%", transform:"translateX(-50%)", width:20, height:2, background:C.accent, borderRadius:"0 0 2px 2px" }}/>}
            {(() => { const Ico = NAV_ICONS[item.key]; return Ico ? <Ico s={22} c={isA?C.accent:C.textMuted}/> : null; })()}
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function TopBar({ title, isMobile, onSignOut, isSuperAdmin, studioName = "", billingStatus = "active", planName = "" }) {
  const [confirmLogout, setConfirmLogout] = useState(false);
  return (
    <>
      {confirmLogout && <ConfirmModal message="Voulez-vous vous déconnecter de Fydelys ?" onConfirm={()=>{ setConfirmLogout(false); onSignOut?.(); }} onCancel={()=>setConfirmLogout(false)}/>}
      <div style={{ background:C.surface, borderBottom:`1.5px solid ${C.border}`, padding:`0 ${isMobile?16:28}px`, height:isMobile?48:56, display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0, position:"sticky", top:0, zIndex:50 }}>
        <div style={{ fontSize:isMobile?18:20, fontWeight:700, color:C.text, letterSpacing:isMobile?-0.3:0 }}>
          {isMobile ? <>Fyde<span style={{ color:C.accent }}>lys</span></> : title}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {!isMobile && studioName && (
            <a href="/billing" style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 12px", borderRadius:20, border:`1px solid ${billingStatus==="active"?"rgba(78,138,88,.35)":billingStatus==="trialing"?"rgba(196,146,42,.35)":C.border}`, background:billingStatus==="active"?"#F0FAF2":billingStatus==="trialing"?"#FDF8EC":C.bg, textDecoration:"none", cursor:"pointer" }}>
              <span style={{ fontSize:11, fontWeight:700, color:billingStatus==="active"?"#4E8A58":billingStatus==="trialing"?"#C4922A":C.textMid }}>
                {billingStatus==="active"?"✓ Actif":billingStatus==="trialing"?"⏳ Essai":billingStatus==="past_due"?"⚠ Impayé":"Inactif"}
              </span>
              {planName && <span style={{ fontSize:11, color:C.textMuted, fontWeight:500 }}>{planName.charAt(0).toUpperCase()+planName.slice(1)}</span>}
            </a>
          )}
          {isSuperAdmin && (
            <a href="https://fydelys.fr/dashboard"
              style={{ fontSize:11, padding:"5px 12px", borderRadius:8, border:`1px solid ${C.border}`, background:C.bg, color:C.textSoft, textDecoration:"none", fontWeight:600, display:"flex", alignItems:"center", gap:5, whiteSpace:"nowrap" }}>
              ⬅ SuperAdmin
            </a>
          )}
          <div style={{ display:"flex", alignItems:"center", gap:7, padding:"4px 10px 4px 5px", background:C.bg, border:`1px solid ${C.border}`, borderRadius:20 }}>
            <div style={{ width:24, height:24, borderRadius:"50%", background:C.accentBg, border:`1px solid #DFC0A0`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color:C.accent, flexShrink:0 }}>{studioName?studioName.charAt(0).toUpperCase():"?"}</div>
            <span style={{ fontSize:13, fontWeight:600, color:C.text, whiteSpace:"nowrap" }}>{studioName || "Mon studio"}</span>
          </div>
          <button
            title="Se déconnecter"
            onClick={()=>setConfirmLogout(true)}
            style={{ display:"flex", alignItems:"center", justifyContent:"center", width:32, height:32, borderRadius:8, border:`1px solid ${C.border}`, background:C.bg, cursor:"pointer", flexShrink:0, transition:"all .15s" }}
            onMouseEnter={e=>{e.currentTarget.style.background=C.warnBg; e.currentTarget.style.borderColor="#EFC8BC";}}
            onMouseLeave={e=>{e.currentTarget.style.background=C.bg; e.currentTarget.style.borderColor=C.border;}}>
            <IcoLogOut s={15} c={C.warn}/>
          </button>
        </div>
      </div>
    </>
  );
}

export { NAV, Sidebar, BottomNav, TopBar };