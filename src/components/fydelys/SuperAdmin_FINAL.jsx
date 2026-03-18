"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { C } from "./theme";
import { IcoUsers, IcoUser, IcoSettings, IcoX, IcoCheck, IcoCalendar } from "./icons";
import { SESSIONS_INIT, FYDELYS_PLANS, MY_COACH_NAME, TENANTS_INIT, TENANTS_DATA, USERS_DATA, ROLES_DEF } from "./demoData";
import { Card, SectionHead, Button, Tag, Pill, EmptyState, ConfirmModal } from "./ui";

const saInp = (f=false,err=false) => ({
  width:"100%", padding:"9px 12px",
  border:`1.5px solid ${err?"#F87171":f?"#A06838":"#DDD5C8"}`,
  borderRadius:9, fontSize:13, outline:"none",
  color:"#2A1F14", background:"#FDFAF7",
  boxSizing:"border-box",
  boxShadow: f?"0 0 0 3px rgba(160,104,56,.07)":"none"
});

// FieldSA / SelectSA définis HORS de SuperAdminView pour éviter la perte de focus
// (React recrée les composants internes à chaque render sinon)
function FieldSA({ label, k, placeholder, type="text", required, value, onChange, error }) {
  return (
    <div>
      <label style={{ fontSize:11, fontWeight:700, color:"#8C7B6C", textTransform:"uppercase", letterSpacing:.8, display:"block", marginBottom:5 }}>
        {label}{required&&<span style={{color:"#F87171"}}> *</span>}
      </label>
      <input type={type} value={value} onChange={e=>onChange(k,e.target.value)} placeholder={placeholder}
        style={saInp(false,!!error)}/>
      {error&&<div style={{fontSize:11,color:"#F87171",marginTop:3}}>{error}</div>}
    </div>
  );
}
function SelectSA({ label, k, opts, required, value, onChange }) {
  return (
    <div>
      <label style={{ fontSize:11, fontWeight:700, color:"#8C7B6C", textTransform:"uppercase", letterSpacing:.8, display:"block", marginBottom:5 }}>
        {label}{required&&<span style={{color:"#F87171"}}> *</span>}
      </label>
      <select value={value} onChange={e=>onChange(k,e.target.value)} style={{...saInp(), appearance:"none"}}>
        {opts.map(o=><option key={o.v} value={o.v} style={{background:"#FDFAF7"}}>{o.l}</option>)}
      </select>
    </div>
  );
}

// ── Form Modal (New + Edit) ───────────────────────────────────────────────────
const toSlug = (s) =>
  s.toLowerCase()
   .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
   .replace(/[^a-z0-9]/g,"");

const validateSlug = (s) => /^[a-z0-9]+$/.test(s);

function TenantFormModal({ editing, setModal, showToast, setTenants, createClient, FYDELYS_PLANS }) {
  const emptyF = editing
    ? { name:editing.name, slug:editing.slug||"", email:editing.email||"", firstName:editing.firstName||"", lastName:editing.lastName||"", phone:editing.phone||"", city:editing.city||"", zip:editing.zip||"", address:editing.address||"", plan:editing.plan||"Essentiel", type:editing.type||"Yoga", notes:editing.notes||"", isCoach:editing.isCoach||false, paymentMode:editing.paymentMode||"none" }
    : { name:"", slug:"", email:"", firstName:"", lastName:"", phone:"", city:"", zip:"", address:"", plan:"Essentiel", type:"Yoga", notes:"", isCoach:false, paymentMode:"none" };
  const [f, setF] = useState(emptyF);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});

  const upd = (k, v) => {
    const next = {...f, [k]:v};
    if(k==="name" && !editing) next.slug = toSlug(v);
    if(k==="slug") next.slug = v.toLowerCase().replace(/[^a-z0-9-]/g,"").replace(/\..*$/,"");
    setF(next);
    setErrors(e=>({...e,[k]:undefined}));
  };

  const validate1 = () => {
    const e = {};
    if(!f.name.trim())               e.name = "Obligatoire";
    if(!f.city.trim())               e.city = "Obligatoire";
    if(!f.slug.trim())               e.slug = "Obligatoire";
    else if(!validateSlug(f.slug))   e.slug = "Uniquement lettres minuscules, chiffres et tirets (ex: yoga-paris)";
    return e;
  };
  const validate2 = () => {
    const e = {};
    if(!f.email.trim()||!f.email.includes("@")) e.email = "Email invalide";
    if(!f.firstName.trim()) e.firstName = "Obligatoire";
    if(!f.lastName.trim())  e.lastName  = "Obligatoire";
    if(!f.phone.trim())     e.phone     = "Obligatoire";
    return e;
  };

  const nextStep = () => {
    if(step===1){ const e=validate1(); if(Object.keys(e).length){ setErrors(e); return; } }
    if(step===2){ const e=validate2(); if(Object.keys(e).length){ setErrors(e); return; } }
    setStep(s=>s+1);
  };

  const save = async () => {
    const supabase = createClient();
    const now = new Date();
    const mois = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
    const since = `${mois[now.getMonth()]} ${now.getFullYear()}`;

    if(editing) {
      // Mettre à jour le studio en base
      const { error } = await supabase.from("studios").update({
        name: f.name, slug: f.slug, city: f.city, address: f.address || null,
        phone: f.phone || null, email: f.email, notes: f.notes || null,
        payment_mode: f.paymentMode || "none",
        stripe_connect_enabled: f.paymentMode === "connect",
      }).eq("id", editing.id);
      if(error) { showToast(`Erreur : ${error.message}`, false); return; }

      // Mettre à jour le profil admin si existe
      await supabase.from("profiles").update({
        first_name: f.firstName, last_name: f.lastName,
        is_coach: f.isCoach || false,
      }).eq("studio_id", editing.id).eq("role", "admin");

      setTenants(prev=>prev.map(t=>t.id===editing.id ? {
        ...t, name:f.name, slug:f.slug, city:f.city, address:f.address,
        email:f.email, phone:f.phone, notes:f.notes,
        contact:`${f.firstName} ${f.lastName}`.trim(),
        firstName:f.firstName, lastName:f.lastName, isCoach:f.isCoach,
      } : t));
      showToast(`✅ "${f.name}" mis à jour`);
    } else {
      // Créer le studio en base via service role (seed)
      const res = await fetch("/api/sa/create-tenant", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({
          studioName: f.name, slug: f.slug, city: f.city, zip: f.zip||null,
          address: f.address||null, type: f.type, email: f.email, phone: f.phone||null,
          firstName: f.firstName, lastName: f.lastName, isCoach: f.isCoach||false,
          plan: f.plan,
          payment_mode: f.paymentMode || "none",
          stripe_connect_enabled: f.paymentMode === "connect",
        }),
      });
      const result = await res.json();
      if(!res.ok || result.error) { showToast(`Erreur : ${result.error || "création échouée"}`, false); return; }

      const newT = {
        id: result.studioId || `t${Date.now()}`,
        name:f.name, slug:f.slug, city:f.city, email:f.email,
        contact:`${f.firstName} ${f.lastName}`,
        firstName:f.firstName, lastName:f.lastName, phone:f.phone, notes:f.notes,
        plan:f.plan, members:0, revenue:0, status:"actif", since, growth:0,
      };
      setTenants(prev=>[newT, ...prev]);
      showToast(`🚀 "${f.name}" créé !`);
    }
    setModal(null);
  };

  const STEPS = ["Studio", "Contact", "Confirmation"];
  return (
    <div onClick={e=>e.target===e.currentTarget&&setModal(null)}
      style={{position:"fixed",inset:0,background:"rgba(42,31,20,.5)",zIndex:800,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"#FFFFFF",border:"1px solid rgba(167,139,250,.2)",borderRadius:20,padding:32,width:"100%",maxWidth:520,boxShadow:"0 32px 64px rgba(0,0,0,.5)",maxHeight:"90vh",overflowY:"auto"}}>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <div>
            <div style={{fontSize:20,fontWeight:800,color:"#2A1F14",letterSpacing:-0.5}}>{editing?"Modifier le tenant":"Nouveau tenant"}</div>
            <div style={{fontSize:12,color:"#8C7B6C",marginTop:2}}>Étape {step} / 3 — {STEPS[step-1]}</div>
          </div>
          <button onClick={()=>setModal(null)} style={{background:"#F4EFE8",border:"1px solid #DDD5C8",borderRadius:8,width:32,height:32,cursor:"pointer",color:"#8C7B6C",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>

        <div style={{display:"flex",gap:6,marginBottom:28}}>
          {STEPS.map((s,i)=>(
            <div key={s} style={{flex:1,height:3,borderRadius:2,background:i+1<=step?"#A06838":"#EAE4DA"}}/>
          ))}
        </div>

        {step===1&&(
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <FieldSA label="Nom du studio / centre" k="name" placeholder="Ex: Yoga Flow Paris" required value={f.name} onChange={upd} error={errors.name}/>
            <div>
              <label style={{fontSize:11,fontWeight:700,color:"#8C7B6C",textTransform:"uppercase",letterSpacing:.8,display:"block",marginBottom:5}}>
                Sous-domaine <span style={{color:"#B0A090"}}>(lettres, chiffres, tirets)</span> <span style={{color:"#F87171"}}>*</span>
              </label>
              <div style={{display:"flex",alignItems:"center",background:"#FAFAF8",border:`1.5px solid ${errors.slug?"#F87171":"#DDD5C8"}`,borderRadius:9,overflow:"hidden"}}>
                <input value={f.slug} onChange={e=>upd("slug",e.target.value)} placeholder="yogaflowparis"
                  style={{...saInp(),border:"none",background:"transparent",flex:1}}/>
                <span style={{padding:"9px 12px",color:"#8C7B6C",fontSize:13,borderLeft:"1px solid #DDD5C8",whiteSpace:"nowrap"}}>.fydelys.fr</span>
              </div>
              {errors.slug&&<div style={{fontSize:11,color:"#F87171",marginTop:3}}>{errors.slug}</div>}
              <div style={{fontSize:11,color:"#B0A090",marginTop:4}}>✓ Autorisé : <code style={{color:"#A06838"}}>yoga-paris</code> · <code style={{color:"#A06838"}}>studio2</code> &nbsp; ✗ Interdit : points, espaces, majuscules, accents</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:12}}>
              <FieldSA label="Ville" k="city" placeholder="Paris, Lyon…" required value={f.city} onChange={upd} error={errors.city}/>
              <FieldSA label="Code postal" k="zip" placeholder="75001" value={f.zip} onChange={upd}/>
            </div>
            <FieldSA label="Adresse" k="address" placeholder="12 rue de la Paix" value={f.address} onChange={upd}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <SelectSA label="Type de pratique" k="type" required value={f.type} onChange={upd} opts={[
                {v:"Yoga",l:"🧘 Yoga"},{v:"Pilates",l:"⚡ Pilates"},{v:"Danse",l:"💃 Danse"},
                {v:"Fitness",l:"🏋 Fitness"},{v:"Méditation",l:"☯ Méditation"},{v:"Multi",l:"🌀 Multi-disciplines"}
              ]}/>
              <SelectSA label="Plan Fydelys" k="plan" value={f.plan} onChange={upd} opts={[
                ...FYDELYS_PLANS.map(p=>({v:p.name,l:`${p.name} — ${p.price} €/mois`}))
              ]}/>
            </div>
          </div>
        )}

        {step===2&&(
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div style={{padding:"12px 16px",background:"rgba(167,139,250,.08)",borderRadius:10,border:"1px solid rgba(167,139,250,.15)",fontSize:13,color:"#8C5E38"}}>
              👤 Informations du gérant / responsable du studio
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <FieldSA label="Prénom" k="firstName" placeholder="Marie" required value={f.firstName} onChange={upd} error={errors.firstName}/>
              <FieldSA label="Nom" k="lastName" placeholder="Laurent" required value={f.lastName} onChange={upd} error={errors.lastName}/>
            </div>
            <FieldSA label="Email professionnel" k="email" type="email" placeholder="marie@studio.fr" required value={f.email} onChange={upd} error={errors.email}/>
            <FieldSA label="Téléphone" k="phone" type="tel" placeholder="+33 6 12 34 56 78" required value={f.phone} onChange={upd} error={errors.phone}/>
            {/* Toggle coach */}
            <div onClick={()=>upd("isCoach",!f.isCoach)}
              style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",background:f.isCoach?"#F5EBE0":"#FAFAF8",border:`1px solid ${f.isCoach?"rgba(160,104,56,.3)":"#DDD5C8"}`,borderRadius:10,cursor:"pointer",userSelect:"none"}}>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:f.isCoach?"#8C5E38":"#8C7B6C"}}>🎯 Aussi coach / intervenant</div>
                <div style={{fontSize:11,color:"#B0A090",marginTop:2}}>Le gérant donne également des cours dans son studio</div>
              </div>
              <div style={{width:40,height:22,borderRadius:11,background:f.isCoach?"#A06838":"rgba(160,104,56,.15)",position:"relative",flexShrink:0,transition:"background .2s"}}>
                <div style={{position:"absolute",top:3,left:f.isCoach?20:3,width:16,height:16,borderRadius:"50%",background:"#fff",transition:"left .2s"}}/>
              </div>
            </div>
            <div>
              <label style={{fontSize:11,fontWeight:700,color:"#8C7B6C",textTransform:"uppercase",letterSpacing:.8,display:"block",marginBottom:5}}>Notes internes</label>
              <textarea value={f.notes} onChange={e=>upd("notes",e.target.value)} placeholder="Informations complémentaires, source du lead…" rows={3}
                style={{...saInp(),resize:"vertical"}}/>
            </div>
          </div>
        )}

        {step===3&&(
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div style={{padding:"16px",background:"rgba(52,211,153,.06)",borderRadius:12,border:"1px solid rgba(52,211,153,.2)"}}>
              <div style={{fontSize:13,fontWeight:700,color:"#34D399",marginBottom:12}}>✅ Récapitulatif</div>
              {[
                ["Studio",       f.name],
                ["Sous-domaine", `${f.slug}.fydelys.fr`],
                ["Ville",        f.city],
                ["Code postal",  f.zip],
                ["Type",         f.type],
                ["Plan",         f.plan],
                ["Gérant",       `${f.firstName} ${f.lastName}`],
                ["Email",        f.email],
                ["Téléphone",    f.phone],
                ["Rôle gérant",  f.isCoach ? "Admin + Coach" : "Admin uniquement"],
              ].map(([k,v])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #EDE6DC",fontSize:13}}>
                  <span style={{color:"#8C7B6C"}}>{k}</span>
                  <span style={{color:"#2A1F14",fontWeight:600}}>{v}</span>
                </div>
              ))}
            </div>
            {/* Switch Stripe Connect */}
            <div style={{padding:"14px 16px",background:"rgba(124,58,237,.04)",borderRadius:10,border:"1px solid rgba(124,58,237,.2)"}}>
              <div style={{fontSize:12,fontWeight:700,color:"#7C3AED",marginBottom:10,textTransform:"uppercase",letterSpacing:.5}}>⚡ Paiement en ligne</div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {[
                  {key:"none",    label:"🚫 Désactivé",     desc:"Encaissement manuel uniquement"},
                  {key:"connect", label:"⚡ Stripe Connect", desc:"Compte Express + commission Fydelys"},
                  {key:"direct",  label:"🔑 Clés directes",  desc:"Le studio fournit ses propres clés Stripe"},
                ].map(m=>(
                  <div key={m.key} onClick={()=>upd("paymentMode",m.key)}
                    style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:8,border:`1.5px solid ${f.paymentMode===m.key?"#7C3AED":"#DDD5C8"}`,background:f.paymentMode===m.key?"rgba(124,58,237,.06)":"#FAFAF8",cursor:"pointer"}}>
                    <div style={{width:16,height:16,borderRadius:"50%",border:`2px solid ${f.paymentMode===m.key?"#7C3AED":"#DDD5C8"}`,background:f.paymentMode===m.key?"#7C3AED":"transparent",flexShrink:0}}/>
                    <div>
                      <div style={{fontSize:12,fontWeight:700,color:f.paymentMode===m.key?"#7C3AED":"#2A1F14"}}>{m.label}</div>
                      <div style={{fontSize:11,color:"#8C7B6C"}}>{m.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {!editing&&(
              <div style={{padding:"12px 16px",background:"#FBF6EE",borderRadius:10,border:"1px solid rgba(160,104,56,.2)",fontSize:12,color:"#8C7B6C",lineHeight:1.6}}>
                🌱 <strong>Seed automatique :</strong> disciplines, créneaux du soir, abonnements et salle principale seront créés automatiquement.
              </div>
            )}
          </div>
        )}

        <div style={{display:"flex",gap:10,marginTop:24}}>
          {step>1&&(
            <button onClick={()=>setStep(s=>s-1)} style={{flex:1,padding:"11px",background:"transparent",border:"1px solid #DDD5C8",borderRadius:10,color:"#8C7B6C",fontSize:14,fontWeight:600,cursor:"pointer"}}>← Retour</button>
          )}
          {step<3?(
            <button onClick={nextStep} style={{flex:2,padding:"11px",background:"linear-gradient(145deg,#B88050,#9A6030)",border:"none",borderRadius:10,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer"}}>Continuer →</button>
          ):(
            <button onClick={save} style={{flex:2,padding:"11px",background:editing?"linear-gradient(135deg,#2563EB,#1D4ED8)":"linear-gradient(135deg,#059669,#047857)",border:"none",borderRadius:10,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer"}}>
              {editing?"💾 Enregistrer":"🚀 Créer le tenant"}
            </button>
          )}
          {step===1&&<button onClick={()=>setModal(null)} style={{flex:1,padding:"11px",background:"transparent",border:"1px solid #DDD5C8",borderRadius:10,color:"#B0A090",fontSize:14,cursor:"pointer"}}>Annuler</button>}
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirm Modal ──────────────────────────────────────────────────────
function DeleteModal({ tenant, setModal, showToast, setTenants, createClient }) {
  return (
    <div onClick={e=>e.target===e.currentTarget&&setModal(null)}
      style={{position:"fixed",inset:0,background:"rgba(42,31,20,.5)",zIndex:800,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"#FFFFFF",border:"1px solid rgba(248,113,113,.3)",borderRadius:20,padding:32,width:"100%",maxWidth:420,boxShadow:"0 32px 64px rgba(0,0,0,.5)"}}>
        <div style={{fontSize:32,textAlign:"center",marginBottom:16}}>🗑</div>
        <div style={{fontSize:18,fontWeight:800,color:"#2A1F14",textAlign:"center",marginBottom:8}}>Supprimer ce tenant ?</div>
        <div style={{fontSize:14,color:"#8C7B6C",textAlign:"center",marginBottom:24,lineHeight:1.6}}>
          <strong style={{color:"#F87171"}}>{tenant.name}</strong> et toutes ses données (membres, séances, paiements) seront supprimées définitivement.
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={()=>setModal(null)} style={{flex:1,padding:"11px",background:"transparent",border:"1px solid #DDD5C8",borderRadius:10,color:"#8C7B6C",fontSize:14,fontWeight:600,cursor:"pointer"}}>Annuler</button>
          <button onClick={()=>{ setTenants(prev=>prev.filter(t=>t.id!==tenant.id)); setModal(null); showToast(`"${tenant.name}" supprimé`,false); }}
            style={{flex:1,padding:"11px",background:"linear-gradient(135deg,#DC2626,#B91C1C)",border:"none",borderRadius:10,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer"}}>
            Supprimer définitivement
          </button>
        </div>
      </div>
    </div>
  );
}


function SuperAdminView({ onSwitch, isMobile, onSignOut, onImpersonateStudio }) {
  const [tenants, setTenants] = useState(TENANTS_INIT);
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState("tous");
  const [modal, setModal]     = useState(null);
  const [plans, setPlans]     = useState([
    { slug:"essentiel", name:"Essentiel", price:9,  stripe_price_id:"" },
    { slug:"standard",  name:"Standard",  price:29, stripe_price_id:"" },
    { slug:"pro",       name:"Pro",       price:69, stripe_price_id:"" },
  ]);
  const [savingPlans, setSavingPlans] = useState(false);
  const [showPlans, setShowPlans]     = useState(false);
  const [envStatus, setEnvStatus]     = useState(null);
  const [showConfig, setShowConfig]   = useState(false); // null | {type:"new"} | {type:"edit",tenant} | {type:"delete",tenant}
  const [toast, setToast]     = useState(null);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [loading, setLoading] = useState(true);
  const showToast = (msg, ok=true) => { setToast({msg,ok}); setTimeout(()=>setToast(null),3500); };
  const p = isMobile ? 16 : 28;

  // Charger les vrais studios depuis Supabase
  useEffect(() => {
    // Utiliser l'API service role pour contourner la RLS sur profiles
    fetch("/api/sa/studios")
      .then(r => r.json())
      .then(({ studios: studiosData, profiles: profilesData, error }) => {
      if (error) { console.error("Studios load error:", error); setLoading(false); return; }
      const mois = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
      const profileMap = {};
      (profilesData || []).forEach((p) => { if (p.studio_id) profileMap[p.studio_id] = p; });

      const mapped = (studiosData || []).map((s) => {
        const admin = profileMap[s.id];
        return {
          id:        s.id,
          name:      s.name || "Sans nom",
          slug:      s.slug || "",
          city:      s.city || "",
          address:   s.address || "",
          email:     s.email || "",
          phone:     s.phone || admin?.phone || "",
          status:    s.status === "actif" ? "actif" : s.billing_status === "canceled" ? "suspendu" : "actif",
          plan:      s.plan_slug || "Essentiel",
          since:     (() => { const d = new Date(s.created_at); return `${mois[d.getMonth()]} ${d.getFullYear()}`; })(),
          firstName: admin?.first_name || "",
          lastName:  admin?.last_name  || "",
          isCoach:   admin?.is_coach   || false,
          contact:   admin ? `${admin.first_name||""} ${admin.last_name||""}`.trim() : "",
          notes:       s.notes || "",
          paymentMode: s.payment_mode || "none",
          members:     0,
          revenue:   0,
          growth:    0,
        };
      });
      setTenants(mapped);
      setLoading(false);
      // Charger les plans Fydelys
      fetch("/api/sa/plans").then(r=>r.json()).then(({ plans: dbPlans }) => {
        if (dbPlans?.length) setPlans(p => p.map(plan => {
          const db = dbPlans.find(d => d.slug === plan.slug);
          return db ? { ...plan, stripe_price_id: db.stripe_price_id || "" } : plan;
        }));
      }).catch(()=>{});
    }).catch(e => { console.error("SA load error:", e); setLoading(false); });
  }, []);

  const filtered = tenants
    .filter(t => filter==="tous" || t.status===filter)
    .filter(t => (t.name+" "+t.city+" "+(t.contact||"")).toLowerCase().includes(search.toLowerCase()));

  const totalRev   = tenants.filter(t=>t.status==="actif").reduce((s,t)=>s+(t.revenue||0),0);
  const totalMem   = tenants.reduce((s,t)=>s+(t.members||0),0);
  const actifCount = tenants.filter(t=>t.status==="actif").length;
  const suspCount  = tenants.filter(t=>t.status==="suspendu").length;

  // ── Helpers slug ─────────────────────────────────────────────────────────────
  // toSlug and validateSlug are defined at module level

  // ── Shared styles ─────────────────────────────────────────────────────────────
  const SA = saInp();


  return (
    <div style={{minHeight:"100vh",background:"#F4EFE8"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing:border-box; font-family:-apple-system,'Inter',sans-serif; }
        body { margin:0; }
        ::-webkit-scrollbar { width:5px; } ::-webkit-scrollbar-thumb { background:#C4A87A; border-radius:3px; }
      `}</style>

      {toast&&(
        <div style={{position:"fixed",top:20,right:20,zIndex:900,display:"flex",alignItems:"center",gap:10,padding:"12px 18px",background:toast.ok?"#059669":"#DC2626",borderRadius:10,color:"white",fontSize:14,fontWeight:600,boxShadow:"0 8px 24px rgba(0,0,0,.25)"}}>
          {toast.msg}
        </div>
      )}
      {modal?.type==="new"    && <TenantFormModal setModal={setModal} showToast={showToast} setTenants={setTenants} createClient={createClient} FYDELYS_PLANS={FYDELYS_PLANS}/>}
      {modal?.type==="edit"   && <TenantFormModal editing={modal.tenant} setModal={setModal} showToast={showToast} setTenants={setTenants} createClient={createClient} FYDELYS_PLANS={FYDELYS_PLANS}/>}
      {modal?.type==="delete" && <DeleteModal tenant={modal.tenant} setModal={setModal} showToast={showToast} setTenants={setTenants} createClient={createClient}/>}

      {confirmLogout && <ConfirmModal message="Voulez-vous vous déconnecter de Fydelys ?" onConfirm={()=>{ setConfirmLogout(false); onSignOut?.(); }} onCancel={()=>setConfirmLogout(false)}/>}
      {/* TopBar */}
      <div style={{borderBottom:"1px solid #F4EFE8",padding:`14px ${p}px`,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:36,height:36,borderRadius:10,background:"#F5EBE0",border:"1.5px solid #DDD5C8",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>⚜️</div>
          <div>
            <div style={{fontSize:16,fontWeight:800,color:"#2A1F14",letterSpacing:-0.3}}>Fyde<span style={{color:"#A06838"}}>lys</span></div>
            <div style={{fontSize:11,color:"#8C7B6C",textTransform:"uppercase",letterSpacing:1,fontWeight:600}}>Super Admin</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{fontSize:12,color:"#B0A090"}}>Plateforme · {tenants.length} tenant{tenants.length!==1?"s":""}</div>
          <button
            onClick={()=>setConfirmLogout(true)}
            style={{fontSize:12,padding:"6px 14px",borderRadius:8,border:"1px solid #DDD5C8",background:"transparent",color:"#8C7B6C",cursor:"pointer",fontWeight:600,display:"flex",alignItems:"center",gap:5}}>
            🚪 Déconnexion
          </button>
        </div>
      </div>

      <div style={{padding:`${p}px`}}>
        {/* KPIs */}
        <div style={{display:"grid",gridTemplateColumns:`repeat(${isMobile?2:4},1fr)`,gap:isMobile?10:16,marginBottom:24}}>
          {[
            {l:"Tenants actifs", v:actifCount, sub:`/ ${tenants.length} total`,        c:"#A06838", bg:"rgba(167,139,250,.1)", icon:"🏢"},
            {l:"Total membres",  v:totalMem,   sub:"tous studios",                     c:"#34D399", bg:"rgba(52,211,153,.1)",  icon:"👥"},
            {l:"CA mensuel",     v:totalRev>0?`${(totalRev/1000).toFixed(1)}k €`:"—", sub:"tenants actifs", c:"#FBBF24", bg:"rgba(251,191,36,.1)", icon:"💰"},
            {l:"Suspendus",      v:suspCount,  sub:suspCount?"action requise":"aucun", c:"#F87171", bg:"rgba(248,113,113,.1)", icon:"⚠"},
          ].map(k=>(
            <div key={k.l} style={{background:k.bg,borderRadius:14,padding:isMobile?"14px 12px":"20px",border:`1px solid ${k.c}20`}}>
              <div style={{fontSize:22,marginBottom:6}}>{k.icon}</div>
              <div style={{fontSize:isMobile?22:30,fontWeight:800,color:k.c,lineHeight:1}}>{k.v}</div>
              <div style={{fontSize:11,color:"#8C7B6C",marginTop:4}}>{k.l}</div>
              <div style={{fontSize:10,color:"#B0A090"}}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Configuration plateforme Fydelys */}
        <div style={{background:"#FAFAF8",borderRadius:14,border:"1px solid #DDD5C8",marginBottom:16,overflow:"hidden"}}>
          <div onClick={()=>{
            setShowConfig(v=>!v);
            if(!envStatus) fetch("/api/sa/config").then(r=>r.json()).then(d=>setEnvStatus(d.status||[]));
          }} style={{padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",userSelect:"none"}}>
            <div style={{fontSize:14,fontWeight:700,color:"#2A1F14"}}>🔐 Variables d'environnement Vercel</div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              {envStatus && <span style={{fontSize:11,fontWeight:700,color:envStatus.some(e=>!e.present)?"#F87171":"#34D399"}}>{envStatus.filter(e=>!e.present).length===0?"✓ Tout configuré":`⚠ ${envStatus.filter(e=>!e.present).length} manquante(s)`}</span>}
              <span style={{fontSize:12,color:"#8C7B6C"}}>{showConfig?"▲":"▼"}</span>
            </div>
          </div>
          {showConfig && (
            <div style={{borderTop:"1px solid #EAE4DA",padding:"14px 18px"}}>
              {!envStatus && <div style={{fontSize:12,color:"#8C7B6C"}}>Chargement…</div>}
              {envStatus && (
                <div style={{display:"flex",flexDirection:"column",gap:7}}>
                  {envStatus.map(e=>(
                    <div key={e.key} style={{display:"grid",gridTemplateColumns:"1fr auto auto",gap:10,alignItems:"center",padding:"7px 10px",borderRadius:7,background:e.present?"#F0FDF4":"#FEF2F2",border:`1px solid ${e.present?"rgba(52,211,153,.2)":"rgba(248,113,113,.2)"}`}}>
                      <div>
                        <div style={{fontSize:12,fontWeight:700,color:e.present?"#065F46":"#991B1B"}}>{e.label}</div>
                        <div style={{fontSize:10,color:"#8C7B6C",fontFamily:"monospace"}}>{e.key}</div>
                      </div>
                      <div style={{fontSize:11,color:"#8C7B6C",fontFamily:"monospace"}}>{e.present?e.preview:e.hint}</div>
                      <div style={{fontSize:11,fontWeight:700,color:e.present?"#34D399":"#F87171"}}>{e.present?"✓":"✗"}</div>
                    </div>
                  ))}
                  <div style={{fontSize:11,color:"#8C7B6C",marginTop:6,padding:"8px 10px",background:"#F8F5F0",borderRadius:7}}>
                    ⚠ Pour modifier ces variables, rendez-vous sur <strong>Vercel → Settings → Environment Variables</strong> puis redéployez.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Configuration plans Fydelys */}
        <div style={{background:"#FAFAF8",borderRadius:14,border:"1px solid #DDD5C8",marginBottom:20,overflow:"hidden"}}>
          <div onClick={()=>setShowPlans(v=>!v)}
            style={{padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",userSelect:"none"}}>
            <div style={{fontSize:14,fontWeight:700,color:"#2A1F14"}}>⚙ Plans Fydelys — Stripe Price IDs</div>
            <div style={{fontSize:12,color:"#8C7B6C"}}>{showPlans?"▲ Masquer":"▼ Configurer"}</div>
          </div>
          {showPlans && (
            <div style={{borderTop:"1px solid #EAE4DA",padding:"16px 18px"}}>
              <div style={{fontSize:12,color:"#8C7B6C",marginBottom:12,lineHeight:1.6}}>
                Saisissez les <strong>stripe_price_id</strong> de vos produits d'abonnement Fydelys (depuis votre Dashboard Stripe plateforme, pas ceux des studios).
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:14}}>
                {plans.map((plan,i)=>(
                  <div key={plan.slug} style={{display:"grid",gridTemplateColumns:"100px 60px 1fr",gap:10,alignItems:"center"}}>
                    <div style={{fontSize:13,fontWeight:700,color:"#2A1F14"}}>{plan.name}</div>
                    <div style={{fontSize:12,color:"#8C7B6C"}}>{plan.price}€/mois</div>
                    <input
                      value={plan.stripe_price_id}
                      onChange={e=>setPlans(p=>p.map((pl,j)=>j===i?{...pl,stripe_price_id:e.target.value}:pl))}
                      placeholder="price_live_…"
                      style={{padding:"7px 10px",border:"1.5px solid #DDD5C8",borderRadius:7,fontSize:12,outline:"none",color:"#2A1F14",background:"#FDFAF7",fontFamily:"monospace",boxSizing:"border-box"}}/>
                  </div>
                ))}
              </div>
              <button onClick={async()=>{
                setSavingPlans(true);
                try {
                  const res = await fetch("/api/sa/plans",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({plans})});
                  if(res.ok) showToast("Plans enregistrés ✓");
                  else showToast("Erreur lors de la sauvegarde",false);
                } catch { showToast("Erreur réseau",false); }
                setSavingPlans(false);
              }} disabled={savingPlans}
                style={{padding:"8px 18px",borderRadius:8,border:"none",background:"#7C3AED",color:"white",fontSize:13,fontWeight:700,cursor:"pointer",opacity:savingPlans?.6:1}}>
                {savingPlans?"Enregistrement…":"💾 Sauvegarder les plans"}
              </button>
            </div>
          )}
        </div>

        {/* Table */}
        <div style={{background:"#FAFAF8",borderRadius:14,border:"1px solid #DDD5C8",overflow:"hidden"}}>
          <div style={{padding:"14px 18px",borderBottom:"1px solid #EAE4DA",display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Rechercher…"
              style={{flex:1,minWidth:160,padding:"8px 14px",background:"#FDFAF7",border:"1px solid #DDD5C8",borderRadius:8,color:"#2A1F14",fontSize:13,outline:"none",boxSizing:"border-box"}}/>
            <div style={{display:"flex",gap:6}}>
              {["tous","actif","suspendu"].map(f=>(
                <button key={f} onClick={()=>setFilter(f)} style={{fontSize:12,padding:"5px 12px",borderRadius:16,border:`1px solid ${filter===f?"#A06838":"#DDD5C8"}`,background:filter===f?"#A06838":"transparent",color:filter===f?"#fff":"#8C7B6C",fontWeight:600,cursor:"pointer"}}>
                  {f.charAt(0).toUpperCase()+f.slice(1)}
                </button>
              ))}
            </div>
            <button onClick={()=>setModal({type:"new"})} style={{fontSize:13,padding:"7px 16px",borderRadius:8,border:"none",background:"#A06838",color:"#fff",fontWeight:700,cursor:"pointer"}}>＋ Nouveau tenant</button>
          </div>

          {/* Empty state */}
          {tenants.length===0&&(
            <div style={{padding:"56px 24px",textAlign:"center"}}>
              <div style={{fontSize:40,marginBottom:12}}>🏢</div>
              <div style={{fontSize:16,fontWeight:700,color:"#5C4A38",marginBottom:6}}>Aucun tenant pour l'instant</div>
              <div style={{fontSize:13,color:"#B0A090",marginBottom:20}}>Créez votre premier studio client</div>
              <button onClick={()=>setModal({type:"new"})} style={{padding:"10px 24px",background:"#A06838",border:"none",borderRadius:10,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer"}}>＋ Créer le premier tenant</button>
            </div>
          )}

          {/* Rows */}
          {filtered.map(t=>(
            <div key={t.id} style={{padding:"13px 18px",borderBottom:"1px solid #EAE4DA",display:"flex",alignItems:"center",gap:14,flexWrap:isMobile?"wrap":"nowrap"}}
              onMouseEnter={e=>e.currentTarget.style.background="#FBF8F4"}
              onMouseLeave={e=>e.currentTarget.style.background=""}>
              <div style={{width:34,height:34,borderRadius:8,background:"#F5EBE0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>🏛</div>
              <div style={{flex:1,minWidth:100}}>
                <div style={{fontSize:14,fontWeight:700,color:"#2A1F14"}}>{t.name}</div>
                <div style={{fontSize:11,color:"#8C7B6C"}}>{t.city} · {t.slug}.fydelys.fr · depuis {t.since}</div>
                {t.contact&&<div style={{fontSize:11,color:"#A06838"}}>{t.contact} · {t.email}</div>}
              </div>
              {!isMobile&&<>
                <div style={{textAlign:"center",minWidth:56}}>
                  <div style={{fontSize:15,fontWeight:800,color:"#34D399"}}>{t.members}</div>
                  <div style={{fontSize:10,color:"#B0A090"}}>membres</div>
                </div>
                <div style={{textAlign:"center",minWidth:70}}>
                  <div style={{fontSize:15,fontWeight:800,color:"#FBBF24"}}>{(t.revenue||0).toLocaleString()} €</div>
                  <div style={{fontSize:10,color:"#B0A090"}}>/mois</div>
                </div>
              </>}
              <div style={{display:"flex",gap:6,alignItems:"center",flexShrink:0}}>
                <span style={{fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:10,background:t.plan==="Pro"?"rgba(160,104,56,.2)":t.plan==="Business"?"rgba(251,191,36,.2)":"#F4EFE8",color:t.plan==="Pro"?"#8C5E38":t.plan==="Business"?"#FCD34D":"#8C7B6C"}}>{t.plan}</span>
                <span style={{fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:10,background:t.status==="actif"?"rgba(52,211,153,.15)":"rgba(248,113,113,.15)",color:t.status==="actif"?"#34D399":"#F87171"}}>{t.status==="actif"?"Actif":"Suspendu"}</span>
              </div>
              <div style={{display:"flex",gap:6,flexShrink:0}}>
                <button
                  onClick={()=>onImpersonateStudio && onImpersonateStudio(t.slug)}
                  title="Voir l'app studio comme un admin"
                  style={{fontSize:11,padding:"4px 10px",borderRadius:6,border:"1.5px solid rgba(124,58,237,.35)",background:"rgba(124,58,237,.08)",color:"#7C3AED",cursor:"pointer",fontWeight:700}}>
                  👁 Simuler
                </button>
                <button onClick={()=>setModal({type:"edit",tenant:t})}
                  style={{fontSize:11,padding:"4px 10px",borderRadius:6,border:"1px solid rgba(167,139,250,.3)",background:"rgba(167,139,250,.1)",color:"#8C5E38",cursor:"pointer",fontWeight:600}}>✏ Modifier</button>
                {t.status==="actif"
                  ? <button onClick={async()=>{
                      const sb=createClient();
                      await sb.from("studios").update({status:"suspendu",suspended_at:new Date().toISOString()}).eq("id",t.id);
                      setTenants(p=>p.map(x=>x.id===t.id?{...x,status:"suspendu"}:x));
                      showToast(`"${t.name}" suspendu`,false);
                    }}
                      style={{fontSize:11,padding:"4px 10px",borderRadius:6,border:"1px solid rgba(248,113,113,.3)",background:"rgba(248,113,113,.1)",color:"#F87171",cursor:"pointer",fontWeight:600}}>Suspendre</button>
                  : <button onClick={async()=>{
                      const sb=createClient();
                      await sb.from("studios").update({status:"actif",suspended_at:null}).eq("id",t.id);
                      setTenants(p=>p.map(x=>x.id===t.id?{...x,status:"actif"}:x));
                      showToast(`"${t.name}" réactivé`);
                    }}
                      style={{fontSize:11,padding:"4px 10px",borderRadius:6,border:"1px solid rgba(52,211,153,.3)",background:"rgba(52,211,153,.1)",color:"#34D399",cursor:"pointer",fontWeight:600}}>Réactiver</button>
                }
                <button onClick={()=>setModal({type:"delete",tenant:t})}
                  style={{fontSize:11,padding:"4px 10px",borderRadius:6,border:"1px solid rgba(248,113,113,.2)",background:"rgba(248,113,113,.07)",color:"#F87171",cursor:"pointer",fontWeight:600}}>🗑</button>
              </div>
            </div>
          ))}

          {filtered.length===0&&tenants.length>0&&(
            <div style={{padding:"32px",textAlign:"center",color:"#B0A090",fontSize:13}}>Aucun résultat pour « {search} »</div>
          )}
        </div>

        {/* Stats bar */}
        {tenants.length>0&&(
          <div style={{marginTop:16,padding:"14px 18px",background:"#FFFFFF",borderRadius:12,border:"1px solid #DDD5C8",display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:14}}>
            {[
              {l:"Taux occupation moyen", v:"—",  c:"#A06838"},
              {l:"Séances / semaine",     v:"—",  c:"#34D399"},
              {l:"Taux renouvellement",   v:"—",  c:"#FBBF24"},
              {l:"Tickets support",       v:"0",  c:"#F87171"},
            ].map(s=>(
              <div key={s.l}>
                <div style={{fontSize:20,fontWeight:800,color:s.c}}>{s.v}</div>
                <div style={{fontSize:11,color:"#8C7B6C",marginTop:2}}>{s.l}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


// ══════════════════════════════════════════════════════════════════════════════
// COACH VIEW — uniquement ses cours, inscrits, profil
// ══════════════════════════════════════════════════════════════════════════════


export { SuperAdminView };