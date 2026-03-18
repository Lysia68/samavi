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
  const total  = payments.filter(p=>p.status==="payé").reduce((s,p)=>s+p.amount,0);
  const unpaid = payments.filter(p=>p.status==="impayé").reduce((s,p)=>s+p.amount,0);
  const p = isMobile?12:28;

  useEffect(() => {
    if (!studioId) return;
    setDbLoading(true);
    createClient().from("member_payments")
      .select("id, member_id, amount, status, payment_date, payment_type, notes, members(first_name, last_name), subscriptions(name)")
      .eq("studio_id", studioId).order("payment_date", { ascending: false })
      .then(({ data, error }) => {
        if (error) { console.error("load payments", error); setDbLoading(false); return; }
        if (!data || data.length === 0) { setPayments(PAYMENTS_DEMO); setIsDemoData(true); setDbLoading(false); return; }
        if (data) setPayments(data.map(pay => ({
          id: pay.id, memberId: pay.member_id,
          member: pay.members ? `${pay.members.first_name} ${pay.members.last_name}` : "—",
          amount: pay.amount, status: pay.status,
          date: pay.payment_date, type: pay.payment_type || "Carte",
          subscription: pay.subscriptions?.name || "—", notes: pay.notes || "",
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
