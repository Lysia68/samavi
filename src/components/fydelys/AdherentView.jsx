"use client";

import React, { useState, useEffect, useContext } from "react";
import { createClient } from "@/lib/supabase";
import { AppCtx } from "./context";
import { C } from "./theme";
import { DISCIPLINES, SUBSCRIPTIONS_INIT, ADH_NAV_KEYS } from "./demoData";
import { IcoCalendar2, IcoUser2, IcoChevron, IcoCreditCard2, IcoCheck, IcoX, IcoAlert2, IcoTag2, IcoUsers2, IcoBarChart2, IcoActivity, IcoHeart, IcoStar, IcoZap } from "./icons";
import { Card, SectionHead, Button, Tag, Pill, EmptyState, DateLabel, Field, SessionRow } from "./ui";
import { OnboardingView } from "./OnboardingView";

function AdherentView({ onSwitch, isMobile, studioName = "", impersonateUserId = null }) {
  const ADH_NAV = ADH_NAV_KEYS.map((n,i) => ({ ...n, icon:[IcoCalendar2,IcoHeart,IcoActivity,IcoCreditCard2][i] }));
  const ADH_MOBILE_NAV = ADH_NAV;
  const [page, setPage] = useState("planning");
  const [toast, setToast] = useState(null);
  const showToast = (msg, ok=true) => { setToast({msg,ok}); setTimeout(()=>setToast(null),4000); };

  // Gérer le retour depuis Stripe Checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    if (payment === "success") {
      setPage("payment");
      showToast("✅ Paiement confirmé ! Votre compte a été mis à jour.");
      // Nettoyer l'URL
      window.history.replaceState({}, "", window.location.pathname);
    } else if (payment === "canceled") {
      setPage("payment");
      showToast("Paiement annulé.", false);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);
  const p = isMobile ? 16 : 28;

  const { studioId, discs } = useContext(AppCtx);
  const allDiscs = discs?.length ? discs : DISCIPLINES;

  // ── Données membre chargées depuis Supabase ─────────────────────────────────
  const [me, setMe] = useState(null);           // fiche membre
  const [myBookings, setMyBookings] = useState([]); // ids de sessions réservées
  const [history, setHistory] = useState([]);   // bookings passés
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studioId) return;
    const sb = createClient();
    sb.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;

      // En mode impersonate admin, utiliser l'userId ciblé ; sinon l'user connecté
      const targetUid = impersonateUserId || user.id;
      let member = null;
      const { data: byUid } = await sb.from("members")
        .select("id, first_name, last_name, email, status, credits, credits_total, created_at, phone, address, postal_code, city, profile_complete")
        .eq("studio_id", studioId).eq("auth_user_id", targetUid).maybeSingle();
      member = byUid;

      // Fallback email uniquement pour l'user réel (pas l'impersonate)
      if (!member && !impersonateUserId && user.email) {
        const { data: byEmail } = await sb.from("members")
          .select("id, first_name, last_name, email, status, credits, credits_total, created_at, phone, address, postal_code, city, profile_complete")
          .eq("studio_id", studioId).eq("email", user.email).maybeSingle();
        member = byEmail;
        if (member) {
          await sb.from("members").update({ auth_user_id: user.id }).eq("id", member.id);
        }
      }

      if (member) setMe(member);

      // Bookings actifs
      if (member?.id) {
        const { data: bk } = await sb.from("bookings")
          .select("session_id, status")
          .eq("member_id", member.id)
          .in("status", ["confirmed", "waitlist"]);
        setMyBookings((bk || []).map(b => b.session_id));

        // Historique
        const today = new Date().toISOString().split("T")[0];
        const { data: hist } = await sb.from("bookings")
          .select("session_id, status, sessions(session_date, session_time, discipline_id, teacher, disciplines(name,color))")
          .eq("member_id", member.id)
          .order("session_id", { ascending: false })
          .limit(50);
        setHistory((hist || []).filter(h => h.sessions && h.sessions.session_date <= today));
      }

      setLoading(false);
    });
  }, [studioId]);

  // ── Planning Adhérent ───────────────────────────────────────────────────────
  function AdhPlanning() {
    const [sessions, setSessions] = useState([]);
    const [filterDisc, setFilterDisc] = useState(0);
    const [confirmSess, setConfirmSess] = useState(null);
    const [loadingSess, setLoadingSess] = useState(true);

    useEffect(() => {
      if (!studioId) return;
      const today = new Date().toISOString().split("T")[0];
      createClient().from("sessions")
        .select("id, discipline_id, teacher, room, level, session_date, session_time, duration_min, spots, status, disciplines(name,color,icon)")
        .eq("studio_id", studioId)
        .in("status", ["scheduled", "cancelled"])
        .gte("session_date", today)
        .order("session_date").order("session_time")
        .limit(60)
        .then(({ data }) => {
          if (data?.length) {
            // Compter les bookings par session
            createClient().from("bookings")
              .select("session_id")
              .in("session_id", data.map(s=>s.id))
              .in("status", ["confirmed","waitlist"])
              .then(({ data: bk }) => {
                const counts = {};
                (bk||[]).forEach(b => { counts[b.session_id] = (counts[b.session_id]||0)+1; });
                setSessions(data.map(s => ({
                  ...s,
                  discName: s.disciplines?.name || "",
                  discColor: s.disciplines?.color || C.accent,
                  discIcon: s.disciplines?.icon || "",
                  booked: counts[s.id] || 0,
                  date: s.session_date,
                  time: s.session_time?.slice(0,5) || "",
                })));
              });
          } else {
            setSessions([]);
          }
          setLoadingSess(false);
        });
    }, [studioId]);

    const grouped = sessions
      .filter(s => !filterDisc || s.discipline_id === filterDisc)
      .reduce((acc,s) => { (acc[s.date]=acc[s.date]||[]).push(s); return acc; }, {});

    const book = async (s) => {
      setConfirmSess(null);
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      if (!me?.id) return;

      // Vérifier crédits si le membre en a un système de crédits actif
      const hasCredits = me.credits !== null && me.credits !== undefined && me.credits_total > 0;
      if (hasCredits && me.credits <= 0) {
        showToast("Crédits insuffisants — rechargez votre compte", false);
        return;
      }

      const isFull = s.booked >= s.spots;
      const { error } = await sb.from("bookings").upsert({
        session_id: s.id,
        member_id: me.id,
        status: isFull ? "waitlist" : "confirmed",
      }, { onConflict: "session_id,member_id", ignoreDuplicates: true });
      if (!error) {
        setMyBookings(p=>[...p, s.id]);
        setSessions(p=>p.map(x=>x.id===s.id?{...x,booked:x.booked+1}:x));
        if (isFull) {
          showToast(`Ajouté à la liste d'attente — ${s.discName}`);
        } else {
          showToast(`Réservé : ${s.discName} — ${s.time}`);
        }
      } else {
        showToast("Erreur lors de la réservation", false);
      }
    };

    const cancel = async (s) => {
      // Vérifier le délai d'annulation autorisé
      const { data: studio } = await createClient().from("studios")
        .select("cancel_delay_hours").eq("id", studioId).single();
      const delayH = studio?.cancel_delay_hours ?? 2; // défaut 2h
      const now = new Date();
      const [y,mo,d] = (s.date||s.session_date||"").split("-").map(Number);
      const [h,mi]   = (s.time||s.session_time||"00:00").split(":").map(Number);
      const sessStart = new Date(y, mo-1, d, h, mi);
      const diffH = (sessStart - now) / 3600000;
      if (diffH < delayH) {
        showToast(`Annulation impossible — délai de ${delayH}h dépassé`, false);
        return;
      }
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      const { error } = await sb.from("bookings")
        .delete().eq("session_id", s.id).eq("member_id", me.id);
      if (!error) {
        setMyBookings(p=>p.filter(id=>id!==s.id));
        setSessions(p=>p.map(x=>x.id===s.id?{...x,booked:Math.max(0,x.booked-1)}:x));
        showToast("Réservation annulée");
      }
    };

    if (loadingSess) return <div style={{ padding:p, color:C.textMuted, fontSize:14 }}>Chargement du planning…</div>;

    return (
      <div style={{ padding:p }}>
        {/* Modal confirmation */}
        {confirmSess && (
          <div onClick={e=>e.target===e.currentTarget&&setConfirmSess(null)}
            style={{ position:"fixed", inset:0, background:"rgba(42,31,20,.45)", zIndex:800, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
            <div style={{ background:C.surface, borderRadius:16, padding:28, width:"100%", maxWidth:420, boxShadow:"0 8px 32px rgba(42,31,20,.18)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                <div style={{ fontSize:18, fontWeight:700, color:C.text }}>Confirmer la réservation</div>
                <button onClick={()=>setConfirmSess(null)} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:6, padding:"4px 10px", cursor:"pointer", fontSize:13, color:C.textSoft }}>✕</button>
              </div>
              <div style={{ background:C.accentLight, borderRadius:10, padding:14, marginBottom:18 }}>
                <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:4 }}>{confirmSess.discName}</div>
                <div style={{ fontSize:13, color:C.textSoft }}>{new Date(confirmSess.date).toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})}</div>
                <div style={{ fontSize:13, color:C.textSoft }}>{confirmSess.time} · {confirmSess.duration_min} min · {confirmSess.room}</div>
                <div style={{ fontSize:13, color:C.textSoft }}>{confirmSess.teacher}</div>
                {(() => {
                  const hasCredits = me?.credits !== null && me?.credits !== undefined && me?.credits_total > 0;
                  if (!hasCredits) return null;
                  if (me.credits <= 0) return (
                    <div style={{ marginTop:10, padding:"8px 12px", background:"#FEE2E2", borderRadius:8, fontSize:13, color:"#991B1B", fontWeight:600 }}>
                      ⛔ Crédits insuffisants — vous ne pouvez pas réserver cette séance.
                    </div>
                  );
                  return (
                    <div style={{ marginTop:10, padding:"8px 12px", background:C.surface, borderRadius:8, fontSize:13, color:C.textMid }}>
                      💳 Cette séance utilisera <strong>1 crédit</strong> (il vous en restera {me.credits - 1})
                    </div>
                  );
                })()}
              </div>
              <div style={{ display:"flex", gap:10 }}>
                {(() => {
                  const hasCredits = me?.credits !== null && me?.credits !== undefined && me?.credits_total > 0;
                  const blocked = hasCredits && me.credits <= 0;
                  return blocked
                    ? <Button sm variant="ghost" onClick={()=>setConfirmSess(null)}>Fermer</Button>
                    : <><Button sm onClick={()=>book(confirmSess)}>Confirmer</Button>
                       <Button sm variant="ghost" onClick={()=>setConfirmSess(null)}>Annuler</Button></>;
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Barre crédits — visible si système crédits actif */}
        {me?.credits_total > 0 && (
          <div style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 16px", background:me.credits<=0?C.warnBg:C.accentLight, borderRadius:12, marginBottom:18, border:`1px solid ${me.credits<=0?C.warn:C.accentBg}` }}>
            <IcoCreditCard2 s={20} c={me.credits<=0?C.warn:C.accent}/>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:600, color:me.credits<=0?C.warn:C.text }}>
                {me.credits<=0 ? "⛔ Plus de crédits disponibles" : `Crédits restants : ${me.credits}/${me.credits_total}`}
              </div>
              <div style={{ height:4, background:C.bgDeep, borderRadius:2, marginTop:5 }}>
                <div style={{ width:`${Math.min((me.credits/me.credits_total)*100,100)}%`, height:"100%", background:me.credits<=0?C.warn:me.credits/me.credits_total<0.25?C.warn:C.accent, borderRadius:2 }}/>
              </div>
            </div>
          </div>
        )}

        {/* Filtres disciplines */}
        <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
          {[{id:0,name:"Toutes",color:C.accent},...allDiscs].map(d=>(
            <button key={d.id} onClick={()=>setFilterDisc(d.id)}
              style={{ fontSize:13, padding:"5px 14px", borderRadius:20, border:`1.5px solid ${filterDisc===d.id?d.color:C.border}`, background:filterDisc===d.id?d.color+"18":"transparent", color:filterDisc===d.id?d.color:C.textMid, cursor:"pointer", fontWeight:500 }}>
              {d.icon||""} {d.name}
            </button>
          ))}
        </div>

        {Object.keys(grouped).length === 0
          ? <EmptyState icon={<IcoCalendar2 s={40} c={C.textMuted}/>} title="Aucun cours planifié" sub="Aucune séance disponible pour le moment"/>
          : Object.entries(grouped).sort(([a],[b])=>a>b?1:-1).map(([date,daySessions])=>(
            <div key={date} style={{ marginBottom:20 }}>
              <DateLabel date={date}/>
              {daySessions.map(s=>{
                const isBooked   = myBookings.includes(s.id);
                const isFull     = s.booked >= s.spots;
                const isCancelled = s.status === "cancelled";
                const pct        = s.booked/s.spots;
                return (
                  <Card key={s.id} style={{ marginBottom:8, borderLeft:`3px solid ${isCancelled ? C.warn : s.discColor}`, opacity: isCancelled ? 0.75 : (isFull&&!isBooked ? .7 : 1) }}>
                    {isCancelled && (
                      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8, padding:"5px 10px", background:C.warnBg, borderRadius:8, fontSize:12, fontWeight:700, color:C.warn }}>
                        ⚠ Séance annulée{isBooked ? " — votre réservation est automatiquement annulée" : ""}
                      </div>
                    )}
                    <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
                      <div style={{ fontSize:isMobile?15:16, fontWeight:700, color:isCancelled?C.warn:C.accent, width:38, flexShrink:0, paddingTop:2 }}>{s.time}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:2 }}>
                          <span style={{ fontSize:isMobile?15:16, fontWeight:700, color:isCancelled?C.textMuted:C.text, textDecoration:isCancelled?"line-through":"none" }}>{s.discName}</span>
                          {!isCancelled && <Pill color={s.discColor} bg={s.discColor+"18"}>{s.level}</Pill>}
                          {isFull && !isBooked && !isCancelled && <Tag s="complet"/>}
                        </div>
                        <div style={{ fontSize:isMobile?14:15, color:C.textSoft, marginBottom:6 }}>{s.teacher} · {s.room} · {s.duration_min} min</div>
                        {!isCancelled && (
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <div style={{ flex:1, maxWidth:160, height:4, background:C.bgDeep, borderRadius:2 }}>
                              <div style={{ height:"100%", width:`${Math.min(pct*100,100)}%`, background:pct>=1?C.warn:C.ok, borderRadius:2 }}/>
                            </div>
                            <span style={{ fontSize:12, fontWeight:600, color:pct>=1?C.warn:C.textSoft }}>{s.booked}/{s.spots} places</span>
                          </div>
                        )}
                      </div>
                      <div style={{ flexShrink:0 }}>
                        {isCancelled ? null : isBooked
                          ? <Button sm variant="danger" onClick={()=>cancel(s)}>Annuler</Button>
                          : isFull
                            ? <Button sm variant="secondary" onClick={()=>showToast("Ajouté à la liste d'attente")}>Liste d'attente</Button>
                            : (() => {
                                const hasC = me?.credits_total > 0;
                                const blocked = hasC && me.credits <= 0;
                                return blocked
                                  ? <button disabled style={{ fontSize:12, padding:"5px 12px", borderRadius:8, border:"1px solid #EFC8BC", background:C.warnBg, color:C.warn, cursor:"not-allowed", fontWeight:600 }}>⛔ Crédits épuisés</button>
                                  : <Button sm onClick={()=>setConfirmSess(s)}>Réserver</Button>;
                              })()
                        }
                      </div>
                    </div>
                    {isBooked && !isCancelled && (
                      <div style={{ marginTop:10, padding:"7px 12px", background:C.okBg, borderRadius:8, fontSize:13, color:C.ok, display:"flex", alignItems:"center", gap:6 }}>
                        <IcoCheck s={14} c={C.ok}/> Vous êtes inscrit(e) à cette séance
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          ))
        }
      </div>
    );
  }

  // ── Mon Compte ──────────────────────────────────────────────────────────────
  function AdhAccount() {
    const initials = me ? `${me.first_name?.[0]||""}${me.last_name?.[0]||""}`.toUpperCase() : "?";
    if (loading) return <div style={{ padding:p, color:C.textMuted, fontSize:14 }}>Chargement…</div>;
    if (!me) return (
      <div style={{ padding:p }}>
        <Card>
          <div style={{ textAlign:"center", padding:"24px 0", color:C.textMuted }}>
            <div style={{ fontSize:32, marginBottom:8 }}>👤</div>
            <div style={{ fontSize:15, fontWeight:600, color:C.text, marginBottom:4 }}>Profil introuvable</div>
            <div style={{ fontSize:13 }}>Votre fiche membre n'a pas encore été créée par le studio.</div>
          </div>
        </Card>
      </div>
    );
    return (
      <div style={{ padding:p, maxWidth:600 }}>
        <Card style={{ marginBottom:16 }}>
          <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:18 }}>
            <div style={{ width:54, height:54, borderRadius:"50%", background:C.accentBg, border:`2px solid ${C.accent}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:700, color:C.accent }}>
              {initials}
            </div>
            <div>
              <div style={{ fontSize:20, fontWeight:700, color:C.text }}>{me?.first_name} {me?.last_name}</div>
              <div style={{ fontSize:14, color:C.textSoft }}>{me?.email}</div>
              <Tag s={me?.status||"actif"}/>
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
            {[
              { l:"Crédits restants",  v:`${me?.credits||0} / ${me?.credits_total||0}`,  icon:<IcoCreditCard2 s={16} c={C.accent}/> },
              { l:"Membre depuis",     v:me?.created_at ? new Date(me.created_at).toLocaleDateString("fr-FR") : "—", icon:<IcoCalendar2 s={16} c={C.accent}/> },
              { l:"Séances effectuées",v:history.filter(h=>h.status==="confirmed").length, icon:<IcoCheck s={16} c={C.ok}/> },
              { l:"Statut",            v:me?.status||"actif",                              icon:<IcoUser2 s={16} c={C.accent}/> },
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
        </Card>
      </div>
    );
  }

  // Variable pour AdhAccount — sessions futures réservées
  const [sessions_for_account] = useState([]);

  // ── Historique ──────────────────────────────────────────────────────────────
  function AdhHistory() {
    const presents = history.filter(h=>h.status==="confirmed").length;
    const absents  = history.filter(h=>h.status==="absent").length;
    const statusHistMap = { confirmed:[C.ok,C.okBg], absent:[C.warn,C.warnBg], waitlist:[C.info,C.infoBg] };

    if (loading) return <div style={{ padding:p, color:C.textMuted, fontSize:14 }}>Chargement…</div>;
    if (history.length === 0) return (
      <div style={{ padding:p }}>
        <EmptyState icon={<IcoActivity s={40} c={C.textMuted}/>} title="Aucun historique" sub="Vos séances passées apparaîtront ici"/>
      </div>
    );

    return (
      <div style={{ padding:p, maxWidth:700 }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:18 }}>
          {[{l:"Total séances",v:history.length},{l:"Présences",v:presents,color:C.ok,bg:C.okBg},{l:"Absences",v:absents,color:C.warn,bg:C.warnBg}].map(k=>(
            <Card key={k.l} style={{ textAlign:"center", padding:"14px 10px", background:k.bg||C.surface }}>
              <div style={{ fontSize:26, fontWeight:800, color:k.color||C.text }}>{k.v}</div>
              <div style={{ fontSize:12, color:C.textSoft, marginTop:3 }}>{k.l}</div>
            </Card>
          ))}
        </div>
        <Card noPad>
          <SectionHead>Détail des séances</SectionHead>
          {history.map((h,i)=>{
            const [color,bg] = statusHistMap[h.status]||[C.textMuted,C.bg];
            const sess = h.sessions;
            return (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 16px", borderBottom:`1px solid ${C.borderSoft}` }}>
                <div style={{ width:32, height:32, borderRadius:8, background:bg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  {h.status==="confirmed" ? <IcoCheck s={16} c={color}/> : <IcoX s={16} c={color}/>}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:15, fontWeight:700, color:C.text }}>{sess?.disciplines?.name||"Séance"}</div>
                  <div style={{ fontSize:13, color:C.textSoft }}>{sess?.teacher} · {sess?.session_date ? new Date(sess.session_date).toLocaleDateString("fr-FR") : ""}</div>
                </div>
                <Tag s={h.status==="confirmed"?"présent":"absent"}/>
              </div>
            );
          })}
        </Card>
      </div>
    );
  }

  // ── Paiement / Abonnement ───────────────────────────────────────────────────
  function AdhPayment() {
    const [subs, setSubs]               = useState([]);
    const [packs, setPacks]             = useState([]);
    const [subsLoading, setSubsLoading] = useState(true);
    const [redirecting, setRedirecting] = useState(null);

    useEffect(() => {
      if (!studioId) return;
      createClient().from("subscriptions")
        .select("id, name, price, period, description, popular, color")
        .eq("studio_id", studioId).eq("active", true).order("price")
        .then(({ data }) => {
          setSubs(data?.length ? data.map(s => ({ ...s, color: s.color || "#B8936A" })) : SUBSCRIPTIONS_INIT);
          setSubsLoading(false);
        });
      createClient().from("credits_packs")
        .select("id, name, credits_amount, price")
        .eq("studio_id", studioId).eq("active", true).order("price")
        .then(({ data }) => { if (data?.length) setPacks(data); });
    }, [studioId]);

    const handleCheckout = async (type, id) => {
      setRedirecting(id);
      try {
        const body = { studioId, memberId: me?.id, type };
        if (type === "subscription") body.subscriptionId = id;
        if (type === "credits")      body.creditsPackId  = id;
        const res = await fetch("/api/connect/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const { url, error } = await res.json();
        if (error) { showToast(error, false); setRedirecting(null); return; }
        if (url) window.location.href = url;
      } catch(e) { showToast("Erreur de paiement", false); setRedirecting(null); }
    };

    return (
      <div style={{ padding:p }}>
        {/* Crédits actuels */}
        {me?.credits_total > 0 && (
          <Card style={{ marginBottom:16, borderLeft:`3px solid ${me.credits<=0?C.warn:C.accent}` }}>
            <div style={{ display:"flex", alignItems:"center", gap:14 }}>
              <IcoCreditCard2 s={24} c={me.credits<=0?C.warn:C.accent}/>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:700, color:C.text }}>
                  {me.credits<=0 ? "⛔ Plus de crédits" : `${me.credits} crédit${me.credits>1?"s":""} restant${me.credits>1?"s":""}`}
                </div>
                <div style={{ height:5, background:C.bgDeep, borderRadius:3, marginTop:5, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${Math.min((me.credits/me.credits_total)*100,100)}%`, background:me.credits<=0?C.warn:C.accent, borderRadius:3, transition:"width .4s" }}/>
                </div>
              </div>
              <div style={{ fontSize:12, color:C.textMuted, flexShrink:0 }}>{me.credits}/{me.credits_total}</div>
            </div>
          </Card>
        )}

        {/* Abonnements */}
        <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:12 }}>📋 Abonnements</div>
        <div style={{ display:"grid", gridTemplateColumns:`repeat(${isMobile?1:2},1fr)`, gap:12, marginBottom:24 }}>
          {subsLoading
            ? <div style={{ color:C.textMuted, fontSize:14 }}>Chargement…</div>
            : subs.filter(s=>s.price>0).map(sub => (
              <div key={sub.id}
                style={{ background:C.surface, borderRadius:12, border:`2px solid ${sub.popular?C.accent:C.border}`, padding:"18px 16px", position:"relative" }}>
                {sub.popular && <div style={{ position:"absolute", top:-1, right:14, background:C.accent, color:"white", fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:"0 0 6px 6px" }}>Populaire</div>}
                <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:4 }}>{sub.name}</div>
                <div style={{ fontSize:24, fontWeight:800, color:C.accent, lineHeight:1, marginBottom:12 }}>
                  {sub.price} €<span style={{ fontSize:13, fontWeight:400, color:C.textSoft }}> / {sub.period||"mois"}</span>
                </div>
                <Button sm block onClick={()=>handleCheckout("subscription", sub.id)} disabled={redirecting===sub.id}>
                  {redirecting===sub.id ? "Redirection…" : "Souscrire →"}
                </Button>
              </div>
            ))
          }
          {!subsLoading && subs.filter(s=>s.price>0).length===0 && (
            <div style={{ color:C.textMuted, fontSize:13, fontStyle:"italic" }}>Aucun abonnement disponible.</div>
          )}
        </div>

        {/* Packs crédits */}
        {packs.length > 0 && (
          <>
            <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:12 }}>🎟 Packs de crédits</div>
            <div style={{ display:"grid", gridTemplateColumns:`repeat(${isMobile?1:2},1fr)`, gap:12 }}>
              {packs.map(pack => (
                <div key={pack.id} style={{ background:C.surface, borderRadius:12, border:`1.5px solid ${C.border}`, padding:"16px" }}>
                  <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:2 }}>{pack.name}</div>
                  <div style={{ fontSize:13, color:C.textSoft, marginBottom:10 }}>
                    {pack.credits_amount} cours · {pack.price} €
                  </div>
                  <Button sm block onClick={()=>handleCheckout("credits", pack.id)} disabled={redirecting===pack.id}>
                    {redirecting===pack.id ? "Redirection…" : `Acheter — ${pack.price} €`}
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Note sécurité */}
        <div style={{ marginTop:20, padding:"10px 14px", background:C.infoBg, borderRadius:8, display:"flex", gap:8, alignItems:"center" }}>
          <span>🔒</span>
          <span style={{ fontSize:12, color:C.info }}>Paiement sécurisé par Stripe — vous serez redirigé vers la page de paiement.</span>
        </div>
      </div>
    );
  }

  // ── Onboarding gate ─────────────────────────────────────────────────────────
  // profile_complete === false → onboarding explicitement requis
  // profile_complete === null/undefined + nom générique → colonne pas encore migrée, forcer onboarding
  const needsOnboarding = !loading && me && (
    me.profile_complete === false ||
    (me.profile_complete == null && (
      !me.first_name || me.first_name === "Nouveau" ||
      !me.last_name  || me.last_name  === "Membre"  ||
      !me.phone
    ))
  )
  if (needsOnboarding) {
    return (
      <OnboardingView
        studioName={studioName}
        onComplete={() => setMe(m => ({ ...m, profile_complete: true }))}
      />
    );
  }

  // ── Render principal ────────────────────────────────────────────────────────
  // Écran de chargement global — évite le flash de contenu vide
  if (loading || !studioId) return (
    <div style={{ display:"flex", minHeight:"100vh", background:C.bg, alignItems:"center", justifyContent:"center" }}>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:16 }}>
        <div style={{ width:40, height:40, borderRadius:"50%", border:`3px solid ${C.accentBg}`, borderTopColor:C.accent, animation:"spin 0.8s linear infinite" }}/>
        <div style={{ fontSize:13, color:C.textMuted, fontWeight:500 }}>Chargement…</div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

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
        <div style={{ position:"fixed", top:20, right:20, zIndex:600, display:"flex", alignItems:"center", gap:8, padding:"10px 16px", borderRadius:10, background:toast.ok?C.ok:C.warn, color:"white", fontSize:14, fontWeight:600, boxShadow:"0 4px 16px rgba(0,0,0,.15)" }}>
          {toast.ok ? <IcoCheck s={16} c="white"/> : <IcoAlert2 s={16} c="white"/>}{toast.msg}
        </div>
      )}

      {/* Sidebar desktop */}
      {!isMobile && (
        <aside style={{ width:220, background:C.surface, borderRight:`1.5px solid ${C.border}`, minHeight:"100vh", display:"flex", flexDirection:"column", flexShrink:0 }}>
          <div style={{ padding:"24px 20px 18px" }}>
            <div style={{ fontSize:17, fontWeight:800, color:C.text, letterSpacing:-0.4, lineHeight:1.2, marginBottom:4 }}>
              {studioName || <span>Fyde<span style={{ color:C.accent }}>lys</span></span>}
            </div>
            <div style={{ fontSize:10, color:C.textMuted, fontWeight:500, marginTop:4 }}>
              Propulsé par <a href="https://fydelys.fr" target="_blank" rel="noopener" style={{ color:C.accent, textDecoration:"none", fontWeight:600 }}>Fydelys.fr</a>
            </div>
          </div>
          {me && (
            <div style={{ margin:"0 12px 12px", padding:"10px 12px", background:C.accentLight, borderRadius:12, border:`1px solid ${C.accentBg}` }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:34, height:34, borderRadius:"50%", background:C.accentBg, border:`2px solid ${C.accent}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:C.accent, flexShrink:0 }}>
                  {`${me.first_name?.[0]||""}${me.last_name?.[0]||""}`.toUpperCase()}
                </div>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{me.first_name} {me.last_name}</div>
                  <div style={{ fontSize:11, color:C.textSoft, display:"flex", alignItems:"center", gap:4 }}>
                    <IcoCreditCard2 s={11} c={C.textSoft}/> {me.credits||0} crédit{(me.credits||0)!==1?"s":""}
                  </div>
                </div>
              </div>
            </div>
          )}
          <nav style={{ flex:1, padding:"4px 10px" }}>
            {ADH_NAV.map(item=>{
              const Ico = item.icon;
              return (
                <button key={item.key} onClick={()=>setPage(item.key)}
                  style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"11px 20px", borderRadius:10, border:"none", cursor:"pointer", fontSize:14, fontWeight:page===item.key?700:500, background:page===item.key?C.accentBg:"transparent", color:page===item.key?C.accent:C.textMid, marginBottom:2, textAlign:"left" }}>
                  <Ico s={18} c={page===item.key?C.accent:C.textMuted}/>{item.label}
                </button>
              );
            })}
          </nav>
        </aside>
      )}

      {/* Contenu principal */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, paddingBottom:isMobile?60:0 }}>
        {/* Header desktop — titre page + nom membre */}
        {!isMobile && (
          <div style={{ padding:"16px 28px 0", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ fontSize:26, fontWeight:800, color:C.text, letterSpacing:-0.5 }}>
              {ADH_NAV.find(n=>n.key===page)?.label||"Planning"}
            </div>
            {me && (
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:30, height:30, borderRadius:"50%", background:C.accentBg, border:`1.5px solid ${C.accent}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:C.accent, flexShrink:0 }}>
                  {`${me.first_name?.[0]||""}${me.last_name?.[0]||""}`.toUpperCase()||"?"}
                </div>
                <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{me.first_name} {me.last_name}</div>
              </div>
            )}
          </div>
        )}
        {/* Header mobile — studio + nom membre */}
        {isMobile && (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 16px 4px", borderBottom:`1px solid ${C.borderSoft}` }}>
            <div style={{ fontSize:15, fontWeight:800, color:C.text, letterSpacing:-0.3 }}>{studioName || "Fydelys"}</div>
            {me && (
              <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                <div style={{ fontSize:13, fontWeight:600, color:C.textSoft }}>{me.first_name} {me.last_name}</div>
                <div style={{ width:28, height:28, borderRadius:"50%", background:C.accentBg, border:`1.5px solid ${C.accent}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:C.accent }}>
                  {`${me.first_name?.[0]||""}${me.last_name?.[0]||""}`.toUpperCase()||"?"}
                </div>
              </div>
            )}
          </div>
        )}
        <div style={{ flex:1, overflowY:"auto" }}>
          {page === "planning" && <AdhPlanning/>}
          {page === "account"  && <AdhAccount/>}
          {page === "history"  && <AdhHistory/>}
          {page === "payment"  && <AdhPayment/>}
        </div>
      </div>

      {/* Bottom nav mobile */}
      {isMobile && (
        <nav style={{ position:"fixed", bottom:0, left:0, right:0, background:C.surface, borderTop:`1.5px solid ${C.border}`, display:"flex", zIndex:200, height:58 }}>
          {ADH_MOBILE_NAV.map(item=>{
            const isA = page===item.key;
            const Ico = item.icon;
            return (
              <button key={item.key} onClick={()=>setPage(item.key)}
                style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:3, border:"none", background:"none", cursor:"pointer", color:isA?C.accent:C.textMuted, fontSize:10, fontWeight:isA?700:500, padding:"6px 0" }}>
                <Ico s={20} c={isA?C.accent:C.textMuted}/>
                {item.label}
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}

export { AdherentView };