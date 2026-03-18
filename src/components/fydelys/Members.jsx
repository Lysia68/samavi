"use client";

import React, { useState, useEffect, useContext } from "react";
import { BirthDatePicker } from "./pickers";
import { createClient } from "@/lib/supabase";
import { AppCtx } from "./context";
import { C } from "./theme";
import { MEMBERS_DEMO, SUBSCRIPTIONS_DEMO, SESSIONS_DEMO, BOOKINGS_DEMO, SUBSCRIPTIONS_INIT } from "./demoData";
import { IcoUserPlus2, IcoMail, IcoUser2, IcoCalendar2, IcoX, IcoCheck, IcoTag2, IcoSearch } from "./icons";
import { Card, SectionHead, Button, Field, FieldLabel, Tag, Pill, MemberRow, DemoBanner, EmptyState, CreditBadge } from "./ui";


const EMPTY_FORM = {
  firstName:"", lastName:"", email:"", phone:"",
  address:"", postalCode:"", city:"",
  birthDate:"", subscription:"",
};

function MemberForm({ value, onChange, errors={}, isMobile }) {
  const cols = (n) => ({ display:"grid", gridTemplateColumns:`repeat(${isMobile?1:n},1fr)`, gap:14 });
  const inp = (err) => ({
    width:"100%", padding:"9px 12px", border:`1.5px solid ${err?"#C43A3A":C.border}`, borderRadius:8,
    fontSize:13, outline:"none", boxSizing:"border-box", color:C.text, background:C.surfaceWarm, fontFamily:"inherit",
  });
  const sec = (emoji, txt) => (
    <div style={{ fontSize:11, fontWeight:800, color:C.accent, textTransform:"uppercase", letterSpacing:.6, marginBottom:10 }}>{emoji} {txt}</div>
  );
  const lbl = (txt, req) => (
    <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:.8, marginBottom:5 }}>
      {txt}{req&&<span style={{color:"#C43A3A",marginLeft:2}}>*</span>}
    </div>
  );
  const err = (k) => errors[k] && <div style={{fontSize:11,color:"#C43A3A",marginTop:3}}>Champ obligatoire</div>;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
      <div>
        {sec("👤","Identité")}
        <div style={cols(3)}>
          <div>{lbl("Prénom",true)}<input value={value.firstName} onChange={e=>onChange({...value,firstName:e.target.value})} placeholder="Prénom" style={inp(errors.firstName)}/>{err("firstName")}</div>
          <div>{lbl("Nom",true)}<input value={value.lastName} onChange={e=>onChange({...value,lastName:e.target.value})} placeholder="Nom" style={inp(errors.lastName)}/>{err("lastName")}</div>
          <div>{lbl("Date de naissance",true)}<BirthDatePicker value={value.birthDate} onChange={v=>onChange({...value,birthDate:v})} error={errors.birthDate}/>{err("birthDate")}</div>
        </div>
      </div>
      <div>
        {sec("📬","Contact")}
        <div style={cols(2)}>
          <div>{lbl("Email",true)}<input value={value.email} onChange={e=>onChange({...value,email:e.target.value})} placeholder="email@exemple.com" type="email" style={inp(errors.email)}/>{err("email")}</div>
          <div>{lbl("Téléphone")}<input value={value.phone} onChange={e=>onChange({...value,phone:e.target.value})} placeholder="06 00 00 00 00" type="tel" style={inp()}/></div>
        </div>
      </div>
      <div>
        {sec("📍","Adresse")}
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <div>{lbl("Rue")}<input value={value.address} onChange={e=>onChange({...value,address:e.target.value})} placeholder="12 rue des Lilas" style={inp()}/></div>
          <div style={cols(2)}>
            <div>{lbl("Code postal")}<input value={value.postalCode} onChange={e=>onChange({...value,postalCode:e.target.value})} placeholder="75000" maxLength={10} style={inp()}/></div>
            <div>{lbl("Ville")}<input value={value.city} onChange={e=>onChange({...value,city:e.target.value})} placeholder="Paris" style={inp()}/></div>
          </div>
        </div>
      </div>

    </div>
  );
}

function Members({ isMobile }) {
  const { studioId } = useContext(AppCtx);
  const [members, setMembers]       = useState([]);
  const [dbLoading, setDbLoading]   = useState(true);
  const [isDemoData, setIsDemoData] = useState(false);
  const [subscriptionsList, setSubscriptionsList] = useState([]);
  const [search, setSearch]         = useState("");
  const [selected, setSelected]     = useState(null);
  const [showAdd, setShowAdd]       = useState(false);
  const [nM, setNM]                 = useState(EMPTY_FORM);
  const [nMErrors, setNMErrors]     = useState({});
  const [editMode, setEditMode]     = useState(false);
  const [editForm, setEditForm]     = useState(null);
  const [modal, setModal]           = useState(null);
  const [toast, setToast]           = useState(null);
  const p = isMobile ? 12 : 28;

  const showToast = (msg, ok=true) => { setToast({msg,ok}); setTimeout(()=>setToast(null),3500); };
  const filtered = members.filter(m =>
    `${m.firstName} ${m.lastName} ${m.email}`.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (!studioId) return;
    // Charger les abonnements du studio
    createClient().from("subscriptions").select("id,name").eq("studio_id",studioId).eq("active",true).order("name")
      .then(({data})=>{ if(data?.length) setSubscriptionsList(data); });
  }, [studioId]);

  useEffect(() => {
    if (!studioId) return;
    setDbLoading(true);

    async function load() {
      console.log("[Members] load — studioId:", studioId);
      try {
        const r = await fetch(`/api/members?studioId=${studioId}`);
        const json = await r.json();
        console.log("[Members] /api/members →", r.status, json);
        if (r.ok && !json.error) {
          setMembers(json.members?.length ? json.members.map(mapRow) : []);
          setDbLoading(false);
          return;
        }
        console.warn("[Members] API error:", json.error);
      } catch(e) {
        console.error("[Members] fetch failed:", e);
      }

      // Fallback Supabase direct
      console.log("[Members] trying Supabase client fallback...");
      const { data, error } = await createClient()
        .from("members")
        .select("id,first_name,last_name,email,phone,address,postal_code,city,birth_date,status,credits,credits_total,joined_at,next_payment,notes,subscription_id,profile_complete,subscriptions(name)")
        .eq("studio_id", studioId).order("last_name");
      console.log("[Members] fallback →", { count: data?.length, error: error?.message });

      setMembers(data?.length ? data.map(mapRow) : []);
      setDbLoading(false);
    }

    load();
  }, [studioId]);

  function mapRow(m) {
    return {
      id:m.id, firstName:m.first_name, lastName:m.last_name,
      email:m.email, phone:m.phone||"",
      address:m.address||"", postalCode:m.postal_code||"", city:m.city||"",
      birthDate:m.birth_date||"",
      status:m.status||"actif", credits:m.credits||0, creditTotal:m.credits_total||0,
      joined:m.joined_at, nextPayment:m.next_payment, notes:m.notes||"",
      subscription:m.subscriptions?.name||"—", subscriptionId:m.subscription_id||null,
      profileComplete:m.profile_complete,
      avatar:(m.first_name?.[0]||"")+(m.last_name?.[0]||""),
    };
  }

  function dbPayload(f) {
    return {
      first_name:f.firstName, last_name:f.lastName,
      email:f.email.toLowerCase().trim(), phone:f.phone||"",
      address:f.address||null, postal_code:f.postalCode||null, city:f.city||null,
      birth_date:f.birthDate||null,
    };
  }

  function validate(f) {
    const e={};
    if (!f.firstName.trim()) e.firstName=true;
    if (!f.lastName.trim())  e.lastName=true;
    if (!f.email.trim())     e.email=true;
    if (!f.birthDate)        e.birthDate=true;
    return e;
  }

  const add = async () => {
    const errs = validate(nM); setNMErrors(errs);
    if (Object.keys(errs).length || !studioId) return;
    const tempId=`tmp-${Date.now()}`;
    setMembers(prev=>[...prev,{id:tempId,...nM,joined:new Date().toISOString().split("T")[0],status:"nouveau",credits:0,subscription:"—",avatar:(nM.firstName[0]||"")+(nM.lastName[0]||"")}]);
    setShowAdd(false); setNM(EMPTY_FORM); setNMErrors({});
    const res = await fetch("/api/members", { method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ studioId, ...dbPayload(nM), status:"nouveau", credits:0, joined_at:new Date().toISOString().split("T")[0] }) });
    const json = await res.json();
    if (!res.ok) {
      setMembers(prev=>prev.filter(m=>m.id!==tempId));
      showToast(json.error==="EMAIL_EXISTS" ? "Email déjà utilisé dans ce studio ✕" : "Erreur : "+(json.error||"impossible de créer"), false);
    } else if (json.id) { setMembers(prev=>prev.map(m=>m.id===tempId?{...m,id:json.id}:m)); showToast("Adhérent créé ✓"); }
  };

  const startEdit = (m) => {
    setEditForm({ firstName:m.firstName,lastName:m.lastName,email:m.email,phone:m.phone||"",address:m.address||"",postalCode:m.postalCode||"",city:m.city||"",birthDate:m.birthDate||"",subscription:m.subscription||"" });
    setNMErrors({}); setEditMode(true);
  };

  const saveEdit = async () => {
    const errs=validate(editForm); setNMErrors(errs);
    if (Object.keys(errs).length) return;
    const id=selected.id;
    const updated={...selected,...editForm,postalCode:editForm.postalCode,avatar:(editForm.firstName[0]||"")+(editForm.lastName[0]||"")};
    setMembers(prev=>prev.map(m=>m.id===id?updated:m)); setSelected(updated); setEditMode(false);
    const res = await fetch("/api/members", { method:"PATCH", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ id, ...dbPayload(editForm) }) });
    const json = await res.json();
    if (!res.ok) showToast("Erreur : "+(json.error||"sauvegarde impossible"), false); else showToast("Profil mis à jour ✓");
  };

  const deleteMember = async (id) => {
    setMembers(prev=>prev.filter(m=>m.id!==id)); setSelected(null);
    await fetch(`/api/members?id=${id}`, { method:"DELETE" });
    showToast("Adhérent supprimé");
  };

  const Modal = ({children}) => (
    <div style={{position:"fixed",inset:0,background:"rgba(42,31,20,.45)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}
      onClick={e=>{if(e.target===e.currentTarget)setModal(null);}}>
      <div style={{background:C.surface,borderRadius:16,padding:24,width:"100%",maxWidth:480,boxShadow:"0 24px 60px rgba(0,0,0,.18)",maxHeight:"85vh",overflowY:"auto"}}>
        {children}
      </div>
    </div>
  );
  const ModalHeader = ({title,onClose}) => (
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
      <div style={{fontSize:16,fontWeight:800,color:C.text}}>{title}</div>
      <button onClick={onClose} style={{background:"none",border:`1.5px solid ${C.border}`,borderRadius:8,padding:"4px 7px",cursor:"pointer",display:"flex"}}><IcoX s={15} c={C.textSoft}/></button>
    </div>
  );

  const EmailModal = () => {
    const [subject,setSubject]=useState(`Bonjour ${modal.member.firstName}`);
    const [body,setBody]=useState(""); const [sent,setSent]=useState(false);
    const si={width:"100%",padding:"9px 12px",border:`1.5px solid ${C.border}`,borderRadius:8,fontSize:14,outline:"none",boxSizing:"border-box",color:C.text,background:C.surfaceWarm};
    return <Modal>
      <ModalHeader title={`Email à ${modal.member.firstName} ${modal.member.lastName}`} onClose={()=>setModal(null)}/>
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:C.bg,borderRadius:8,marginBottom:14}}>
        <IcoMail s={14} c={C.textSoft}/><span style={{fontSize:13,color:C.textSoft}}>{modal.member.email}</span>
      </div>
      <div style={{marginBottom:12}}><FieldLabel>Objet</FieldLabel><input value={subject} onChange={e=>setSubject(e.target.value)} style={si} onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/></div>
      <div style={{marginBottom:16}}><FieldLabel>Message</FieldLabel><textarea value={body} onChange={e=>setBody(e.target.value)} rows={5} placeholder="Votre message…" style={{...si,resize:"vertical",fontFamily:"inherit"}} onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/></div>
      {sent ? <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",background:C.okBg,borderRadius:8,color:C.ok,fontWeight:600,fontSize:14}}><IcoCheck s={16} c={C.ok}/>Email envoyé !</div>
        : <div style={{display:"flex",gap:10}}><Button variant="primary" onClick={()=>setSent(true)}><span style={{display:"flex",alignItems:"center",gap:6}}><IcoMail s={14} c="white"/>Envoyer</span></Button><Button variant="ghost" onClick={()=>setModal(null)}>Annuler</Button></div>}
    </Modal>;
  };

  const SubscriptionModal = () => {
    const [subId, setSubId] = useState(modal.member.subscriptionId || "");
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const subName = subscriptionsList.find(s=>s.id===subId)?.name || subId || "—";

    const save = async () => {
      setSaving(true);
      const res = await fetch("/api/members", { method:"PATCH", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ id: modal.member.id, subscription_id: subId || null }) });
      setSaving(false);
      if (res.ok) {
        const newSub = subscriptionsList.find(s=>s.id===subId)?.name||"—";
        const updater = m => m.id===modal.member.id
          ? {...m, subscriptionId:subId||null, subscription:newSub}
          : m;
        setMembers(prev=>prev.map(updater));
        setSelected(prev=>prev?.id===modal.member.id ? {...prev, subscriptionId:subId||null, subscription:newSub} : prev);
        setSaved(true);
        setTimeout(()=>setModal(null), 1200);
      } else { showToast("Erreur lors de la sauvegarde",false); }
    };

    return <Modal>
      <ModalHeader title={`Abonnement — ${modal.member.firstName} ${modal.member.lastName}`} onClose={()=>setModal(null)}/>
      <div style={{marginBottom:16}}>
        <div style={{fontSize:12,color:C.textMuted,fontWeight:600,marginBottom:8,textTransform:"uppercase"}}>Abonnement actuel</div>
        <div style={{padding:"10px 14px",background:C.accentBg,borderRadius:8,fontSize:15,fontWeight:700,color:C.accentDark}}>
          {modal.member.subscription||"—"}
        </div>
      </div>
      <div style={{marginBottom:18}}>
        <FieldLabel>Nouvel abonnement</FieldLabel>
        <select value={subId} onChange={e=>setSubId(e.target.value)}
          style={{width:"100%",padding:"9px 12px",border:`1.5px solid ${C.border}`,borderRadius:8,fontSize:13,color:C.text,background:C.surfaceWarm,outline:"none"}}>
          <option value="">— Aucun abonnement —</option>
          {subscriptionsList.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      {saved
        ? <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",background:C.okBg,borderRadius:8,color:C.ok,fontWeight:600,fontSize:14}}><IcoCheck s={16} c={C.ok}/>Abonnement mis à jour !</div>
        : <div style={{display:"flex",gap:10}}>
            <Button variant="primary" onClick={save} disabled={saving}>{saving?"Enregistrement…":"Enregistrer"}</Button>
            <Button variant="ghost" onClick={()=>setModal(null)}>Annuler</Button>
          </div>
      }
    </Modal>;
  };

  const HistoryModal = () => {
    const [history, setHistory] = React.useState(null); // null=loading, []=empty, [...]=data
    const memberId = modal?.member?.id;

    React.useEffect(() => {
      if (!memberId) return;
      // Via API service role pour contourner RLS bookings
      fetch(`/api/members/history?memberId=${memberId}`)
        .then(r => r.ok ? r.json() : null)
        .then(json => {
          if (!json?.bookings) { setHistory([]); return; }
          const today = new Date(); today.setHours(0,0,0,0);
          setHistory(json.bookings.map(b => {
            const s = b.sessions;
            const sessionDate = s?.session_date ? new Date(s.session_date) : null;
            const past = sessionDate && sessionDate < today;
            const statut = past
              ? (b.status === "cancelled" ? "absent" : "présent")
              : "à venir";
            return {
              date: s?.session_date || "",
              disc: s?.disciplines?.name || "—",
              icon: s?.disciplines?.icon || "🏃",
              teacher: s?.teacher || "—",
              room: s?.room || "",
              status: statut,
            };
          }).filter(b => b.date));
        })
        .catch(() => setHistory([]));
    }, [memberId]);

    const presences = history?.filter(s => s.status === "présent").length || 0;
    const absences  = history?.filter(s => s.status === "absent").length || 0;
    const avenir    = history?.filter(s => s.status === "à venir").length || 0;

    return (
      <Modal>
        <ModalHeader title={`Séances — ${modal.member.firstName} ${modal.member.lastName}`} onClose={()=>setModal(null)}/>
        <div style={{display:"flex",gap:10,marginBottom:16}}>
          {[["Séances",(history?.length||0)],["Présences",presences],["Absences",absences],["À venir",avenir]].map(([l,v])=>(
            <div key={l} style={{flex:1,textAlign:"center",padding:"10px 6px",background:C.bg,borderRadius:10,border:`1.5px solid ${C.border}`}}>
              <div style={{fontSize:20,fontWeight:800,color:C.text}}>{history===null?"…":v}</div>
              <div style={{fontSize:10,color:C.textSoft}}>{l}</div>
            </div>
          ))}
        </div>
        {history === null && (
          <div style={{textAlign:"center",padding:"32px 0",color:C.textMuted,fontSize:13}}>Chargement…</div>
        )}
        {history !== null && history.length === 0 && (
          <div style={{textAlign:"center",padding:"32px 0"}}>
            <div style={{fontSize:28,marginBottom:8}}>📅</div>
            <div style={{fontSize:14,fontWeight:700,color:C.text}}>Aucune séance</div>
            <div style={{fontSize:12,color:C.textMuted,marginTop:4}}>Cet adhérent n'a pas encore de réservations.</div>
          </div>
        )}
        {history !== null && history.map((s,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"9px 0",borderBottom:`1px solid ${C.borderSoft}`}}>
            <div style={{width:32,height:32,borderRadius:8,
              background:s.status==="présent"?C.okBg:s.status==="absent"?C.warnBg:C.accentBg,
              display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              {s.status==="présent"?<IcoCheck s={14} c={C.ok}/>:s.status==="absent"?<IcoX s={14} c={C.warn}/>:<IcoCalendar2 s={14} c={C.accent}/>}
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:700,color:C.text}}>{s.icon} {s.disc}</div>
              <div style={{fontSize:12,color:C.textSoft}}>{s.teacher} · {s.date ? new Date(s.date+"T12:00:00").toLocaleDateString("fr-FR") : ""}</div>
              {s.room && <div style={{fontSize:11,color:C.textMuted,marginTop:1}}>📍 {s.room}</div>}
            </div>
            <span style={{fontSize:12,fontWeight:600,
              color:s.status==="présent"?C.ok:s.status==="absent"?C.warn:C.accent}}>
              {s.status}
            </span>
          </div>
        ))}
      </Modal>
    );
  };

  const GiftModal = () => {
    const m = modal?.member;
    const [qty, setQty] = React.useState(1);
    const [reason, setReason] = React.useState("");
    const [saving, setSaving] = React.useState(false);

    const gift = async () => {
      if (!qty || qty < 1) return;
      setSaving(true);
      const newCredits = (m.credits || 0) + parseInt(qty);
      const newTotal   = (m.creditTotal || 0) + parseInt(qty);
      try {
        await fetch("/api/members", {
          method: "PATCH",
          headers: {"Content-Type":"application/json"},
          body: JSON.stringify({ id: m.id, credits: newCredits, credits_total: newTotal }),
        });
        setMembers(prev => prev.map(mb => mb.id === m.id
          ? { ...mb, credits: newCredits, creditTotal: newTotal }
          : mb
        ));
        if (selected?.id === m.id) setSelected(s => ({ ...s, credits: newCredits, creditTotal: newTotal }));
        showToast(`🎁 ${qty} séance${qty > 1 ? "s" : ""} offerte${qty > 1 ? "s" : ""} à ${m.firstName}`);
        setModal(null);
      } catch { showToast("Erreur lors de l'attribution", false); }
      setSaving(false);
    };

    return (
      <Modal>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
          <div>
            <div style={{fontSize:17,fontWeight:800,color:C.text}}>🎁 Offrir des séances</div>
            <div style={{fontSize:13,color:C.textSoft,marginTop:2}}>{m?.firstName} {m?.lastName}</div>
          </div>
          <button onClick={()=>setModal(null)} style={{background:"none",border:`1.5px solid ${C.border}`,borderRadius:8,padding:"5px 8px",cursor:"pointer",display:"flex",alignItems:"center"}}><IcoX s={16} c={C.textSoft}/></button>
        </div>

        {/* Solde actuel */}
        <div style={{padding:"10px 14px",background:C.accentBg,borderRadius:9,border:`1px solid ${C.border}`,marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontSize:13,color:C.textSoft}}>Solde actuel</span>
          <span style={{fontSize:16,fontWeight:800,color:C.accent}}>{m?.credits || 0} séance{(m?.credits||0) > 1 ? "s" : ""}</span>
        </div>

        {/* Quantité */}
        <div style={{marginBottom:14}}>
          <FieldLabel>Nombre de séances à offrir</FieldLabel>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            {[1,2,3,5,10].map(n => (
              <button key={n} onClick={()=>setQty(n)}
                style={{padding:"8px 14px",borderRadius:8,border:`1.5px solid ${qty===n?C.accent:C.border}`,background:qty===n?C.accentBg:C.surface,color:qty===n?C.accent:C.textMid,fontWeight:700,fontSize:13,cursor:"pointer"}}>
                {n}
              </button>
            ))}
            <input type="number" min="1" max="100" value={qty} onChange={e=>setQty(Math.max(1,parseInt(e.target.value)||1))}
              style={{width:60,padding:"8px",border:`1.5px solid ${C.border}`,borderRadius:8,fontSize:13,textAlign:"center",outline:"none",color:C.text,background:C.surface}}/>
          </div>
        </div>

        {/* Raison (optionnel) */}
        <div style={{marginBottom:18}}>
          <FieldLabel>Motif (optionnel)</FieldLabel>
          <input value={reason} onChange={e=>setReason(e.target.value)} placeholder="Ex: Séance offerte, compensation, cadeau anniversaire…"
            style={{width:"100%",padding:"9px 12px",border:`1.5px solid ${C.border}`,borderRadius:8,fontSize:13,outline:"none",color:C.text,background:C.surface,boxSizing:"border-box"}}/>
        </div>

        {/* Résumé */}
        <div style={{padding:"10px 14px",background:"#F0FDF4",borderRadius:9,border:"1px solid rgba(52,211,153,.25)",marginBottom:18}}>
          <span style={{fontSize:13,color:"#065F46"}}>
            Après attribution : <strong>{(m?.credits||0) + parseInt(qty||0)} séances</strong> disponibles
          </span>
        </div>

        <div style={{display:"flex",gap:10}}>
          <Button variant="ghost" sm onClick={()=>setModal(null)}>Annuler</Button>
          <Button variant="primary" sm onClick={gift} disabled={saving}>
            {saving ? "Attribution…" : `🎁 Offrir ${qty} séance${qty>1?"s":""}`}
          </Button>
        </div>
      </Modal>
    );
  };

  const MemberDetail = () => {
    const m=selected;
    const adresseFull=[m.address,[m.postalCode,m.city].filter(Boolean).join(" ")].filter(Boolean).join(", ");
    const birthdayFmt=m.birthDate?new Date(m.birthDate+"T12:00:00").toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"}):null;
    const infoRow=(ico,lbl,val)=>val?<div style={{display:"flex",alignItems:"flex-start",gap:8}}><span style={{fontSize:14,flexShrink:0,marginTop:1}}>{ico}</span><div><div style={{fontSize:11,fontWeight:700,color:C.textMuted,textTransform:"uppercase",letterSpacing:.5}}>{lbl}</div><div style={{fontSize:13,color:C.text,fontWeight:500}}>{val}</div></div></div>:null;
    return (
      <Card style={{marginTop:16,borderTop:`3px solid ${C.accent}`}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:48,height:48,borderRadius:"50%",background:C.accentBg,border:`1.5px solid #DFC0A0`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,fontWeight:700,color:C.accent}}>{m.avatar}</div>
            <div>
              <div style={{fontSize:19,fontWeight:800,color:C.text}}>{m.firstName} {m.lastName}</div>
              <div style={{fontSize:13,color:C.textSoft,marginTop:3,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                <span style={{display:"flex",alignItems:"center",gap:4}}><IcoMail s={13} c={C.textMuted}/>{m.email}</span>
                {m.phone&&<span style={{display:"flex",alignItems:"center",gap:4}}><span style={{fontSize:13}}>📞</span>{m.phone}</span>}
              </div>
              {m.profileComplete===false&&<div style={{fontSize:11,color:C.warn,fontWeight:600,marginTop:3}}>⚠ Profil non complété</div>}
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>startEdit(m)} style={{fontSize:12,padding:"6px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,background:C.surface,color:C.textMid,cursor:"pointer",fontWeight:600}}>✏ Modifier</button>
            <button onClick={()=>setSelected(null)} style={{background:"none",border:`1.5px solid ${C.border}`,borderRadius:8,padding:"5px 8px",cursor:"pointer",display:"flex",alignItems:"center"}}><IcoX s={16} c={C.textSoft}/></button>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:`repeat(${isMobile?2:4},1fr)`,gap:10,marginBottom:14}}>
          {[["Abonnement",m.subscription],["Statut",m.status],["Membre depuis",m.joined?new Date(m.joined).toLocaleDateString("fr-FR"):"—"],["Crédits",m.credits>0?`${m.credits} séances`:"Illimité"]].map(([l,v])=>(
            <div key={l} style={{background:C.bg,borderRadius:8,padding:"11px 13px",border:`1.5px solid ${C.border}`}}>
              <div style={{fontSize:11,fontWeight:700,color:C.textMuted,textTransform:"uppercase",marginBottom:3}}>{l}</div>
              <div style={{fontSize:15,fontWeight:600,color:C.text,textTransform:"capitalize"}}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:10,marginBottom:16,background:C.bg,borderRadius:10,padding:"14px 16px",border:`1px solid ${C.borderSoft}`}}>
          {infoRow("🎂","Date de naissance",birthdayFmt)}
          {infoRow("📍","Adresse",adresseFull||null)}

        </div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          <Button variant="primary" sm onClick={()=>setModal({type:"email",member:m})}><span style={{display:"flex",alignItems:"center",gap:5}}><IcoMail s={13} c="white"/>Envoyer un email</span></Button>
          <Button variant="ghost" sm onClick={()=>setModal({type:"subscription",member:m})}><span style={{display:"flex",alignItems:"center",gap:5}}><IcoTag2 s={13} c={C.textMid}/>Modifier l'abonnement</span></Button>
          <Button variant="ghost" sm onClick={()=>setModal({type:"history",member:m})}><span style={{display:"flex",alignItems:"center",gap:5}}><IcoCalendar2 s={13} c={C.textMid}/>Historique séances</span></Button>
          <Button variant="ghost" sm onClick={()=>setModal({type:"gift",member:m})}><span style={{display:"flex",alignItems:"center",gap:5}}>🎁 Offrir des séances</span></Button>
        </div>
      </Card>
    );
  };

  return (
    <div>
      {toast && (
        <div style={{position:"fixed",bottom:90,left:"50%",transform:"translateX(-50%)",zIndex:9000,padding:"10px 20px",borderRadius:10,background:toast.ok?"#065F46":"#991B1B",color:"#fff",fontSize:13,fontWeight:700,boxShadow:"0 4px 20px rgba(0,0,0,.2)",whiteSpace:"nowrap"}}>
          {toast.ok?"✓":"✗"} {toast.msg}
        </div>
      )}
      {modal?.type==="email"        && <EmailModal/>}
      {modal?.type==="subscription" && <SubscriptionModal/>}
      {modal?.type==="history"      && <HistoryModal/>}
      {modal?.type==="gift"         && <GiftModal/>}

      {/* Modal Modifier */}
      {editMode && editForm && (
        <div style={{position:"fixed",inset:0,background:"rgba(42,31,20,.5)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}
          onClick={e=>{if(e.target===e.currentTarget){setEditMode(false);setNMErrors({});}}}>
          <div style={{background:C.surface,borderRadius:16,padding:24,width:"100%",maxWidth:580,boxShadow:"0 24px 60px rgba(0,0,0,.2)",maxHeight:"90vh",overflowY:"auto"}}
            onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
              <div style={{fontSize:16,fontWeight:800,color:C.text}}>✏ Modifier le profil</div>
              <button onClick={()=>{setEditMode(false);setNMErrors({});}} style={{background:"none",border:`1.5px solid ${C.border}`,borderRadius:8,padding:"4px 7px",cursor:"pointer"}}><IcoX s={15} c={C.textSoft}/></button>
            </div>
            <MemberForm value={editForm} onChange={setEditForm} errors={nMErrors} isMobile={isMobile}/>
            <div style={{display:"flex",gap:10,marginTop:20}}>
              <Button variant="primary" onClick={saveEdit}>💾 Enregistrer</Button>
              <Button variant="ghost" onClick={()=>{setEditMode(false);setNMErrors({});}}>Annuler</Button>
            </div>
          </div>
        </div>
      )}

      <div style={{padding:p}}>
        <div style={{display:"flex",gap:10,marginBottom:18,alignItems:"center"}}>
          <div style={{position:"relative",display:"flex",alignItems:"center",flex:1}}>
            <span style={{position:"absolute",left:10,pointerEvents:"none",display:"flex"}}><IcoSearch s={15} c={C.textMuted}/></span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher…"
              style={{flex:1,padding:isMobile?"9px 12px":"10px 14px",paddingLeft:34,border:`1px solid ${C.border}`,borderRadius:8,fontSize:16,outline:"none",color:C.text,background:C.surfaceWarm,width:"100%"}}
              onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/>
          </div>
          <Button sm variant="primary" onClick={()=>{setShowAdd(!showAdd);setNM(EMPTY_FORM);setNMErrors({});}}>＋ {!isMobile&&"Adhérent"}</Button>
        </div>

        {showAdd && (
          <Card style={{marginBottom:16,borderTop:`3px solid ${C.accent}`}}>
            <div style={{fontSize:13,fontWeight:800,color:C.accent,textTransform:"uppercase",letterSpacing:.6,marginBottom:18}}>Nouvel adhérent</div>
            <MemberForm value={nM} onChange={setNM} errors={nMErrors} isMobile={isMobile}/>
            <div style={{marginTop:18,display:"flex",gap:10}}>
              <Button variant="primary" onClick={add}>✦ Créer l'adhérent</Button>
              <Button variant="ghost" onClick={()=>{setShowAdd(false);setNMErrors({});}}>Annuler</Button>
            </div>
          </Card>
        )}

        {dbLoading ? (
          <div style={{textAlign:"center",padding:"40px 0",color:C.textMuted,fontSize:15}}>⏳ Chargement…</div>
        ) : filtered.length===0 ? (
          <EmptyState icon="👤" title="Aucun adhérent" sub={search?"Aucun résultat":"Créez votre premier adhérent !"}/>
        ) : (
          <Card noPad>{filtered.map(m=><MemberRow key={m.id} m={m} onSelect={m=>setSelected(selected?.id===m.id?null:m)} selected={selected?.id===m.id}/>)}</Card>
        )}
        {selected && !editMode && <MemberDetail/>}
      </div>
    </div>
  );
}

export { Members };
