"use client";

import React, { useState, useEffect, useContext } from "react";
import { BirthDatePicker } from "./pickers";
import { createClient } from "@/lib/supabase";
import { AppCtx } from "./context";
import { C } from "./theme";
import { MEMBERS_DEMO, SUBSCRIPTIONS_DEMO, SESSIONS_DEMO, BOOKINGS_DEMO, SUBSCRIPTIONS_INIT } from "./demoData";
import { IcoUserPlus2, IcoMail, IcoUser2, IcoCalendar2, IcoX, IcoCheck, IcoTag2, IcoSearch } from "./icons";
import { Card, SectionHead, Button, Field, FieldLabel, Tag, Pill, MemberRow, DemoBanner, EmptyState, CreditBadge, formatPhone, formatPostalCode, formatName } from "./ui";


function GuestsList({ memberId, studioId }) {
  const [guests, setGuests] = React.useState(null);
  React.useEffect(() => {
    if (!memberId) return;
    createClient().from("member_guests").select("id, name, phone")
      .eq("member_id", memberId).order("name")
      .then(({ data }) => setGuests(data || []));
  }, [memberId]);

  if (!guests || guests.length === 0) return null;

  const handleDelete = async (guest) => {
    // Vérifier si l'invité a des réservations futures
    const today = new Date().toISOString().slice(0,10);
    const { count } = await createClient().from("bookings")
      .select("id", { count:"exact", head:true })
      .eq("guest_name", guest.name).eq("host_member_id", memberId)
      .neq("status", "cancelled")
      .gte("sessions.session_date", today);
    if (count && count > 0) {
      alert(`${guest.name} a ${count} réservation${count>1?"s":""} à venir. Annulez-les d'abord.`);
      return;
    }
    await createClient().from("member_guests").delete().eq("id", guest.id);
    setGuests(prev => prev.filter(g => g.id !== guest.id));
  };

  return (
    <div style={{marginBottom:14,background:C.bg,borderRadius:10,padding:"10px 14px",border:`1px solid ${C.borderSoft}`}}>
      <div style={{fontSize:11,fontWeight:700,color:C.textMuted,textTransform:"uppercase",letterSpacing:.5,marginBottom:8}}>Invités enregistrés ({guests.length})</div>
      {guests.map(g => (
        <div key={g.id} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",borderBottom:`1px solid ${C.borderSoft}`}}>
          <div style={{width:24,height:24,borderRadius:"50%",background:C.accentBg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:C.accent,flexShrink:0}}>
            {g.name?.[0]?.toUpperCase()||"?"}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:13,fontWeight:600,color:C.text}}>{g.name}</div>
            {g.phone && <div style={{fontSize:11,color:C.textMuted}}>{g.phone}</div>}
          </div>
          <button onClick={()=>handleDelete(g)}
            style={{fontSize:11,padding:"2px 6px",borderRadius:6,border:"none",background:"transparent",color:C.textMuted,cursor:"pointer"}}
            onMouseEnter={e=>{e.currentTarget.style.color="#A85030";}}
            onMouseLeave={e=>{e.currentTarget.style.color=C.textMuted;}}>
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

const EMPTY_FORM = {
  firstName:"", lastName:"", email:"", phone:"",
  address:"", postalCode:"", city:"",
  birthDate:"", subscription:"", profession:"", facebook:"",
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
        <div style={cols(2)}>
          <div>{lbl("Prénom",true)}<input value={value.firstName} onChange={e=>onChange({...value,firstName:formatName(e.target.value)})} placeholder="Prénom" style={inp(errors.firstName)}/>{err("firstName")}</div>
          <div>{lbl("Nom",true)}<input value={value.lastName} onChange={e=>onChange({...value,lastName:e.target.value.toUpperCase()})} placeholder="Nom" style={inp(errors.lastName)}/>{err("lastName")}</div>
        </div>
        <div>{lbl("Date de naissance")}<BirthDatePicker key={value.birthDate||"empty"} value={value.birthDate} onChange={v=>onChange({...value,birthDate:v})} error={errors.birthDate}/>{err("birthDate")}</div>
      </div>
      <div>
        {sec("📬","Contact")}
        <div style={cols(2)}>
          <div>{lbl("Email",true)}<input value={value.email} onChange={e=>onChange({...value,email:e.target.value})} placeholder="email@exemple.com" type="email" style={inp(errors.email)}/>{err("email")}</div>
          <div>{lbl("Téléphone")}<input value={value.phone} onChange={e=>onChange({...value,phone:formatPhone(e.target.value)})} placeholder="06 00 00 00 00" type="tel" style={inp()}/></div>
        </div>
      </div>
      <div>
        {sec("📍","Adresse & Infos")}
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <div>{lbl("Rue")}<input value={value.address} onChange={e=>onChange({...value,address:e.target.value})} placeholder="12 rue des Lilas" style={inp()}/></div>
          <div style={cols(2)}>
            <div>{lbl("Code postal")}<input value={value.postalCode} onChange={e=>onChange({...value,postalCode:formatPostalCode(e.target.value)})} placeholder="75000" style={inp()}/></div>
            <div>{lbl("Ville")}<input value={value.city} onChange={e=>onChange({...value,city:e.target.value})} placeholder="Paris" style={inp()}/></div>
          </div>
          <div>{lbl("Profession")}<input value={value.profession||""} onChange={e=>onChange({...value,profession:e.target.value})} placeholder="Ex : Ingénieur, Enseignant, Retraité…" style={inp()}/></div>
          <div>{lbl("Facebook")}
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              <input value={value.facebook||""} onChange={e=>onChange({...value,facebook:e.target.value})} placeholder="URL ou nom du profil Facebook" style={{...inp(), flex:1}}/>
              {value.facebook && (
                <a href={value.facebook.startsWith("http") ? value.facebook : `https://facebook.com/${value.facebook}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",width:36,height:36,borderRadius:8,border:`1.5px solid ${C.border}`,background:C.surface,cursor:"pointer",textDecoration:"none",fontSize:16}}
                  title="Ouvrir le profil Facebook">
                  🔗
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

const VO_PLAN_LABEL = {
  monthly: "Mensuel", quarterly: "Trimestriel", biannual: "Semestriel",
  yearly: "Annuel", family: "Famille", one_shot: "Accès 1 mois",
};

function VideoIconSvg({ size = 13, color = "#A85030" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true" style={{verticalAlign:"middle"}}>
      <path d="M4 4h12a2 2 0 0 1 2 2v2.5l3.5-2.5a1 1 0 0 1 1.5.9v10.2a1 1 0 0 1-1.5.9L18 15.5V18a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/>
    </svg>
  );
}

function Members({ isMobile, onImpersonate, openMemberId, onMemberOpened }) {
  const { studioId, studioSlug } = useContext(AppCtx);
  const [voSubs, setVoSubs] = useState(new Map());
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
  const [confirmModal, setConfirmModal] = useState(null); // {title, message, onConfirm, danger?, inputLabel?, inputDefault?}
  const p = isMobile ? 12 : 28;

  const showToast = (msg, ok=true) => { setToast({msg,ok}); setTimeout(()=>setToast(null),3500); };
  const filtered = members.filter(m =>
    `${m.firstName} ${m.lastName} ${m.email}`.toLowerCase().includes(search.toLowerCase())
  );

  // Ouvrir le drawer d'un membre depuis le planning (événement fydelys:openMember)
  useEffect(() => {
    if (!openMemberId || !members.length) return;
    const m = members.find(x => x.id === openMemberId);
    if (m) { setSelected(m); onMemberOpened && onMemberOpened(); }
  }, [openMemberId, members]);

  // Charger les abonnements VideosOnline uniquement pour yogalatestudio
  useEffect(() => {
    if (studioSlug !== "yogalatestudio") { setVoSubs(new Map()); return; }
    const emails = members.map(m => m.email?.toLowerCase()).filter(Boolean);
    if (emails.length === 0) return;
    createClient().from("vo_members")
      .select("email, subscription_plan, subscription_status")
      .in("email", emails)
      .then(({ data }) => {
        const map = new Map();
        (data || []).forEach(v => {
          if (v.email) map.set(v.email.toLowerCase(), { plan: v.subscription_plan, status: v.subscription_status });
        });
        setVoSubs(map);
      });
  }, [studioSlug, members.length]);

  useEffect(() => {
    if (!studioId) return;
    // Charger les abonnements du studio
    createClient().from("subscriptions").select("id,name,price,period,credits").eq("studio_id",studioId).eq("active",true).order("name")
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
        .select("id,first_name,last_name,email,phone,address,postal_code,city,birth_date,status,credits,credits_total,joined_at,next_payment,notes,subscription_id,profile_complete,frozen_until,profession,facebook,subscriptions(name,period)")
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
      subscription:m.subscriptions?.name||"—", subscriptionId:m.subscription_id||null, subPeriod:m.subscriptions?.period||null,
      profileComplete:m.profile_complete, frozenUntil:m.frozen_until||null, profession:m.profession||"", facebook:m.facebook||"",
      avatar:(m.first_name?.[0]||"")+(m.last_name?.[0]||""),
    };
  }

  function dbPayload(f) {
    return {
      first_name:f.firstName, last_name:f.lastName,
      email:f.email.toLowerCase().trim(), phone:f.phone||"",
      address:f.address||null, postal_code:f.postalCode||null, city:f.city||null,
      birth_date:f.birthDate||null, profession:f.profession||null, facebook:f.facebook||null,
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
      showToast(json.limit ? json.error : json.error==="EMAIL_EXISTS" ? "Email déjà utilisé dans ce studio" : "Erreur : "+(json.error||"impossible de créer"), false);
    } else if (json.id) { setMembers(prev=>prev.map(m=>m.id===tempId?{...m,id:json.id}:m)); showToast("Membre créé — invitation envoyée par email ✓"); }
  };

  const startEdit = (m) => {
    setEditForm({ firstName:m.firstName,lastName:m.lastName,email:m.email,phone:m.phone||"",address:m.address||"",postalCode:m.postalCode||"",city:m.city||"",birthDate:m.birthDate||"",subscription:m.subscription||"",profession:m.profession||"",facebook:m.facebook||"" });
    setNMErrors({}); setEditMode(true);
  };

  const saveEdit = async () => {
    const errs=validate(editForm); setNMErrors(errs);
    if (Object.keys(errs).length) return;
    const id=selected.id;
    const updated={...selected,...editForm,postalCode:editForm.postalCode,avatar:(editForm.firstName[0]||"")+(editForm.lastName[0]||"")};
    // Fermer le mode edit d'abord, puis mettre à jour les données en un seul batch
    setEditMode(false);
    // Petit délai pour laisser la modale se fermer avant de mettre à jour le drawer
    requestAnimationFrame(() => {
      setMembers(prev=>prev.map(m=>m.id===id?updated:m));
      setSelected(updated);
    });
    const res = await fetch("/api/members", { method:"PATCH", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ id, ...dbPayload(editForm) }) });
    const json = await res.json();
    if (!res.ok) showToast("Erreur : "+(json.error||"sauvegarde impossible"), false); else showToast("Profil mis à jour ✓");
  };

  const deleteMember = async (id) => {
    const sb = createClient();
    const today = new Date().toISOString().slice(0,10);
    const { count } = await sb.from("bookings").select("id", { count:"exact", head:true })
      .eq("member_id", id).eq("status", "confirmed").gte("session_date", today);
    const m = members.find(x=>x.id===id);
    const name = m ? `${m.firstName} ${m.lastName}` : "ce membre";
    const msg = count && count > 0
      ? `${name} a ${count} réservation${count>1?"s":""} future${count>1?"s":""}. L'historique sera conservé mais le compte sera désactivé.`
      : `Supprimer ${name} ? L'historique sera conservé mais le compte sera désactivé.`;
    setConfirmModal({
      title: "Supprimer le membre",
      message: msg,
      danger: true,
      onConfirm: async () => {
        setMembers(prev=>prev.filter(x=>x.id!==id)); setSelected(null);
        await fetch(`/api/members?id=${id}`, { method:"DELETE" });
        showToast("Membre supprimé");
        setConfirmModal(null);
      },
    });
  };

  const Modal = ({children}) => (
    <div style={{position:"fixed",inset:0,background:"rgba(42,31,20,.45)",zIndex:700,display:"flex",alignItems:isMobile?"flex-end":"center",justifyContent:"center",padding:isMobile?0:16}}
      onClick={e=>{if(e.target===e.currentTarget)setModal(null);}}>
      <div style={{background:C.surface,borderRadius:isMobile?"16px 16px 0 0":16,padding:isMobile?"18px 18px 28px":24,width:"100%",maxWidth:isMobile?"100%":480,boxShadow:"0 24px 60px rgba(0,0,0,.18)",maxHeight:isMobile?"90vh":"85vh",overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
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

  const saveSubscription = async () => {
    const subId = modal.subId ?? (modal.member.subscriptionId || "");
    const payMode = modal.paymentMode || "";
    setModal(prev => ({...prev, saving:true}));
    const sub = subscriptionsList.find(s=>s.id===subId);
    const res = await fetch("/api/members", { method:"PATCH", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ id: modal.member.id, subscription_id: subId || null }) });
    // Enregistrer le paiement si abonnement + mode de paiement renseigné
    if (res.ok && subId && payMode && sub?.price) {
      await createClient().from("member_payments").insert({
        studio_id: studioId, member_id: modal.member.id,
        amount: sub.price, status: "payé",
        payment_date: new Date().toISOString().slice(0,10),
        payment_type: payMode, source: "manual",
        notes: sub.name,
      });
    }
    // Ajouter les crédits de l'abonnement au membre (uniquement si changement réel d'abonnement)
    const previousSubId = modal.member.subscriptionId || null;
    const subChanged = subId && subId !== previousSubId;
    if (res.ok && sub?.credits && subChanged) {
      const currentCredits = modal.member.credits || 0;
      const currentTotal = modal.member.creditTotal || 0;
      await createClient().from("members").update({
        credits: currentCredits + sub.credits,
        credits_total: currentTotal + sub.credits,
      }).eq("id", modal.member.id);
      setMembers(prev=>prev.map(m => m.id===modal.member.id ? {...m, credits:currentCredits+sub.credits, creditTotal:currentTotal+sub.credits} : m));
      setSelected(prev=>prev?.id===modal.member.id ? {...prev, credits:currentCredits+sub.credits, creditTotal:currentTotal+sub.credits} : prev);
    }
    setModal(prev => ({...prev, saving:false}));
    if (res.ok) {
      const newSub = sub?.name||"—";
      setMembers(prev=>prev.map(m => m.id===modal.member.id ? {...m, subscriptionId:subId||null, subscription:newSub} : m));
      setSelected(prev=>prev?.id===modal.member.id ? {...prev, subscriptionId:subId||null, subscription:newSub} : prev);
      setModal(null);
      showToast("Abonnement mis à jour ✓");
    } else { showToast("Erreur lors de la sauvegarde",false); setModal(prev => ({...prev, saving:false})); }
  };

  const SubscriptionModal = () => {
    const subId = modal.subId ?? (modal.member.subscriptionId || "");
    const payMode = modal.paymentMode ?? "";
    return <Modal>
      <ModalHeader title={`Abonnement — ${modal.member.firstName} ${modal.member.lastName}`} onClose={()=>setModal(null)}/>
      <div style={{marginBottom:16}}>
        <div style={{fontSize:12,color:C.textMuted,fontWeight:600,marginBottom:8,textTransform:"uppercase"}}>Abonnement actuel</div>
        <div style={{padding:"10px 14px",background:C.accentBg,borderRadius:8,fontSize:15,fontWeight:700,color:C.accentDark}}>
          {modal.member.subscription||"—"}
        </div>
      </div>
      <div style={{marginBottom:14}}>
        <FieldLabel>Nouvel abonnement</FieldLabel>
        <select value={subId} onChange={e=>setModal(prev=>({...prev, subId:e.target.value}))}
          style={{width:"100%",padding:"9px 12px",border:`1.5px solid ${C.border}`,borderRadius:8,fontSize:13,color:C.text,background:C.surfaceWarm,outline:"none"}}>
          <option value="">— Aucun abonnement —</option>
          {subscriptionsList.map(s=><option key={s.id} value={s.id}>{s.name}{s.price ? ` — ${s.price} €` : ""}</option>)}
        </select>
      </div>
      <div style={{marginBottom:18}}>
        <FieldLabel>Mode de paiement</FieldLabel>
        <select value={payMode} onChange={e=>setModal(prev=>({...prev, paymentMode:e.target.value}))}
          style={{width:"100%",padding:"9px 12px",border:`1.5px solid ${C.border}`,borderRadius:8,fontSize:13,color:C.text,background:C.surfaceWarm,outline:"none"}}>
          <option value="">— Non renseigné —</option>
          <option value="Carte">Carte bancaire</option>
          <option value="Espèces">Espèces</option>
          <option value="Chèque">Chèque</option>
          <option value="Virement">Virement</option>
          <option value="Prélèvement">Prélèvement</option>
        </select>
      </div>
      <div style={{display:"flex",gap:10}}>
        <Button variant="primary" onClick={saveSubscription} disabled={modal.saving}>{modal.saving?"Enregistrement…":"Enregistrer"}</Button>
        <Button variant="ghost" onClick={()=>setModal(null)} disabled={modal.saving}>Annuler</Button>
      </div>
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
            <div style={{fontSize:12,color:C.textMuted,marginTop:4}}>Ce membre n'a pas encore de réservations.</div>
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
        // Log activité "offre de séances" (plus précis que le log auto PATCH)
        await createClient().from("member_activity").insert({
          member_id: m.id, studio_id: studioId,
          actor_role: "admin", action: "credit_add",
          details: { amount: parseInt(qty), source: "admin_gift", reason: reason || null },
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
    const infoRow=(ico,lbl,val)=>val?<div style={{display:"flex",alignItems:"flex-start",gap:8,padding:"6px 0"}}><span style={{fontSize:14,flexShrink:0,marginTop:1}}>{ico}</span><div><div style={{fontSize:11,fontWeight:700,color:C.textMuted,textTransform:"uppercase",letterSpacing:.5}}>{lbl}</div><div style={{fontSize:13,color:C.text,fontWeight:500,wordBreak:"break-word"}}>{val}</div></div></div>:null;
    const isFrozen = m.frozenUntil && new Date(m.frozenUntil) >= new Date(new Date().toISOString().slice(0,10));
    const actionBtn = (label, onClick, primary) => (
      <button onClick={onClick} style={{
        minHeight:38, padding:"8px 12px", borderRadius:10,
        border:primary?"none":`1.5px solid ${C.border}`, background:primary?"linear-gradient(145deg,#B88050,#9A6030)":C.surface,
        color:primary?"#fff":C.textMid, fontSize:12, fontWeight:600, cursor:"pointer",
        display:"flex", alignItems:"center", justifyContent:"center", gap:5, whiteSpace:"nowrap",
      }}>{label}</button>
    );
    return (
      <div onClick={e=>{if(e.target===e.currentTarget)setSelected(null)}}
        style={{position:"fixed",inset:0,background:"rgba(42,31,20,.4)",zIndex:500,display:"flex",justifyContent:isMobile?"center":"flex-end",alignItems:isMobile?"flex-end":"stretch"}}>
        <div style={{
          background:C.surface,width:isMobile?"100%":420,maxHeight:isMobile?"92vh":"100vh",
          overflowY:"auto",boxShadow:isMobile?"0 -8px 40px rgba(42,31,20,.2)":"-8px 0 40px rgba(42,31,20,.15)",
          borderRadius:isMobile?"16px 16px 0 0":0,
          animation:"slideIn .2s ease",
          WebkitOverflowScrolling:"touch",
        }}>
          <style>{`@keyframes slideIn { from { transform: translate${isMobile?"Y(40px)":"X(40px)"}; opacity:0; } to { transform: none; opacity:1; } }`}</style>

          {/* Handle bar mobile */}
          {isMobile && <div style={{display:"flex",justifyContent:"center",padding:"10px 0 4px"}}><div style={{width:36,height:4,borderRadius:2,background:C.border}}/></div>}

          <div style={{padding:isMobile?"12px 18px 24px":"24px 28px"}}>
            {/* Header */}
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:16,gap:10}}>
              <div style={{display:"flex",alignItems:"center",gap:12,flex:1,minWidth:0}}>
                <div style={{width:44,height:44,borderRadius:"50%",background:C.accentBg,border:`1.5px solid #DFC0A0`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,color:C.accent,flexShrink:0}}>{m.avatar}</div>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:isMobile?17:19,fontWeight:800,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.firstName} {m.lastName}</div>
                  <div style={{fontSize:12,color:C.textSoft,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.email}</div>
                  {m.phone&&<div style={{fontSize:12,color:C.textSoft,marginTop:1}}>{m.phone}</div>}
                  {m.profileComplete===false&&<div style={{fontSize:11,color:C.warn,fontWeight:600,marginTop:2}}>Profil non complété</div>}
                </div>
              </div>
              <div style={{display:"flex",gap:6,flexShrink:0}}>
                <button onClick={()=>startEdit(m)} style={{fontSize:12,padding:"6px 10px",borderRadius:8,border:`1.5px solid ${C.border}`,background:C.surface,color:C.textMid,cursor:"pointer",fontWeight:600}}>Modifier</button>
                <button onClick={()=>setSelected(null)} style={{background:"none",border:`1.5px solid ${C.border}`,borderRadius:8,padding:"5px 7px",cursor:"pointer",display:"flex",alignItems:"center"}}><IcoX s={14} c={C.textSoft}/></button>
              </div>
            </div>

            {/* KPIs */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
              {[["Abonnement",m.subscription],["Statut",m.status],["Membre depuis",m.joined?new Date(m.joined).toLocaleDateString("fr-FR"):"—"],["Crédits",`${m.credits} séance${Math.abs(m.credits)!==1?"s":""}`]].map(([l,v])=>(
                <div key={l} style={{background:l==="Crédits"&&m.credits<=0?"#FDE8E8":C.bg,borderRadius:8,padding:"10px 12px",border:`1px solid ${l==="Crédits"&&m.credits<=0?"#F5C2C2":C.border}`}}>
                  <div style={{fontSize:10,fontWeight:700,color:C.textMuted,textTransform:"uppercase",marginBottom:2}}>{l}</div>
                  <div style={{fontSize:14,fontWeight:600,color:l==="Crédits"&&m.credits<=0?"#C43A3A":C.text,textTransform:"capitalize"}}>{v}</div>
                </div>
              ))}
            </div>

            {/* Videos Online — uniquement yogalatestudio */}
            {studioSlug === "yogalatestudio" && voSubs.has(m.email?.toLowerCase() || "") && (() => {
              const vo = voSubs.get(m.email.toLowerCase());
              return (
                <div style={{ background:"linear-gradient(145deg,#F5EBE0,#EFDFCB)", border:`1.5px solid ${C.accent}40`, borderRadius:10, padding:"10px 14px", marginBottom:12, display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ width:32, height:32, borderRadius:"50%", background:"#FFF", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <VideoIconSvg size={16} color="#8C5E38"/>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:"#8C5E38", textTransform:"uppercase", letterSpacing:.8, marginBottom:2 }}>Videos Online</div>
                    <div style={{ fontSize:13, fontWeight:600, color:C.text }}>
                      {VO_PLAN_LABEL[vo.plan] || "Sans formule"}
                      {vo.status && <span style={{ marginLeft:8, fontSize:11, fontWeight:500, color: vo.status === "active" ? C.ok : vo.status === "trialing" ? C.info : C.textSoft }}>· {vo.status}</span>}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Infos perso */}
            <div style={{marginBottom:14,background:C.bg,borderRadius:10,padding:"10px 14px",border:`1px solid ${C.borderSoft}`}}>
              {infoRow("🎂","Date de naissance",birthdayFmt)}
              {infoRow("📍","Adresse",adresseFull||null)}
              {infoRow("💼","Profession",m.profession||null)}
              {m.facebook && infoRow("📘","Facebook",<a href={m.facebook.startsWith("http")?m.facebook:`https://facebook.com/${m.facebook}`} target="_blank" rel="noopener noreferrer" style={{color:C.accent,textDecoration:"none",fontWeight:600}}>{m.facebook} 🔗</a>)}
            </div>

            {/* Invités enregistrés */}
            <GuestsList memberId={m.id} studioId={studioId}/>

            {/* Gel alert */}
            {isFrozen && (
              <div style={{marginBottom:12,padding:"8px 12px",background:"#FFF8E8",border:"1.5px solid #F0D080",borderRadius:8,fontSize:12,color:"#8B6914",fontWeight:600}}>
                Gelé jusqu'au {new Date(m.frozenUntil).toLocaleDateString("fr-FR")}
              </div>
            )}

            {/* Actions */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {onImpersonate && actionBtn(<>👁 Vue membre</>, ()=>onImpersonate("adherent", m.id, `${m.firstName} ${m.lastName}`.trim()), true)}
              {actionBtn(<><IcoMail s={13} c={onImpersonate?"currentColor":"white"}/> Email</>, ()=>setModal({type:"email",member:m}), !onImpersonate)}
              {actionBtn(<>🔗 Renvoyer lien</>, async()=>{
                try {
                  const res = await fetch("/api/send-magic-link", {
                    method:"POST", headers:{"Content-Type":"application/json"},
                    body: JSON.stringify({ email: m.email, tenantSlug: window.location.hostname.split(".")[0] }),
                  });
                  if (res.ok) showToast(`Lien de connexion envoyé à ${m.email}`);
                  else showToast("Erreur lors de l'envoi", false);
                } catch { showToast("Erreur réseau", false); }
              })}
              {actionBtn(<><IcoTag2 s={13} c={C.textMid}/> Abonnement</>, ()=>setModal({type:"subscription",member:m}))}
              {actionBtn(<><IcoCalendar2 s={13} c={C.textMid}/> Historique</>, ()=>setModal({type:"history",member:m}))}
              {actionBtn(<>🎁 Offrir séances</>, ()=>setModal({type:"gift",member:m}))}
              {actionBtn(<><IcoX s={13} c="#A85030"/> Supprimer</>, ()=>deleteMember(m.id))}
              {isFrozen
                ? actionBtn(<>&#10052; Dégeler</>, async()=>{
                    await createClient().from("members").update({frozen_until:null, status:"actif"}).eq("id",m.id);
                    setMembers(prev=>prev.map(x=>x.id===m.id?{...x,frozenUntil:null,status:"actif"}:x));
                    setSelected(prev=>prev?{...prev,frozenUntil:null,status:"actif"}:prev);
                    showToast("Membre dégelé");
                  })
                : actionBtn(<>&#10052; Geler</>, ()=>{
                    setConfirmModal({
                      title: "Geler le compte",
                      message: `Geler le compte de ${m.firstName} ${m.lastName} ? Le membre ne pourra plus réserver ni se connecter.`,
                      inputLabel: "Jusqu'au",
                      inputDefault: new Date(Date.now()+30*86400000).toISOString().slice(0,10),
                      onConfirm: async (val) => {
                        const until = val?.trim();
                        if (!until || !/^\d{4}-\d{2}-\d{2}$/.test(until)) return;
                        await createClient().from("members").update({frozen_until:until, status:"suspendu"}).eq("id",m.id);
                        setMembers(prev=>prev.map(x=>x.id===m.id?{...x,frozenUntil:until,status:"suspendu"}:x));
                        setSelected(prev=>prev?{...prev,frozenUntil:until,status:"suspendu"}:prev);
                        showToast(`Gelé jusqu'au ${new Date(until).toLocaleDateString("fr-FR")}`);
                        setConfirmModal(null);
                      },
                    });
                  })
              }
            </div>
          </div>
        </div>
      </div>
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

      {/* Confirm modal (remplace window.confirm/prompt) */}
      {confirmModal && (
        <div style={{position:"fixed",inset:0,background:"rgba(42,31,20,.5)",zIndex:1100,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}
          onClick={()=>setConfirmModal(null)}>
          <div style={{background:C.surface,borderRadius:16,padding:24,width:"100%",maxWidth:380,boxShadow:"0 16px 48px rgba(0,0,0,.2)"}}
            onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:16,fontWeight:800,color:C.text,marginBottom:8}}>{confirmModal.title}</div>
            <div style={{fontSize:14,color:C.textMid,lineHeight:1.5,marginBottom:confirmModal.inputLabel?12:20}}>{confirmModal.message}</div>
            {confirmModal.inputLabel && (
              <div style={{marginBottom:20}}>
                <div style={{fontSize:12,fontWeight:600,color:C.textSoft,marginBottom:4}}>{confirmModal.inputLabel}</div>
                <input id="confirm-input" type="date" defaultValue={confirmModal.inputDefault||""}
                  style={{width:"100%",padding:"9px 12px",borderRadius:9,border:`1.5px solid ${C.border}`,fontSize:14,outline:"none",boxSizing:"border-box",background:"#FDFAF7",color:C.text}}/>
              </div>
            )}
            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
              <button onClick={()=>setConfirmModal(null)}
                style={{padding:"9px 18px",borderRadius:9,border:`1.5px solid ${C.border}`,background:C.surface,color:C.textMid,fontSize:13,fontWeight:600,cursor:"pointer"}}>
                Annuler
              </button>
              <button onClick={()=>{
                  const val = confirmModal.inputLabel ? document.getElementById("confirm-input")?.value : null;
                  confirmModal.onConfirm(val);
                }}
                style={{padding:"9px 18px",borderRadius:9,border:"none",
                  background:confirmModal.danger?"#A85030":C.accent,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Modifier */}
      {editMode && editForm && (
        <div style={{position:"fixed",inset:0,background:"rgba(42,31,20,.5)",zIndex:600,display:"flex",alignItems:isMobile?"flex-end":"center",justifyContent:"center",padding:isMobile?0:16}}
          onClick={e=>{if(e.target===e.currentTarget){setEditMode(false);setNMErrors({});}}}>
          <div style={{
            background:C.surface,borderRadius:isMobile?"16px 16px 0 0":16,padding:isMobile?"16px 18px 28px":24,
            width:"100%",maxWidth:isMobile?"100%":580,boxShadow:"0 -8px 40px rgba(0,0,0,.2)",
            maxHeight:isMobile?"95vh":"90vh",overflowY:"auto",WebkitOverflowScrolling:"touch",
          }} onClick={e=>e.stopPropagation()}>
            {isMobile && <div style={{display:"flex",justifyContent:"center",padding:"0 0 10px"}}><div style={{width:36,height:4,borderRadius:2,background:C.border}}/></div>}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <div style={{fontSize:15,fontWeight:800,color:C.text}}>Modifier le profil</div>
              <button onClick={()=>{setEditMode(false);setNMErrors({});}} style={{background:"none",border:`1.5px solid ${C.border}`,borderRadius:8,padding:"5px 8px",cursor:"pointer"}}><IcoX s={14} c={C.textSoft}/></button>
            </div>
            <MemberForm value={editForm} onChange={setEditForm} errors={nMErrors} isMobile={isMobile}/>
            <div style={{display:"flex",gap:10,marginTop:20,padding:"12px 0 0",borderTop:`1px solid ${C.border}`}}>
              <Button variant="primary" onClick={saveEdit} style={{flex:1}}>Enregistrer</Button>
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
          <Button sm variant="ghost" onClick={()=>window.open(`/api/export?type=members&studioId=${studioId}`)}>Exporter</Button>
          <Button sm variant="primary" onClick={()=>{setShowAdd(!showAdd);setNM(EMPTY_FORM);setNMErrors({});}}>＋ {!isMobile&&"Membre"}</Button>
        </div>

        {showAdd && (
          <Card style={{marginBottom:16,borderTop:`3px solid ${C.accent}`}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
              <div style={{fontSize:13,fontWeight:800,color:C.accent,textTransform:"uppercase",letterSpacing:.6}}>Nouveau membre</div>
              <div style={{display:"flex",gap:8}}>
                <Button variant="primary" sm onClick={add}>✦ Valider</Button>
                <Button variant="ghost" sm onClick={()=>{setShowAdd(false);setNMErrors({});}}>Annuler</Button>
              </div>
            </div>
            <MemberForm value={nM} onChange={setNM} errors={nMErrors} isMobile={isMobile}/>
            <div style={{marginTop:18,display:"flex",gap:10}}>
              <Button variant="primary" onClick={add}>✦ Créer le membre</Button>
              <Button variant="ghost" onClick={()=>{setShowAdd(false);setNMErrors({});}}>Annuler</Button>
            </div>
          </Card>
        )}

        {dbLoading ? (
          <div style={{textAlign:"center",padding:"40px 0",color:C.textMuted,fontSize:15}}>⏳ Chargement…</div>
        ) : filtered.length===0 ? (
          search ? <EmptyState icon="👤" title="Aucun résultat" sub="Essayez un autre nom ou email"/>
          : <div style={{ textAlign:"center", padding:"40px 16px" }}>
              <div style={{ fontSize:48, marginBottom:12 }}>👥</div>
              <div style={{ fontSize:18, fontWeight:700, color:C.text, marginBottom:8 }}>Aucun membre</div>
              <div style={{ fontSize:14, color:C.textSoft, lineHeight:1.6, marginBottom:20, maxWidth:400, margin:"0 auto 20px" }}>
                Ajoutez votre premier membre. Un magic link de connexion lui sera envoyé par email.
              </div>
              <div style={{ display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap" }}>
                <button onClick={()=>{setShowAdd(true);setNM(EMPTY_FORM);setNMErrors({});}}
                  style={{ padding:"10px 20px", borderRadius:10, border:"none", background:C.accent, color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer" }}>
                  + Ajouter un membre
                </button>
                <button onClick={()=>window.dispatchEvent(new CustomEvent("fydelys:nav",{detail:"aide"}))}
                  style={{ padding:"10px 20px", borderRadius:10, border:`1.5px solid ${C.border}`, background:C.surface, color:C.textMid, fontSize:14, fontWeight:600, cursor:"pointer" }}>
                  ? Aide
                </button>
              </div>
            </div>
        ) : (
          <Card noPad>{filtered.map(m=>{
            const voKey = m.email?.toLowerCase() || "";
            const voSub = voSubs.get(voKey);
            return <MemberRow key={m.id} m={{...m, voSub}} onSelect={m=>setSelected(selected?.id===m.id?null:m)} selected={selected?.id===m.id}/>;
          })}</Card>
        )}
      </div>
      {selected && !editMode && !modal && <MemberDetail/>}
    </div>
  );
}

export { Members };