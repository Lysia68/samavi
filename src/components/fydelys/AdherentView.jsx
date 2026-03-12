"use client";

import React, { useState, useEffect, useContext } from "react";
import { createClient } from "@/lib/supabase";
import { AppCtx } from "./context";
import { C } from "./theme";
import { SESSIONS_INIT, MEMBERS_DEMO, DISCIPLINES, SUBSCRIPTIONS_INIT, ADH_NAV_KEYS } from "./demoData";
import { IcoCalendar2, IcoUser2, IcoChevron, IcoCreditCard2, IcoCheck, IcoX, IcoAlert2, IcoTag2, IcoUsers2, IcoBarChart2, IcoActivity, IcoHeart, IcoStar, IcoZap } from "./icons";
import { Card, SectionHead, Button, Tag, Pill, EmptyState, DemoBanner, DateLabel, Field, SessionRow } from "./ui";


function AdherentView({ onSwitch, isMobile, studioName = "" }) {
  const ADH_NAV = ADH_NAV_KEYS.map((n,i) => ({ ...n, icon:[IcoCalendar2,IcoHeart,IcoActivity,IcoCreditCard2][i] }));
  const ADH_MOBILE_NAV = ADH_NAV;
  const [page, setPage]    = useState("planning");
  const [myBookings, setMyBookings] = useState([1,3]);
  const [toast, setToast]  = useState(null);
  const showToast = (msg, ok=true) => { setToast({msg,ok}); setTimeout(()=>setToast(null),3000); };
  const p = isMobile ? 16 : 28;

  const ME = { fn:"Sophie", ln:"Leroux", avatar:"SL", sub:"Carnet 10 séances", credits:4, total:10, joined:"2025-11-05" };

  // ── Planning Adhérent ──────────────────────────────────────────────────────
  function AdhPlanning() {
    const [sessions, setSessions] = useState(SESSIONS_INIT);
    const [filterDisc, setFilterDisc] = useState(0);
    const [confirmSess, setConfirmSess] = useState(null);

    const grouped = sessions
      .filter(s => !filterDisc || s.disciplineId===filterDisc)
      .reduce((acc,s)=>{ (acc[s.date]=acc[s.date]||[]).push(s); return acc; }, {});

    const book = (s) => {
      setMyBookings(p=>[...p,s.id]);
      setSessions(p=>p.map(x=>x.id===s.id?{...x,booked:x.booked+1}:x));
      setConfirmSess(null);
      showToast(`Réservé : ${DISCIPLINES.find(d=>d.id===s.disciplineId)?.name} — ${s.time}`);
    };
    const cancel = (s) => {
      setMyBookings(p=>p.filter(id=>id!==s.id));
      setSessions(p=>p.map(x=>x.id===s.id?{...x,booked:Math.max(0,x.booked-1)}:x));
      showToast("Réservation annulée");
    };

    return (
      <div style={{ padding:p }}>
        {/* Modal confirmation réservation */}
        {confirmSess && (
          <div onClick={e=>e.target===e.currentTarget&&setConfirmSess(null)}
            style={{ position:"fixed", inset:0, background:"rgba(42,31,20,.45)", zIndex:800, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
            <div style={{ background:C.surface, borderRadius:16, padding:28, width:"100%", maxWidth:420, boxShadow:"0 24px 56px rgba(42,31,20,.18)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
                <div style={{ fontSize:18, fontWeight:700, color:C.text }}>Confirmer la réservation</div>
                <button onClick={()=>setConfirmSess(null)} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:7, padding:"3px 8px", cursor:"pointer", color:C.textSoft, fontSize:15 }}>✕</button>
              </div>
              <div style={{ background:C.accentLight, borderRadius:10, padding:14, marginBottom:18 }}>
                <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:4 }}>
                  {DISCIPLINES.find(d=>d.id===confirmSess.disciplineId)?.name}
                </div>
                <div style={{ fontSize:13, color:C.textSoft }}>{new Date(confirmSess.date).toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})} · {confirmSess.time} · {confirmSess.duration} min</div>
                <div style={{ fontSize:13, color:C.textSoft }}>{confirmSess.teacher} · {confirmSess.room}</div>
                {ME.credits>0 && (
                  <div style={{ marginTop:10, padding:"8px 12px", background:C.surface, borderRadius:8, fontSize:13, color:C.textMid }}>
                    💳 Cette séance utilisera <strong>1 crédit</strong> (il vous en restera {ME.credits-1})
                  </div>
                )}
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <Button sm onClick={()=>book(confirmSess)}>Confirmer</Button>
                <Button sm variant="ghost" onClick={()=>setConfirmSess(null)}>Annuler</Button>
              </div>
            </div>
          </div>
        )}

        {/* Barre crédits */}
        {ME.credits>0 && (
          <div style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 16px", background:C.accentLight, borderRadius:10, marginBottom:16, border:`1px solid ${C.border}` }}>
            <IcoCreditCard2 s={20} c={C.accent}/>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:600, color:C.text }}>Crédits restants : {ME.credits}/{ME.total}</div>
              <div style={{ height:4, background:C.bgDeep, borderRadius:2, marginTop:5 }}>
                <div style={{ width:`${ME.credits/ME.total*100}%`, height:"100%", background:C.accent, borderRadius:2 }}/>
              </div>
            </div>
          </div>
        )}

        {/* Filtres disciplines */}
        <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
          {[{id:0,name:"Toutes",color:C.accent},...DISCIPLINES].map(d=>(
            <button key={d.id} onClick={()=>setFilterDisc(d.id)}
              style={{ fontSize:13, padding:"5px 14px", borderRadius:20, border:`1.5px solid ${filterDisc===d.id?d.color:C.border}`, background:filterDisc===d.id?d.color+"18":C.surface, color:filterDisc===d.id?d.color:C.textMid, fontWeight:filterDisc===d.id?700:500, cursor:"pointer" }}>
              {d.icon||""} {d.name}
            </button>
          ))}
        </div>

        {Object.entries(grouped).sort(([a],[b])=>a>b?1:-1).map(([date,daySessions])=>(
          <div key={date} style={{ marginBottom:20 }}>
            <DateLabel date={date}/>
            {daySessions.map(s=>{
              const disc = DISCIPLINES.find(d=>d.id===s.disciplineId);
              const isBooked = myBookings.includes(s.id);
              const isFull   = s.booked >= s.spots;
              const pct      = s.booked/s.spots;
              return (
                <Card key={s.id} style={{ marginBottom:8, borderLeft:`3px solid ${disc?.color||C.accent}`, opacity:isFull&&!isBooked?0.65:1 }}>
                  <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
                    <div style={{ fontSize:isMobile?15:16, fontWeight:700, color:C.accent, width:38, flexShrink:0, letterSpacing:-0.2 }}>{s.time}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:2 }}>
                        <span style={{ fontSize:isMobile?15:16, fontWeight:700, color:C.text }}>{disc?.name}</span>
                        <Pill color={disc?.color||C.accent} bg={disc?.color+"18"||C.accentLight}>{s.level}</Pill>
                        {isFull && !isBooked && <Tag s="complet"/>}
                      </div>
                      <div style={{ fontSize:isMobile?14:15, color:C.textSoft, marginBottom:6 }}>{s.teacher} · {s.room} · {s.duration} min</div>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div style={{ flex:1, maxWidth:160, height:4, background:C.bgDeep, borderRadius:2 }}>
                          <div style={{ height:"100%", width:`${Math.min(pct*100,100)}%`, background:pct>=1?C.warn:pct>.75?C.accent:C.ok, borderRadius:2 }}/>
                        </div>
                        <span style={{ fontSize:12, fontWeight:600, color:pct>=1?C.warn:C.textSoft }}>{s.booked}/{s.spots} places</span>
                      </div>
                    </div>
                    <div style={{ flexShrink:0 }}>
                      {isBooked
                        ? <Button sm variant="danger" onClick={()=>cancel(s)}>Annuler</Button>
                        : isFull
                          ? <Button sm variant="secondary" onClick={()=>showToast("Ajouté à la liste d'attente")}>Liste d'attente</Button>
                          : <Button sm onClick={()=>setConfirmSess(s)}>Réserver</Button>
                      }
                    </div>
                  </div>
                  {isBooked && (
                    <div style={{ marginTop:10, padding:"7px 12px", background:C.okBg, borderRadius:8, fontSize:13, color:C.ok, fontWeight:600, display:"flex", alignItems:"center", gap:6 }}>
                      <IcoCheck s={14} c={C.ok}/> Vous êtes inscrit(e) à cette séance
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        ))}
      </div>
    );
  }

  // ── Mon Compte ─────────────────────────────────────────────────────────────
  function AdhAccount() {
    return (
      <div style={{ padding:p, maxWidth:600 }}>
        <Card style={{ marginBottom:16 }}>
          <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:18 }}>
            <div style={{ width:54, height:54, borderRadius:"50%", background:C.accentBg, border:`2px solid #DFC0A0`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:700, color:C.accent }}>{ME.avatar}</div>
            <div>
              <div style={{ fontSize:20, fontWeight:700, color:C.text }}>{ME.fn} {ME.ln}</div>
              <div style={{ fontSize:14, color:C.textSoft }}>sophie.l@email.com</div>
              <Tag s="actif"/>
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
            {[
              { l:"Abonnement",        v:ME.sub,                                              icon:<IcoTag2 s={16} c={C.accent}/>   },
              { l:"Crédits restants",  v:`${ME.credits} / ${ME.total}`,                       icon:<IcoCreditCard2 s={16} c={C.ok}/>  },
              { l:"Membre depuis",     v:new Date(ME.joined).toLocaleDateString("fr-FR"),     icon:<IcoCalendar2 s={16} c={C.info}/>  },
              { l:"Séances effectuées",v:MY_HISTORY.filter(h=>h.status==="présent").length,   icon:<IcoCheck s={16} c={C.ok}/>       },
            ].map(k=>(
              <div key={k.l} style={{ background:C.bg, borderRadius:10, padding:"12px 14px", display:"flex", gap:10, alignItems:"center" }}>
                {k.icon}
                <div>
                  <div style={{ fontSize:15, fontWeight:700, color:C.text }}>{k.v}</div>
                  <div style={{ fontSize:12, color:C.textSoft }}>{k.l}</div>
                </div>
              </div>
            ))}
          </div>
          <Button sm variant="ghost" onClick={()=>showToast("Profil enregistré !")}>Modifier le profil</Button>
        </Card>
        <Card>
          <SectionHead>Mes prochaines séances</SectionHead>
          {SESSIONS_INIT.filter(s=>myBookings.includes(s.id)).length===0
            ? <div style={{ padding:"18px 16px", fontSize:14, color:C.textMuted, textAlign:"center" }}>Aucune réservation à venir</div>
            : SESSIONS_INIT.filter(s=>myBookings.includes(s.id)).map(s=>(
              <SessionRow key={s.id} sess={s} isMobile={isMobile}/>
            ))
          }
        </Card>
      </div>
    );
  }

  // ── Historique ─────────────────────────────────────────────────────────────
  function AdhHistory() {
    const presents = MY_HISTORY.filter(h=>h.status==="présent").length;
    const statusHistMap = { présent:[C.ok,C.okBg], absent:[C.warn,C.warnBg] };
    return (
      <div style={{ padding:p, maxWidth:700 }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:18 }}>
          {[{l:"Total séances",v:MY_HISTORY.length},{l:"Présences",v:presents,color:C.ok,bg:C.okBg},{l:"Absences",v:MY_HISTORY.length-presents,color:C.warn,bg:C.warnBg}].map(k=>(
            <Card key={k.l} style={{ textAlign:"center", padding:"14px 10px", background:k.bg||C.surface }}>
              <div style={{ fontSize:26, fontWeight:800, color:k.color||C.text }}>{k.v}</div>
              <div style={{ fontSize:12, color:C.textSoft, marginTop:3 }}>{k.l}</div>
            </Card>
          ))}
        </div>
        <Card style={{ marginBottom:16 }}>
          <SectionHead>Par discipline</SectionHead>
          <div style={{ padding:14 }}>
            {DISCIPLINES.map(d=>{
              const count = MY_HISTORY.filter(h=>h.disc===d.name).length;
              if(!count) return null;
              return (
                <div key={d.id} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
                  <span style={{ fontSize:18 }}>{d.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                      <span style={{ fontSize:14, fontWeight:600, color:C.text }}>{d.name}</span>
                      <span style={{ fontSize:13, fontWeight:700, color:d.color }}>{count}</span>
                    </div>
                    <div style={{ height:4, background:C.bgDeep, borderRadius:2 }}>
                      <div style={{ width:`${count/MY_HISTORY.length*100}%`, height:"100%", background:d.color, borderRadius:2 }}/>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
        <Card noPad>
          <SectionHead>Détail des séances</SectionHead>
          {MY_HISTORY.map(h=>{
            const [color,bg] = statusHistMap[h.status]||[C.textMuted,C.bg];
            return (
              <div key={h.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 16px", borderBottom:`1px solid ${C.borderSoft}` }}>
                <div style={{ width:32, height:32, borderRadius:8, background:bg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  {h.status==="présent" ? <IcoCheck s={16} c={color}/> : <IcoX s={16} c={color}/>}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:15, fontWeight:700, color:C.text }}>{h.disc}</div>
                  <div style={{ fontSize:13, color:C.textSoft }}>{h.teacher} · {new Date(h.date).toLocaleDateString("fr-FR")} · {h.duration} min</div>
                </div>
                <Tag s={h.status}/>
              </div>
            );
          })}
        </Card>
      </div>
    );
  }

  // ── Paiement / Abonnement ──────────────────────────────────────────────────
  function AdhPayment() {
    const [step, setStep] = useState("choose");
    const [chosen, setChosen] = useState(null);
    const [cardNum, setCardNum] = useState("");
    const [expiry, setExpiry]   = useState("");
    const [cvv, setCvv]         = useState("");

    if(step==="done") return (
      <div style={{ padding:p, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:400 }}>
        <div style={{ fontSize:56, marginBottom:16 }}>🎉</div>
        <div style={{ fontSize:22, fontWeight:800, color:C.ok, marginBottom:8 }}>Paiement réussi !</div>
        <div style={{ fontSize:14, color:C.textSoft, marginBottom:24, textAlign:"center" }}>Abonnement <strong>{chosen?.name}</strong> activé.</div>
        <Button sm onClick={()=>{setStep("choose");setChosen(null);}}>Retour</Button>
      </div>
    );

    if(step==="stripe") return (
      <div style={{ padding:p }}>
        <div style={{ maxWidth:440, margin:"0 auto" }}>
          <button onClick={()=>setStep("choose")} style={{ fontSize:13, color:C.textSoft, background:"none", border:"none", cursor:"pointer", marginBottom:16, display:"flex", alignItems:"center", gap:6 }}>
            <IcoChevron s={14} c={C.textSoft}/> Retour
          </button>
          <Card>
            <div style={{ padding:"12px 16px", background:C.accentLight, borderRadius:10, marginBottom:20, border:`1px solid ${C.border}` }}>
              <div style={{ fontSize:15, fontWeight:700, color:C.text }}>{chosen?.name}</div>
              <div style={{ fontSize:24, fontWeight:800, color:C.accent }}>{chosen?.price} € <span style={{ fontSize:14, fontWeight:400, color:C.textSoft }}>/ {chosen?.period}</span></div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:14, marginBottom:18 }}>
              <Field label="Numéro de carte" value={cardNum} onChange={v=>setCardNum(v.replace(/\D/g,"").slice(0,16))} placeholder="1234 5678 9012 3456"/>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <Field label="Expiration" value={expiry} onChange={v=>setExpiry(v)} placeholder="MM/AA"/>
                <Field label="CVV" value={cvv} onChange={v=>setCvv(v.slice(0,3))} placeholder="123"/>
              </div>
            </div>
            <div style={{ padding:"10px 14px", background:C.infoBg, borderRadius:8, display:"flex", gap:8, alignItems:"center", marginBottom:16 }}>
              <span>🔒</span><span style={{ fontSize:13, color:C.info }}>Paiement sécurisé par Stripe. Données chiffrées.</span>
            </div>
            <Button block onClick={()=>{ if(cardNum.length<16){showToast("Numéro de carte invalide",false);return;} setStep("done"); }}>
              Payer {chosen?.price} €
            </Button>
          </Card>
        </div>
      </div>
    );

    return (
      <div style={{ padding:p }}>
        <Card style={{ marginBottom:20, borderTop:`3px solid ${C.accent}` }}>
          <div style={{ fontSize:14, fontWeight:700, color:C.textMid, marginBottom:12 }}>Abonnement actuel</div>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <IcoCreditCard2 s={28} c={C.accent}/>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:C.text }}>{ME.sub}</div>
              <div style={{ fontSize:13, color:C.textSoft }}>{ME.credits} crédits restants · valable 6 mois</div>
            </div>
          </div>
        </Card>
        <div style={{ fontSize:16, fontWeight:700, color:C.text, marginBottom:16 }}>Changer d'abonnement</div>
        <div style={{ display:"grid", gridTemplateColumns:`repeat(${isMobile?1:2},1fr)`, gap:14 }}>
          {SUBSCRIPTIONS_INIT.map(sub=>(
            <div key={sub.id} onClick={()=>{setChosen(sub);setStep("stripe");}}
              style={{ background:C.surface, borderRadius:12, border:`2px solid ${sub.popular?sub.color:C.border}`, padding:18, cursor:"pointer", position:"relative", transition:"border-color .15s, box-shadow .15s" }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=sub.color;e.currentTarget.style.boxShadow=`0 4px 16px ${sub.color}22`;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=sub.popular?sub.color:C.border;e.currentTarget.style.boxShadow="";}}>
              {sub.popular && <div style={{ position:"absolute", top:-1, right:14, background:sub.color, color:"#fff", fontSize:10, fontWeight:800, padding:"3px 10px", borderRadius:"0 0 8px 8px", textTransform:"uppercase" }}>Populaire</div>}
              <div style={{ fontSize:16, fontWeight:700, color:C.text, marginBottom:4 }}>{sub.name}</div>
              <div style={{ fontSize:26, fontWeight:800, color:sub.color, lineHeight:1, marginBottom:8 }}>
                {sub.price} €<span style={{ fontSize:14, fontWeight:400, color:C.textSoft }}> / {sub.period}</span>
              </div>
              <div style={{ fontSize:13, color:C.textSoft, marginBottom:14 }}>{sub.description}</div>
              <Button sm>Choisir →</Button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const PAGE_MAP = { planning:<AdhPlanning/>, account:<AdhAccount/>, history:<AdhHistory/>, payment:<AdhPayment/> };
  const ADH_PAGE_TITLES = { planning:"Planning", account:"Mon compte", history:"Historique", payment:"Paiement" };

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:C.bg }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing:border-box; font-family:-apple-system,'Inter',sans-serif; }
        body { margin:0; }
        select { cursor:pointer; }
        ::-webkit-scrollbar { width:5px; height:5px; }
        ::-webkit-scrollbar-thumb { background:#D0C4B8; border-radius:3px; }
        ::-webkit-scrollbar-track { background:transparent; }
      `}</style>

      {toast && (
        <div style={{ position:"fixed", top:20, right:20, zIndex:600, display:"flex", alignItems:"center", gap:10, padding:"12px 18px", background:toast.ok?C.ok:C.warn, borderRadius:10, color:"white", fontSize:14, fontWeight:600, boxShadow:"0 8px 24px rgba(0,0,0,.15)" }}>
          {toast.ok ? <IcoCheck s={16} c="white"/> : <IcoAlert2 s={16} c="white"/>}{toast.msg}
        </div>
      )}

      {/* Sidebar desktop */}
      {!isMobile && (
        <aside style={{ width:220, background:C.surface, borderRight:`1.5px solid ${C.border}`, minHeight:"100vh", display:"flex", flexDirection:"column", flexShrink:0 }}>
          <div style={{ padding:"24px 20px 18px" }}>
            <div style={{ fontSize:17, fontWeight:800, color:C.text, letterSpacing:-0.4, lineHeight:1.2 }}>
              {studioName || <span>Fyde<span style={{ color:C.accent }}>lys</span></span>}
            </div>
            <div style={{ fontSize:10, color:C.textMuted, fontWeight:500, marginTop:4 }}>
              Propulsé par <a href="https://fydelys.fr" target="_blank" rel="noopener" style={{ color:C.accent, textDecoration:"none", fontWeight:600 }}>Fydelys.fr</a>
            </div>
          </div>
          <div style={{ margin:"0 12px 12px", padding:"10px 12px", background:C.accentLight, borderRadius:10, border:`1.5px solid ${C.border}`, display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:"50%", background:C.accentBg, border:`1.5px solid #DFC0A0`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700, color:C.accent, flexShrink:0 }}>{ME.avatar}</div>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:C.text }}>{ME.fn} {ME.ln}</div>
              <div style={{ fontSize:12, color:C.ok }}>💳 {ME.credits} crédits</div>
            </div>
          </div>
          <nav style={{ flex:1 }}>
            {ADH_NAV.map(item=>{
              const Ico = item.icon;
              return (
                <button key={item.key} onClick={()=>setPage(item.key)}
                  style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"11px 20px", background:page===item.key?C.accentLight:"none", border:"none", cursor:"pointer", color:page===item.key?C.accent:C.textMid, fontSize:15, fontWeight:page===item.key?700:500, borderLeft:`3px solid ${page===item.key?C.accent:"transparent"}`, textAlign:"left", transition:"all .15s" }}
                  onMouseEnter={e=>{if(page!==item.key){e.currentTarget.style.background=C.bg;e.currentTarget.style.color=C.text;}}}
                  onMouseLeave={e=>{if(page!==item.key){e.currentTarget.style.background="none";e.currentTarget.style.color=C.textMid;}}}>
                  <Ico s={18} c={page===item.key?C.accent:C.textMuted}/>{item.label}
                </button>
              );
            })}
          </nav>
          <div style={{ padding:"12px 16px", borderTop:`1px solid ${C.border}` }}>
            <div style={{ fontSize:12, color:C.textMuted, marginBottom:6 }}>Changer de vue :</div>
            {[["superadmin","⚡ Super Admin"],["admin","🏠 Vue Studio"]].map(([r,l])=>(
              <button key={r} onClick={()=>onSwitch(r)} style={{ display:"block", width:"100%", fontSize:12, padding:"5px 10px", borderRadius:7, border:`1px solid ${C.border}`, background:C.surfaceWarm, color:C.textMid, cursor:"pointer", marginBottom:4, textAlign:"left", fontWeight:500 }}>{l}</button>
            ))}
          </div>
        </aside>
      )}

      {/* Contenu */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, paddingBottom:isMobile?62:0 }}>
        <div style={{ background:C.surface, borderBottom:`1.5px solid ${C.border}`, padding:`0 ${isMobile?16:28}px`, height:isMobile?48:56, display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0, position:"sticky", top:0, zIndex:50 }}>
          <div style={{ fontSize:isMobile?18:20, fontWeight:700, color:C.text, letterSpacing:isMobile?-0.3:0 }}>
            {isMobile ? (
              <div>
                <div style={{ fontSize:14, fontWeight:800, color:C.text, lineHeight:1.1 }}>{studioName || <span>Fyde<span style={{ color:C.accent }}>lys</span></span>}</div>
                <div style={{ fontSize:9, color:C.textMuted }}>via <span style={{ color:C.accent, fontWeight:600 }}>Fydelys</span></div>
              </div>
            ) : ADH_PAGE_TITLES[page]}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            {!isMobile && <Pill color={C.ok} bg={C.okBg}>💳 {ME.credits} crédits</Pill>}
            <div style={{ width:32, height:32, borderRadius:"50%", background:C.accentBg, border:`1.5px solid #DFC0A0`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:C.accent }}>{ME.avatar}</div>
          </div>
        </div>
        {isMobile && (
          <div style={{ padding:"16px 16px 4px", fontSize:28, fontWeight:800, color:C.text, letterSpacing:-0.6 }}>
            {ADH_PAGE_TITLES[page]}
          </div>
        )}
        <div style={{ flex:1, overflowY:"auto" }}>{PAGE_MAP[page]}</div>
      </div>

      {/* Bottom nav mobile */}
      {isMobile && (
        <nav style={{ position:"fixed", bottom:0, left:0, right:0, background:C.surface, borderTop:`1px solid ${C.border}`, display:"flex", zIndex:200, height:62, boxShadow:"0 -2px 16px rgba(42,31,20,.07)" }}>
          {ADH_MOBILE_NAV.map(item=>{
            const isA = page===item.key;
            const Ico = item.icon;
            return (
              <button key={item.key} onClick={()=>setPage(item.key)}
                style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:2, background:"none", border:"none", cursor:"pointer", color:isA?C.accent:C.textMuted, fontSize:12, fontWeight:isA?700:400, transition:"color .15s", padding:"6px 0 4px", position:"relative" }}>
                {isA && <div style={{ position:"absolute", top:0, left:"50%", transform:"translateX(-50%)", width:20, height:2, background:C.accent, borderRadius:"0 0 2px 2px" }}/>}
                <Ico s={22} c={isA?C.accent:C.textMuted}/>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}

export { AdherentView };