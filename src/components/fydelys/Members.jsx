"use client";

import React, { useState, useEffect, useContext } from "react";
import { createClient } from "@/lib/supabase";
import { AppCtx } from "./context";
import { C } from "./theme";
import { MEMBERS_DEMO, SUBSCRIPTIONS_DEMO, SESSIONS_DEMO, BOOKINGS_DEMO, SUBSCRIPTIONS_INIT } from "./demoData";
import { IcoUserPlus2, IcoMail, IcoUser2, IcoCalendar2, IcoX, IcoCheck, IcoTag2 , IcoSearch } from "./icons";
import { Card, SectionHead, Button, Field, FieldLabel, Tag, Pill, MemberRow, DemoBanner, EmptyState, CreditBadge } from "./ui";

function Members({ isMobile }) {
  const { studioId } = useContext(AppCtx);
  const [members, setMembers] = useState([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [isDemoData, setIsDemoData] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [nM, setNM] = useState({ firstName:"", lastName:"", email:"", phone:"" });
  const [nMErrors, setNMErrors] = useState({});
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const showToast = (msg, ok=true) => { setToast({msg,ok}); setTimeout(()=>setToast(null),3500); };
  const p = isMobile?12:28;
  const filtered = members.filter(m=>`${m.firstName} ${m.lastName} ${m.email}`.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    if (!studioId) return;
    setDbLoading(true);
    createClient().from("members")
      .select("id, first_name, last_name, email, phone, status, credits, joined_at, next_payment, notes, subscriptions(name)")
      .eq("studio_id", studioId).order("last_name")
      .then(({ data, error }) => {
        if (error) { console.error("load members", error); setDbLoading(false); return; }
        if (!data || data.length === 0) { setMembers(MEMBERS_DEMO); setIsDemoData(true); setDbLoading(false); return; }
        if (data) setMembers(data.map(m => ({
          id: m.id, firstName: m.first_name, lastName: m.last_name,
          email: m.email, phone: m.phone || "", status: m.status || "actif",
          credits: m.credits || 0, joined: m.joined_at, nextPayment: m.next_payment,
          notes: m.notes || "", subscription: m.subscriptions?.name || "—",
          avatar: (m.first_name?.[0]||"")+(m.last_name?.[0]||""),
        })));
        setDbLoading(false);
      });
  }, [studioId]);

  const add = async () => {
    const errs = {};
    if (!nM.firstName.trim()) errs.firstName = true;
    if (!nM.email.trim()) errs.email = true;
    setNMErrors(errs);
    if (Object.keys(errs).length || !studioId) return;
    // Vérifier doublon email dans ce studio
    const { data: existing } = await createClient().from("members")
      .select("id").eq("studio_id", studioId).eq("email", nM.email.toLowerCase().trim()).single();
    if (existing) { showToast("Un membre avec cet email existe déjà ✕"); return; }
    const tempId = `tmp-${Date.now()}`;
    setMembers(prev=>[...prev, { id:tempId, ...nM, joined:new Date().toISOString().split("T")[0], status:"nouveau", credits:0, nextPayment:null, subscription:"—", avatar:(nM.firstName[0]||"")+(nM.lastName[0]||"") }]);
    setShowAdd(false);
    setNM({ firstName:"", lastName:"", email:"", phone:"" });
    setNMErrors({});
    try {
      const { data, error } = await createClient().from("members").insert({
        studio_id: studioId, first_name: nM.firstName, last_name: nM.lastName,
        email: nM.email.toLowerCase().trim(), phone: nM.phone || "", status: "nouveau", credits: 0,
        joined_at: new Date().toISOString().split("T")[0],
      }).select("id").single();
      if (error) {
        console.error("insert member", error);
        setMembers(prev=>prev.filter(m=>m.id!==tempId));
        if (error.code === "23505") showToast("Email déjà utilisé dans ce studio ✕");
      } else if (data?.id) setMembers(prev=>prev.map(m=>m.id===tempId?{...m,id:data.id}:m));
    } catch(e) { console.error("insert member", e); }
  };

  const updateMember = async (id, updates) => {
    setMembers(prev=>prev.map(m=>m.id===id?{...m,...updates}:m));
    const map = {};
    if (updates.status !== undefined)  map.status = updates.status;
    if (updates.credits !== undefined) map.credits = updates.credits;
    if (updates.notes !== undefined)   map.notes = updates.notes;
    if (updates.nextPayment !== undefined) map.next_payment = updates.nextPayment;
    if (updates.firstName !== undefined) map.first_name = updates.firstName;
    if (updates.lastName !== undefined)  map.last_name = updates.lastName;
    if (updates.phone !== undefined)     map.phone = updates.phone;
    if (Object.keys(map).length) {
      try { await createClient().from("members").update(map).eq("id", id); }
      catch(e) { console.error("update member", e); }
    }
  };

  const deleteMember = async (id) => {
    setMembers(prev=>prev.filter(m=>m.id!==id));
    try { await createClient().from("members").delete().eq("id", id); }
    catch(e) { console.error("delete member", e); }
  };

  // Mock session history per member
  const SESSION_HISTORY = [
    { date:"2026-03-09", disc:"Yoga Vinyasa",  teacher:"Sophie Laurent", status:"présent" },
    { date:"2026-03-05", disc:"Pilates",        teacher:"Marie Dubois",   status:"présent" },
    { date:"2026-02-28", disc:"Méditation",     teacher:"Camille Morin",  status:"présent" },
    { date:"2026-02-24", disc:"Yoga Vinyasa",   teacher:"Sophie Laurent", status:"absent" },
    { date:"2026-02-18", disc:"Yin Yoga",       teacher:"Camille Morin",  status:"présent" },
  ];

  // ── Modals ────────────────────────────────────────────────────────────────
  const Modal = ({ children }) => (
    <div style={{ position:"fixed", inset:0, background:"rgba(42,31,20,.45)", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
      onClick={e=>{ if(e.target===e.currentTarget) setModal(null); }}>
      <div style={{ background:C.surface, borderRadius:16, padding:24, width:"100%", maxWidth:480, boxShadow:"0 24px 60px rgba(0,0,0,.18)", maxHeight:"85vh", overflowY:"auto" }}>
        {children}
      </div>
    </div>
  );

  const ModalHeader = ({ title, onClose }) => (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
      <div style={{ fontSize:16, fontWeight:800, color:C.text }}>{title}</div>
      <button onClick={onClose} style={{ background:"none", border:`1.5px solid ${C.border}`, borderRadius:8, padding:"4px 7px", cursor:"pointer", display:"flex" }}><IcoX s={15} c={C.textSoft}/></button>
    </div>
  );

  const EmailModal = () => {
    const [subject, setSubject] = useState(`Bonjour ${modal.member.firstName}`);
    const [body, setBody] = useState("");
    const [sent, setSent] = useState(false);
    return (
      <Modal>
        <ModalHeader title={`Email à ${modal.member.firstName} ${modal.member.lastName}`} onClose={()=>setModal(null)}/>
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", background:C.bg, borderRadius:8, marginBottom:14 }}>
          <IcoMail s={14} c={C.textSoft}/>
          <span style={{ fontSize:13, color:C.textSoft }}>{modal.member.email}</span>
        </div>
        <div style={{ marginBottom:12 }}>
          <FieldLabel>Objet</FieldLabel>
          <input value={subject} onChange={e=>setSubject(e.target.value)}
            style={{ width:"100%", padding:"9px 12px", border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:14, outline:"none", boxSizing:"border-box", color:C.text, background:C.surfaceWarm }}
            onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/>
        </div>
        <div style={{ marginBottom:16 }}>
          <FieldLabel>Message</FieldLabel>
          <textarea value={body} onChange={e=>setBody(e.target.value)} rows={5} placeholder="Votre message…"
            style={{ width:"100%", padding:"9px 12px", border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:14, outline:"none", boxSizing:"border-box", color:C.text, background:C.surfaceWarm, resize:"vertical", fontFamily:"inherit" }}
            onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/>
        </div>
        {sent
          ? <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px", background:C.okBg, borderRadius:8, color:C.ok, fontWeight:600, fontSize:14 }}><IcoCheck s={16} c={C.ok}/>Email envoyé avec succès !</div>
          : <div style={{ display:"flex", gap:10 }}>
              <Button variant="primary" onClick={()=>setSent(true)}><span style={{display:"flex",alignItems:"center",gap:6}}><IcoMail s={14} c="white"/>Envoyer</span></Button>
              <Button variant="ghost" onClick={()=>setModal(null)}>Annuler</Button>
            </div>
        }
      </Modal>
    );
  };

  const SubscriptionModal = () => {
    const [sub, setSub] = useState(modal.member.subscription);
    const [saved, setSaved] = useState(false);
    return (
      <Modal>
        <ModalHeader title={`Abonnement — ${modal.member.firstName} ${modal.member.lastName}`} onClose={()=>setModal(null)}/>
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:12, color:C.textMuted, fontWeight:600, marginBottom:8, textTransform:"uppercase" }}>Abonnement actuel</div>
          <div style={{ padding:"10px 14px", background:C.accentBg, borderRadius:8, fontSize:15, fontWeight:700, color:C.accentDark }}>{modal.member.subscription}</div>
        </div>
        <div style={{ marginBottom:18 }}>
          <FieldLabel>Nouvel abonnement</FieldLabel>
          <Field value={sub} onChange={setSub} opts={SUBSCRIPTIONS_INIT.map(s=>({v:s.name,l:s.name}))}/>
        </div>
        {saved
          ? <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px", background:C.okBg, borderRadius:8, color:C.ok, fontWeight:600, fontSize:14 }}><IcoCheck s={16} c={C.ok}/>Abonnement mis à jour !</div>
          : <div style={{ display:"flex", gap:10 }}>
              <Button variant="primary" onClick={()=>{ setMembers(prev=>prev.map(m=>m.id===modal.member.id?{...m,subscription:sub}:m)); setSaved(true); }}>Enregistrer</Button>
              <Button variant="ghost" onClick={()=>setModal(null)}>Annuler</Button>
            </div>
        }
      </Modal>
    );
  };

  const HistoryModal = () => (
    <Modal>
      <ModalHeader title={`Séances — ${modal.member.firstName} ${modal.member.lastName}`} onClose={()=>setModal(null)}/>
      <div style={{ display:"flex", gap:14, marginBottom:16 }}>
        {[["Séances",SESSION_HISTORY.length],["Présences",SESSION_HISTORY.filter(s=>s.status==="présent").length],["Absences",SESSION_HISTORY.filter(s=>s.status==="absent").length]].map(([l,v])=>(
          <div key={l} style={{ flex:1, textAlign:"center", padding:"10px 8px", background:C.bg, borderRadius:10, border:`1.5px solid ${C.border}` }}>
            <div style={{ fontSize:22, fontWeight:800, color:C.text }}>{v}</div>
            <div style={{ fontSize:11, color:C.textSoft }}>{l}</div>
          </div>
        ))}
      </div>
      {SESSION_HISTORY.map((s,i)=>(
        <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"9px 0", borderBottom:`1px solid ${C.borderSoft}` }}>
          <div style={{ width:32, height:32, borderRadius:8, background:s.status==="présent"?C.okBg:C.warnBg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            {s.status==="présent" ? <IcoCheck s={14} c={C.ok}/> : <IcoX s={14} c={C.warn}/>}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:700, color:C.text }}>{s.disc}</div>
            <div style={{ fontSize:12, color:C.textSoft }}>{s.teacher} · {new Date(s.date).toLocaleDateString("fr-FR")}</div>
          </div>
          <span style={{ fontSize:12, fontWeight:600, color:s.status==="présent"?C.ok:C.warn }}>{s.status}</span>
        </div>
      ))}
    </Modal>
  );

  return (
    <div>
      {isDemoData && <DemoBanner/>}
      <div style={{ padding:p }}>
      {modal?.type==="email"        && <EmailModal/>}
      {modal?.type==="subscription" && <SubscriptionModal/>}
      {modal?.type==="history"      && <HistoryModal/>}

      <div style={{ display:"flex", gap:10, marginBottom:18, alignItems:"center" }}>
        <div style={{ position:"relative", display:"flex", alignItems:"center", flex:1 }}>
          <span style={{ position:"absolute", left:10, pointerEvents:"none", display:"flex" }}><IcoSearch s={15} c={C.textMuted}/></span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher…"
            style={{ flex:1, padding:isMobile?"9px 12px":"10px 14px", paddingLeft:34, border:`1px solid ${C.border}`, borderRadius:8, fontSize:16, outline:"none", color:C.text, background:C.surfaceWarm, width:"100%" }}
            onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/>
        </div>
        <Button sm variant="primary" onClick={()=>setShowAdd(!showAdd)}>＋ {!isMobile&&"Adhérent"}</Button>
      </div>
      {showAdd && (
        <Card style={{ marginBottom:16, borderTop:`3px solid ${C.accent}` }}>
          <div style={{ fontSize:14, fontWeight:700, color:C.accent, textTransform:"uppercase", marginBottom:16 }}>Nouvel adhérent</div>
          <div style={{ display:"grid", gridTemplateColumns:`repeat(${isMobile?1:3},1fr)`, gap:14 }}>
            <div>
              <Field label={<span>Prénom <span style={{color:"#C43A3A"}}>*</span></span>} value={nM.firstName} onChange={v=>{setNM({...nM,firstName:v});setNMErrors(e=>({...e,firstName:false}))}} placeholder="Prénom" error={nMErrors.firstName}/>
              {nMErrors.firstName && <div style={{fontSize:11,color:"#C43A3A",marginTop:3}}>Champ obligatoire</div>}
            </div>
            <Field label="Nom" value={nM.lastName} onChange={v=>setNM({...nM,lastName:v})} placeholder="Nom"/>
            <div>
              <Field label={<span>Email <span style={{color:"#C43A3A"}}>*</span></span>} value={nM.email} onChange={v=>{setNM({...nM,email:v});setNMErrors(e=>({...e,email:false}))}} placeholder="email@..." error={nMErrors.email}/>
              {nMErrors.email && <div style={{fontSize:11,color:"#C43A3A",marginTop:3}}>Champ obligatoire</div>}
            </div>
            <Field label="Téléphone"  value={nM.phone}        onChange={v=>setNM({...nM,phone:v})}        placeholder="06..."/>
            <Field label="Abonnement" value={nM.subscription} onChange={v=>setNM({...nM,subscription:v})} opts={SUBSCRIPTIONS_INIT.map(s=>({v:s.name,l:s.name}))}/>
          </div>
          <div style={{ marginTop:14, display:"flex", gap:10 }}>
            <Button variant="primary" onClick={add}>Créer l'adhérent</Button>
            <Button variant="ghost" onClick={()=>setShowAdd(false)}>Annuler</Button>
          </div>
        </Card>
      )}
      {<Card noPad>{filtered.map(m=><MemberRow key={m.id} m={m} onSelect={m=>setSelected(selected?.id===m.id?null:m)} selected={selected?.id===m.id}/>)}</Card>
      }
      {selected && (
        <Card style={{ marginTop:16, borderTop:`3px solid ${C.accent}` }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
            <div style={{ display:"flex", alignItems:"center", gap:14 }}>
              <div style={{ width:46, height:46, borderRadius:"50%", background:C.accentBg, border:`1.5px solid #DFC0A0`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:700, color:C.accent }}>{selected.avatar}</div>
              <div>
                <div style={{ fontSize:20, fontWeight:700, color:C.text }}>{selected.firstName} {selected.lastName}</div>
                <div style={{ fontSize:14, color:C.textSoft }}>{selected.email} · {selected.phone}</div>
              </div>
            </div>
            <button onClick={()=>setSelected(null)} style={{ background:"none", border:`1.5px solid ${C.border}`, borderRadius:8, padding:"5px 8px", cursor:"pointer", color:C.textSoft, display:"flex", alignItems:"center" }}><IcoX s={16} c={C.textSoft}/></button>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:`repeat(${isMobile?2:4},1fr)`, gap:12, marginBottom:16 }}>
            {[["Abonnement",selected.subscription],["Statut",selected.status],["Depuis",new Date(selected.joined).toLocaleDateString("fr-FR")],["Crédits",selected.credits>0?`${selected.credits} séances`:"Illimité"]].map(([l,v])=>(
              <div key={l} style={{ background:C.bg, borderRadius:8, padding:"12px 14px", border:`1.5px solid ${C.border}` }}>
                <div style={{ fontSize:12, fontWeight:700, color:C.textMuted, textTransform:"uppercase", marginBottom:4 }}>{l}</div>
                <div style={{ fontSize:16, fontWeight:600, color:C.text, textTransform:"capitalize" }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            <Button variant="primary" sm onClick={()=>setModal({type:"email",member:selected})}><span style={{display:"flex",alignItems:"center",gap:5}}><IcoMail s={13} c="white"/>Envoyer un email</span></Button>
            <Button variant="ghost" sm onClick={()=>setModal({type:"subscription",member:selected})}><span style={{display:"flex",alignItems:"center",gap:5}}><IcoTag2 s={13} c={C.textMid}/>Modifier l'abonnement</span></Button>
            <Button variant="ghost" sm onClick={()=>setModal({type:"history",member:selected})}><span style={{display:"flex",alignItems:"center",gap:5}}><IcoCalendar2 s={13} c={C.textMid}/>Historique séances</span></Button>
          </div>
        </Card>
      )}
    </div>
    </div>
  );
}


export { Members };