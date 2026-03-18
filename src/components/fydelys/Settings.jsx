"use client";

import React, { useState, useEffect, useContext } from "react";
import { createClient } from "@/lib/supabase";
import { AppCtx } from "./context";
import { C } from "./theme";
import { FYDELYS_PLANS, DISCIPLINES, ROLES_DEF, TENANTS_INIT, TENANTS_DATA, USERS_DATA } from "./demoData";
import { IcoUser2, IcoUsers2, IcoSettings2, IcoCheck, IcoX, IcoMail, IcoLogOut, IcoCalendar2, IcoAlert2, IcoEuro2, IcoHome2, IcoLayers2, IcoTag2, IcoUserPlus2, IcoYoga, IcoDoor } from "./icons";
import { Card, SectionHead, Button, Field, FieldLabel, Tag, Pill, EmptyState } from "./ui";

function RoleBadge({ role }) {
  const r = ROLES_DEF[role] || ROLES_DEF.adherent;
  return <span style={{ fontSize:11, fontWeight:700, color:r.color, background:r.bg, padding:"3px 9px", borderRadius:10, whiteSpace:"nowrap" }}>{r.label}</span>;
}




// ── AIDE ILLUSTRATIONS — visuels SVG pour les guides ────────────────────────

function InviteCoachModal({ C, studioSlug, onClose, onSubmit }) {
  const [email, setEmail]   = React.useState("");
  const [name, setName]     = React.useState({ fn:"", ln:"" });
  const [errors, setErrors] = React.useState({});
  const firstInputRef       = React.useRef(null);
  React.useEffect(() => {
    const t = setTimeout(() => firstInputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, []);
  const inpStyle = { width:"100%", padding:"9px 12px", border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:14, outline:"none", boxSizing:"border-box", color:C.text, background:C.surfaceWarm };
  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()}
      style={{position:"fixed",inset:0,background:"rgba(42,31,20,.45)",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:C.surface,borderRadius:16,padding:24,width:"100%",maxWidth:440,boxShadow:"0 24px 60px rgba(0,0,0,.18)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
          <div style={{fontSize:16,fontWeight:800,color:C.text}}>Inviter un coach</div>
          <button onClick={onClose} style={{background:"none",border:`1.5px solid ${C.border}`,borderRadius:8,padding:"4px 8px",cursor:"pointer"}}><IcoX s={14} c={C.textSoft}/></button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
          <div>
            <FieldLabel>Prénom</FieldLabel>
            <input ref={firstInputRef} name="invite_fn" autoComplete="new-password" value={name.fn}
              onChange={e=>{setName(p=>({...p,fn:e.target.value}));setErrors(v=>({...v,fn:false}))}} placeholder="Marie *"
              style={{...inpStyle, borderColor: errors.fn ? "#C43A3A" : C.border, background: errors.fn ? "#FFF5F5" : C.surfaceWarm}}
              onFocus={e=>e.target.style.borderColor=errors.fn?"#C43A3A":C.accent} onBlur={e=>e.target.style.borderColor=errors.fn?"#C43A3A":C.border}/>
          </div>
          <div>
            <FieldLabel>Nom</FieldLabel>
            <input name="invite_ln" autoComplete="new-password" value={name.ln}
              onChange={e=>{setName(p=>({...p,ln:e.target.value}));setErrors(v=>({...v,ln:false}))}} placeholder="Laurent *"
              style={{...inpStyle, borderColor: errors.ln ? "#C43A3A" : C.border, background: errors.ln ? "#FFF5F5" : C.surfaceWarm}}
              onFocus={e=>e.target.style.borderColor=errors.ln?"#C43A3A":C.accent} onBlur={e=>e.target.style.borderColor=errors.ln?"#C43A3A":C.border}/>
          </div>
        </div>
        <div style={{marginBottom:16}}>
          <FieldLabel>Email professionnel</FieldLabel>
          <input name="invite_email" autoComplete="new-password" inputMode="email" value={email}
            onChange={e=>{setEmail(e.target.value);setErrors(v=>({...v,email:false}))}} placeholder="coach@studio.fr *"
            style={{...inpStyle, borderColor: errors.email ? "#C43A3A" : C.border, background: errors.email ? "#FFF5F5" : C.surfaceWarm}}
            onFocus={e=>e.target.style.borderColor=errors.email?"#C43A3A":C.accent} onBlur={e=>e.target.style.borderColor=errors.email?"#C43A3A":C.border}/>
        </div>
        <div style={{padding:"10px 14px",background:C.accentLight,borderRadius:8,fontSize:12,color:C.accentDark,marginBottom:16}}>
          🔗 Un magic link sera envoyé à <strong>{email||"…"}</strong>. Le coach accédera via <strong>{studioSlug ? `${studioSlug}.fydelys.fr` : "votre studio"}</strong>
        </div>
        <div style={{display:"flex",gap:10}}>
          <Button variant="primary" onClick={()=>{
            const e = {};
            if (!name.fn.trim()) e.fn = true;
            if (!name.ln.trim()) e.ln = true;
            if (!email.trim()) e.email = true;
            setErrors(e);
            if (Object.keys(e).length) return;
            onSubmit(email, name.fn, name.ln);
          }}>
            <IcoMail s={14} c="white"/> Envoyer l'invitation
          </Button>
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
        </div>
      </div>
    </div>
  );
}

// ── Composant aperçu site vitrine — défini HORS de Settings pour éviter React error #300
function VitrinPreview({ name, city, description, cover, accent, slug }) {
  const borderSoft = "#EDE4D8";
  const textMuted  = "#B0A090";
  const text       = "#2A1F14";
  const accentBg   = accent + "18";
  return (
    <div style={{ background:"#fff", border:"1px solid #DDD5C8", borderRadius:12, marginBottom:14, overflow:"hidden" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", borderBottom:"1px solid #EDE4D8" }}>
        <div style={{ fontSize:13, fontWeight:700, color:text }}>Aperçu du site</div>
        {slug && (
          <a href={`https://${slug}.fydelys.fr/?preview=1`} target="_blank" rel="noopener noreferrer"
            style={{ fontSize:11, fontWeight:700, color:accent, textDecoration:"none" }}>
            Ouvrir ↗
          </a>
        )}
      </div>
      <div style={{ position:"relative", overflow:"hidden" }}>
        {cover
          ? <img src={cover} alt="" style={{ width:"100%", height:140, objectFit:"cover", display:"block", filter:"brightness(.45)" }}/>
          : <div style={{ height:140, background:"#2A1F14" }}/>
        }
        <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"16px 24px", textAlign:"center", gap:8 }}>
          <div style={{ fontSize:18, fontWeight:800, color:"#fff", letterSpacing:-0.3 }}>{name||"Nom du studio"}</div>
          {city && <div style={{ fontSize:12, color:"rgba(255,255,255,.65)" }}>📍 {city}</div>}
          {description && (
            <div style={{ fontSize:12, color:"rgba(255,255,255,.8)", lineHeight:1.5, maxWidth:340 }}>
              {description.slice(0,100)}{description.length>100?"…":""}
            </div>
          )}
          <div style={{ marginTop:4, padding:"6px 16px", borderRadius:8, background:accent, color:"#fff", fontSize:12, fontWeight:700 }}>
            Je réserve →
          </div>
        </div>
      </div>
      <div style={{ padding:"12px 16px" }}>
        <div style={{ fontSize:12, fontWeight:700, color:textMuted, marginBottom:8, textTransform:"uppercase", letterSpacing:.5 }}>📅 Prochaines séances</div>
        {[
          { icon:"🧘", name:"Yoga Hatha", time:"09:00", duration:60, places:5 },
          { icon:"💪", name:"Pilates",    time:"11:00", duration:45, places:2 },
        ].map((s,i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:i===0?`1px solid ${borderSoft}`:"none" }}>
            <div style={{ width:36, height:36, borderRadius:8, background:accentBg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>{s.icon}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:700, color:text }}>{s.name}</div>
              <div style={{ fontSize:11, color:textMuted }}>{s.time} · {s.duration} min</div>
            </div>
            <div style={{ fontSize:12, fontWeight:700, color:accent }}>{s.places} places</div>
          </div>
        ))}
        <div style={{ fontSize:11, color:textMuted, textAlign:"center", marginTop:8, fontStyle:"italic" }}>
          Les vraies séances s'afficheront sur le site publié.
        </div>
      </div>
    </div>
  );
}

function Settings({ isMobile, onImpersonate }) {
  const { studioName, studioSlug, userName, userEmail, planName, membersCount, userRole, studioId, discs } = useContext(AppCtx);
  const p = isMobile?12:28;
  const realRole = userRole || "admin";
  const [currentRole, setCurrentRole] = useState(realRole);
  // ── Données studio depuis Supabase
  const [studioForm, setStudioForm] = useState({ name:"", address:"", city:"", phone:"", email:"", website:"", cancel_delay_hours:12, booking_days_ahead:7, waitlist_max:10, timezone:"Europe/Paris", reminder_hours_default:24, description:"", cover_photo_url:"", accent_color:"#B07848", public_page_enabled:false, sms_enabled:false });
  const [studioSaving, setStudioSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [studioToast, setStudioToast] = useState(null);
  const showStudioToast = (msg, ok=true) => { setStudioToast({msg,ok}); setTimeout(()=>setStudioToast(null),3000); };

  React.useEffect(() => {
    if (!studioId) return;
    createClient().from("studios")
      .select("name, address, city, phone, email, website, cancel_delay_hours, booking_days_ahead, waitlist_max, timezone, reminder_hours_default, description, cover_photo_url, accent_color, slug, public_page_enabled, sms_enabled")
      .eq("id", studioId).single()
      .then(({ data }) => {
        if (data) setStudioForm({
          name: data.name || "",
          address: data.address || "",
          city: data.city || "",
          phone: data.phone || "",
          email: data.email || "",
          website: data.website || "",
          cancel_delay_hours: data.cancel_delay_hours ?? 12,
          booking_days_ahead: data.booking_days_ahead ?? 7,
          waitlist_max: data.waitlist_max ?? 10,
          timezone: data.timezone || "Europe/Paris",
          reminder_hours_default: data.reminder_hours_default ?? 24,
          description: data.description || (data.name ? `Bienvenue chez ${data.name}${data.city?" à "+data.city:""}. Réservez vos séances en ligne.` : ""),
          cover_photo_url: data.cover_photo_url || "",
          accent_color: data.accent_color || "#B07848",
          slug: data.slug || "",
          public_page_enabled: data.public_page_enabled ?? false,
          sms_enabled: data.sms_enabled ?? false,
        });
      });
  }, [studioId]);

  const saveStudio = async () => {
    if (!studioId) return;
    setStudioSaving(true);
    // Payload de base (colonnes existantes)
    const basePayload = {
      name: studioForm.name,
      address: studioForm.address,
      city: studioForm.city,
      phone: studioForm.phone,
      email: studioForm.email,
      website: studioForm.website,
      cancel_delay_hours: parseInt(studioForm.cancel_delay_hours) || 12,
      booking_days_ahead: parseInt(studioForm.booking_days_ahead) || 7,
      waitlist_max: parseInt(studioForm.waitlist_max) || 10,
      sms_enabled: studioForm.sms_enabled || false,
      description: studioForm.description || null,
      cover_photo_url: studioForm.cover_photo_url || null,
      accent_color: studioForm.accent_color || "#B07848",
      public_page_enabled: studioForm.public_page_enabled ?? false,
    };
    // Colonnes ajoutées par migration — incluses seulement si disponibles
    const extPayload = {
      ...basePayload,
      timezone: studioForm.timezone || "Europe/Paris",
      reminder_hours_default: parseInt(studioForm.reminder_hours_default) || 24,
    };
    let { error } = await createClient().from("studios").update(extPayload).eq("id", studioId);
    // Fallback si colonnes timezone/reminder absentes en base
    if (error?.message?.includes("timezone") || error?.message?.includes("reminder")) {
      ({ error } = await createClient().from("studios").update(basePayload).eq("id", studioId));
    }
    setStudioSaving(false);
    if (error) showStudioToast("Erreur : " + error.message, false);
    else showStudioToast("Paramètres enregistrés ✓");
  };
  // Sync si userRole change (chargement async)
  React.useEffect(() => {
    if (userRole) {
      setCurrentRole(userRole);
      // Remettre l'onglet par défaut si le tab courant n'est pas accessible
      setTab(t => {
        if (userRole !== "superadmin" && t === "superadmin") return "studio";
        return t;
      });
    }
  }, [userRole]);
  const [tab, setTab] = useState("studio"); // toujours "studio" par défaut — sera "superadmin" si SA
  // ── Données équipe partagées entre TabTeam et TabUsers ──────────────────────
  const [teamData, setTeamData] = useState({ coaches:[], invites:[], loaded:false });
  const loadTeam = React.useCallback(async () => {
    if (!studioId) return;
    try {
      const res = await fetch(`/api/team?studioId=${studioId}`);
      const data = await res.json();
      setTeamData({ coaches: data.coaches||[], invites: data.invites||[], loaded:true });
    } catch(e) { console.error("loadTeam error", e); }
  }, [studioId]);
  React.useEffect(() => { loadTeam(); }, [loadTeam]);
  const [users, setUsers] = useState(USERS_DATA);
  const [tenants, setTenants] = useState(TENANTS_DATA);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [modal, setModal] = useState(null); // type: "newTenant"|"inviteUser"|"editUser"|"password"|"2fa"|"sessions"|"deleteAccount"
  const [toast, setToast] = useState(null);
  const [inviteModal, setInviteModal] = useState(false);

  const isSA = realRole === "superadmin";       // vrai rôle pour les onglets/accès
  const isAdmin = realRole === "admin" || isSA; // vrai rôle pour les permissions
  const isSAPreview = currentRole === "superadmin"; // aperçu uniquement (demo switcher)

  const showToast = (msg, ok=true) => { setToast({msg,ok}); setTimeout(()=>setToast(null),3000); };

  // ── Shared Modal shell ────────────────────────────────────────────────────
  const Modal = ({ children, maxW=440 }) => (
    <div style={{ position:"fixed", inset:0, background:"rgba(42,31,20,.45)", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
      onClick={e=>{ if(e.target===e.currentTarget) setModal(null); }}>
      <div style={{ background:C.surface, borderRadius:16, padding:24, width:"100%", maxWidth:maxW, boxShadow:"0 24px 60px rgba(0,0,0,.18)", maxHeight:"85vh", overflowY:"auto" }}>
        {children}
      </div>
    </div>
  );
  const MHead = ({ title }) => (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
      <div style={{ fontSize:16, fontWeight:800, color:C.text }}>{title}</div>
      <button onClick={()=>setModal(null)} style={{ background:"none", border:`1.5px solid ${C.border}`, borderRadius:8, padding:"4px 7px", cursor:"pointer", display:"flex" }}><IcoX s={15} c={C.textSoft}/></button>
    </div>
  );

  // ── Modal: Nouveau tenant ────────────────────────────────────────────────
  const NewTenantModal = () => {
    const [f, setF] = useState({ name:"", city:"", plan:"Essentiel" });
    return (
      <Modal>
        <MHead title="Nouveau tenant"/>
        <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:18 }}>
          <div><FieldLabel>Nom du studio</FieldLabel><input value={f.name} onChange={e=>setF({...f,name:e.target.value})} placeholder="Ex: Hot Yoga Lyon" style={{ width:"100%", padding:"9px 12px", border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:14, outline:"none", boxSizing:"border-box", color:C.text, background:C.surfaceWarm }} onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/></div>
          <div><FieldLabel>Ville</FieldLabel><input value={f.city} onChange={e=>setF({...f,city:e.target.value})} placeholder="Paris, Lyon…" style={{ width:"100%", padding:"9px 12px", border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:14, outline:"none", boxSizing:"border-box", color:C.text, background:C.surfaceWarm }} onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/></div>
          <Field label="Plan" value={f.plan} onChange={v=>setF({...f,plan:v})} opts={FYDELYS_PLANS.map(p=>({v:p.name,l:p.name}))}/>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <Button variant="primary" onClick={()=>{ if(!f.name) return; setTenants(prev=>[...prev,{id:`t${Date.now()}`,name:f.name,city:f.city,plan:f.plan,members:0,revenue:"0 €",status:"actif",since:"Mars 2026"}]); setModal(null); showToast(`Tenant "${f.name}" créé !`); }}>Créer le tenant</Button>
          <Button variant="ghost" onClick={()=>setModal(null)}>Annuler</Button>
        </div>
      </Modal>
    );
  };

  // ── Modal: Inviter utilisateur ────────────────────────────────────────────
  const InviteUserModal = () => {
    const [f, setF] = useState({ fn:"", ln:"", email:"", role:"adherent", tenant:"t1" });
    return (
      <Modal>
        <MHead title="Inviter un utilisateur"/>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
          <div><FieldLabel>Prénom</FieldLabel><input value={f.fn} onChange={e=>setF({...f,fn:e.target.value})} style={{ width:"100%", padding:"9px 12px", border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:14, outline:"none", boxSizing:"border-box", color:C.text, background:C.surfaceWarm }} onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/></div>
          <div><FieldLabel>Nom</FieldLabel><input value={f.ln} onChange={e=>setF({...f,ln:e.target.value})} style={{ width:"100%", padding:"9px 12px", border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:14, outline:"none", boxSizing:"border-box", color:C.text, background:C.surfaceWarm }} onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/></div>
        </div>
        <div style={{ marginBottom:12 }}><FieldLabel>Email</FieldLabel><input type="email" value={f.email} onChange={e=>setF({...f,email:e.target.value})} placeholder="prenom@studio.fr" style={{ width:"100%", padding:"9px 12px", border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:14, outline:"none", boxSizing:"border-box", color:C.text, background:C.surfaceWarm }} onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/></div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:18 }}>
          <Field label="Rôle" value={f.role} onChange={v=>setF({...f,role:v})} opts={Object.entries(ROLES_DEF).map(([v,r])=>({v,l:r.label}))}/>
          {isSA && <Field label="Tenant" value={f.tenant} onChange={v=>setF({...f,tenant:v})} opts={tenants.map(t=>({v:t.id,l:t.name}))}/>}
        </div>
        <div style={{ padding:"10px 14px", background:C.accentBg, borderRadius:8, fontSize:12, color:C.accentDark, marginBottom:16 }}>
          Un email d'invitation sera envoyé à <strong>{f.email||"…"}</strong>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <Button variant="primary" onClick={()=>{ if(!f.fn||!f.email) return; setUsers(prev=>[...prev,{id:`u${Date.now()}`,fn:f.fn,ln:f.ln,email:f.email,role:f.role,tenant:f.tenant,status:"actif",lastLogin:"Jamais"}]); setModal(null); showToast(`Invitation envoyée à ${f.email}`); }}><span style={{display:"flex",alignItems:"center",gap:6}}><IcoMail s={14} c="white"/>Envoyer l'invitation</span></Button>
          <Button variant="ghost" onClick={()=>setModal(null)}>Annuler</Button>
        </div>
      </Modal>
    );
  };

  // ── Modal: Modifier utilisateur ───────────────────────────────────────────
  const EditUserModal = () => {
    const u = modal.user;
    const [role, setRole] = useState(u.role);
    const [status, setStatus] = useState(u.status);
    return (
      <Modal>
        <MHead title={`Modifier — ${u.fn} ${u.ln}`}/>
        <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", background:C.bg, borderRadius:10, marginBottom:18 }}>
          <div style={{ width:36, height:36, borderRadius:"50%", background:C.accentBg, border:`1px solid #DFC0A0`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:C.accent }}>{u.fn[0]}{u.ln[0]}</div>
          <div><div style={{ fontSize:14, fontWeight:700, color:C.text }}>{u.fn} {u.ln}</div><div style={{ fontSize:12, color:C.textSoft }}>{u.email}</div></div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:18 }}>
          <Field label="Rôle" value={role} onChange={setRole} opts={Object.entries(ROLES_DEF).map(([v,r])=>({v,l:r.label}))}/>
          <Field label="Statut" value={status} onChange={setStatus} opts={["actif","suspendu"].map(v=>({v,l:v.charAt(0).toUpperCase()+v.slice(1)}))}/>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <Button variant="primary" onClick={()=>{ setUsers(prev=>prev.map(x=>x.id===u.id?{...x,role,status}:x)); setModal(null); showToast("Utilisateur mis à jour"); }}>Enregistrer</Button>
          <Button variant="ghost" onClick={()=>setModal(null)}>Annuler</Button>
        </div>
      </Modal>
    );
  };

  // ── Modal: Mot de passe ───────────────────────────────────────────────────
  const PasswordModal = () => {
    const [f, setF] = useState({ old:"", new1:"", new2:"" });
    const [done, setDone] = useState(false);
    const valid = f.old && f.new1.length >= 8 && f.new1===f.new2;
    return (
      <Modal>
        <MHead title="Changer le mot de passe"/>
        {done ? (
          <div style={{ display:"flex", alignItems:"center", gap:10, padding:"14px", background:C.okBg, borderRadius:10, color:C.ok, fontWeight:600 }}><IcoCheck s={18} c={C.ok}/>Mot de passe mis à jour !</div>
        ) : (
          <>
            <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:18 }}>
              {[["Mot de passe actuel","old"],["Nouveau mot de passe","new1"],["Confirmer","new2"]].map(([lbl,key])=>(
                <div key={key}><FieldLabel>{lbl}</FieldLabel><input type="password" value={f[key]} onChange={e=>setF({...f,[key]:e.target.value})} style={{ width:"100%", padding:"9px 12px", border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:14, outline:"none", boxSizing:"border-box", color:C.text, background:C.surfaceWarm }} onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/></div>
              ))}
            </div>
            {f.new1 && f.new1!==f.new2 && <div style={{ fontSize:12, color:C.warn, marginBottom:10 }}>Les mots de passe ne correspondent pas.</div>}
            {f.new1 && f.new1.length < 8 && <div style={{ fontSize:12, color:C.warn, marginBottom:10 }}>Minimum 8 caractères.</div>}
            <div style={{ display:"flex", gap:10 }}>
              <Button variant="primary" onClick={()=>{ if(valid) setDone(true); }} >Changer</Button>
              <Button variant="ghost" onClick={()=>setModal(null)}>Annuler</Button>
            </div>
          </>
        )}
      </Modal>
    );
  };

  // ── Modal: 2FA ────────────────────────────────────────────────────────────
  const TwoFAModal = () => {
    const [step, setStep] = useState(1);
    const [code, setCode] = useState("");
    return (
      <Modal>
        <MHead title="Authentification à 2 facteurs"/>
        {step===1 && (
          <>
            <div style={{ textAlign:"center", padding:"20px 0" }}>
              <div style={{ width:160, height:160, background:"#F0EBE3", borderRadius:12, margin:"0 auto 16px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, color:C.textMuted }}>QR Code<br/>2FA</div>
              <div style={{ fontSize:13, color:C.textSoft }}>Scannez ce QR code avec<br/><strong>Google Authenticator</strong> ou <strong>Authy</strong></div>
            </div>
            <div style={{ padding:"8px 14px", background:C.bg, borderRadius:8, fontFamily:"monospace", fontSize:13, color:C.text, textAlign:"center", marginBottom:16, letterSpacing:2 }}>JBSWY3DPEHPK3PXP</div>
            <Button variant="primary" onClick={()=>setStep(2)} block>J'ai scanné le QR code</Button>
          </>
        )}
        {step===2 && (
          <>
            <div style={{ fontSize:14, color:C.textSoft, marginBottom:16 }}>Entrez le code à 6 chiffres généré par votre application :</div>
            <input value={code} onChange={e=>setCode(e.target.value)} maxLength={6} placeholder="000000"
              style={{ width:"100%", padding:"12px", border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:24, outline:"none", boxSizing:"border-box", color:C.text, background:C.surfaceWarm, textAlign:"center", letterSpacing:8, fontWeight:700, marginBottom:16 }}
              onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/>
            <div style={{ display:"flex", gap:10 }}>
              <Button variant="primary" onClick={()=>{ if(code.length===6){ setModal(null); showToast("2FA activé avec succès !"); }}}>Activer</Button>
              <Button variant="ghost" onClick={()=>setModal(null)}>Annuler</Button>
            </div>
          </>
        )}
      </Modal>
    );
  };

  // ── Modal: Sessions ───────────────────────────────────────────────────────
  const SessionsModal = () => {
    const [sessions, setSessions] = useState([
      { id:1, device:"iPhone 14 Pro", location:"Paris, France", current:true,  last:"Maintenant",      icon:"📱" },
      { id:2, device:"MacBook Pro",   location:"Paris, France", current:false, last:"Il y a 2 heures", icon:"💻" },
      { id:3, device:"Chrome / Windows", location:"Lyon, France", current:false, last:"Il y a 3 jours", icon:"🌐" },
    ]);
    return (
      <Modal>
        <MHead title="Sessions actives"/>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {sessions.map(s=>(
            <div key={s.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", borderRadius:10, background:s.current?C.okBg:C.bg, border:`1.5px solid ${s.current?"#B8DFC4":C.border}` }}>
              <span style={{ fontSize:22 }}>{s.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:700, color:C.text }}>{s.device} {s.current && <span style={{ fontSize:11, color:C.ok, fontWeight:600 }}>● Session actuelle</span>}</div>
                <div style={{ fontSize:12, color:C.textSoft }}>{s.location} · {s.last}</div>
              </div>
              {!s.current && <button onClick={()=>setSessions(prev=>prev.filter(x=>x.id!==s.id))} style={{ fontSize:12, padding:"4px 10px", borderRadius:7, border:`1px solid #EFC8BC`, background:C.warnBg, color:C.warn, cursor:"pointer", fontWeight:600 }}>Déconnecter</button>}
            </div>
          ))}
        </div>
        {sessions.filter(s=>!s.current).length > 0 && (
          <button onClick={()=>setSessions(prev=>prev.filter(s=>s.current))} style={{ marginTop:14, width:"100%", padding:"10px", borderRadius:8, border:`1.5px solid #EFC8BC`, background:C.warnBg, color:C.warn, cursor:"pointer", fontWeight:700, fontSize:13 }}>
            Déconnecter toutes les autres sessions
          </button>
        )}
      </Modal>
    );
  };

  // ── Modal: Supprimer compte ───────────────────────────────────────────────
  const DeleteAccountModal = () => {
    const [confirm, setConfirm] = useState("");
    return (
      <Modal>
        <MHead title="Supprimer mon compte"/>
        <div style={{ padding:"14px", background:C.warnBg, borderRadius:10, border:`1px solid #EFC8BC`, marginBottom:18 }}>
          <div style={{ fontSize:14, fontWeight:700, color:C.warn, marginBottom:6 }}>⚠ Action irréversible</div>
          <div style={{ fontSize:13, color:C.textMid }}>Toutes vos données seront définitivement supprimées. Cette action ne peut pas être annulée.</div>
        </div>
        <div style={{ marginBottom:18 }}>
          <FieldLabel>Tapez <strong>SUPPRIMER</strong> pour confirmer</FieldLabel>
          <input value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="SUPPRIMER"
            style={{ width:"100%", padding:"9px 12px", border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:14, outline:"none", boxSizing:"border-box", color:C.text, background:C.surfaceWarm }}
            onFocus={e=>e.target.style.borderColor=C.warn} onBlur={e=>e.target.style.borderColor=C.border}/>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <Button variant="danger" onClick={()=>{ if(confirm==="SUPPRIMER"){ setModal(null); showToast("Compte supprimé", false); }}}>Supprimer définitivement</Button>
          <Button variant="ghost" onClick={()=>setModal(null)}>Annuler</Button>
        </div>
      </Modal>
    );
  };

  const tabs = [
    ...(isSA ? [{ key:"superadmin", label:"Super Admin", icon:<IcoLayers2 s={14} c="currentColor"/> }] : []),
    { key:"studio",  label:"Studio",       icon:<IcoSettings2 s={14} c="currentColor"/> },
    { key:"team",    label:"Équipe",        icon:<IcoUsers2 s={14} c="currentColor"/> },
    { key:"users",   label:"Utilisateurs", icon:<IcoTag2 s={14} c="currentColor"/> },

    { key:"rooms",    label:"Salles",       icon:<IcoDoor s={14} c="currentColor"/> },
    ...(isAdmin ? [{ key:"payments", label:"Paiements", icon:<IcoEuro2 s={14} c="currentColor"/> }] : []),
    { key:"account",  label:"Mon compte",  icon:<IcoHome2 s={14} c="currentColor"/> },
  ].filter(Boolean);

  // ── Preview role switcher (superadmin seulement) ────────────────────────
  const RoleSwitcher = () => {
    if (!isSA) return null; // N'afficher que pour le superadmin réel
    return (
      <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 14px", background:C.cardAlt||"#F5EEE6", border:`1px solid ${C.border}`, borderRadius:10, marginBottom:16, flexWrap:"wrap" }}>
        <span style={{ fontSize:12, color:C.accent, fontWeight:600 }}>👁 Aperçu rôle :</span>
        {["superadmin","admin","staff","adherent"].map(r=>(
          <button key={r} onClick={()=>{ setCurrentRole(r); setTab(r==="superadmin"?"superadmin":"studio"); }}
            style={{ fontSize:11, padding:"3px 10px", borderRadius:8, border:`1.5px solid ${currentRole===r?C.accent:C.border}`, background:currentRole===r?C.accent:"white", color:currentRole===r?"white":C.textMid, fontWeight:700, cursor:"pointer" }}>
            {ROLES_DEF[r].label}
          </button>
        ))}
      </div>
    );
  };

  // ── Tab: Super Admin ──────────────────────────────────────────────────────
  const TabSuperAdmin = () => (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)", gap:10, marginBottom:20 }}>
        {[
          { lbl:"Tenants actifs",    val:tenants.filter(t=>t.status==="actif").length,  icon:<IcoLayers2 s={16} c="#7C3AED"/>, c:"#7C3AED", bg:"#F3EEFF" },
          { lbl:"Total membres",     val:tenants.reduce((s,t)=>s+t.members,0),          icon:<IcoUsers2 s={16} c={C.ok}/>,     c:C.ok,      bg:C.okBg },
          { lbl:"CA plateforme",     val:"18 330 €",                                    icon:<IcoEuro2 s={16} c={C.accent}/>,  c:C.accent,  bg:C.accentBg },
          { lbl:"Tenants suspendus", val:tenants.filter(t=>t.status==="suspendu").length,icon:<IcoAlert2 s={16} c={C.warn}/>,  c:C.warn,    bg:C.warnBg },
        ].map(s=>(
          <Card key={s.lbl} style={{ padding:"12px 14px" }}>
            <div style={{ width:28, height:28, borderRadius:7, background:s.bg, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:6 }}>{s.icon}</div>
            <div style={{ fontSize:20, fontWeight:800, color:s.c, lineHeight:1, marginBottom:3 }}>{s.val}</div>
            <div style={{ fontSize:11, color:C.textSoft }}>{s.lbl}</div>
          </Card>
        ))}
      </div>
      <Card noPad>
        <SectionHead action={<Button sm variant="primary" onClick={()=>setModal({type:"newTenant"})}><span style={{display:"flex",alignItems:"center",gap:5}}><IcoUserPlus2 s={13} c="white"/>Nouveau tenant</span></Button>}>
          Tous les tenants
        </SectionHead>
        {tenants.map(t=>(
          <div key={t.id} style={{ padding:"12px 16px", borderBottom:`1px solid ${C.borderSoft}`, transition:"background .1s" }}
            onMouseEnter={e=>e.currentTarget.style.background=C.bg}
            onMouseLeave={e=>e.currentTarget.style.background=""}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:5 }}>
              <div style={{ width:32, height:32, borderRadius:8, background:"#F3EEFF", border:"1px solid #C4A8F0", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><IcoYoga s={16} c="#7C3AED"/></div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:700, color:C.text }}>{t.name}</div>
                <div style={{ fontSize:11, color:C.textSoft }}>{t.city} · depuis {t.since}</div>
              </div>
              <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:8, background:t.plan==="Pro"?"#F3EEFF":"#EEE", color:t.plan==="Pro"?"#7C3AED":C.textMid }}>{t.plan}</span>
              <Tag s={t.status}/>
            </div>
            <div style={{ display:"flex", gap:16, paddingLeft:42 }}>
              <span style={{ fontSize:11, color:C.textSoft }}><span style={{ fontWeight:600, color:C.text }}>{t.members}</span> membres</span>
              <span style={{ fontSize:11, color:C.textSoft }}><span style={{ fontWeight:600, color:C.accent }}>{t.revenue}</span> / mois</span>
              <div style={{ marginLeft:"auto", display:"flex", gap:6 }}>
                <button onClick={()=>showToast(`Accès à "${t.name}" simulé`)} style={{ fontSize:11, padding:"3px 10px", borderRadius:6, border:`1px solid ${C.border}`, background:C.bg, color:C.textMid, cursor:"pointer", fontWeight:600 }}>Accéder</button>
                {t.status==="actif"
                  ? <button onClick={()=>{ setTenants(prev=>prev.map(x=>x.id===t.id?{...x,status:"suspendu"}:x)); showToast(`"${t.name}" suspendu`, false); }} style={{ fontSize:11, padding:"3px 10px", borderRadius:6, border:`1px solid #EFC8BC`, background:C.warnBg, color:C.warn, cursor:"pointer", fontWeight:600 }}>Suspendre</button>
                  : <button onClick={()=>{ setTenants(prev=>prev.map(x=>x.id===t.id?{...x,status:"actif"}:x)); showToast(`"${t.name}" réactivé`); }} style={{ fontSize:11, padding:"3px 10px", borderRadius:6, border:`1px solid #B8DFC4`, background:C.okBg, color:C.ok, cursor:"pointer", fontWeight:600 }}>Réactiver</button>
                }
              </div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );

  // ── Tab: Studio settings ──────────────────────────────────────────────────
  const TabStudio = () => {
    const SI = ({ label, fkey, type="text", placeholder="" }) => (
      <div>
        <FieldLabel>{label}</FieldLabel>
        <input type={type} value={studioForm[fkey]||""} placeholder={placeholder} disabled={!isAdmin}
          onChange={e=>setStudioForm(f=>({...f,[fkey]:e.target.value}))}
          style={{ width:"100%", padding:"9px 12px", border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:14, outline:"none", boxSizing:"border-box", color:C.text, background:isAdmin?C.surfaceWarm:"#F8F5F2", opacity:isAdmin?1:0.7, transition:"border-color .15s" }}
          onFocus={e=>{ if(isAdmin) e.target.style.borderColor=C.accent; }}
          onBlur={e=>e.target.style.borderColor=C.border}/>
      </div>
    );
    return (
      <div>
        {studioToast && (
          <div style={{ marginBottom:12, padding:"10px 14px", borderRadius:9, background:studioToast.ok?"#D1FAE5":"#FEE2E2", color:studioToast.ok?"#065F46":"#991B1B", fontSize:13, fontWeight:600 }}>
            {studioToast.ok?"✓":"✗"} {studioToast.msg}
          </div>
        )}
        {!studioId && (
          <div style={{ padding:"12px 16px", background:"#FEF3C7", borderRadius:9, marginBottom:14, fontSize:13, color:"#92400E" }}>
            ⏳ Chargement des données studio…
          </div>
        )}
        <Card noPad style={{ marginBottom:14 }}>
          <SectionHead>Informations du studio</SectionHead>
          <div style={{ padding:"16px 18px", display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr", gap:12 }}>
            <div style={{ gridColumn:isMobile?"1":"1 / -1" }}>
              <SI label="Nom du studio" fkey="name" placeholder="Mon Studio Yoga"/>
            </div>
            <SI label="Adresse" fkey="address" placeholder="12 rue de la Paix"/>
            <SI label="Ville" fkey="city" placeholder="Paris"/>
            <SI label="Téléphone" fkey="phone" type="tel" placeholder="06 00 00 00 00"/>
            <SI label="Email de contact" fkey="email" type="email" placeholder="contact@studio.fr"/>
            <SI label="Site web" fkey="website" placeholder="https://monstudio.fr"/>
          </div>
          {isAdmin && (
            <div style={{ padding:"0 18px 16px", display:"flex", alignItems:"center", gap:10 }}>
              <Button sm variant="primary" onClick={saveStudio}>{studioSaving?"Enregistrement…":"Enregistrer"}</Button>
            </div>
          )}
        </Card>

        <Card noPad style={{ marginBottom:14 }}>
          <SectionHead>Paramètres de réservation</SectionHead>
          <div style={{ padding:"16px 18px", display:"grid", gridTemplateColumns:isMobile?"1fr 1fr":"1fr 1fr 1fr", gap:12 }}>
            <SI label="Annulation (h avant)" fkey="cancel_delay_hours" type="number"/>
            <SI label="Résa ouverte (j avant)" fkey="booking_days_ahead" type="number"/>
            <SI label="Attente max" fkey="waitlist_max" type="number"/>
          </div>
          <div style={{ padding:"0 18px 16px" }}>
            <div onClick={()=>setStudioForm(f=>({...f,sms_enabled:!f.sms_enabled}))}
              style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 14px",
                background:studioForm.sms_enabled?"#F0FFF4":"#FAFAF8",
                border:`1px solid ${studioForm.sms_enabled?"rgba(52,211,153,.3)":C.border}`,
                borderRadius:10, cursor:"pointer", userSelect:"none" }}>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:studioForm.sms_enabled?"#065F46":C.textMid }}>📱 SMS de confirmation &amp; rappels</div>
                <div style={{ fontSize:11, color:C.textMuted, marginTop:2 }}>Envoie un SMS aux adhérents à chaque réservation et avant chaque séance (via Twilio — coût par SMS)</div>
              </div>
              <div style={{ width:40, height:22, borderRadius:11, background:studioForm.sms_enabled?"#34D399":"rgba(52,211,153,.15)", position:"relative", flexShrink:0, transition:"background .2s" }}>
                <div style={{ position:"absolute", top:3, left:studioForm.sms_enabled?20:3, width:16, height:16, borderRadius:"50%", background:"#fff", transition:"left .2s" }}/>
              </div>
            </div>
          </div>
          <div style={{ padding:"0 18px 16px", borderTop:`1px solid ${C.borderSoft}`, paddingTop:16 }}>
            <div style={{ fontSize:11, fontWeight:800, color:C.accent, textTransform:"uppercase", letterSpacing:.6, marginBottom:12 }}>🔔 Notifications</div>
            <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr", gap:12, marginBottom:10, alignItems:"flex-end" }}>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:.8, marginBottom:5 }}>Fuseau horaire (UTC)</div>
                <select value={studioForm.timezone} disabled={!isAdmin}
                  onChange={e=>setStudioForm(f=>({...f,timezone:e.target.value}))}
                  style={{ width:"100%", padding:"9px 12px", border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:13, color:C.text, background:C.surfaceWarm, outline:"none", cursor:isAdmin?"pointer":"default", opacity:isAdmin?1:.6 }}>
                  {["Europe/Paris","Europe/London","Europe/Brussels","Europe/Zurich","Europe/Madrid","Europe/Rome","Europe/Berlin","Europe/Amsterdam","Europe/Lisbon","America/New_York","America/Chicago","America/Los_Angeles","America/Montreal","America/Sao_Paulo","Asia/Dubai","Asia/Singapore","Asia/Tokyo","Pacific/Auckland","Australia/Melbourne","Africa/Casablanca","UTC"].map(tz=>(
                    <option key={tz} value={tz}>{tz.replace(/_/g," ")}</option>
                  ))}
                </select>
              </div>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:.8, marginBottom:5 }}>Rappel cours (heures avant)</div>
                <select value={studioForm.reminder_hours_default} disabled={!isAdmin}
                  onChange={e=>setStudioForm(f=>({...f,reminder_hours_default:parseInt(e.target.value)}))}
                  style={{ width:"100%", padding:"9px 12px", border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:13, color:C.text, background:C.surfaceWarm, outline:"none", cursor:isAdmin?"pointer":"default", opacity:isAdmin?1:.6 }}>
                  {[1,2,3,6,12,24,48].map(h=><option key={h} value={h}>{h}h avant la séance</option>)}
                </select>
              </div>
            </div>
            <div style={{ fontSize:12, color:C.textMuted, background:C.bg, padding:"8px 12px", borderRadius:8, border:`1px solid ${C.borderSoft}` }}>
              ℹ Un email de rappel sera envoyé <strong>{studioForm.reminder_hours_default}h</strong> avant chaque séance, et un email d'anniversaire le jour J, selon le fuseau <strong>{studioForm.timezone}</strong>.
            </div>
          </div>
          {isAdmin && (
            <div style={{ padding:"0 18px 16px" }}>
              <Button sm variant="primary" onClick={saveStudio}>{studioSaving?"Enregistrement…":"Enregistrer"}</Button>
            </div>
          )}
        </Card>

        <Card noPad style={{ marginBottom:14 }}>
          <SectionHead>Site vitrine <span style={{fontSize:11,fontWeight:500,color:C.textMuted,marginLeft:6}}>— si vous n'avez pas de site web</span></SectionHead>
          <div style={{ padding:"16px 18px", display:"flex", flexDirection:"column", gap:14 }}>
            {/* Toggle activation */}
            {(() => {
              const canEnable = !!(studioForm.cover_photo_url && studioForm.description?.trim());
              return (
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 14px", background:studioForm.public_page_enabled?C.okBg:C.bg, borderRadius:10, border:`1.5px solid ${studioForm.public_page_enabled?C.ok:C.border}`, transition:"all .2s" }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:C.text }}>Site vitrine gratuit</div>
                    <div style={{ fontSize:12, color:C.textSoft, marginTop:2 }}>
                      {studioForm.public_page_enabled
                        ? "Activé — votre studio est visible en ligne"
                        : canEnable
                          ? "À activer si vous n'avez pas de site web"
                          : "Ajoutez une photo et une description pour activer"}
                    </div>
                  </div>
                  <button disabled={!isAdmin || (!studioForm.public_page_enabled && !canEnable)}
                    onClick={()=>{ if(!canEnable && !studioForm.public_page_enabled){ showStudioToast("Ajoutez une photo de couverture et une description avant d'activer le site vitrine.", false); return; } setStudioForm(f=>({...f,public_page_enabled:!f.public_page_enabled})); }}
                    style={{ width:44, height:24, borderRadius:12, border:"none", background:studioForm.public_page_enabled?C.ok:(!canEnable?"#E0D8D0":"#D0C8C0"), cursor:(isAdmin&&(canEnable||studioForm.public_page_enabled))?"pointer":"not-allowed", position:"relative", transition:"background .2s", flexShrink:0, opacity:(!isAdmin||(!canEnable&&!studioForm.public_page_enabled))?.6:1 }}>
                    <div style={{ position:"absolute", top:3, left:studioForm.public_page_enabled?22:3, width:18, height:18, borderRadius:"50%", background:"white", transition:"left .2s", boxShadow:"0 1px 4px rgba(0,0,0,.2)" }}/>
                  </button>
                </div>
              );
            })()}

            {/* Lien de la page — seulement si activée */}
            {studioForm.slug && studioForm.public_page_enabled && (
              <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:C.accentBg, borderRadius:9, border:`1px solid ${C.border}` }}>
                <span style={{ fontSize:12, color:C.textMuted }}>🌐 Votre page :</span>
                <a href={`https://${studioForm.slug}.fydelys.fr/?preview=1`} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize:13, fontWeight:700, color:C.accent, textDecoration:"none" }}>
                  {studioForm.slug}.fydelys.fr ↗
                </a>
              </div>
            )}
            {studioForm.slug && !studioForm.public_page_enabled && (
              <div style={{ fontSize:12, color:C.textMuted, padding:"8px 12px", background:C.bg, borderRadius:8, border:`1px solid ${C.borderSoft}` }}>
                Les visiteurs sur <strong>{studioForm.slug}.fydelys.fr</strong> seront redirigés vers la connexion.
              </div>
            )}

            {/* Description */}
            <div>
              <FieldLabel>Description du studio</FieldLabel>
              <textarea value={studioForm.description} disabled={!isAdmin}
                onChange={e=>setStudioForm(f=>({...f,description:e.target.value}))}
                placeholder="Décrivez votre studio, votre ambiance, vos spécialités… (visible sur votre site vitrine)"
                rows={3}
                style={{ width:"100%", padding:"9px 12px", border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:14, outline:"none", boxSizing:"border-box", color:C.text, background:isAdmin?C.surfaceWarm:"#F8F5F2", resize:"vertical", fontFamily:"inherit", opacity:isAdmin?1:0.7 }}
                onFocus={e=>{ if(isAdmin) e.target.style.borderColor=C.accent; }}
                onBlur={e=>e.target.style.borderColor=C.border}/>
              <div style={{ fontSize:11, color:C.textMuted, marginTop:4 }}>{(studioForm.description||"").length}/300 caractères</div>
            </div>

            {/* Photo de couverture — upload */}
            <div>
              <FieldLabel>Photo de couverture</FieldLabel>
              {/* Photos par défaut */}
              {!studioForm.cover_photo_url && isAdmin && (
                <div style={{ marginBottom:10 }}>
                  <div style={{ fontSize:11, color:C.textMuted, marginBottom:6 }}>Choisir une photo de départ :</div>
                  <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:4 }}>
                    {[
                      { url:"https://images.unsplash.com/photo-1588286840104-8957b019727f?w=800&q=80&auto=format&fit=crop", label:"Yoga" },
                      { url:"https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80&auto=format&fit=crop", label:"Pilates" },
                      { url:"https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80&auto=format&fit=crop", label:"Méditation" },
                      { url:"https://images.unsplash.com/photo-1547153760-18fc86324498?w=800&q=80&auto=format&fit=crop", label:"Danse" },
                      { url:"https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80&auto=format&fit=crop", label:"Fitness" },
                      { url:"https://images.unsplash.com/photo-1552196563-55cd4e45efb3?w=800&q=80&auto=format&fit=crop", label:"Stretching" },
                    ].map(p => (
                      <button key={p.label} onClick={()=>setStudioForm(f=>({...f,cover_photo_url:p.url}))}
                        style={{ flexShrink:0, border:`2px solid ${C.border}`, borderRadius:8, overflow:"hidden", cursor:"pointer", padding:0, background:"none", position:"relative" }}
                        onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent}
                        onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                        <img src={p.url} alt={p.label} style={{ width:64, height:44, objectFit:"cover", display:"block" }}/>
                        <div style={{ position:"absolute", bottom:0, left:0, right:0, background:"rgba(0,0,0,.45)", color:"white", fontSize:9, fontWeight:700, textAlign:"center", padding:"2px 0" }}>{p.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {studioForm.cover_photo_url ? (
                <div style={{ position:"relative", borderRadius:10, overflow:"hidden", border:`1.5px solid ${C.border}` }}>
                  <img src={studioForm.cover_photo_url} alt="Couverture" style={{ width:"100%", height:140, objectFit:"cover", display:"block" }}
                    onError={e=>{ e.target.style.display="none"; }}/>
                  {isAdmin && (
                    <button onClick={()=>setStudioForm(f=>({...f,cover_photo_url:"", public_page_enabled:false}))}
                      style={{ position:"absolute", top:8, right:8, background:"rgba(0,0,0,.55)", border:"none", borderRadius:6, padding:"4px 8px", color:"white", fontSize:11, fontWeight:600, cursor:"pointer" }}>
                      ✕ Supprimer
                    </button>
                  )}
                  {isAdmin && (
                    <label style={{ position:"absolute", bottom:8, right:8, background:C.accent, border:"none", borderRadius:6, padding:"5px 10px", color:"white", fontSize:11, fontWeight:700, cursor:"pointer" }}>
                      ✏ Changer
                      <input type="file" accept="image/*" style={{ display:"none" }} onChange={async e=>{
                        const file = e.target.files?.[0]; if(!file||!studioId) return;
                        if(file.size > 5*1024*1024) { showStudioToast("Image trop lourde (max 5 Mo)", false); return; }
                        setUploadingPhoto(true);
                        try {
                          const sb = createClient();
                          const ext = file.name.split(".").pop();
                          const path = `studios/${studioId}/cover.${ext}`;
                          const { error } = await sb.storage.from("studio-assets").upload(path, file, { upsert:true, contentType:file.type });
                          if(error) throw error;
                          const { data:{ publicUrl } } = sb.storage.from("studio-assets").getPublicUrl(path);
                          setStudioForm(f=>({...f, cover_photo_url: publicUrl+"?t="+Date.now()}));
                          showStudioToast("Photo mise à jour !");
                        } catch(err) { showStudioToast("Erreur upload : "+err.message, false); }
                        setUploadingPhoto(false);
                      }}/>
                    </label>
                  )}
                  {uploadingPhoto && (
                    <div style={{ position:"absolute", inset:0, background:"rgba(255,255,255,.7)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:600, color:C.accent }}>
                      Envoi en cours…
                    </div>
                  )}
                </div>
              ) : (
                <label style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8, padding:"28px 16px", border:`2px dashed ${C.border}`, borderRadius:10, cursor:isAdmin?"pointer":"default", background:C.bg, transition:"border-color .15s" }}
                  onMouseEnter={e=>{ if(isAdmin) e.currentTarget.style.borderColor=C.accent; }}
                  onMouseLeave={e=>{ e.currentTarget.style.borderColor=C.border; }}>
                  <span style={{ fontSize:28 }}>🖼</span>
                  <span style={{ fontSize:13, fontWeight:600, color:C.textMid }}>
                    {uploadingPhoto ? "Envoi en cours…" : "Cliquer pour ajouter une photo"}
                  </span>
                  <span style={{ fontSize:11, color:C.textMuted }}>JPG, PNG, WEBP — max 5 Mo</span>
                  <input type="file" accept="image/*" disabled={!isAdmin} style={{ display:"none" }} onChange={async e=>{
                    const file = e.target.files?.[0]; if(!file||!studioId) return;
                    if(file.size > 5*1024*1024) { showStudioToast("Image trop lourde (max 5 Mo)", false); return; }
                    setUploadingPhoto(true);
                    try {
                      const sb = createClient();
                      const ext = file.name.split(".").pop();
                      const path = `studios/${studioId}/cover.${ext}`;
                      const { error } = await sb.storage.from("studio-assets").upload(path, file, { upsert:true, contentType:file.type });
                      if(error) throw error;
                      const { data:{ publicUrl } } = sb.storage.from("studio-assets").getPublicUrl(path);
                      setStudioForm(f=>({...f, cover_photo_url: publicUrl+"?t="+Date.now()}));
                      showStudioToast("Photo ajoutée !");
                    } catch(err) { showStudioToast("Erreur upload : "+err.message, false); }
                    setUploadingPhoto(false);
                  }}/>
                </label>
              )}
            </div>

            {/* Couleur accentuation — palette pastel limitée */}
            <div>
              <FieldLabel>Couleur principale</FieldLabel>
              <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginTop:4 }}>
                {[
                  { hex:"#B07848", label:"Terracotta" },
                  { hex:"#8A7CC8", label:"Lavande"   },
                  { hex:"#7C9E8A", label:"Sauge"     },
                  { hex:"#C87C7C", label:"Rose poudré"},
                  { hex:"#7CB8C8", label:"Ciel"      },
                  { hex:"#B07CA0", label:"Mauve"     },
                  { hex:"#7C9EC8", label:"Bleu doux" },
                  { hex:"#C8B47C", label:"Sable"     },
                ].map(({ hex, label }) => {
                  const selected = (studioForm.accent_color || "#B07848").toLowerCase() === hex.toLowerCase();
                  return (
                    <button key={hex} disabled={!isAdmin}
                      onClick={() => setStudioForm(f => ({ ...f, accent_color: hex }))}
                      title={label}
                      style={{ width:36, height:36, borderRadius:"50%", background:hex, border:selected?`3px solid #2A1F14`:`3px solid transparent`, cursor:isAdmin?"pointer":"default", flexShrink:0, outline:selected?`2px solid ${hex}`:"none", outlineOffset:2 }}/>
                  );
                })}
              </div>
              <div style={{ fontSize:11, color:C.textMuted, marginTop:8, display:"flex", alignItems:"center", gap:6 }}>
                <div style={{ width:14, height:14, borderRadius:"50%", background:studioForm.accent_color||"#B07848", border:`1.5px solid ${C.border}`, flexShrink:0 }}/>
                Couleur sélectionnée : <strong>{studioForm.accent_color || "#B07848"}</strong>
              </div>
            </div>
          </div>
          {isAdmin && (
            <div style={{ padding:"0 18px 16px" }}>
              <Button sm variant="primary" onClick={saveStudio}>{studioSaving?"Enregistrement…":"Enregistrer"}</Button>
            </div>
          )}
        </Card>

        {/* Aperçu site vitrine */}
        {(studioForm.cover_photo_url || studioForm.description) && <VitrinPreview
          name={studioForm.name}
          city={studioForm.city}
          description={studioForm.description}
          cover={studioForm.cover_photo_url}
          accent={studioForm.accent_color || "#B07848"}
          slug={studioForm.slug}
        />}

        <Card noPad>
          <SectionHead>Votre forfait</SectionHead>
          <div style={{ padding:"16px 18px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div>
              <div style={{ fontSize:16, fontWeight:800, color:C.text }}>{planName || "Essentiel"}</div>
              <div style={{ fontSize:12, color:C.textMuted, marginTop:2 }}>{membersCount} adhérent{membersCount>1?"s":""} actif{membersCount>1?"s":""}</div>
            </div>
            <Button sm variant="ghost" onClick={()=>window.location.href="/billing"}>Changer de forfait</Button>
          </div>
        </Card>
      </div>
    );
  };

  // ── Tab: Users ────────────────────────────────────────────────────────────
  const TabUsers = () => {
    const handleImpersonate = (role, userId, name) => onImpersonate && onImpersonate(role, userId, name);
    const realUsers = teamData.coaches;
    const loadingUsers = !teamData.loaded;
    const [confirmAction, setConfirmAction] = React.useState(null);

    const handleSuspend = async (userId) => {
      const res = await fetch("/api/team/suspend", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ userId, studioId })
      });
      if (res.ok) { showToast("Utilisateur suspendu"); await loadTeam(); }
      else showToast("Erreur lors de la suspension", false);
      setConfirmAction(null);
    };

    const handleDelete = async (userId) => {
      const res = await fetch("/api/team/suspend", {
        method:"DELETE", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ userId, studioId })
      });
      if (res.ok) { showToast("Utilisateur supprimé", false); await loadTeam(); }
      else showToast("Erreur lors de la suppression", false);
      setConfirmAction(null);
    };

    const roleLabel = { admin:"Admin", coach:"Coach", adherent:"Adhérent", superadmin:"Super Admin" };
    const roleColor = { admin:C.accent, coach:"#7C3AED", adherent:"#3A6E46", superadmin:"#C43A3A" };

    if (loadingUsers) return <div style={{padding:32,textAlign:"center",color:C.textMuted}}>Chargement…</div>;

    return (
      <div>
        <Card noPad>
          {realUsers.length === 0 && (
            <div style={{padding:32,textAlign:"center",color:C.textMuted}}>Aucun utilisateur trouvé</div>
          )}
          {realUsers.map(u => (
            <div key={u.id} style={{ padding:"12px 16px", borderBottom:`1px solid ${C.borderSoft}` }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:34, height:34, borderRadius:"50%", background:C.accentBg, border:`1px solid #DFC0A0`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:C.accent, flexShrink:0 }}>
                  {(u.fn[0]||"?")}{ (u.ln[0]||"")}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:C.text }}>{u.fn} {u.ln}</div>
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:3, flexWrap:"wrap" }}>
                    <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:6, background:`${roleColor[u.role]||C.accent}18`, color:roleColor[u.role]||C.accent }}>
                      {roleLabel[u.role]||u.role}
                    </span>
                    {u.confirmed === false && (
                      <span style={{ fontSize:11, fontWeight:600, padding:"2px 8px", borderRadius:6, background:"#FFF3CD", color:"#856404" }}>
                        ⏳ En attente de confirmation
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap", justifyContent:"flex-end" }}>
                  {/* Se connecter en tant que */}
                  {isAdmin && (u.role === "coach" || u.role === "adherent") && (
                    <button onClick={()=>handleImpersonate(u.role, u.id, `${u.fn||''} ${u.ln||''}`.trim())}
                      style={{ fontSize:11, padding:"4px 10px", borderRadius:6, border:`1.5px solid ${C.accent}`, background:C.accentLight, color:C.accentDark, cursor:"pointer", fontWeight:600, display:"flex", alignItems:"center", gap:4 }}>
                      👁 Vue {u.role === "coach" ? "coach" : "membre"}
                    </button>
                  )}
                  {isAdmin && u.role !== "admin" && (
                    confirmAction?.id === u.id ? (
                      <>
                        <button onClick={()=> confirmAction.action==="delete" ? handleDelete(u.id) : handleSuspend(u.id)}
                          style={{ fontSize:11, padding:"4px 10px", borderRadius:6, border:"1px solid #EFC8BC", background:C.warnBg, color:C.warn, cursor:"pointer", fontWeight:700 }}>
                          Confirmer
                        </button>
                        <button onClick={()=>setConfirmAction(null)}
                          style={{ fontSize:11, padding:"4px 10px", borderRadius:6, border:`1px solid ${C.border}`, background:C.bg, color:C.textMuted, cursor:"pointer" }}>
                          Annuler
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={()=>setConfirmAction({id:u.id,action:"suspend"})}
                          style={{ fontSize:11, padding:"4px 10px", borderRadius:6, border:`1px solid ${C.border}`, background:C.bg, color:C.textMid, cursor:"pointer", fontWeight:600 }}>
                          Suspendre
                        </button>
                        <button onClick={()=>setConfirmAction({id:u.id,action:"delete"})}
                          style={{ fontSize:11, padding:"4px 10px", borderRadius:6, border:`1px solid #EFC8BC`, background:"transparent", color:C.warn, cursor:"pointer" }}>
                          Supprimer
                        </button>
                      </>
                    )
                  )}
                </div>
              </div>
            </div>
          ))}
        </Card>
      </div>
    );
  };

  // ── Tab: Roles ────────────────────────────────────────────────────────────
  const TabRoles = () => (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      {Object.entries(ROLES_DEF).filter(([key])=> isSA || key !== "superadmin").map(([key, r])=>(
        <Card key={key} style={{ borderLeft:`3px solid ${r.color}` }}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, marginBottom:10 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:36, height:36, borderRadius:9, background:r.bg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                {key==="superadmin"&&<IcoLayers2 s={18} c={r.color}/>}{key==="admin"&&<IcoSettings2 s={18} c={r.color}/>}
                {key==="staff"&&<IcoCalendar2 s={18} c={r.color}/>}{key==="adherent"&&<IcoUsers2 s={18} c={r.color}/>}
              </div>
              <div>
                <div style={{ fontSize:15, fontWeight:700, color:C.text }}>{r.label}</div>
                <div style={{ fontSize:12, color:C.textSoft, marginTop:2 }}>{r.desc}</div>
              </div>
            </div>
            <span style={{ fontSize:12, fontWeight:700, color:r.color, background:r.bg, padding:"3px 10px", borderRadius:10, flexShrink:0 }}>
              {users.filter(u=>u.role===key).length} utilisateur{users.filter(u=>u.role===key).length>1?"s":""}
            </span>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr", gap:6 }}>
            {(isSA
              ? [["Planning",["superadmin","admin","staff"]],["Membres",["superadmin","admin","staff"]],["Paiements",["superadmin","admin"]],["Paramètres",["superadmin","admin"]],["Tous les tenants",["superadmin"]],["Config plateforme",["superadmin"]]]
              : [["Planning",["admin","staff","adherent"]],["Membres",["admin","staff"]],["Paiements",["admin"]],["Paramètres",["admin"]],["Disciplines",["admin"]],["Équipe",["admin"]]]
            ).map(([perm,roles])=>{
              const has = roles.includes(key);
              return (
                <div key={perm} style={{ display:"flex", alignItems:"center", gap:7, padding:"5px 8px", borderRadius:7, background:has?r.bg+"80":C.bg }}>
                  <div style={{ width:16, height:16, borderRadius:"50%", background:has?r.color:"#D0C8C0", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{has?<IcoCheck s={9} c="white"/>:<IcoX s={9} c="white"/>}</div>
                  <span style={{ fontSize:12, color:has?r.color:C.textMuted, fontWeight:has?600:400 }}>{perm}</span>
                </div>
              );
            })}
          </div>
        </Card>
      ))}
    </div>
  );

  // ── Tab: Mon compte ───────────────────────────────────────────────────────
  const [accountForm, setAccountForm] = useState({ firstName:"", lastName:"", email:"", phone:"" });
  const [accountSaving, setAccountSaving] = useState(false);
  const [accountToast, setAccountToast] = useState(null);
  const showAccountToast = (msg, ok=true) => { setAccountToast({msg,ok}); setTimeout(()=>setAccountToast(null),3000); };

  useEffect(() => {
    createClient().auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: prof } = await createClient().from("profiles")
        .select("first_name, last_name, phone").eq("id", user.id).single();
      setAccountForm({
        firstName: prof?.first_name || "",
        lastName:  prof?.last_name  || "",
        email:     user.email || "",
        phone:     prof?.phone || "",
      });
    });
  }, []);

  const saveAccount = async () => {
    setAccountSaving(true);
    try {
      const { data: { user } } = await createClient().auth.getUser();
      if (!user) { showAccountToast("Non connecté", false); return; }
      const { error } = await createClient().from("profiles").update({
        first_name: accountForm.firstName,
        last_name:  accountForm.lastName,
        phone:      accountForm.phone,
      }).eq("id", user.id);
      if (error) showAccountToast("Erreur : " + error.message, false);
      else showAccountToast("Profil enregistré !");
    } catch(e) { showAccountToast("Erreur", false); }
    finally { setAccountSaving(false); }
  };

  const TabAccount = () => (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      {accountToast && (
        <div style={{ position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)", zIndex:9999,
          background:accountToast.ok?"#2A1F14":"#7F1D1D", color:"#fff", borderRadius:12, padding:"11px 22px",
          fontSize:13, fontWeight:600, boxShadow:"0 4px 20px rgba(0,0,0,.25)", whiteSpace:"nowrap" }}>
          {accountToast.ok?"✓":"✕"} {accountToast.msg}
        </div>
      )}
      <Card>
        <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:18 }}>
          <div style={{ width:56, height:56, borderRadius:14, background:C.accentBg, border:`2px solid #DFC0A0`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:800, color:C.accent }}>
            {(accountForm.firstName?.[0]||"")+(accountForm.lastName?.[0]||"")||"?"}
          </div>
          <div>
            <div style={{ fontSize:17, fontWeight:800, color:C.text }}>{[accountForm.firstName, accountForm.lastName].filter(Boolean).join(" ")||"Utilisateur"}</div>
            <div style={{ fontSize:13, color:C.textSoft, marginTop:2 }}>{accountForm.email}</div>
            <div style={{ marginTop:5 }}><RoleBadge role={currentRole}/></div>
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr", gap:12 }}>
          {[
            ["Prénom",    accountForm.firstName, v => setAccountForm(f=>({...f, firstName:v}))],
            ["Nom",       accountForm.lastName,  v => setAccountForm(f=>({...f, lastName:v}))],
            ["Email",     accountForm.email,     null],
            ["Téléphone", accountForm.phone,     v => setAccountForm(f=>({...f, phone:v}))],
          ].map(([lbl, val, onChange]) => (
            <div key={lbl}><FieldLabel>{lbl}</FieldLabel>
              <input
                value={val}
                readOnly={!onChange}
                onChange={onChange ? e=>onChange(e.target.value) : undefined}
                style={{ width:"100%", padding:"9px 12px", border:`1.5px solid ${C.border}`, borderRadius:8,
                  fontSize:14, outline:"none", boxSizing:"border-box", color:C.text,
                  background: onChange ? C.surfaceWarm : "#F0EBE4",
                  cursor: onChange ? "text" : "default" }}
                onFocus={e=>{ if(onChange) e.target.style.borderColor=C.accent; }}
                onBlur={e=>e.target.style.borderColor=C.border}
              />
            </div>
          ))}
        </div>
        <div style={{ marginTop:14 }}>
          <Button sm variant="primary" onClick={saveAccount} disabled={accountSaving}>
            {accountSaving ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </Card>
      {/* ── Facturation ── */}
      <Card noPad>
        <SectionHead>Formule Fydelys</SectionHead>
        <div style={{ padding:"16px 18px" }}>
          {/* Plan actuel */}
          {(() => {
            const currentPlan = FYDELYS_PLANS.find(p=>p.name===planName) || FYDELYS_PLANS[0];
            return (
              <div style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 16px", background:C.accentLight, borderRadius:10, marginBottom:20, border:`1.5px solid ${currentPlan.color}40` }}>
                <div style={{ width:44, height:44, borderRadius:11, background:currentPlan.color, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <span style={{ fontSize:20 }}>⭐</span>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:15, fontWeight:800, color:C.text }}>Plan <span style={{ color:currentPlan.color }}>{currentPlan.name}</span></div>
                  <div style={{ fontSize:12, color:C.textSoft, marginTop:2 }}>{currentPlan.price} €/mois · {currentPlan.limits.members ? `${currentPlan.limits.members} adhérents max` : "Adhérents illimités"}</div>
                </div>
                <div style={{ fontSize:11, fontWeight:700, padding:"3px 9px", borderRadius:6, background:"#EAF5EC", color:"#3A6E46", flexShrink:0 }}>Actif</div>
              </div>
            );
          })()}

          {/* Cards 3 plans */}
          <div style={{ fontSize:12, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:.8, marginBottom:12 }}>Changer de formule</div>
          <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)", gap:12, marginBottom:16 }}>
            {FYDELYS_PLANS.map(plan => {
              const isCurrent = plan.name === planName;
              return (
                <div key={plan.id} style={{ borderRadius:12, border:`2px solid ${isCurrent?plan.color:C.border}`, background:isCurrent?`${plan.color}08`:C.surface, padding:"16px", position:"relative", transition:"border-color .15s" }}>
                  {plan.popular && !isCurrent && (
                    <div style={{ position:"absolute", top:-1, right:12, background:plan.color, color:"#fff", fontSize:9, fontWeight:800, padding:"2px 8px", borderRadius:"0 0 7px 7px", textTransform:"uppercase" }}>Populaire</div>
                  )}
                  {isCurrent && (
                    <div style={{ position:"absolute", top:-1, right:12, background:"#3A6E46", color:"#fff", fontSize:9, fontWeight:800, padding:"2px 8px", borderRadius:"0 0 7px 7px", textTransform:"uppercase" }}>✓ Actuel</div>
                  )}
                  <div style={{ fontSize:15, fontWeight:800, color:plan.color, marginBottom:2 }}>{plan.name}</div>
                  <div style={{ fontSize:10, color:C.textSoft, marginBottom:10 }}>{plan.desc}</div>
                  <div style={{ fontSize:24, fontWeight:800, color:C.text, lineHeight:1, marginBottom:12 }}>
                    {plan.price} €<span style={{ fontSize:12, fontWeight:400, color:C.textSoft }}>/mois</span>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:5, marginBottom:14 }}>
                    {plan.features.map((f,i) => (
                      <div key={i} style={{ display:"flex", alignItems:"center", gap:7 }}>
                        <span style={{ fontSize:11, flexShrink:0, color:f.ok?"#3A6E46":"#C8B8A8" }}>{f.ok?"✓":"✕"}</span>
                        <span style={{ fontSize:12, color:f.ok?C.text:C.textSoft, textDecoration:f.ok?"none":"none" }}>{f.label}</span>
                      </div>
                    ))}
                  </div>
                  {!isCurrent && (
                    <button onClick={()=>showToast(`Passage au plan ${plan.name} — bientôt disponible`)}
                      style={{ width:"100%", padding:"8px 12px", borderRadius:8, border:`1.5px solid ${plan.color}`, background:"transparent", color:plan.color, fontSize:12, fontWeight:700, cursor:"pointer" }}>
                      Choisir {plan.name} →
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ fontSize:11, color:C.textSoft, textAlign:"center" }}>
            15 jours d'essai gratuit inclus · Sans engagement · Résiliable à tout moment
          </div>
        </div>
      </Card>

      <Card noPad>
        <SectionHead>Sécurité</SectionHead>
        <div style={{ padding:"14px 18px", display:"flex", flexDirection:"column", gap:10 }}>
          {[
            ["Changer le mot de passe", ()=>setModal({type:"password"}),   "Modifier"],
            ["Authentification 2 facteurs", ()=>setModal({type:"2fa"}),    "Configurer"],
            ["Sessions actives",         ()=>setModal({type:"sessions"}),  "3 appareils"],
          ].map(([lbl, action, label])=>(
            <div key={lbl} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", borderRadius:8, background:C.bg }}>
              <span style={{ fontSize:14, color:C.text, fontWeight:500 }}>{lbl}</span>
              <button onClick={action} style={{ fontSize:12, padding:"4px 12px", borderRadius:7, border:`1px solid ${C.border}`, background:C.surface, color:C.accent, cursor:"pointer", fontWeight:600 }}>{label}</button>
            </div>
          ))}
        </div>
      </Card>
      <Card style={{ background:C.warnBg, border:`1px solid #EFC8BC` }}>
        <div style={{ fontSize:14, fontWeight:700, color:C.warn, marginBottom:6 }}>Zone de danger</div>
        <div style={{ fontSize:12, color:C.textMid, marginBottom:12 }}>La suppression de votre compte est irréversible.</div>
        <Button sm variant="danger" onClick={()=>setModal({type:"deleteAccount"})}>Supprimer mon compte</Button>
      </Card>
    </div>
  );

  // ── Tab: Équipe — coachs et leurs disciplines ─────────────────────────────
  const COACHES_INIT = [];

  const TabTeam = () => {
    const [coaches, setCoaches]         = useState([]);
    const [pendingInvites, setPendingInvites] = useState([]);
    const [editCoach, setEditCoach]     = useState(null);

    // Utiliser les données partagées depuis Settings
    useEffect(() => {
      // Équipe = coachs uniquement (role coach ou is_coach=true), pas les admins purs
      setCoaches((teamData.coaches || []).filter(c => c.role === "coach" || c.is_coach === true));
      setPendingInvites(teamData.invites || []);
    }, [teamData]);

    // ── Sauvegarder disciplines → coach_disciplines ───────────────────────────
    const saveDisciplines = async (coachId, discIds) => {
      setCoaches(prev => prev.map(c => c.id===coachId ? {...c, disciplines:discIds} : c));
      setEditCoach(null);
      try {
        const res = await fetch("/api/team", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ coachId, discIds, studioId }),
        });
        if (!res.ok) throw new Error("Erreur API");
        showToast("Disciplines mises à jour ✓");
        await loadTeam();
      } catch(e) {
        console.error("saveDisciplines", e);
        showToast("Erreur lors de la sauvegarde");
      }
    };

    // Modal affectation disciplines
    const DiscModal = ({ coach }) => {
      const [selected, setSelected] = useState([...coach.disciplines]);
      const toggle = (id) => setSelected(prev =>
        prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id]
      );
      return (
        <div onClick={e=>e.target===e.currentTarget&&setEditCoach(null)}
          style={{position:"fixed",inset:0,background:"rgba(42,31,20,.45)",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
          <div style={{background:C.surface,borderRadius:16,padding:24,width:"100%",maxWidth:460,boxShadow:"0 24px 60px rgba(0,0,0,.18)"}}>
            {/* Header */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
              <div>
                <div style={{fontSize:16,fontWeight:800,color:C.text}}>Disciplines de {coach.fn} {coach.ln}</div>
                <div style={{fontSize:12,color:C.textMuted,marginTop:2}}>Sélectionnez les disciplines que ce coach enseigne</div>
              </div>
              <button onClick={()=>setEditCoach(null)} style={{background:"none",border:`1.5px solid ${C.border}`,borderRadius:8,padding:"4px 8px",cursor:"pointer"}}>
                <IcoX s={14} c={C.textSoft}/>
              </button>
            </div>
            {/* Grid disciplines */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:20}}>
              {(discs && discs.length ? discs : DISCIPLINES).map(d => {
                const on = selected.includes(d.id);
                return (
                  <div key={d.id} onClick={()=>toggle(d.id)}
                    style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",borderRadius:12,border:`2px solid ${on?d.color:C.border}`,background:on?`${d.color}14`:C.surface,cursor:"pointer",userSelect:"none",transition:"all .15s"}}>
                    <div style={{width:32,height:32,borderRadius:8,background:on?d.color:C.bgDeep,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0,transition:"all .15s"}}>
                      {d.icon}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:700,color:on?d.color:C.text}}>{d.name}</div>
                    </div>
                    <div style={{width:18,height:18,borderRadius:"50%",border:`2px solid ${on?d.color:C.border}`,background:on?d.color:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      {on && <span style={{color:"#fff",fontSize:10,fontWeight:800}}>✓</span>}
                    </div>
                  </div>
                );
              })}
            </div>
            {selected.length===0 && (
              <div style={{padding:"8px 14px",background:C.warnBg,borderRadius:8,fontSize:12,color:C.warn,marginBottom:14}}>
                ⚠ Ce coach n'aura aucune discipline affectée
              </div>
            )}
            <div style={{display:"flex",gap:10}}>
              <Button variant="primary" onClick={()=>saveDisciplines(coach.id, selected)}>
                Enregistrer ({selected.length} discipline{selected.length!==1?"s":""})
              </Button>
              <Button variant="ghost" onClick={()=>setEditCoach(null)}>Annuler</Button>
            </div>
          </div>
        </div>
      );
    };

    // InviteCoachModal est rendu depuis Settings (parent) pour éviter la perte de focus

    return (
      <div>
        {editCoach && <DiscModal coach={editCoach}/>}
        {inviteModal && <InviteCoachModal
        C={C}
        studioSlug={studioSlug}
        onClose={()=>setInviteModal(false)}
        onSubmit={async (emailSent, fn, ln)=>{
          if(!emailSent||!fn) return;
          setInviteModal(false);
          try {
            const res = await fetch("/api/invite-coach", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: emailSent,
                firstName: fn,
                lastName: ln,
                studioId,
              }),
            });
            if (!res.ok) {
              const err = await res.json().catch(()=>({}));
              showToast(`Erreur : ${err.error||"envoi échoué"}`);
              return;
            }
            showToast(`Invitation envoyée à ${emailSent} ✓`);
            await loadTeam();
          } catch(e) {
            console.error("invite error", e);
            showToast("Erreur réseau lors de l'invitation");
          }
        }}
      />}

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:10}}>
          <div>
            <div style={{fontSize:18,fontWeight:800,color:C.text,letterSpacing:-0.3}}>Équipe & Coachs</div>
            <div style={{fontSize:13,color:C.textMuted,marginTop:2}}>{coaches.length} intervenant{coaches.length!==1?"s":""} · Gérez les disciplines par coach</div>
          </div>
          <Button sm variant="primary" onClick={()=>setInviteModal(true)}>
            + Inviter un coach
          </Button>
        </div>

        {/* Invitations en attente */}
        {pendingInvites.length > 0 && (
          <div style={{marginBottom:16}}>
            <div style={{fontSize:12,fontWeight:700,color:C.textMuted,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>⏳ Invitations en attente</div>
            {pendingInvites.map(inv => (
              <div key={inv.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:C.accentLight,borderRadius:10,border:`1px solid ${C.accentBorder||C.border}`,padding:"10px 14px",marginBottom:6}}>
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:C.accentDark}}>{inv.email}</div>
                  <div style={{fontSize:11,color:C.textMuted,marginTop:1}}>Invitation envoyée · En attente de connexion</div>
                </div>
                <span style={{fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:8,background:"#FFF3CD",color:"#856404"}}>⏳ En attente</span>
              </div>
            ))}
          </div>
        )}

        {/* Liste des coachs */}
        {coaches.map(coach => {
          const allDiscs = (discs && discs.length) ? discs : DISCIPLINES;
          const assignedDiscs = allDiscs.filter(d => coach.disciplines.includes(d.id));
          const initials = (coach.fn[0]||"")+(coach.ln[0]||"");
          return (
            <div key={coach.id} style={{background:C.surface,borderRadius:14,border:`1px solid ${C.border}`,padding:"16px 18px",marginBottom:10}}>
              <div style={{display:"flex",alignItems:"flex-start",gap:14,flexWrap:isMobile?"wrap":"nowrap"}}>
                {/* Avatar */}
                <div style={{width:44,height:44,borderRadius:"50%",background:`linear-gradient(135deg,${C.accent},${C.accentDark})`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:15,fontWeight:800,flexShrink:0}}>
                  {initials}
                </div>
                {/* Infos */}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                    <div style={{fontSize:15,fontWeight:700,color:C.text}}>{coach.fn} {coach.ln}</div>
                    <span style={{fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:8,background:coach.status==="invité"?C.infoBg:C.okBg,color:coach.status==="invité"?C.info:C.ok}}>
                      {coach.status==="invité"?"⏳ Invitation envoyée":"✓ Actif"}
                    </span>
                  </div>
                  <div style={{fontSize:12,color:C.textMuted,marginTop:2}}>{coach.email}</div>
                  {/* Disciplines assignées */}
                  <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:10}}>
                    {assignedDiscs.length===0 ? (
                      <span style={{fontSize:12,color:C.textMuted,fontStyle:"italic"}}>Aucune discipline affectée</span>
                    ) : assignedDiscs.map(d=>(
                      <span key={d.id} style={{display:"inline-flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:20,background:`${d.color}18`,border:`1px solid ${d.color}40`,fontSize:12,fontWeight:600,color:d.color}}>
                        {d.icon} {d.name}
                      </span>
                    ))}
                  </div>
                </div>
                {/* Action */}
                <button onClick={()=>setEditCoach(coach)}
                  style={{flexShrink:0,padding:"7px 14px",borderRadius:9,border:`1.5px solid ${C.border}`,background:C.surface,color:C.accent,fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
                  ✏ Disciplines
                </button>
              </div>
            </div>
          );
        })}

        {coaches.length===0 && (
          <div style={{textAlign:"center",padding:"48px 16px",color:C.textMuted}}>
            <div style={{marginBottom:12,display:"flex",justifyContent:"center"}}><IcoUsers2 s={36} c={C.textMuted}/></div>
            <div style={{fontSize:15,fontWeight:600,color:C.textSoft}}>Aucun coach dans l'équipe</div>
          </div>
        )}
      </div>
    );
  };

  // ── Tab Salles ────────────────────────────────────────────────────────────

  // ── Tab: Paiements (Stripe Connect) ──────────────────────────────────────
  const TabPayments = () => {
    const [connectStatus, setConnectStatus] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [connecting, setConnecting] = React.useState(false);
    const [commission] = React.useState(2);
    // Config SA : mode paiement du studio
    const [paymentMode, setPaymentMode] = React.useState(null); // null=loading, "connect"|"direct"
    const [directKeys, setDirectKeys] = React.useState({ pk:"", sk:"" });
    const [savingKeys, setSavingKeys] = React.useState(false);
    const [savingMode, setSavingMode] = React.useState(false);

    React.useEffect(() => {
      if (!studioId) return;
      fetch(`/api/connect/status?studioId=${studioId}`)
        .then(r => r.json())
        .then(d => { setConnectStatus(d); setLoading(false); })
        .catch(() => setLoading(false));

      // Charger le mode paiement configuré par le SA
      createClient().from("studios")
        .select("payment_mode, stripe_pk")
        .eq("id", studioId).single()
        .then(({ data }) => {
          setPaymentMode(data?.payment_mode || "connect");
          setDirectKeys({ pk: data?.stripe_pk || "", sk: "" }); // sk jamais retourné (sécurité)
        })
        .catch(() => setPaymentMode("connect"));

      // Si retour depuis onboarding Stripe
      const params = new URLSearchParams(window.location.search);
      if (params.get("connect") === "success") {
        // Re-fetch status après quelques secondes
        setTimeout(() => {
          fetch(`/api/connect/status?studioId=${studioId}`)
            .then(r => r.json()).then(setConnectStatus);
        }, 2000);
      }
    }, [studioId]);

    const [disconnecting, setDisconnecting] = React.useState(false);
    const [confirmDisconnect, setConfirmDisconnect] = React.useState(false);

    const handleConnect = async () => {
      setConnecting(true);
      try {
        const res = await fetch("/api/connect/onboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studioId }),
        });
        const { url } = await res.json();
        if (url) window.location.href = url;
      } catch(e) { showToast("Erreur de connexion Stripe", false); }
      setConnecting(false);
    };

    const handleDisconnect = async () => {
      setDisconnecting(true);
      try {
        const res = await fetch("/api/connect/disconnect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studioId }),
        });
        if (res.ok) {
          setConnectStatus({ status: "not_connected" });
          setConfirmDisconnect(false);
          showToast("Compte Stripe déconnecté");
        }
      } catch(e) { showToast("Erreur lors de la déconnexion", false); }
      setDisconnecting(false);
    };

    const statusBadge = {
      not_connected: { label:"Non connecté",  color:"#8C7B6C",  bg:"#F0E8DF" },
      pending:       { label:"En attente",     color:"#92400E",  bg:"#FEF3C7" },
      active:        { label:"Actif ✓",        color:C.ok,       bg:C.okBg    },
      restricted:    { label:"Restreint ⚠",   color:C.warn,     bg:C.warnBg  },
    };

    const st = connectStatus?.status || "not_connected";
    const badge = statusBadge[st] || statusBadge.not_connected;
    const isActive = st === "active";

    const savePaymentMode = async (mode) => {
      setSavingMode(true);
      await createClient().from("studios").update({
        payment_mode: mode,
        stripe_connect_enabled: mode === "connect",
        ...(mode === "direct" ? { stripe_pk: directKeys.pk } : {}),
      }).eq("id", studioId);
      setPaymentMode(mode);
      showToast("Mode paiement mis à jour");
      setSavingMode(false);
    };

    return (
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

        {/* Bloc SA — choix du mode paiement */}
        {isSA && paymentMode !== null && (
          <Card style={{ borderLeft:`3px solid #7C3AED` }}>
            <div style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:4 }}>⚙ Configuration Super Admin</div>
            <div style={{ fontSize:12, color:C.textSoft, marginBottom:14 }}>
              Choisissez le mode de paiement pour ce studio.
            </div>
            <div style={{ display:"flex", gap:10, marginBottom:14, flexWrap:"wrap" }}>
              {[
                { key:"none",    label:"🚫 Désactivé",      desc:"Pas de paiement en ligne — encaissement manuel" },
                { key:"connect", label:"⚡ Stripe Connect",  desc:"Compte Express du studio, commission Fydelys" },
                { key:"direct",  label:"🔑 Clés directes",   desc:"Le studio fournit ses propres clés Stripe" },
              ].map(m => (
                <div key={m.key} onClick={()=>setPaymentMode(m.key)}
                  style={{ flex:1, minWidth:140, padding:"12px", borderRadius:10, border:`2px solid ${paymentMode===m.key?"#7C3AED":C.border}`, background:paymentMode===m.key?"#F3EEFF":C.bg, cursor:"pointer" }}>
                  <div style={{ fontSize:13, fontWeight:700, color:paymentMode===m.key?"#7C3AED":C.text }}>{m.label}</div>
                  <div style={{ fontSize:11, color:C.textSoft, marginTop:3 }}>{m.desc}</div>
                </div>
              ))}
            </div>
            {paymentMode === "direct" && (
              <div style={{ marginBottom:12 }}>
                <FieldLabel>Clé publique Stripe (pk_live_… ou pk_test_…)</FieldLabel>
                <input value={directKeys.pk} onChange={e=>setDirectKeys(k=>({...k,pk:e.target.value}))}
                  placeholder="pk_live_…"
                  style={{ width:"100%", padding:"9px 12px", border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:13, outline:"none", boxSizing:"border-box", color:C.text, background:C.surfaceWarm, fontFamily:"monospace" }}/>
                <div style={{ fontSize:11, color:C.textMuted, marginTop:4 }}>
                  ⚠ La clé secrète reste côté serveur — à configurer dans les env vars du studio.
                </div>
              </div>
            )}
            <button onClick={()=>savePaymentMode(paymentMode)} disabled={savingMode}
              style={{ padding:"8px 18px", borderRadius:8, border:"none", background:"#7C3AED", color:"white", fontSize:13, fontWeight:700, cursor:"pointer", opacity:savingMode?.6:1 }}>
              {savingMode ? "Enregistrement…" : "Valider la configuration"}
            </button>
          </Card>
        )}

        {/* Bloc Connect Stripe — affiché seulement si mode=connect */}
        {paymentMode === "direct" && (
          <Card style={{ borderLeft:`3px solid ${C.ok}` }}>
            <div style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:4 }}>🔑 Clés Stripe directes</div>
            <div style={{ fontSize:12, color:C.textSoft, marginBottom:14 }}>
              Les paiements sont traités sur le compte Stripe du studio, sans commission Fydelys.
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <div>
                <FieldLabel>Clé publique (pk_live_… ou pk_test_…)</FieldLabel>
                <input value={directKeys.pk}
                  onChange={e=>setDirectKeys(k=>({...k,pk:e.target.value}))}
                  placeholder="pk_live_…"
                  style={{ width:"100%", padding:"9px 12px", border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:13, outline:"none", boxSizing:"border-box", color:C.text, background:C.surfaceWarm, fontFamily:"monospace" }}
                  onFocus={e=>e.target.style.borderColor=C.accent}
                  onBlur={e=>e.target.style.borderColor=C.border}/>
              </div>
              <div>
                <FieldLabel>Clé secrète (sk_live_… ou sk_test_…)</FieldLabel>
                <input type="password" value={directKeys.sk}
                  onChange={e=>setDirectKeys(k=>({...k,sk:e.target.value}))}
                  placeholder="sk_live_… (saisir pour modifier)"
                  style={{ width:"100%", padding:"9px 12px", border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:13, outline:"none", boxSizing:"border-box", color:C.text, background:C.surfaceWarm, fontFamily:"monospace" }}
                  onFocus={e=>e.target.style.borderColor=C.accent}
                  onBlur={e=>e.target.style.borderColor=C.border}/>
                <div style={{ fontSize:11, color:C.textMuted, marginTop:4 }}>
                  ⚠ La clé secrète est stockée chiffrée — elle ne sera jamais affichée en clair.
                </div>
              </div>
              <div style={{ display:"flex", gap:8, marginTop:4 }}>
                <Button sm variant="primary" onClick={async () => {
                  setSavingKeys(true);
                  try {
                    const res = await fetch("/api/sa/stripe-keys", {
                      method: "POST",
                      headers: {"Content-Type":"application/json"},
                      body: JSON.stringify({ studioId, pk: directKeys.pk, sk: directKeys.sk || null }),
                    });
                    if (res.ok) { showToast("Clés Stripe enregistrées"); setDirectKeys(k=>({...k, sk:""})); }
                    else showToast("Erreur lors de l'enregistrement", false);
                  } catch { showToast("Erreur réseau", false); }
                  setSavingKeys(false);
                }} disabled={savingKeys || !directKeys.pk}>
                  {savingKeys ? "Enregistrement…" : "💾 Enregistrer les clés"}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {(paymentMode === "connect" || !paymentMode) && (
        <>{/* Bloc Connect Stripe */}
        <Card style={{ borderLeft:`3px solid ${isActive ? C.ok : C.accent}` }}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, marginBottom:16 }}>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:C.text }}>Stripe Connect</div>
              <div style={{ fontSize:12, color:C.textSoft, marginTop:2 }}>
                Encaissez directement vos adhérents — abonnements, crédits, séances à l'unité.
              </div>
            </div>
            {!loading && (
              <span style={{ fontSize:12, fontWeight:700, padding:"3px 10px", borderRadius:10, flexShrink:0, color:badge.color, background:badge.bg }}>
                {badge.label}
              </span>
            )}
          </div>

          {loading && <div style={{ color:C.textMuted, fontSize:13 }}>Vérification…</div>}

          {!loading && !isActive && (
            <div>
              <div style={{ fontSize:13, color:C.textSoft, lineHeight:1.7, marginBottom:16, padding:"12px 14px", background:C.accentBg, borderRadius:10 }}>
                <strong>Comment ça marche :</strong><br/>
                1. Cliquez "Connecter Stripe" → formulaire Stripe Express (5 min)<br/>
                2. Une fois validé, vos adhérents paient directement sur votre compte<br/>
                3. Fydelys prélève une commission de <strong>{commission}%</strong> par transaction
              </div>
              <button onClick={handleConnect} disabled={connecting}
                style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 20px", borderRadius:10, border:"none", background:connecting?"#ccc":C.accent, color:"white", fontSize:14, fontWeight:700, cursor:connecting?"not-allowed":"pointer" }}>
                {connecting ? "Redirection…" : st === "pending" ? "↩ Reprendre l'onboarding" : "⚡ Connecter Stripe"}
              </button>
            </div>
          )}

          {!loading && isActive && (
            <div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:16 }}>
                {[
                  ["Paiements carte", connectStatus?.charges_enabled ? "✓ Activé" : "✗ Inactif", connectStatus?.charges_enabled ? C.ok : C.warn],
                  ["Virements", connectStatus?.payouts_enabled ? "✓ Activé" : "✗ Inactif", connectStatus?.payouts_enabled ? C.ok : C.warn],
                  ["Commission Fydelys", `${commission}% / transaction`, C.accent],
                ].map(([l,v,c]) => (
                  <div key={l} style={{ background:C.bg, borderRadius:8, padding:"10px 12px", border:`1px solid ${C.border}` }}>
                    <div style={{ fontSize:11, color:C.textMuted, fontWeight:600, marginBottom:3, textTransform:"uppercase" }}>{l}</div>
                    <div style={{ fontSize:13, fontWeight:700, color:c }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                <button onClick={handleConnect}
                  style={{ fontSize:12, padding:"7px 14px", borderRadius:8, border:`1.5px solid ${C.border}`, background:C.bg, color:C.textMid, cursor:"pointer", fontWeight:600 }}>
                  🔗 Tableau de bord Stripe →
                </button>
                {!confirmDisconnect
                  ? <button onClick={()=>setConfirmDisconnect(true)}
                      style={{ fontSize:12, padding:"7px 14px", borderRadius:8, border:`1px solid #EFC8BC`, background:C.warnBg, color:C.warn, cursor:"pointer", fontWeight:600 }}>
                      Déconnecter
                    </button>
                  : <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <span style={{ fontSize:12, color:C.warn, fontWeight:600 }}>Confirmer ?</span>
                      <button onClick={handleDisconnect} disabled={disconnecting}
                        style={{ fontSize:12, padding:"5px 12px", borderRadius:7, border:"none", background:C.warn, color:"white", cursor:"pointer", fontWeight:700 }}>
                        {disconnecting ? "…" : "Oui, déconnecter"}
                      </button>
                      <button onClick={()=>setConfirmDisconnect(false)}
                        style={{ fontSize:12, padding:"5px 10px", borderRadius:7, border:`1px solid ${C.border}`, background:C.bg, color:C.textMid, cursor:"pointer" }}>
                        Annuler
                      </button>
                    </div>
                }
              </div>
            </div>
          )}
        </Card>

        </> ) }

        {/* Abonnements vendables */}
        <Card>
          <div style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:4 }}>Abonnements</div>
          <div style={{ fontSize:12, color:C.textSoft, marginBottom:12 }}>Configurez le prix de vos abonnements dans l'onglet Studio → Abonnements.</div>
          <div style={{ fontSize:12, color:C.textMuted, fontStyle:"italic" }}>
            Les abonnements avec un prix &gt; 0 € seront proposés au paiement par carte aux adhérents.
          </div>
        </Card>


      </div>
    );
  };

  const TabRooms = () => {
    const sb = createClient();
    const COLORS = ["#C8906A","#7C9E8A","#8A7CC8","#C87C7C","#7CB8C8","#C8C07C","#B07CA0","#7C9EC8"];
    const emptyRoom = { name:"", capacity:10, location:"", address:"", maps_url:"", color:COLORS[0], notes:"" };
    const [rooms, setRooms]         = React.useState([]);
    const [loading, setLoading]     = React.useState(true);
    const [modal, setModal]         = React.useState(null); // null | "add" | room obj
    const [form, setForm]           = React.useState(emptyRoom);
    const [saving, setSaving]       = React.useState(false);
    const [confirmDel, setConfirmDel] = React.useState(null);

    React.useEffect(() => {
      if (!studioId) return;
      sb.from("rooms").select("*").eq("studio_id", studioId).order("name")
        .then(({ data }) => { setRooms(data || []); setLoading(false); });
    }, [studioId]);

    function openAdd() { setForm(emptyRoom); setModal("add"); }
    function openEdit(r) { setForm({ name:r.name, capacity:r.capacity, location:r.location||"", address:r.address||"", maps_url:r.maps_url||"", color:r.color||COLORS[0], notes:r.notes||"" }); setModal(r); }

    async function save() {
      if (!form.name.trim()) return;
      setSaving(true);
      if (modal === "add") {
        const { data } = await sb.from("rooms").insert({ ...form, studio_id: studioId }).select().single();
        if (data) setRooms(prev => [...prev, data].sort((a,b) => a.name.localeCompare(b.name)));
        showToast(`Salle "${form.name}" créée`);
      } else {
        const { data } = await sb.from("rooms").update(form).eq("id", modal.id).select().single();
        if (data) setRooms(prev => prev.map(r => r.id === data.id ? data : r));
        showToast(`Salle "${form.name}" mise à jour`);
      }
      setSaving(false); setModal(null);
    }

    async function deleteRoom(id) {
      await sb.from("rooms").delete().eq("id", id);
      setRooms(prev => prev.filter(r => r.id !== id));
      setConfirmDel(null);
      showToast("Salle supprimée", false);
    }

    const inp = { width:"100%", padding:"9px 12px", border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:14, outline:"none", boxSizing:"border-box", color:C.text, background:C.surfaceWarm };

    return (
      <div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:C.text }}>Salles</div>
            <div style={{ fontSize:13, color:C.textMuted, marginTop:2 }}>{rooms.length} salle{rooms.length!==1?"s":""} configurée{rooms.length!==1?"s":""}</div>
          </div>
          <button onClick={openAdd}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 16px", borderRadius:8, border:"none", background:C.accent, color:"white", fontSize:13, fontWeight:700, cursor:"pointer" }}>
            + Ajouter une salle
          </button>
        </div>

        {loading && <div style={{ color:C.textMuted, fontSize:13 }}>Chargement…</div>}

        {!loading && rooms.length === 0 && (
          <Card>
            <div style={{ textAlign:"center", padding:"32px 0", color:C.textMuted }}>
              <IcoDoor s={32} c={C.border}/>
              <div style={{ marginTop:12, fontSize:15, fontWeight:600, color:C.text }}>Aucune salle configurée</div>
              <div style={{ fontSize:13, marginTop:4 }}>Créez vos salles pour les assigner aux séances.</div>
              <button onClick={openAdd} style={{ marginTop:16, padding:"8px 20px", borderRadius:8, border:"none", background:C.accent, color:"white", fontSize:13, fontWeight:700, cursor:"pointer" }}>
                + Créer la première salle
              </button>
            </div>
          </Card>
        )}

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px,1fr))", gap:12 }}>
          {rooms.map(r => (
            <Card key={r.id} style={{ borderLeft:`4px solid ${r.color||C.accent}`, cursor:"default" }}>
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:8 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:38, height:38, borderRadius:10, background:`${r.color||C.accent}22`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <IcoDoor s={18} c={r.color||C.accent}/>
                  </div>
                  <div>
                    <div style={{ fontSize:15, fontWeight:700, color:C.text }}>{r.name}</div>
                    {r.location && <div style={{ fontSize:12, color:C.textMuted, marginTop:1 }}>📍 {r.location}</div>}
                    {r.address && <div style={{ fontSize:12, color:C.textMuted, marginTop:1 }}>{r.address}</div>}
                    {r.maps_url && (
                      <a href={r.maps_url} target="_blank" rel="noopener noreferrer"
                        onClick={e=>e.stopPropagation()}
                        style={{ fontSize:12, color:C.accent, fontWeight:600, marginTop:2, display:"inline-flex", alignItems:"center", gap:3, textDecoration:"none" }}>
                        🗺 Voir sur Google Maps
                      </a>
                    )}
                  </div>
                </div>
                <div style={{ display:"flex", gap:5, flexShrink:0 }}>
                  <button onClick={()=>openEdit(r)}
                    style={{ fontSize:11, padding:"4px 10px", borderRadius:6, border:`1px solid ${C.border}`, background:C.bg, color:C.textMid, cursor:"pointer", fontWeight:600 }}>
                    Modifier
                  </button>
                  {confirmDel === r.id ? (
                    <button onClick={()=>deleteRoom(r.id)}
                      style={{ fontSize:11, padding:"4px 10px", borderRadius:6, border:"1px solid #EFC8BC", background:C.warnBg, color:C.warn, cursor:"pointer", fontWeight:700 }}>
                      Confirmer
                    </button>
                  ) : (
                    <button onClick={()=>setConfirmDel(r.id)}
                      style={{ fontSize:11, padding:"4px 10px", borderRadius:6, border:`1px solid ${C.border}`, background:C.bg, color:C.textMuted, cursor:"pointer", fontWeight:600 }}>
                      ✕
                    </button>
                  )}
                </div>
              </div>
              <div style={{ display:"flex", gap:8, marginTop:12, flexWrap:"wrap" }}>
                <span style={{ fontSize:12, fontWeight:600, padding:"3px 10px", borderRadius:20, background:`${r.color||C.accent}18`, color:r.color||C.accent }}>
                  👥 {r.capacity} places
                </span>
                {r.notes && <span style={{ fontSize:12, color:C.textMuted, fontStyle:"italic" }}>{r.notes}</span>}
              </div>
            </Card>
          ))}
        </div>

        {/* Modal ajout/édition */}
        {modal !== null && (
          <div style={{ position:"fixed", inset:0, background:"rgba(42,31,20,.45)", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
            onClick={e=>{ if(e.target===e.currentTarget) setModal(null); }}>
            <div style={{ background:C.surface, borderRadius:16, padding:24, width:"100%", maxWidth:480, boxShadow:"0 24px 60px rgba(0,0,0,.18)" }}>
              <div style={{ fontSize:16, fontWeight:700, color:C.text, marginBottom:18 }}>
                {modal === "add" ? "Nouvelle salle" : `Modifier — ${modal.name}`}
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
                <div style={{ gridColumn:"1/-1" }}>
                  <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, marginBottom:4, textTransform:"uppercase", letterSpacing:.5 }}>Nom *</div>
                  <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Ex : Studio A" style={inp}
                    onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/>
                </div>
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, marginBottom:4, textTransform:"uppercase", letterSpacing:.5 }}>Capacité</div>
                  <input type="number" min={1} max={500} value={form.capacity} onChange={e=>setForm(f=>({...f,capacity:parseInt(e.target.value)||1}))} style={inp}
                    onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/>
                </div>
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, marginBottom:4, textTransform:"uppercase", letterSpacing:.5 }}>Localisation / Étage</div>
                  <input value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))} placeholder="Ex : 1er étage, Bâtiment B" style={inp}
                    onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/>
                </div>
                <div style={{ gridColumn:"1/-1" }}>
                  <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, marginBottom:4, textTransform:"uppercase", letterSpacing:.5 }}>Adresse complète</div>
                  <input value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))} placeholder="Ex : 12 rue de la Paix, 75001 Paris" style={inp}
                    onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/>
                </div>
                <div style={{ gridColumn:"1/-1" }}>
                  <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, marginBottom:4, textTransform:"uppercase", letterSpacing:.5 }}>Lien Google Maps</div>
                  <input value={form.maps_url} onChange={e=>setForm(f=>({...f,maps_url:e.target.value}))} placeholder="https://maps.google.com/…" style={inp}
                    onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/>
                  {form.maps_url && (
                    <a href={form.maps_url} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize:11, color:C.accent, marginTop:4, display:"inline-block", textDecoration:"none" }}>
                      🗺 Vérifier le lien →
                    </a>
                  )}
                </div>
                <div style={{ gridColumn:"1/-1" }}>
                  <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, marginBottom:4, textTransform:"uppercase", letterSpacing:.5 }}>Couleur</div>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    {COLORS.map(col => (
                      <button key={col} onClick={()=>setForm(f=>({...f,color:col}))}
                        style={{ width:28, height:28, borderRadius:"50%", background:col, border:form.color===col?`3px solid ${C.text}`:"3px solid transparent", cursor:"pointer", flexShrink:0 }}/>
                    ))}
                  </div>
                </div>
                <div style={{ gridColumn:"1/-1" }}>
                  <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, marginBottom:4, textTransform:"uppercase", letterSpacing:.5 }}>Notes</div>
                  <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Équipements, accès…" rows={2}
                    style={{ ...inp, resize:"vertical", fontFamily:"inherit" }}
                    onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/>
                </div>
              </div>

              <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
                <button onClick={()=>setModal(null)}
                  style={{ padding:"8px 16px", borderRadius:8, border:`1.5px solid ${C.border}`, background:C.bg, color:C.textMid, fontSize:13, fontWeight:600, cursor:"pointer" }}>
                  Annuler
                </button>
                <button onClick={save} disabled={saving || !form.name.trim()}
                  style={{ padding:"8px 20px", borderRadius:8, border:"none", background:form.name.trim()?C.accent:"#ccc", color:"white", fontSize:13, fontWeight:700, cursor:form.name.trim()?"pointer":"not-allowed" }}>
                  {saving ? "Enregistrement…" : modal==="add" ? "Créer la salle" : "Enregistrer"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const TAB_CONTENT = { superadmin:<TabSuperAdmin/>, studio:<TabStudio/>, team:<TabTeam/>, users:<TabUsers/>, roles:<TabRoles/>, rooms:<TabRooms/>, payments:<TabPayments/>, account:<TabAccount/> };

  return (
    <div style={{ padding:p, maxWidth:isSA?"none":720 }}>
      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", top:20, right:20, zIndex:600, display:"flex", alignItems:"center", gap:10, padding:"12px 18px", background:toast.ok!==false?C.ok:C.warn, borderRadius:10, color:"white", fontSize:14, fontWeight:600, boxShadow:"0 8px 24px rgba(0,0,0,.15)" }}>
          {toast.ok!==false ? <IcoCheck s={16} c="white"/> : <IcoAlert2 s={16} c="white"/>}{toast.msg}
        </div>
      )}
      {/* Modals */}
      {modal?.type==="newTenant"     && <NewTenantModal/>}
      {modal?.type==="inviteUser"    && <InviteUserModal/>}
      {modal?.type==="editUser"      && <EditUserModal/>}
      {modal?.type==="password"      && <PasswordModal/>}
      {modal?.type==="2fa"           && <TwoFAModal/>}
      {modal?.type==="sessions"      && <SessionsModal/>}
      {modal?.type==="deleteAccount" && <DeleteAccountModal/>}

      <RoleSwitcher/>
      <div style={{ display:"flex", gap:4, marginBottom:20, flexWrap:"wrap" }}>
        {tabs.map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:10, border:`1.5px solid ${tab===t.key?C.accent:C.border}`, background:tab===t.key?C.accentBg:C.surface, color:tab===t.key?C.accentDark:C.textMid, fontSize:13, fontWeight:tab===t.key?700:500, cursor:"pointer", transition:"all .15s" }}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>
      {TAB_CONTENT[tab] || <TabStudio/>}
    </div>
  );
}

// ─── TENANTS DATA (Super Admin) ───────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
// SUPER ADMIN VIEW
// ══════════════════════════════════════════════════════════════════════════════

// Palette beige/marron Super Admin
const SA_C = {
  bg:"#F4EFE8", surface:"#FFFFFF", surfaceWarm:"#FBF8F4",
  border:"#DDD5C8", borderSoft:"#EAE4DA",
  text:"#2A1F14", textMid:"#5C4A38", textSoft:"#8C7B6C", textMuted:"#B0A090",
  accent:"#A06838", accentDark:"#8C5E38", accentBg:"#F5EBE0", accentLight:"#FBF6EE",
  ok:"#4E8A58", okBg:"#E6F2E8", warn:"#A85030", warnBg:"#F5EAE6",
  info:"#3A6E90", infoBg:"#E6EFF5", gold:"#C4922A", goldBg:"#FDF4E3",
};
const saInp = (f=false,err=false) => ({
  width:"100%", padding:"9px 12px",
  border:`1.5px solid ${err?"#F87171":f?"#A06838":"#DDD5C8"}`,
  borderRadius:9, fontSize:13, outline:"none",
  color:"#2A1F14", background:"#FDFAF7",
  boxSizing:"border-box",
  boxShadow: f?"0 0 0 3px rgba(160,104,56,.07)":"none"
});

// FieldSA / SelectSA définis HORS de SuperAdminView

export { Settings, InviteCoachModal, RoleBadge };