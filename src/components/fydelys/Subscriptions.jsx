"use client";

import React, { useState, useEffect, useContext } from "react";
import { createClient } from "@/lib/supabase";
import { AppCtx } from "./context";
import { C } from "./theme";
import { SUBSCRIPTIONS_DEMO } from "./demoData";
import { IcoTag2, IcoX, IcoCheck, IcoSettings2 } from "./icons";
import { Card, SectionHead, Button, Field, FieldLabel, Tag, Pill, DemoBanner, EmptyState } from "./ui";

function Subscriptions({ isMobile }) {
  const { studioId } = useContext(AppCtx);
  const [subs, setSubs] = useState([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [isDemoData, setIsDemoData] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState(null);
  const [nSub, setNSub] = useState({ name:"", price:"", period:"mois", description:"" });
  const [editData, setEditData] = useState({});
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const p = isMobile?12:28;

  useEffect(() => {
    if (!studioId) return;
    // Charger le flag stripe_connect_enabled du studio
    createClient().from("studios")
      .select("stripe_connect_enabled, payment_mode")
      .eq("id", studioId).single()
      .then(({ data }) => {
        // Product/Price IDs visibles seulement en mode "direct" (le studio gère ses propres produits Stripe)
        // En mode "connect", Fydelys crée les prix automatiquement via l'API Connect
        setStripeEnabled(data?.payment_mode === "direct");
      });
  }, [studioId]);

  useEffect(() => {
    if (!studioId) return;
    setDbLoading(true);
    createClient().from("subscriptions")
      .select("id, name, price, period, description, popular, color, stripe_price_id, stripe_product_id")
      .eq("studio_id", studioId).eq("active", true).order("price")
      .then(({ data, error }) => {
        if (error) { console.error("load subs", error); setDbLoading(false); return; }
        if (!data || data.length === 0) { setSubs(SUBSCRIPTIONS_DEMO); setIsDemoData(true); setDbLoading(false); return; }
        if (data) setSubs(data.map(s => ({ ...s, color: s.color || "#B8936A" })));
        setDbLoading(false);
      });
  }, [studioId]);

  const startEdit = (sub) => {
    setEditId(sub.id);
    setEditData({ name:sub.name, price:sub.price, period:sub.period, description:sub.description, popular:sub.popular,
      stripe_product_id: sub.stripe_product_id||"", stripe_price_id: sub.stripe_price_id||"" });
  };
  const saveEdit = async (id) => {
    setSubs(prev=>prev.map(s=>s.id===id?{...s,...editData,price:parseFloat(editData.price)||0}:s));
    setEditId(null);
    try {
      await createClient().from("subscriptions").update({
        name: editData.name, price: parseFloat(editData.price)||0,
        period: editData.period, description: editData.description||"", popular: editData.popular||false,
        stripe_product_id: editData.stripe_product_id||"",
        stripe_price_id:   editData.stripe_price_id||"",
      }).eq("id", id);
    } catch(e) { console.error("update sub", e); }
  };

  return (
    <div>
      {isDemoData && <DemoBanner/>}
      <div style={{ padding:p }}>
      <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:18 }}><Button sm variant="primary" onClick={()=>setShowAdd(!showAdd)}>＋ Abonnement</Button></div>
      {showAdd && (
        <Card style={{ marginBottom:18, borderTop:`3px solid ${C.accent}` }}>
          <div style={{ fontSize:14, fontWeight:700, color:C.accent, textTransform:"uppercase", marginBottom:16 }}>Créer un abonnement</div>
          <div style={{ display:"grid", gridTemplateColumns:`repeat(${isMobile?1:2},1fr)`, gap:14 }}>
            <Field label="Nom" value={nSub.name} onChange={v=>setNSub({...nSub,name:v})} placeholder="Ex: Mensuel illimité"/>
            <Field label="Prix (€)" type="number" value={nSub.price} onChange={v=>setNSub({...nSub,price:v})} placeholder="89"/>
            <Field label="Période" value={nSub.period} onChange={v=>setNSub({...nSub,period:v})} opts={["mois","séance","carnet","trimestre","année"]}/>
            <Field label="Description" value={nSub.description} onChange={v=>setNSub({...nSub,description:v})} placeholder="Courte description…"/>
          </div>
          <div style={{ marginTop:14, display:"flex", gap:10 }}>
            <Button variant="primary" onClick={async ()=>{
              if(!nSub.name)return;
              const tempId = `tmp-${Date.now()}`;
              setSubs(prev=>[...prev,{id:tempId,...nSub,price:parseFloat(nSub.price)||0,color:C.accent,popular:false}]);
              setShowAdd(false); setNSub({name:"",price:"",period:"mois",description:""});
              if (studioId) {
                try {
                  const sb = createClient();
                  const { data } = await sb.from("subscriptions").insert({
                    studio_id:studioId, name:nSub.name, price:parseFloat(nSub.price)||0,
                    period:nSub.period, description:nSub.description||"", popular:false, color:C.accent,
                  }).select("id").single();
                  if (data?.id) setSubs(prev=>prev.map(s=>s.id===tempId?{...s,id:data.id}:s));
                } catch(e) { console.error("insert sub", e); }
              }
            }}>Créer</Button>
            <Button variant="ghost" onClick={()=>setShowAdd(false)}>Annuler</Button>
          </div>
        </Card>
      )}
      <div style={{ display:"grid", gridTemplateColumns:`repeat(${isMobile?1:2},1fr)`, gap:16 }}>
        {subs.map(sub=>(
          <Card key={sub.id} style={{ position:"relative", borderTop:`3px solid ${sub.popular?sub.color:C.border}` }}>
            {sub.popular && <div style={{ position:"absolute", top:-1, right:16, background:sub.color, color:"#fff", fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:"0 0 6px 6px", textTransform:"uppercase" }}>POPULAIRE</div>}
            {editId === sub.id ? (
              /* ── Mode édition inline ── */
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:C.accent, textTransform:"uppercase", marginBottom:14 }}>Modifier l'abonnement</div>
                <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:14 }}>
                  <div><FieldLabel>Nom</FieldLabel><input value={editData.name} onChange={e=>setEditData({...editData,name:e.target.value})} style={{ width:"100%", padding:"8px 11px", border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:14, outline:"none", boxSizing:"border-box", color:C.text, background:C.surfaceWarm }} onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/></div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                    <div><FieldLabel>Prix (€)</FieldLabel><input type="number" value={editData.price} onChange={e=>setEditData({...editData,price:e.target.value})} style={{ width:"100%", padding:"8px 11px", border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:14, outline:"none", boxSizing:"border-box", color:C.text, background:C.surfaceWarm }} onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/></div>
                    <Field label="Période" value={editData.period} onChange={v=>setEditData({...editData,period:v})} opts={["mois","séance","carnet","trimestre","année"]}/>
                  </div>
                  <div><FieldLabel>Description</FieldLabel><input value={editData.description} onChange={e=>setEditData({...editData,description:e.target.value})} style={{ width:"100%", padding:"8px 11px", border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:14, outline:"none", boxSizing:"border-box", color:C.text, background:C.surfaceWarm }} onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/></div>
                  {stripeEnabled && <div style={{ borderTop:`1px solid ${C.borderSoft}`, paddingTop:10 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:.5, marginBottom:8 }}>🔗 Stripe (optionnel)</div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                      <div>
                        <FieldLabel>Product ID</FieldLabel>
                        <input value={editData.stripe_product_id||""}
                          onChange={e=>setEditData({...editData,stripe_product_id:e.target.value})}
                          placeholder="prod_…"
                          style={{ width:"100%", padding:"8px 11px", border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:12, outline:"none", boxSizing:"border-box", color:C.text, background:C.surfaceWarm, fontFamily:"monospace" }}
                          onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/>
                      </div>
                      <div>
                        <FieldLabel>Price ID</FieldLabel>
                        <input value={editData.stripe_price_id||""}
                          onChange={e=>setEditData({...editData,stripe_price_id:e.target.value})}
                          placeholder="price_…"
                          style={{ width:"100%", padding:"8px 11px", border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:12, outline:"none", boxSizing:"border-box", color:C.text, background:C.surfaceWarm, fontFamily:"monospace" }}
                          onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/>
                      </div>
                    </div>
                    <div style={{ fontSize:11, color:C.textMuted, marginTop:5, lineHeight:1.6 }}>
                      Trouvez ces IDs dans votre propre <a href="https://dashboard.stripe.com/products" target="_blank" rel="noopener" style={{ color:C.accent, textDecoration:"none" }}>Dashboard Stripe → Produits</a>
                      <span style={{ display:"block", marginTop:3, padding:"4px 8px", background:"#FEF3C7", borderRadius:6, color:"#92400E", fontWeight:600 }}>
                        ⚠ Ce sont les IDs de votre compte Stripe, pas ceux de Fydelys.
                      </span>
                    </div>
                  </div>}
                  <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", fontSize:13, color:C.text }}>
                    <input type="checkbox" checked={editData.popular||false} onChange={e=>setEditData({...editData,popular:e.target.checked})} style={{ width:15, height:15, cursor:"pointer" }}/>
                    Marquer comme populaire
                  </label>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <Button sm variant="primary" onClick={()=>saveEdit(sub.id)}><span style={{display:"flex",alignItems:"center",gap:5}}><IcoCheck s={13} c="white"/>Enregistrer</span></Button>
                  <Button sm variant="ghost" onClick={()=>setEditId(null)}>Annuler</Button>
                </div>
              </div>
            ) : (
              /* ── Mode affichage ── */
              <>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                  <div>
                    <div style={{ fontSize:19, fontWeight:700, color:C.text, marginBottom:4 }}>{sub.name}</div>
                    <div style={{ fontSize:34, fontWeight:700, color:C.text, lineHeight:1 }}>{sub.price} €<span style={{ fontSize:16, color:C.textSoft, fontWeight:400 }}> / {sub.period}</span></div>
                  </div>
                  <div style={{ width:10, height:10, borderRadius:"50%", background:sub.color, marginTop:4, flexShrink:0 }}/>
                </div>
                <div style={{ fontSize:15, color:C.textSoft, marginBottom:18, lineHeight:1.6 }}>{sub.description}</div>
                <div style={{ display:"flex", gap:8 }}>
                  <Button sm variant="ghost" onClick={()=>startEdit(sub)}><span style={{display:"flex",alignItems:"center",gap:5}}><IcoSettings2 s={13} c={C.textMid}/>Modifier</span></Button>
                  <Button sm variant="danger" onClick={async ()=>{
                    setSubs(prev=>prev.filter(s=>s.id!==sub.id));
                    if (studioId) {
                      try { const sb = createClient(); await sb.from("subscriptions").update({active:false}).eq("id",sub.id); }
                      catch(e) { console.error("del sub",e); }
                    }
                  }}>Supprimer</Button>
                </div>
              </>
            )}
          </Card>
        ))}
      </div>
      </div>
    </div>
  );
}


export { Subscriptions };
