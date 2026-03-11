import React, { useState, useEffect, useContext } from "react";
import { createClient } from "@/lib/supabase";
import { AppCtx } from "./context";
import { C } from "./theme";
import { FYDELYS_PLANS, DISCIPLINES, ROLES_DEF, TENANTS_INIT, TENANTS_DATA, USERS_DATA } from "./demoData";
import { IcoUser, IcoUsers, IcoSettings, IcoCheck, IcoX, IcoMail, IcoLogOut, IcoCalendar, IcoAlert, IcoEuro, IcoHome, IcoLayers, IcoTag, IcoUserPlus, IcoYoga } from "./icons";
import { Card, SectionHead, Button, Field, FieldLabel, Tag, Pill, EmptyState } from "./ui";

function RoleBadge({ role }) {
  const r = ROLES_DEF[role] || ROLES_DEF.adherent;
  return <span style={{ fontSize:11, fontWeight:700, color:r.color, background:r.bg, padding:"3px 9px", borderRadius:10, whiteSpace:"nowrap" }}>{r.label}</span>;
}




// ── AIDE ILLUSTRATIONS — visuels SVG pour les guides ────────────────────────

function InviteCoachModal({ C, inviteEmail, setInviteEmail, inviteName, setInviteName, onClose, onSubmit }) {
  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()}
      style={{position:"fixed",inset:0,background:"rgba(42,31,20,.45)",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:C.surface,borderRadius:16,padding:24,width:"100%",maxWidth:440,boxShadow:"0 24px 60px rgba(0,0,0,.18)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
          <div style={{fontSize:16,fontWeight:800,color:C.text}}>Inviter un coach</div>
          <button onClick={onClose} style={{background:"none",border:`1.5px solid ${C.border}`,borderRadius:8,padding:"4px 8px",cursor:"pointer"}}><IcoX s={14} c={C.textSoft}/></button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
          {[["Prénom","fn","Marie"],["Nom","ln","Laurent"]].map(([lbl,k,ph])=>(
            <div key={k}>
              <FieldLabel>{lbl}</FieldLabel>
              <input value={inviteName[k]} onChange={e=>setInviteName(p=>({...p,[k]:e.target.value}))} placeholder={ph}
                style={{width:"100%",padding:"9px 12px",border:`1.5px solid ${C.border}`,borderRadius:8,fontSize:14,outline:"none",boxSizing:"border-box",color:C.text,background:C.surfaceWarm}}
                onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/>
            </div>
          ))}
        </div>
        <div style={{marginBottom:16}}>
          <FieldLabel>Email professionnel</FieldLabel>
          <input autoFocus type="email" value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} placeholder="coach@studio.fr"
            style={{width:"100%",padding:"9px 12px",border:`1.5px solid ${C.border}`,borderRadius:8,fontSize:14,outline:"none",boxSizing:"border-box",color:C.text,background:C.surfaceWarm}}
            onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/>
        </div>
        <div style={{padding:"10px 14px",background:C.accentLight,borderRadius:8,fontSize:12,color:C.accentDark,marginBottom:16}}>
          🔗 Un magic link sera envoyé à <strong>{inviteEmail||"…"}</strong>. Le coach accédera au studio via <strong>slug.fydelys.fr</strong>
        </div>
        <div style={{display:"flex",gap:10}}>
          <Button variant="primary" onClick={onSubmit}>
            <IcoMail s={14} c="white"/> Envoyer l'invitation
          </Button>
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
        </div>
      </div>
    </div>
  );
}

function Settings({ isMobile }) {
  const { studioName, userName, userEmail, planName, membersCount, userRole, studioId } = useContext(AppCtx);
  const p = isMobile?12:28;
  const realRole = userRole || "admin";
  const [currentRole, setCurrentRole] = useState(realRole);
  // ── Données studio depuis Supabase
  const [studioForm, setStudioForm] = useState({ name:"", address:"", phone:"", email:"", website:"", cancel_delay_h:12, booking_days_ahead:7, waitlist_max:10 });
  const [studioSaving, setStudioSaving] = useState(false);
  const [studioToast, setStudioToast] = useState(null);
  const showStudioToast = (msg, ok=true) => { setStudioToast({msg,ok}); setTimeout(()=>setStudioToast(null),3000); };

  React.useEffect(() => {
    if (!studioId) return;
    createClient().from("studios")
      .select("name, address, city, phone, email, website, cancel_delay_h, booking_days_ahead, waitlist_max")
      .eq("id", studioId).single()
      .then(({ data }) => {
        if (data) setStudioForm({
          name: data.name || "",
          address: data.address || "",
          city: data.city || "",
          phone: data.phone || "",
          email: data.email || "",
          website: data.website || "",
          cancel_delay_h: data.cancel_delay_h ?? 12,
          booking_days_ahead: data.booking_days_ahead ?? 7,
          waitlist_max: data.waitlist_max ?? 10,
        });
      });
  }, [studioId]);

  const saveStudio = async () => {
    if (!studioId) return;
    setStudioSaving(true);
    const { error } = await createClient().from("studios").update({
      name: studioForm.name,
      address: studioForm.address,
      city: studioForm.city,
      phone: studioForm.phone,
      email: studioForm.email,
      website: studioForm.website,
      cancel_delay_h: parseInt(studioForm.cancel_delay_h) || 12,
      booking_days_ahead: parseInt(studioForm.booking_days_ahead) || 7,
      waitlist_max: parseInt(studioForm.waitlist_max) || 10,
    }).eq("id", studioId);
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
  const [users, setUsers] = useState(USERS_DATA);
  const [tenants, setTenants] = useState(TENANTS_DATA);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [modal, setModal] = useState(null); // type: "newTenant"|"inviteUser"|"editUser"|"password"|"2fa"|"sessions"|"deleteAccount"
  const [toast, setToast] = useState(null);
  // States invitation coach remontés ici pour éviter perte de focus (TabTeam recréé à chaque render)
  const [inviteModal, setInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName]   = useState({ fn:"", ln:"" });

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
    ...(isSA ? [{ key:"superadmin", label:"Super Admin", icon:<IcoLayers s={14} c="currentColor"/> }] : []),
    { key:"studio",  label:"Studio",       icon:<IcoSettings s={14} c="currentColor"/> },
    { key:"team",    label:"Équipe",        icon:<IcoUsers s={14} c="currentColor"/> },
    { key:"users",   label:"Utilisateurs", icon:<IcoTag s={14} c="currentColor"/> },
    { key:"roles", label:"Rôles", icon:<IcoTag s={14} c="currentColor"/> },
    { key:"account", label:"Mon compte",   icon:<IcoHome s={14} c="currentColor"/> },
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
          { lbl:"Tenants actifs",    val:tenants.filter(t=>t.status==="actif").length,  icon:<IcoLayers s={16} c="#7C3AED"/>, c:"#7C3AED", bg:"#F3EEFF" },
          { lbl:"Total membres",     val:tenants.reduce((s,t)=>s+t.members,0),          icon:<IcoUsers s={16} c={C.ok}/>,     c:C.ok,      bg:C.okBg },
          { lbl:"CA plateforme",     val:"18 330 €",                                    icon:<IcoEuro s={16} c={C.accent}/>,  c:C.accent,  bg:C.accentBg },
          { lbl:"Tenants suspendus", val:tenants.filter(t=>t.status==="suspendu").length,icon:<IcoAlert s={16} c={C.warn}/>,  c:C.warn,    bg:C.warnBg },
        ].map(s=>(
          <Card key={s.lbl} style={{ padding:"12px 14px" }}>
            <div style={{ width:28, height:28, borderRadius:7, background:s.bg, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:6 }}>{s.icon}</div>
            <div style={{ fontSize:20, fontWeight:800, color:s.c, lineHeight:1, marginBottom:3 }}>{s.val}</div>
            <div style={{ fontSize:11, color:C.textSoft }}>{s.lbl}</div>
          </Card>
        ))}
      </div>
      <Card noPad>
        <SectionHead action={<Button sm variant="primary" onClick={()=>setModal({type:"newTenant"})}><span style={{display:"flex",alignItems:"center",gap:5}}><IcoUserPlus s={13} c="white"/>Nouveau tenant</span></Button>}>
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
          <div style={{ padding:"16px 18px", display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr 1fr", gap:12 }}>
            <SI label="Délai annulation (h)" fkey="cancel_delay_h" type="number"/>
            <SI label="Ouverture résa (j avant)" fkey="booking_days_ahead" type="number"/>
            <SI label="Liste d'attente max" fkey="waitlist_max" type="number"/>
          </div>
          {isAdmin && (
            <div style={{ padding:"0 18px 16px" }}>
              <Button sm variant="primary" onClick={saveStudio}>{studioSaving?"Enregistrement…":"Enregistrer"}</Button>
            </div>
          )}
        </Card>

        <Card noPad>
          <SectionHead>Votre forfait</SectionHead>
          <div style={{ padding:"16px 18px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div>
              <div style={{ fontSize:16, fontWeight:800, color:C.text }}>{planName || "Essentiel"}</div>
              <div style={{ fontSize:12, color:C.textMuted, marginTop:2 }}>{membersCount} adhérent{membersCount>1?"s":""} actif{membersCount>1?"s":""}</div>
            </div>
            <Button sm variant="ghost" onClick={()=>window.open("https://fydelys.fr/#pricing","_blank")}>Changer de forfait</Button>
          </div>
        </Card>
      </div>
    );
  };

  // ── Tab: Users ────────────────────────────────────────────────────────────
  const TabUsers = () => {
    const tenantUsers = isSA ? users : users.filter(u=>u.tenant==="t1");
    return (
      <div>
        {isAdmin && (
          <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:12 }}>
            <Button sm variant="primary" onClick={()=>setModal({type:"inviteUser"})}><span style={{display:"flex",alignItems:"center",gap:5}}><IcoUserPlus s={13} c="white"/>Inviter un utilisateur</span></Button>
          </div>
        )}
        <Card noPad>
          {tenantUsers.map(u=>(
            <div key={u.id} style={{ padding:"11px 16px", borderBottom:`1px solid ${C.borderSoft}`, transition:"background .1s" }}
              onMouseEnter={e=>e.currentTarget.style.background=C.bg}
              onMouseLeave={e=>e.currentTarget.style.background=""}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:5 }}>
                <div style={{ width:32, height:32, borderRadius:"50%", background:C.accentBg, border:`1px solid #DFC0A0`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:C.accent, flexShrink:0 }}>{u.fn[0]}{u.ln[0]}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:C.text }}>{u.fn} {u.ln}</div>
                  <div style={{ fontSize:11, color:C.textSoft }}>{u.email}</div>
                </div>
                <RoleBadge role={u.role}/>
                {isSA && <span style={{ fontSize:10, color:C.textMuted, background:C.bg, padding:"2px 7px", borderRadius:8, border:`1px solid ${C.border}` }}>{tenants.find(t=>t.id===u.tenant)?.name}</span>}
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8, paddingLeft:42 }}>
                <Tag s={u.status}/>
                <span style={{ fontSize:11, color:C.textMuted, flex:1 }}>Connecté : {u.lastLogin}</span>
                {isAdmin && (
                  <div style={{ display:"flex", gap:5 }}>
                    <button onClick={()=>setModal({type:"editUser",user:u})} style={{ fontSize:11, padding:"3px 10px", borderRadius:6, border:`1px solid ${C.border}`, background:C.bg, color:C.textMid, cursor:"pointer", fontWeight:600 }}>Modifier</button>
                    {confirmDelete===u.id
                      ? <button onClick={()=>{ setUsers(prev=>prev.filter(x=>x.id!==u.id)); setConfirmDelete(null); showToast("Utilisateur supprimé", false); }}
                          style={{ fontSize:11, padding:"3px 10px", borderRadius:6, border:`1px solid #EFC8BC`, background:C.warnBg, color:C.warn, cursor:"pointer", fontWeight:700 }}>Confirmer</button>
                      : <button onClick={()=>setConfirmDelete(u.id)}
                          style={{ fontSize:11, padding:"3px 10px", borderRadius:6, border:`1px solid ${C.border}`, background:C.bg, color:C.textMuted, cursor:"pointer" }}>Supprimer</button>
                    }
                  </div>
                )}
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
                {key==="superadmin"&&<IcoLayers s={18} c={r.color}/>}{key==="admin"&&<IcoSettings s={18} c={r.color}/>}
                {key==="staff"&&<IcoCalendar s={18} c={r.color}/>}{key==="adherent"&&<IcoUsers s={18} c={r.color}/>}
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
            {[["Planning",["superadmin","admin","staff"]],["Membres",["superadmin","admin","staff"]],["Paiements",["superadmin","admin"]],["Paramètres",["superadmin","admin"]],["Tous les tenants",["superadmin"]],["Config plateforme",["superadmin"]]].map(([perm,roles])=>{
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
    const [coaches, setCoaches]         = useState(COACHES_INIT);
    const [editCoach, setEditCoach]     = useState(null); // coach en cours d'édition disciplines
    // inviteModal/inviteEmail/inviteName remontés dans Settings pour éviter perte de focus

    // Sauvegarder disciplines d'un coach
    const saveDisciplines = (coachId, discIds) => {
      setCoaches(prev => prev.map(c => c.id===coachId ? {...c, disciplines:discIds} : c));
      setEditCoach(null);
      showToast("Disciplines mises à jour ✓");
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
              {DISCIPLINES.map(d => {
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
        inviteEmail={inviteEmail}
        setInviteEmail={setInviteEmail}
        inviteName={inviteName}
        setInviteName={setInviteName}
        onClose={()=>setInviteModal(false)}
        onSubmit={async ()=>{
          if(!inviteEmail||!inviteName.fn) return;
          const newCoach = { id:`c${Date.now()}`, fn:inviteName.fn, ln:inviteName.ln, email:inviteEmail, isCoach:true, disciplines:[], status:"invité" };
          setCoaches(prev=>[...prev, newCoach]);
          setInviteModal(false); setInviteEmail(""); setInviteName({fn:"",ln:""});
          // Appel API pour envoyer le magic link d'invitation
          try {
            await fetch("/api/invite-coach", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: inviteEmail,
                firstName: inviteName.fn,
                lastName: inviteName.ln,
              }),
            });
          } catch(e) { console.error("invite error", e); }
          showToast(`Invitation envoyée à ${inviteEmail} ✓`);
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

        {/* Liste des coachs */}
        {coaches.map(coach => {
          const assignedDiscs = DISCIPLINES.filter(d => coach.disciplines.includes(d.id));
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
            <div style={{fontSize:36,marginBottom:12}}>👥</div>
            <div style={{fontSize:15,fontWeight:600,color:C.textSoft,marginBottom:8}}>Aucun coach dans l'équipe</div>
            <Button sm variant="primary" onClick={()=>setInviteModal(true)}>+ Inviter le premier coach</Button>
          </div>
        )}
      </div>
    );
  };

  const TAB_CONTENT = { superadmin:<TabSuperAdmin/>, studio:<TabStudio/>, team:<TabTeam/>, users:<TabUsers/>, roles:<TabRoles/>, account:<TabAccount/> };

  return (
    <div style={{ padding:p, maxWidth:isSA?"none":720 }}>
      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", top:20, right:20, zIndex:600, display:"flex", alignItems:"center", gap:10, padding:"12px 18px", background:toast.ok!==false?C.ok:C.warn, borderRadius:10, color:"white", fontSize:14, fontWeight:600, boxShadow:"0 8px 24px rgba(0,0,0,.15)" }}>
          {toast.ok!==false ? <IcoCheck s={16} c="white"/> : <IcoAlert s={16} c="white"/>}{toast.msg}
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
