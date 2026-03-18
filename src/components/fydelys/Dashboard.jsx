"use client";

import React, { useState, useEffect, useContext } from "react";
import { createClient } from "@/lib/supabase";
import { AppCtx } from "./context";
import { C } from "./theme";
import { DISCIPLINES, SESSIONS_INIT, BOOKINGS_INIT, MEMBERS, PAYMENTS } from "./demoData";
import { IcoUsers2, IcoCalendar2, IcoBarChart2, IcoEuro2, IcoAlert2, IcoChevron } from "./icons";
import { Card, SectionHead, Pill, KpiCard, MemberRow, DemoBanner, creditColor, CreditBadge } from "./ui";
import { PlanningAccordion } from "./accordion";

// ── PLANNING ACCORDION ────────────────────────────────────────────────────────

function stLbl(s) { return s==="confirmed"?"Confirmé":s==="waitlist"?"En attente":"Annulé"; }
function stStyle(s) {
  if (s==="confirmed") return { color:C.ok,    background:C.okBg    };
  if (s==="waitlist")  return { color:C.accent, background:C.accentBg };
  return { color:C.warn, background:C.warnBg };
}


function DashboardSessionCard({ sess, expandedId, bookings, onToggle, onChangeStatus, isDemo, discs }) {
  const allDiscs = (discs && discs.length) ? discs : DISCIPLINES;
  const disc  = allDiscs.find(d=>d.id===sess.disciplineId) || { name: sess.discipline_name || sess.disciplineId || "Discipline", color:"#C4956A" };
  const bl    = bookings[sess.id]||[];
  const booked= bl.length ? bl.filter(b=>b.st==="confirmed").length : sess.booked;
  const wait  = bl.length ? bl.filter(b=>b.st==="waitlist").length  : sess.waitlist;
  const pct   = booked/sess.spots;
  const isExp = !isDemo && expandedId===sess.id;
  return (
    <div style={{ borderBottom:`1px solid ${C.borderSoft}` }}>
      <div onClick={isDemo ? undefined : ()=>onToggle(sess.id)}
        style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 16px", cursor:isDemo?"default":"pointer", background:isExp?C.accentBg:C.surface, transition:"background .15s" }}
        onMouseEnter={e=>{ if(!isExp && !isDemo) e.currentTarget.style.background=C.surfaceWarm; }}
        onMouseLeave={e=>{ if(!isExp) e.currentTarget.style.background=C.surface; }}>
        <div style={{ fontSize:14, fontWeight:700, color:C.accent, width:36, flexShrink:0 }}>{sess.time}</div>
        <div style={{ width:3, height:28, background:disc.color, borderRadius:2, flexShrink:0 }}/>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:16, fontWeight:700, color:C.text }}>{disc.name}</div>
          <div style={{ fontSize:13, color:C.textSoft }}>{sess.teacher} · {sess.room} · {sess.duration}min</div>
        </div>
        <div style={{ textAlign:"right", flexShrink:0 }}>
          <div style={{ fontSize:15, fontWeight:700, color:pct>=1?C.warn:C.text }}>
            {booked}/{sess.spots}
            {wait>0 && <span style={{ fontSize:12, color:C.accent, marginLeft:3 }}>+{wait}</span>}
          </div>
          <div style={{ width:48, height:3, background:C.bgDeep, borderRadius:2, marginTop:3 }}>
            <div style={{ height:"100%", width:`${Math.min(pct*100,100)}%`, background:pct>=1?C.warn:pct>.75?C.accent:C.ok, borderRadius:2 }}/>
          </div>
        </div>
        <span style={{ flexShrink:0, display:"inline-flex", transition:"transform .2s", transform:isExp?"rotate(180deg)":"none" }}><IcoChevron s={16} c={C.textMuted}/></span>
      </div>
      {isExp && <PlanningAccordion sessId={sess.id} bookings={bookings} onChangeStatus={onChangeStatus}/>}
    </div>
  );
}

// ── PLANNING ──────────────────────────────────────────────────────────────────

function Dashboard({ isMobile }) {
  const p = isMobile?12:28;
  const { studioId, discs: ctxDiscs, setDiscs } = useContext(AppCtx);
  const [localDiscs, setLocalDiscs] = useState([]);
  const discs = localDiscs.length ? localDiscs : ctxDiscs;
  const [expandedId, setExpandedId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [bookings, setBookings] = useState({});
  const [members, setMembers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [publicPageEnabled, setPublicPageEnabled] = useState(null); // null=loading

  const handleToggle = (id) => setExpandedId(prev => prev===id ? null : id);
  const handleChangeStatus = (bid, sid, ns) => {
    setBookings(prev => { const nb={...prev}; nb[sid]=(nb[sid]||[]).map(b=>b.id===bid?{...b,st:ns}:b); return nb; });
  };

  useEffect(() => {
    if (!studioId) return;
    const sb = createClient();
    const today = new Date().toISOString().slice(0,10);
    const monthStart = today.slice(0,7);

    // Charger le flag page publique
    sb.from("studios").select("public_page_enabled, slug").eq("id", studioId).single()
      .then(({ data }) => setPublicPageEnabled(data?.public_page_enabled === true ? { enabled:true, slug:data.slug } : { enabled:false, slug:data?.slug||"" }));

    Promise.all([
      sb.from("sessions").select("id,discipline_id,teacher,room,duration_min,spots,session_date,session_time,status").eq("studio_id", studioId),
      sb.from("members").select("id,first_name,last_name,email,phone,status,joined_at,subscription_id,subscriptions(name)").eq("studio_id", studioId),
      sb.from("member_payments").select("id,amount,status,payment_date").eq("studio_id", studioId),
      sb.from("disciplines").select("id,name,color,icon").eq("studio_id", studioId),
    ]).then(async ([sessRes, membRes, payRes, discRes]) => {
      const sessData = sessRes.data || [];
      const membData = membRes.data || [];
      const payData  = payRes.data  || [];
      const discData = discRes.data || [];

      if (sessData.length === 0 && membData.length === 0) {
        // Données démo
        setSessions(SESSIONS_INIT);
        setBookings(JSON.parse(JSON.stringify(BOOKINGS_INIT)));
        setMembers(MEMBERS);
        setPayments(PAYMENTS);
        setIsDemo(true);
      } else {
        const mappedSessions = sessData.map(s=>({
          id: s.id, disciplineId: s.discipline_id,
          teacher: s.teacher||"", room: s.room||"",
          duration: s.duration_min||60, spots: s.spots||12,
          date: s.session_date, time: s.session_time?.slice(0,5)||"09:00",
          status: s.status||"scheduled", booked:0, waitlist:0,
        }));

        // Charger les bookings pour calculer le taux de remplissage
        const sessionIds = mappedSessions.map(s => s.id);
        let bkMap = {};
        if (sessionIds.length > 0) {
          const { data: bkData } = await sb.from("bookings")
            .select("session_id, status, attended, member_id, members(first_name, last_name, email, phone)")
            .in("session_id", sessionIds);
          (bkData || []).forEach(b => {
            if (!bkMap[b.session_id]) bkMap[b.session_id] = [];
            bkMap[b.session_id].push({
              id: b.member_id,
              st: b.status,
              attended: b.attended,
              fn: b.members?.first_name || "",
              ln: b.members?.last_name  || "",
              name: `${b.members?.first_name||""} ${b.members?.last_name||""}`.trim() || "—",
              email: b.members?.email   || "",
              phone: b.members?.phone   || "",
            });
          });
        }

        setSessions(mappedSessions);
        setBookings(bkMap);
        setMembers(membData.map(m=>({
          ...m,
          firstName: m.first_name||"",
          lastName: m.last_name||"",
          email: m.email||"",
          phone: m.phone||"",
          subscription: m.subscriptions?.name||"—",
          joined: m.joined_at||"",
          avatar: (m.first_name?.[0]||"") + (m.last_name?.[0]||""),
          credits: 0,
        })));
        setPayments(payData.map(p=>({...p, date:p.payment_date, status:p.status})));
        if (discData.length > 0) {
          setLocalDiscs(discData);
          setDiscs(discData);
        }
        setIsDemo(false);
      }
      setLoading(false);
    });
  }, [studioId]);

  // Date du jour
  const today = new Date();
  const todayStr = today.toISOString().slice(0,10);
  const todayLabel = today.toLocaleDateString("fr-FR",{weekday:"short",day:"numeric",month:"long"});
  const todaySessions = sessions.filter(s=>s.date===todayStr);

  // KPIs
  const monthStr = todayStr.slice(0,7);
  const activeMembers = members.filter(m=>m.status==="active"||m.status==="actif"||m.status==="Actif").length;
  const monthSessions = sessions.filter(s=>s.date?.startsWith(monthStr)).length;
  const totalBooked = sessions.reduce((acc,s)=>{ const bks=bookings[s.id]||[]; return acc+(bks.length?bks.filter(b=>b.st==="confirmed").length:s.booked||0); },0);
  const totalCap = sessions.reduce((acc,s)=>acc+(s.spots||0),0);
  const fillRate = totalCap>0 ? Math.round(totalBooked/totalCap*100) : 0;
  const monthRevenue = payments.filter(p=>p.date?.startsWith(monthStr)&&(p.status==="payé"||p.status==="paid")).reduce((s,p)=>s+(p.amount||0),0);

  // Alertes calculées depuis les vraies données
  const unpaidAmount = payments.filter(p=>p.status==="impayé"||p.status==="unpaid").reduce((s,p)=>s+(p.amount||0),0);
  const waitlistCount = Object.values(bookings).reduce((acc,bl)=>acc+(bl||[]).filter(b=>b.st==="waitlist").length,0);
  const alerts = [
    unpaidAmount > 0 && { label:"Impayés en cours", value:`${unpaidAmount.toLocaleString("fr-FR")} €`, c:C.warn, bg:C.warnBg },
    waitlistCount > 0 && { label:"Liste d'attente", value:`${waitlistCount} membre${waitlistCount>1?"s":""}`, c:C.info, bg:C.infoBg },
    publicPageEnabled !== null && !publicPageEnabled.enabled && { label:"page_publique", c:C.accent, bg:C.accentBg, slug:publicPageEnabled.slug },
  ].filter(Boolean);

  // Membres récents triés par date d'inscription
  const recentMembers = [...members].sort((a,b)=>{
    const da = a.joinedAt||a.joined_at||a.created_at||"";
    const db = b.joinedAt||b.joined_at||b.created_at||"";
    return db.localeCompare(da);
  }).slice(0,3);

  const EmptyCard = ({label}) => (
    <div style={{padding:"28px 16px",textAlign:"center",color:C.textMuted,fontSize:14,fontStyle:"italic"}}>
      {label}
    </div>
  );

  return (
    <div>
      {isDemo && <DemoBanner/>}
      <div style={{ padding:p }}>
        <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)", gap:isMobile?8:14, marginBottom:isMobile?12:20 }}>
          <KpiCard icon={<IcoUsers2 s={isMobile?16:18} c={C.ok}/>}      label="Adhérents actifs" value={activeMembers>0?String(activeMembers):"—"}  delta={null} accentColor={C.ok}     isMobile={isMobile}/>
          <KpiCard icon={<IcoCalendar2 s={isMobile?16:18} c="#6B9E7A"/>} label="Séances ce mois"  value={monthSessions>0?String(monthSessions):"—"}   delta={null} accentColor="#6B9E7A"  isMobile={isMobile}/>
          <KpiCard icon={<IcoBarChart2 s={isMobile?16:18} c="#6A8FAE"/>} label="Taux remplissage" value={totalCap>0?fillRate+" %":"—"}                 delta={null} accentColor="#6A8FAE"  isMobile={isMobile}/>
          <KpiCard icon={<IcoEuro2 s={isMobile?16:18} c={C.accent}/>}   label="CA du mois"        value={monthRevenue>0?monthRevenue.toLocaleString("fr-FR")+" €":"—"} delta={null} accentColor={C.accent} isMobile={isMobile}/>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1.6fr 1fr", gap:16 }}>
          <Card noPad>
            <SectionHead action={<Pill>{todayLabel}</Pill>}>Séances du jour</SectionHead>
            {loading
              ? <div style={{padding:"28px",textAlign:"center",color:C.textMuted,fontSize:14}}>Chargement…</div>
              : todaySessions.length === 0
                ? <EmptyCard label="Aucune séance programmée aujourd'hui"/>
                : todaySessions.map(s=>(
                  <DashboardSessionCard key={s.id} sess={s} expandedId={expandedId} bookings={bookings} onToggle={handleToggle} onChangeStatus={handleChangeStatus} isDemo={isDemo} discs={discs}/>
                ))}
          </Card>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <Card noPad>
              <SectionHead><span style={{display:"flex",alignItems:"center",gap:6}}><IcoAlert2 s={15} c={C.warn}/>Alertes</span></SectionHead>
              {loading
                ? <EmptyCard label="Chargement…"/>
                : alerts.length === 0
                  ? <EmptyCard label="Aucune alerte pour le moment"/>
                  : alerts.map(a=>(
                    a.label === "page_publique"
                      ? <div key="page_publique" style={{ padding:"12px 16px", borderBottom:`1px solid ${C.borderSoft}` }}>
                          <div style={{ fontSize:13, color:C.text, fontWeight:600, marginBottom:2 }}>
                            🌐 Site vitrine non activé
                          </div>
                          <div style={{ fontSize:12, color:C.textSoft, marginBottom:8, lineHeight:1.5 }}>
                            Vous n'avez pas de site web ? Activez votre page vitrine gratuite pour présenter votre studio et afficher votre planning en ligne.
                          </div>
                          <button onClick={()=>{ window.dispatchEvent(new CustomEvent("fydelys:nav", { detail:"settings" })); }}
                            style={{ fontSize:12, fontWeight:700, color:C.accent, background:C.accentBg, border:`1px solid ${C.accent}40`, borderRadius:7, padding:"4px 12px", cursor:"pointer" }}>
                            Configurer mon site vitrine →
                          </button>
                        </div>
                      : <div key={a.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 16px", borderBottom:`1px solid ${C.borderSoft}` }}>
                          <span style={{ fontSize:14, color:C.textMid }}>{a.label}</span>
                          <span style={{ fontSize:13, fontWeight:700, color:a.c, background:a.bg, padding:"3px 12px", borderRadius:12 }}>{a.value}</span>
                        </div>
                  ))
              }
            </Card>
            <Card noPad style={{ flex:1 }}>
              <SectionHead>Derniers inscrits</SectionHead>
              {loading
                ? <EmptyCard label="Chargement…"/>
                : recentMembers.length === 0
                  ? <EmptyCard label="Aucun adhérent pour le moment"/>
                  : recentMembers.map(m=><MemberRow key={m.id} m={m} onSelect={()=>{}} selected={false}/>)
              }
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── CREDIT BADGE ─────────────────────────────────────────────────────────────
// Affiche "X/Y" avec couleur dégradée rouge→orange→vert selon % restant
// credits=null = forfait illimité (∞)

export { Dashboard, DashboardSessionCard };
