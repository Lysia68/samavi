"use client";

import React, { useState, useEffect, useContext } from "react";
import { createClient } from "@/lib/supabase";
import { AppCtx } from "./context";
import { C } from "./theme";
import { PAYMENTS_DEMO } from "./demoData";
import { IcoCreditCard2, IcoMail, IcoAlert2, IcoBarChart2, IcoCheck } from "./icons";
import { Card, SectionHead, Button, Tag, Pill, DemoBanner, EmptyState } from "./ui";

function Payments({ isMobile }) {
  const [payments, setPayments] = useState([]);
  const { studioId } = useContext(AppCtx);
  const [dbLoading, setDbLoading] = useState(true);
  const [isDemoData, setIsDemoData] = useState(false);
  const [toast, setToast] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ memberId:"", memberName:"", amount:"", date:new Date().toISOString().slice(0,10), type:"Espèces", status:"payé", notes:"", credits:"0" });
  const [memberSearch, setMemberSearch] = useState("");
  const [memberResults, setMemberResults] = useState([]);
  const [addSaving, setAddSaving] = useState(false);
  const total  = payments.filter(p=>p.status==="payé").reduce((s,p)=>s+p.amount,0);
  const unpaid = payments.filter(p=>p.status==="impayé").reduce((s,p)=>s+p.amount,0);
  const p = isMobile?12:28;

  useEffect(() => {
    if (!studioId) return;
    setDbLoading(true);
    createClient().from("member_payments")
      .select("id, member_id, amount, status, payment_date, payment_type, notes, stripe_payment_id, members(first_name, last_name), subscriptions(name)")
      .eq("studio_id", studioId).order("payment_date", { ascending: false })
      .then(({ data, error }) => {
        if (error) { console.error("load payments", error); setDbLoading(false); return; }
        if (!data || data.length === 0) { setPayments([]); setIsDemoData(false); setDbLoading(false); return; }
        if (data) setPayments(data.map(pay => ({
          id: pay.id, memberId: pay.member_id,
          member: pay.members ? `${pay.members.first_name} ${pay.members.last_name}` : "—",
          amount: pay.amount, status: pay.status,
          date: pay.payment_date, type: pay.payment_type || "Carte",
          subscription: pay.subscriptions?.name || "—", notes: pay.notes || "",
          stripe_payment_id: pay.stripe_payment_id || null,
          relance: false,
        })));
        setDbLoading(false);
      });
  }, [studioId]);

  const relancer = async (id) => {
    setPayments(prev=>prev.map(p=>p.id===id?{...p,relance:true}:p));
    const pay = payments.find(p=>p.id===id);
    setToast(`Relance envoyée à ${pay?.member||""}`);
    setTimeout(()=>setToast(null),3000);
    try { await createClient().from("member_payments").update({ notes:(pay?.notes||"")+" [relancé]" }).eq("id",id); }
    catch(e) { console.error("relancer",e); }
  };

  const stats = [
    {lbl:"Encaissé ce mois", val:`${total} €`,      icon:<IcoCreditCard2 s={20} c={C.ok}/>,  c:C.ok,   bg:C.okBg},
    {lbl:"Impayés",          val:`${unpaid} €`,      icon:<IcoAlert2 s={20} c={C.warn}/>,     c:C.warn, bg:C.warnBg},
    {lbl:"Transactions",     val:payments.length,    icon:<IcoBarChart2 s={20} c={C.info}/>,  c:C.info, bg:C.infoBg},
  ];
  return (
    <div>
      {isDemoData && <DemoBanner/>}
      <div style={{ padding:p }}>
      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", top:20, right:20, zIndex:600, display:"flex", alignItems:"center", gap:10, padding:"12px 18px", background:C.ok, borderRadius:10, color:"white", fontSize:14, fontWeight:600, boxShadow:"0 8px 24px rgba(0,0,0,.15)" }}>
          <IcoMail s={16} c="white"/>{toast}
        </div>
      )}
      <div style={{ display:"flex", justifyContent:"flex-end", gap:8, marginBottom:10 }}>
        <Button sm variant="ghost" onClick={()=>window.open(`/api/export?type=payments&studioId=${studioId}`)}>CSV</Button>
        <Button sm variant="primary" onClick={()=>setShowAdd(!showAdd)}>+ Paiement</Button>
      </div>

      {showAdd && (
        <Card style={{ marginBottom:16, borderTop:`3px solid ${C.accent}` }}>
          <div style={{ fontSize:13, fontWeight:800, color:C.accent, textTransform:"uppercase", letterSpacing:.6, marginBottom:14 }}>Enregistrer un paiement</div>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {/* Membre */}
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:.8, marginBottom:5 }}>Adhérent *</div>
              {addForm.memberId ? (
                <div style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:9, border:`1.5px solid ${C.accent}`, background:C.accentBg }}>
                  <div style={{ flex:1, fontSize:14, fontWeight:700, color:C.accent }}>{addForm.memberName}</div>
                  <button onClick={()=>{ setAddForm(f=>({...f,memberId:"",memberName:""})); setMemberSearch(""); }} style={{ background:"none", border:"none", cursor:"pointer", color:C.textMuted }}>x</button>
                </div>
              ) : (
                <>
                  <input value={memberSearch} placeholder="Rechercher un adhérent…"
                    onChange={e=>{
                      const v=e.target.value; setMemberSearch(v);
                      if(v.length<2){setMemberResults([]);return;}
                      createClient().from("members").select("id,first_name,last_name,email").eq("studio_id",studioId)
                        .or(`first_name.ilike.%${v}%,last_name.ilike.%${v}%,email.ilike.%${v}%`).limit(6)
                        .then(({data})=>setMemberResults(data||[]));
                    }}
                    style={{ width:"100%", padding:"9px 12px", borderRadius:9, border:`1.5px solid ${C.border}`, fontSize:14, outline:"none", boxSizing:"border-box", background:"#FDFAF7" }}/>
                  {memberResults.length>0 && (
                    <div style={{ borderRadius:9, border:`1px solid ${C.borderSoft}`, overflow:"hidden", marginTop:4 }}>
                      {memberResults.map(m=>(
                        <div key={m.id} onClick={()=>{ setAddForm(f=>({...f,memberId:m.id,memberName:`${m.first_name} ${m.last_name}`.trim()})); setMemberResults([]); setMemberSearch(""); }}
                          style={{ padding:"8px 12px", cursor:"pointer", borderBottom:`1px solid ${C.borderSoft}`, fontSize:13, transition:"background .1s" }}
                          onMouseEnter={e=>e.currentTarget.style.background=C.accentBg}
                          onMouseLeave={e=>e.currentTarget.style.background=""}>
                          <span style={{ fontWeight:700, color:C.text }}>{m.first_name} {m.last_name}</span>
                          <span style={{ color:C.textMuted, marginLeft:8 }}>{m.email}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
            {/* Montant + Date */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:.8, marginBottom:5 }}>Montant (EUR) *</div>
                <input type="number" min={0} max={9999} step="0.01" value={addForm.amount} onChange={e=>{ const v=parseFloat(e.target.value); setAddForm(f=>({...f,amount:isNaN(v)?"":String(Math.min(9999,Math.max(0,v)))})); }} placeholder="0.00"
                  style={{ width:"100%", padding:"9px 12px", borderRadius:9, border:`1.5px solid ${C.border}`, fontSize:14, outline:"none", boxSizing:"border-box", background:"#FDFAF7" }}/>
              </div>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:.8, marginBottom:5 }}>Date *</div>
                <input type="date" value={addForm.date} onChange={e=>setAddForm(f=>({...f,date:e.target.value}))}
                  style={{ width:"100%", padding:"9px 12px", borderRadius:9, border:`1.5px solid ${C.border}`, fontSize:14, outline:"none", boxSizing:"border-box", background:"#FDFAF7" }}/>
              </div>
            </div>
            {/* Mode + Statut */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:.8, marginBottom:5 }}>Mode de paiement</div>
                <select value={addForm.type} onChange={e=>setAddForm(f=>({...f,type:e.target.value}))}
                  style={{ width:"100%", padding:"9px 12px", borderRadius:9, border:`1.5px solid ${C.border}`, fontSize:14, outline:"none", boxSizing:"border-box", background:"#FDFAF7", appearance:"none" }}>
                  {["Espèces","Carte","Virement","Chèque","Prélèvement"].map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:.8, marginBottom:5 }}>Statut</div>
                <select value={addForm.status} onChange={e=>setAddForm(f=>({...f,status:e.target.value}))}
                  style={{ width:"100%", padding:"9px 12px", borderRadius:9, border:`1.5px solid ${C.border}`, fontSize:14, outline:"none", boxSizing:"border-box", background:"#FDFAF7", appearance:"none" }}>
                  {["payé","impayé"].map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            {/* Crédits */}
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:.8, marginBottom:5 }}>Crédits à ajouter</div>
              <input type="number" min={0} max={200} value={addForm.credits} onChange={e=>{ const v=parseInt(e.target.value); setAddForm(f=>({...f,credits:isNaN(v)?"0":String(Math.min(200,Math.max(0,v)))})); }} placeholder="0"
                style={{ width:"100%", padding:"9px 12px", borderRadius:9, border:`1.5px solid ${C.border}`, fontSize:14, outline:"none", boxSizing:"border-box", background:"#FDFAF7" }}/>
              <div style={{ fontSize:11, color:C.textMuted, marginTop:3 }}>Nombre de séances ajoutées au solde du membre (0 = pas de modification)</div>
            </div>
            {/* Notes */}
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:.8, marginBottom:5 }}>Notes</div>
              <input value={addForm.notes} onChange={e=>setAddForm(f=>({...f,notes:e.target.value}))} placeholder="Ex : Carnet 10 séances, mois de mars…"
                style={{ width:"100%", padding:"9px 12px", borderRadius:9, border:`1.5px solid ${C.border}`, fontSize:14, outline:"none", boxSizing:"border-box", background:"#FDFAF7" }}/>
            </div>
            {/* Actions */}
            <div style={{ display:"flex", gap:10 }}>
              <Button variant="primary" disabled={addSaving||!addForm.memberId||!addForm.amount} onClick={async()=>{
                setAddSaving(true);
                const { error } = await createClient().from("member_payments").insert({
                  studio_id:studioId, member_id:addForm.memberId,
                  amount:parseFloat(addForm.amount), payment_date:addForm.date,
                  payment_type:addForm.type, status:addForm.status, notes:addForm.notes||null,
                  source:"manual",
                });
                if(!error){
                  // Ajouter les crédits au membre si > 0
                  const creditsToAdd = parseInt(addForm.credits) || 0;
                  if(creditsToAdd > 0){
                    const sb = createClient();
                    const { data:m } = await sb.from("members").select("credits,credits_total").eq("id",addForm.memberId).single();
                    if(m) await sb.from("members").update({ credits:(m.credits||0)+creditsToAdd, credits_total:(m.credits_total||0)+creditsToAdd }).eq("id",addForm.memberId);
                  }
                  setPayments(prev=>[{ id:Date.now(), member:addForm.memberName, amount:parseFloat(addForm.amount), date:addForm.date, subscription:addForm.notes||"—", status:addForm.status, payment_type:addForm.type, stripe_payment_id:null, relance:false },...prev]);
                  setShowAdd(false); setAddForm({ memberId:"",memberName:"",amount:"",date:new Date().toISOString().slice(0,10),type:"Espèces",status:"payé",notes:"",credits:"0" });
                  setToast("Paiement enregistré"); setTimeout(()=>setToast(null),3000);
                }
                setAddSaving(false);
              }}>{addSaving?"Enregistrement…":"Enregistrer"}</Button>
              <Button variant="ghost" onClick={()=>setShowAdd(false)}>Annuler</Button>
            </div>
          </div>
        </Card>
      )}
      <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)", gap:isMobile?8:14, marginBottom:isMobile?16:20 }}>
        {stats.map(s=>(
          <Card key={s.lbl} style={{ padding:"14px 16px" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
              <span style={{display:"flex",alignItems:"center",justifyContent:"center"}}>{s.icon}</span>
              <span style={{ fontSize:11, color:s.c, fontWeight:700, background:s.bg, padding:"2px 8px", borderRadius:10 }}>{s.lbl}</span>
            </div>
            <div style={{ fontSize:isMobile?24:26, fontWeight:800, color:s.c, lineHeight:1 }}>{s.val}</div>
          </Card>
        ))}
      </div>
      <Card noPad>
        {payments.length === 0 && !dbLoading && (
          <EmptyState icon={<IcoBarChart2 s={40} c={C.textMuted}/>} title="Aucun paiement enregistré" sub="Les paiements de vos adhérents apparaîtront ici"/>
        )}
        {payments.map(pay=>(
          <div key={pay.id}
            style={{ padding:"11px 16px", borderBottom:`1px solid ${C.borderSoft}`, transition:"background .1s" }}
            onMouseEnter={e=>e.currentTarget.style.background=C.bg}
            onMouseLeave={e=>e.currentTarget.style.background=""}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:5 }}>
              <div style={{ fontSize:15, fontWeight:700, color:C.text }}>{pay.member}</div>
              <span style={{ fontSize:16, fontWeight:800, color:C.accent, flexShrink:0 }}>{pay.amount} €</span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
              <span style={{ fontSize:12, color:C.textSoft, flex:1 }}>{pay.subscription} · {new Date(pay.date).toLocaleDateString("fr-FR")}</span>
              <Tag s={pay.status}/>
              {pay.status==="impayé" && (
                pay.relance
                  ? <span style={{ fontSize:12, fontWeight:600, color:C.ok, display:"flex", alignItems:"center", gap:4 }}><IcoCheck s={12} c={C.ok}/>Relancé</span>
                  : <Button sm variant="primary" onClick={()=>relancer(pay.id)}><span style={{display:"flex",alignItems:"center",gap:5}}><IcoMail s={12} c="white"/>Relancer</span></Button>
              )}
              {pay.stripe_payment_id
                ? <a href={`/api/invoice?paymentId=${pay.id}`} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize:11, fontWeight:600, color:C.accent, textDecoration:"none", padding:"3px 8px", border:`1px solid ${C.accent}30`, borderRadius:6, background:C.accentBg, display:"flex", alignItems:"center", gap:4, whiteSpace:"nowrap" }}>
                    🧾 Facture
                  </a>
                : <span style={{ fontSize:11, fontWeight:600, color:C.textMuted, padding:"3px 8px", border:`1px solid ${C.border}`, borderRadius:6, background:C.bg, display:"flex", alignItems:"center", gap:4, whiteSpace:"nowrap", cursor:"not-allowed", opacity:0.5 }}
                    title="Facture Stripe non disponible">
                    🧾 Facture
                  </span>
              }
            </div>
          </div>
        ))}
      </Card>
    </div>
    </div>
  );
}



// ── DATE PICKER — calendrier mini popup élégant ──────────────────────────────

export { Payments };