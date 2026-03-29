"use client";

import React, { useState, useEffect, useContext } from "react";
import { createClient } from "@/lib/supabase";
import { AppCtx } from "./context";
import { C } from "./theme";
import { DISCIPLINES, SUBSCRIPTIONS_INIT, ADH_NAV_KEYS } from "./demoData";
import { IcoCalendar2, IcoUser2, IcoChevron, IcoCreditCard2, IcoCheck, IcoX, IcoAlert2, IcoTag2, IcoUsers2, IcoBarChart2, IcoActivity, IcoHeart, IcoStar, IcoZap } from "./icons";
import { Card, SectionHead, Button, Tag, Pill, EmptyState, DateLabel, Field, SessionRow, formatPhone, formatPostalCode, formatName } from "./ui";
import { OnboardingView } from "./OnboardingView";

// ── DatePicker custom — 3 selects stylés ───────────────────────────────────
const MONTHS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

function DatePicker({ value, onChange }) {
  const parts = (typeof value === "string" && value) ? value.split("-") : ["", "", ""];
  const [year,  setYear]  = React.useState(parts[0] || "");
  const [month, setMonth] = React.useState(parts[1] || "");
  const [day,   setDay]   = React.useState(parts[2] || "");

  // Sync depuis value externe (ex: reset)
  React.useEffect(() => {
    const p = (typeof value === "string" && value) ? value.split("-") : ["","",""];
    setYear(p[0]||""); setMonth(p[1]||""); setDay(p[2]||"");
  }, [value]);

  const notify = (y, m, d) => {
    if (y && m && d) onChange({ target: { value: `${y}-${m.padStart(2,"0")}-${d.padStart(2,"0")}` } });
  };

  const selStyle = {
    flex:1, padding:"9px 8px", borderRadius:9, border:`1.5px solid ${C.border}`,
    fontSize:14, background:"#FDFAF7", color:C.text, fontFamily:"inherit",
    outline:"none", cursor:"pointer", appearance:"none", WebkitAppearance:"none",
    backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238C7B6C' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat:"no-repeat", backgroundPosition:"right 8px center", paddingRight:24,
  };

  const days   = Array.from({length:31}, (_,i) => String(i+1).padStart(2,"0"));
  const months = MONTHS_FR.map((m,i) => ({ v:String(i+1).padStart(2,"0"), l:m }));
  const curY   = new Date().getFullYear();
  const years  = Array.from({length:100}, (_,i) => String(curY - i));

  return (
    <div style={{ display:"flex", gap:8 }}>
      <select value={day} onChange={e=>{ const v=e.target.value; setDay(v); notify(year,month,v); }} style={selStyle}>
        <option value="">Jour</option>
        {days.map(d=><option key={d} value={d}>{parseInt(d)}</option>)}
      </select>
      <select value={month} onChange={e=>{ const v=e.target.value; setMonth(v); notify(year,v,day); }} style={{...selStyle, flex:2}}>
        <option value="">Mois</option>
        {months.map(m=><option key={m.v} value={m.v}>{m.l}</option>)}
      </select>
      <select value={year} onChange={e=>{ const v=e.target.value; setYear(v); notify(v,month,day); }} style={{...selStyle, flex:2}}>
        <option value="">Année</option>
        {years.map(y=><option key={y} value={y}>{y}</option>)}
      </select>
    </div>
  );
}

// ── AdhAccountPanel — composant standalone (hors AdherentView pour éviter remontage) ──
const AdhAccountPanel = React.memo(function AdhAccountPanel({ me, loading, history, p, editing, setEditing, saving, form, setForm, setFirst, setLast, setPhone, setBirth, setAddress, setPostal, setCity, setProfession, save }) {
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

  const inpStyle = { width:"100%", padding:"9px 12px", borderRadius:9, border:`1.5px solid ${C.border}`, fontSize:14, boxSizing:"border-box", outline:"none", background:"#FDFAF7", color:C.text, fontFamily:"inherit", WebkitAppearance:"none" };

  return (
    <div style={{ padding:p, maxWidth:600, width:"100%", boxSizing:"border-box" }}>
      <Card style={{ marginBottom:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:16 }}>
          <div style={{ width:54, height:54, borderRadius:"50%", background:C.accentBg, border:`2px solid ${C.accent}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:700, color:C.accent, flexShrink:0 }}>
            {initials}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:18, fontWeight:700, color:C.text }}>{me?.first_name} {me?.last_name}</div>
            <div style={{ fontSize:13, color:C.textSoft, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{me?.email}</div>
            <Tag s={me?.status||"actif"}/>
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          {[
            { l:"Crédits restants",   v:`${me?.credits||0} / ${me?.credits_total||0}`,  icon:<IcoCreditCard2 s={16} c={C.accent}/> },
            { l:"Membre depuis",      v:me?.created_at ? new Date(me.created_at).toLocaleDateString("fr-FR") : "—", icon:<IcoCalendar2 s={16} c={C.accent}/> },
            { l:"Séances effectuées", v:(history||[]).filter(h=>h.attended===true).length, icon:<IcoCheck s={16} c={C.ok}/> },
            { l:"Statut",             v:me?.status||"actif", icon:<IcoUser2 s={16} c={C.accent}/> },
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

      <Card>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
          <div style={{ fontSize:15, fontWeight:700, color:C.text }}>Mes coordonnées</div>
          {!editing
            ? <Button sm variant="secondary" onClick={()=>setEditing(true)}>✏ Modifier</Button>
            : <div style={{ display:"flex", gap:8 }}>
                <Button sm variant="secondary" onClick={()=>{ setEditing(false); setForm({ first_name:me.first_name||"", last_name:me.last_name||"", phone:me.phone||"", birth_date:me.birth_date||"", address:me.address||"", postal_code:me.postal_code||"", city:me.city||"", profession:me.profession||"" }); }}>Annuler</Button>
                <Button sm onClick={save} disabled={saving}>{saving ? "…" : "Enregistrer"}</Button>
              </div>
          }
        </div>

        {!editing ? (
          <div style={{ display:"grid", gap:0 }}>
            {[
              { l:"Prénom",           v:me?.first_name },
              { l:"Nom",              v:me?.last_name },
              { l:"Téléphone",        v:me?.phone },
              { l:"Date de naissance",v:me?.birth_date ? new Date(me.birth_date).toLocaleDateString("fr-FR") : null },
              { l:"Adresse",          v:me?.address },
              { l:"Code postal",      v:me?.postal_code },
              { l:"Ville",            v:me?.city },
              { l:"Profession",       v:me?.profession },
              { l:"Email",            v:me?.email, locked:true },
            ].filter(f=>f.v).map(f=>(
              <div key={f.l} style={{ padding:"9px 0", borderBottom:`1px solid ${C.border}` }}>
                <div style={{ fontSize:11, color:C.textMuted, fontWeight:600, textTransform:"uppercase", letterSpacing:.5, marginBottom:2 }}>{f.l}</div>
                <div style={{ fontSize:14, fontWeight:600, color:C.text, display:"flex", alignItems:"center", gap:6 }}>
                  {f.v}{f.locked && <span style={{ fontSize:10, color:C.textMuted, fontWeight:400 }}>🔒</span>}
                </div>
              </div>
            ))}
          </div>
        ) : form && (
          <div style={{ display:"grid", gap:12 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <div>
                <label style={{ fontSize:12, color:C.textMuted, fontWeight:600, display:"block", marginBottom:5 }}>Prénom</label>
                <input value={form?.first_name||""} onChange={setFirst} style={inpStyle}/>
              </div>
              <div>
                <label style={{ fontSize:12, color:C.textMuted, fontWeight:600, display:"block", marginBottom:5 }}>Nom</label>
                <input value={form?.last_name||""} onChange={setLast} style={inpStyle}/>
              </div>
            </div>
            <div>
              <label style={{ fontSize:12, color:C.textMuted, fontWeight:600, display:"block", marginBottom:5 }}>Téléphone</label>
              <input value={form?.phone||""} onChange={setPhone} type="tel" placeholder="06 12 34 56 78" style={inpStyle}/>
            </div>
            <div>
              <label style={{ fontSize:12, color:C.textMuted, fontWeight:600, display:"block", marginBottom:5 }}>Date de naissance</label>
              <DatePicker key={form?.birth_date||"empty"} value={form?.birth_date||""} onChange={setBirth} />
            </div>
            <div>
              <label style={{ fontSize:12, color:C.textMuted, fontWeight:600, display:"block", marginBottom:5 }}>Adresse</label>
              <input value={form?.address||""} onChange={setAddress} placeholder="5 rue des lilas" style={inpStyle}/>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr", gap:10 }}>
              <div>
                <label style={{ fontSize:12, color:C.textMuted, fontWeight:600, display:"block", marginBottom:5 }}>Code postal</label>
                <input value={form?.postal_code||""} onChange={setPostal} placeholder="75001" style={inpStyle}/>
              </div>
              <div>
                <label style={{ fontSize:12, color:C.textMuted, fontWeight:600, display:"block", marginBottom:5 }}>Ville</label>
                <input value={form?.city||""} onChange={setCity} placeholder="Paris" style={inpStyle}/>
              </div>
            </div>
            <div>
              <label style={{ fontSize:12, color:C.textMuted, fontWeight:600, display:"block", marginBottom:5 }}>Profession</label>
              <input value={form?.profession||""} onChange={setProfession} placeholder="Ex : Ingénieur, Enseignant…" style={inpStyle}/>
            </div>
            <div style={{ padding:"8px 12px", background:C.bg, borderRadius:8, fontSize:12, color:C.textMuted }}>
              L'adresse email ne peut pas être modifiée
            </div>
          </div>
        )}
      </Card>
    </div>
  );
});

function AdherentView({ onSwitch, isMobile, studioName = "", impersonateUserId = null }) {
  const ADH_NAV = ADH_NAV_KEYS.map((n,i) => ({ ...n, icon:[IcoCalendar2,IcoHeart,IcoActivity,IcoTag2,IcoCreditCard2][i] }));
  const ADH_MOBILE_NAV = ADH_NAV;
  const [page, setPage] = useState("planning");
  const [toast, setToast] = useState(null);
  const showToast = (msg, ok=true) => { setToast({msg,ok}); setTimeout(()=>setToast(null),4000); };

  const p = isMobile ? 16 : 28;

  const { studioId, discs } = useContext(AppCtx);
  const allDiscs = discs?.length ? discs : DISCIPLINES;

  // ── Données membre chargées depuis Supabase ─────────────────────────────────
  const [me, setMe] = useState(null);           // fiche membre
  const [studioPaymentMode, setStudioPaymentMode] = useState("none"); // none|connect|direct
  const [myBookings, setMyBookings] = useState([]); // ids de sessions réservées
  const [history, setHistory] = useState([]);   // bookings passés
  const [loading, setLoading] = useState(true);
  // Planning states — hissés ici pour éviter remontage à chaque render
  const [sessions, setSessions] = useState([]);
  const [loadingSess, setLoadingSess] = useState(true);
  const [closures, setClosures] = useState([]);
  const [cancelDelayH, setCancelDelayH] = useState(2);
  // Account states — hissés ici pour éviter le remontage à chaque render
  const [accountEditing, setAccountEditing] = React.useState(false);
  const [accountSaving, setAccountSaving] = React.useState(false);
  const [accountForm, setAccountForm] = React.useState(null);

  // Init form quand me est chargé
  useEffect(() => {
    if (me && !accountForm) {
      setAccountForm({
        first_name:  me.first_name  || "",
        last_name:   me.last_name   || "",
        phone:       me.phone       || "",
        birth_date:  me.birth_date  || "",
        address:     me.address     || "",
        postal_code: me.postal_code || "",
        city:        me.city        || "",
        profession:  me.profession  || "",
      });
    }
  }, [me?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handlers stables par champ — évitent la perte de focus
  const accountSetFirst     = React.useCallback(e => setAccountForm(f => ({ ...f, first_name:  formatName(e.target.value) })), []);
  const accountSetLast      = React.useCallback(e => setAccountForm(f => ({ ...f, last_name:   e.target.value.toUpperCase() })), []);
  const accountSetPhone     = React.useCallback(e => setAccountForm(f => ({ ...f, phone: formatPhone(e.target.value) })), []);
  const accountSetBirth     = React.useCallback(v => setAccountForm(f => ({ ...f, birth_date: typeof v === "string" ? v : v?.target?.value || "" })), []);
  const accountSetAddress   = React.useCallback(e => setAccountForm(f => ({ ...f, address:     e.target.value })), []);
  const accountSetPostal    = React.useCallback(e => setAccountForm(f => ({ ...f, postal_code: formatPostalCode(e.target.value) })), []);
  const accountSetCity      = React.useCallback(e => setAccountForm(f => ({ ...f, city:        e.target.value })), []);
  const accountSetProfession = React.useCallback(e => setAccountForm(f => ({ ...f, profession: e.target.value })), []);
  const accountSetField = null; // gardé pour compatibilité

  const accountSave = React.useCallback(async () => {
    setAccountSaving(true);
    try {
      const res = await fetch("/api/member-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ studioId, memberId: me?.id || null, ...accountForm }),
      });
      const result = await res.json();
      if (res.ok) {
        setMe(m => ({ ...m, ...accountForm }));
        setAccountEditing(false);
        showToast("Coordonnées mises à jour ✓");
      } else {
        showToast(result.error || "Erreur lors de la sauvegarde", false);
      }
    } catch { showToast("Erreur réseau", false); }
    setAccountSaving(false);
  }, [studioId, accountForm, showToast]);


  useEffect(() => {
    if (!studioId) return;
    const sb = createClient();
    // Charger payment_mode du studio
    sb.from("studios").select("payment_mode").eq("id", studioId).single()
      .then(({ data }) => { if (data?.payment_mode) setStudioPaymentMode(data.payment_mode); });
    sb.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;

      // En mode impersonate admin, utiliser l'userId ciblé ; sinon l'user connecté
      const targetUid = impersonateUserId || user.id;
      let member = null;
      if (impersonateUserId) {
        // Impersonate : chercher d'abord par member.id, puis par auth_user_id
        const { data: byId } = await sb.from("members")
          .select("id, first_name, last_name, email, status, credits, credits_total, created_at, phone, birth_date, address, postal_code, city, profession, facebook, profile_complete, subscription_id, subscriptions(period)")
          .eq("studio_id", studioId).eq("id", targetUid).maybeSingle();
        member = byId;
        if (!member) {
          const { data: byUid } = await sb.from("members")
            .select("id, first_name, last_name, email, status, credits, credits_total, created_at, phone, birth_date, address, postal_code, city, profession, facebook, profile_complete, subscription_id, subscriptions(period)")
            .eq("studio_id", studioId).eq("auth_user_id", targetUid).maybeSingle();
          member = byUid;
        }
      } else {
        const { data: byUid } = await sb.from("members")
          .select("id, first_name, last_name, email, status, credits, credits_total, created_at, phone, birth_date, address, postal_code, city, profession, facebook, profile_complete, subscription_id, subscriptions(period)")
          .eq("studio_id", studioId).eq("auth_user_id", targetUid).maybeSingle();
        member = byUid;
      }

      // Fallback email uniquement pour l'user réel (pas l'impersonate)
      if (!member && !impersonateUserId && user.email) {
        const { data: byEmail } = await sb.from("members")
          .select("id, first_name, last_name, email, status, credits, credits_total, created_at, phone, birth_date, address, postal_code, city, profession, facebook, profile_complete, subscription_id, subscriptions(period)")
          .eq("studio_id", studioId).eq("email", user.email).maybeSingle();
        member = byEmail;
        if (member) {
          await sb.from("members").update({ auth_user_id: user.id }).eq("id", member.id);
        }
      }

      if (member) setMe(member);

      // Si retour depuis Stripe → recharger après délai webhook
      const params = new URLSearchParams(window.location.search);
      if (params.get("payment") === "success" && member) {
        setPage("payment");
        showToast("✅ Paiement confirmé ! Votre compte a été mis à jour.");
        window.history.replaceState({}, "", window.location.pathname);
        setTimeout(async () => {
          const { data: fresh } = await sb.from("members")
            .select("id, first_name, last_name, email, status, credits, credits_total, created_at, phone, birth_date, address, postal_code, city, profession, facebook, profile_complete, subscription_id, subscriptions(period)")
            .eq("id", member.id).maybeSingle();
          if (fresh) setMe(fresh);
        }, 2000);
      } else if (params.get("payment") === "canceled") {
        setPage("payment");
        showToast("Paiement annulé.", false);
        window.history.replaceState({}, "", window.location.pathname);
      }

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
          .select("session_id, status, attended, sessions(session_date, session_time, discipline_id, teacher, disciplines(name,color))")
          .eq("member_id", member.id)
          .order("session_id", { ascending: false })
          .limit(50);
        setHistory((hist || []).filter(h => h.sessions && h.sessions.session_date <= today));
      }

      setLoading(false);
    });
  }, [studioId]);

  // ── Planning useEffects (hissés hors de AdhPlanning pour éviter le remontage) ─
  useEffect(() => {
    if (!studioId) return;
    createClient().from("studios")
      .select("cancel_delay_hours").eq("id", studioId).single()
      .then(({ data }) => { if (data?.cancel_delay_hours != null) setCancelDelayH(data.cancel_delay_hours); });
  }, [studioId]);

  useEffect(() => {
    if (!studioId) return;
    setLoadingSess(true);
    const sb = createClient();
    const today = new Date().toISOString().split("T")[0];
    const d30 = new Date(); d30.setDate(d30.getDate() + 30);
    const toDate = d30.toISOString().slice(0,10);
    // Charger les fermetures
    sb.from("studio_closures").select("*").eq("studio_id", studioId).gte("date_end", today).order("date_start")
      .then(({ data }) => setClosures(data || []));
    sb.from("sessions")
      .select("id, discipline_id, teacher, room, level, session_date, session_time, duration_min, spots, status, disciplines(name,color,icon)")
      .eq("studio_id", studioId)
      .in("status", ["scheduled", "cancelled"])
      .gte("session_date", today)
      .lte("session_date", toDate)
      .order("session_date").order("session_time")
      .limit(60)
      .then(({ data, error }) => {
        if (error || !data?.length) { setSessions([]); setLoadingSess(false); return; }
        const sessionIds = data.map(s=>s.id);
        sb.from("bookings")
          .select("session_id")
          .in("session_id", sessionIds)
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
            setLoadingSess(false);
          })
          .catch(() => { setSessions([]); setLoadingSess(false); });
      })
      .catch(() => { setSessions([]); setLoadingSess(false); });
  }, [studioId]);

  useEffect(() => {
    if (!me?.id || !studioId) return;
    // Passer par l'API pour éviter les problèmes RLS quand admin visualise un adhérent
    fetch(`/api/bookings?memberId=${me.id}&studioId=${studioId}`)
      .then(r => r.json())
      .then(data => { if (data.bookings) setMyBookings(data.bookings.map(b => b.session_id)); })
      .catch(() => {
        // Fallback client direct
        createClient().from("bookings")
          .select("session_id, status")
          .eq("member_id", me.id)
          .in("status", ["confirmed","waitlist"])
          .then(({ data }) => { if (data) setMyBookings(data.map(b => b.session_id)); });
      });
  }, [me?.id, studioId]);

  // ── Planning Adhérent ───────────────────────────────────────────────────────
  function AdhPlanning() {
    const [filterDisc, setFilterDisc] = useState(0);
    const [confirmSess, setConfirmSess] = useState(null);

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

      // Passer par l'API pour déclencher les emails de confirmation
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: s.id, memberId: me.id, studioId }),
        credentials: "include",
      });
      const result = await res.json();
      if (res.ok && !result.error) {
        if (result.already) {
          showToast("Déjà inscrit à cette séance");
          return;
        }
        const isFull = result.status === "waitlist";
        // Batching : tous les state updates ensemble pour éviter le flash
        setMyBookings(p=>[...p, s.id]);
        setSessions(p=>p.map(x=>x.id===s.id?{...x,booked:x.booked+(isFull?0:1)}:x));
        // Décrémenter les crédits localement si système de crédits actif
        if (!isFull && me?.credits_total > 0 && me?.credits > 0) {
          setMe(m => ({ ...m, credits: m.credits - 1 }));
        }
        // Toast après le re-render des sessions
        requestAnimationFrame(() => {
          if (isFull) {
            showToast(`Ajouté à la liste d'attente — ${s.discName}`);
          } else {
            showToast(`Réservé : ${s.discName} — ${s.time}`);
          }
        });
      } else {
        showToast(result.error || "Erreur lors de la réservation", false);
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
      const res = await fetch("/api/bookings/cancel", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: s.id, memberId: me.id }),
      });
      if (res.ok) {
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
        <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:isMobile?"nowrap":"wrap", overflowX:isMobile?"auto":"visible", WebkitOverflowScrolling:"touch", paddingBottom:isMobile?4:0 }}>
          {[{id:0,name:"Toutes",color:C.accent},...allDiscs].map(d=>(
            <button key={d.id} onClick={()=>setFilterDisc(d.id)}
              style={{ fontSize:13, padding:"5px 14px", borderRadius:20, border:`1.5px solid ${filterDisc===d.id?d.color:C.border}`, background:filterDisc===d.id?d.color+"18":"transparent", color:filterDisc===d.id?d.color:C.textMid, cursor:"pointer", fontWeight:500, flexShrink:0, whiteSpace:"nowrap" }}>
              {d.icon||""} {d.name}
            </button>
          ))}
        </div>

        {/* Fermetures à venir */}
        {closures.length > 0 && closures.map(c => {
          const startFmt = new Date(c.date_start+"T12:00:00").toLocaleDateString("fr-FR",{day:"numeric",month:"long"});
          const endFmt = new Date(c.date_end+"T12:00:00").toLocaleDateString("fr-FR",{day:"numeric",month:"long"});
          const isNow = c.date_start <= new Date().toISOString().slice(0,10) && c.date_end >= new Date().toISOString().slice(0,10);
          return (
            <div key={c.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:isNow?"#FDE8E8":"#FFF8E8", border:`1.5px solid ${isNow?"#F5C2C2":"#F0D080"}`, borderRadius:10, marginBottom:12 }}>
              <span style={{ fontSize:16 }}>🔒</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700, color:isNow?"#C43A3A":"#8B6914" }}>{c.label || "Fermeture"}</div>
                <div style={{ fontSize:12, color:isNow?"#A85030":"#8C7B6C" }}>
                  {c.date_start === c.date_end ? startFmt : `Du ${startFmt} au ${endFmt}`}
                </div>
              </div>
              {isNow && <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:8, background:"#C43A3A", color:"#fff" }}>En cours</span>}
            </div>
          );
        })}

        {Object.keys(grouped).length === 0
          ? <EmptyState icon={<IcoCalendar2 s={40} c={C.textMuted}/>} title="Aucun cours planifié" sub="Aucune séance disponible pour le moment"/>
          : Object.entries(grouped).sort(([a],[b])=>a>b?1:-1).map(([date,daySessions])=>(
            <div key={date} style={{ marginBottom:20 }}>
              <DateLabel date={date}/>
              {daySessions.map(s=>{
                const isBooked   = myBookings.includes(s.id);
                const isFull     = s.booked >= s.spots;
                const isCancelled = s.status === "cancelled";
                // Masquer les séances déjà commencées (sauf si déjà inscrit)
                const [sy,sm,sd] = (s.date||"").split("-").map(Number);
                const [sh,smi]   = (s.time||"00:00").split(":").map(Number);
                const sessStart  = new Date(sy, sm-1, sd, sh, smi);
                const isPast     = sessStart <= new Date();
                if (isPast && !isBooked) return null;
                const pct        = s.booked/s.spots;
                return (
                  <Card key={s.id} style={{ marginBottom:8, borderLeft:`3px solid ${isCancelled ? C.warn : s.discColor}`, opacity: isCancelled ? 0.75 : (isFull&&!isBooked ? .7 : 1) }}>
                    {isCancelled && (
                      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8, padding:"5px 10px", background:C.warnBg, borderRadius:8, fontSize:12, fontWeight:700, color:C.warn }}>
                        ⚠ Séance annulée{isBooked ? " — votre réservation est automatiquement annulée" : ""}
                      </div>
                    )}
                    <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div style={{ fontSize:isMobile?15:16, fontWeight:700, color:isCancelled?C.warn:C.accent, flexShrink:0 }}>{s.time}</div>
                        <span style={{ fontSize:isMobile?15:16, fontWeight:700, color:isCancelled?C.textMuted:C.text, textDecoration:isCancelled?"line-through":"none" }}>{s.discName}</span>
                        {!isCancelled && <Pill color={s.discColor} bg={s.discColor+"18"}>{s.level}</Pill>}
                        {isFull && !isBooked && !isCancelled && <Tag s="complet"/>}
                        {!isCancelled && <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
                          <div style={{ width:60, height:4, background:C.bgDeep, borderRadius:2 }}>
                            <div style={{ height:"100%", width:`${Math.min(pct*100,100)}%`, background:pct>=1?C.warn:C.ok, borderRadius:2 }}/>
                          </div>
                          <span style={{ fontSize:12, fontWeight:600, color:pct>=1?C.warn:C.textSoft, whiteSpace:"nowrap" }}>{s.booked}/{s.spots}</span>
                        </div>}
                      </div>
                      <div style={{ fontSize:13, color:C.textSoft, paddingLeft:isMobile?0:0 }}>{s.teacher} · {s.room} · {s.duration_min} min</div>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:2 }}>
                        {isCancelled ? null : isBooked
                          ? (() => {
                              const [y,mo,d] = (s.date||"").split("-").map(Number);
                              const [h,mi]   = (s.time||"00:00").split(":").map(Number);
                              const sessStart = new Date(y, mo-1, d, h, mi);
                              const diffH = (sessStart - new Date()) / 3600000;
                              const tooLate = diffH < cancelDelayH;
                              return tooLate
                                ? <button disabled title={`Annulation impossible — délai de ${cancelDelayH}h dépassé`}
                                    style={{ fontSize:12, padding:"5px 12px", borderRadius:8, border:"1px solid #DDD5C8", background:C.bgDeep, color:C.textMuted, cursor:"not-allowed", fontWeight:600, opacity:0.5 }}>
                                    🔒 Annuler
                                  </button>
                                : <Button sm variant="danger" onClick={()=>cancel(s)}>Annuler</Button>;
                            })()
                          : isFull
                            ? <Button sm variant="secondary" onClick={()=>showToast("Ajouté à la liste d'attente")}>Liste d'attente</Button>
                            : (() => {
                                const hasC        = me?.credits_total > 0;
                                const hasCredits  = hasC && me.credits > 0;
                                const subPeriod   = me?.subscriptions?.period || me?.subPeriod;
                                const isUnlimited = subPeriod === "mois" || subPeriod === "trimestre" || subPeriod === "année";
                                const paymentActive = studioPaymentMode !== "none";
                                const canBook = !paymentActive || isUnlimited || hasCredits;
                                const noSub   = paymentActive && !isUnlimited && !hasC;
                                const noCredit = paymentActive && !isUnlimited && hasC && me.credits <= 0;
                                const btnStyle = isMobile ? { width:"100%", textAlign:"center", display:"block" } : {};
                                if (noCredit) return <button disabled style={{ fontSize:12, padding:"6px 12px", borderRadius:8, border:"1px solid #EFC8BC", background:C.warnBg, color:C.warn, cursor:"not-allowed", fontWeight:600, ...btnStyle }}>⛔ Abonnement ou crédit requis</button>;
                                if (noSub)    return <button disabled style={{ fontSize:12, padding:"6px 12px", borderRadius:8, border:"1px solid #DDD5C8", background:C.bgDeep, color:C.textMuted, cursor:"not-allowed", fontWeight:600, ...btnStyle }}>🔒 Abonnement ou crédit requis</button>;
                                return <Button sm onClick={()=>setConfirmSess(s)} style={isMobile?{width:"100%"}:{}}>Réserver</Button>;
                              })()
                        }
                      </div>
                    </div>
                    {isBooked && !isCancelled && (
                      <div style={{ marginTop:10, padding:"7px 12px", background:C.okBg, borderRadius:8, fontSize:13, color:C.ok, display:"flex", alignItems:"center", gap:6 }}>
                        <IcoCheck s={14} c={C.ok}/> Vous êtes inscrit(e) à cette séance
                      </div>
                    )}
                    {isCancelled && isBooked && (
                      <div style={{ marginTop:8, padding:"8px 12px", background:"#FEF3E2", borderRadius:8, fontSize:12, color:"#92400E", display:"flex", alignItems:"center", gap:6, borderLeft:"3px solid #F59E0B" }}>
                        <span>⚠️</span>
                        <span>Cette séance a été annulée par le studio. Votre réservation est annulée et il n'est plus possible d'agir sur cette séance. Contactez votre studio si nécessaire.</span>
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
  // Wrapper qui recharge me + history à chaque fois qu'on arrive sur l'onglet
  function AdhAccountRefreshed() {
    useEffect(() => {
      if (!me?.id) return;
      const sb = createClient();
      // Recharger credits + statut
      sb.from("members")
        .select("id, first_name, last_name, email, status, credits, credits_total, created_at, phone, birth_date, address, postal_code, city, profession, facebook, profile_complete, subscription_id, subscriptions(period)")
        .eq("id", me.id).maybeSingle()
        .then(({ data }) => { if (data) setMe(data); });
      // Recharger historique pour avoir les présences à jour
      const today = new Date().toISOString().split("T")[0];
      sb.from("bookings")
        .select("session_id, status, attended, sessions(session_date, session_time, discipline_id, teacher, disciplines(name,color))")
        .eq("member_id", me.id)
        .order("session_id", { ascending: false })
        .limit(50)
        .then(({ data: hist }) => {
          if (hist) setHistory(hist.filter(h => h.sessions && h.sessions.session_date <= today));
        });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
    return <AdhAccount/>;
  }

  function AdhAccount() {
    return <AdhAccountPanel
      me={me} loading={loading} history={history} p={p}
      editing={accountEditing} setEditing={setAccountEditing}
      saving={accountSaving}
      form={accountForm} setForm={setAccountForm}
      setFirst={accountSetFirst} setLast={accountSetLast}
      setPhone={accountSetPhone} setBirth={accountSetBirth}
      setAddress={accountSetAddress} setPostal={accountSetPostal}
      setCity={accountSetCity} setProfession={accountSetProfession}
      save={accountSave}
    />;
  }


  // Variable pour AdhAccount — sessions futures réservées
  const [sessions_for_account] = useState([]);

  // ── Historique ──────────────────────────────────────────────────────────────
  function AdhHistory() {
    const presents = history.filter(h=>h.attended===true).length;
    const absents  = history.filter(h=>h.sessions?.session_date < new Date().toISOString().slice(0,10) && h.attended!==true).length;
    // statusHistMap dérivé de attended plutôt que status

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
            const [color,bg] = h.attended===true ? [C.ok,C.okBg] : (h.sessions?.session_date < new Date().toISOString().slice(0,10) ? [C.warn,C.warnBg] : [C.info,C.infoBg]);
            const sess = h.sessions;
            return (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 16px", borderBottom:`1px solid ${C.borderSoft}` }}>
                <div style={{ width:32, height:32, borderRadius:8, background:bg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  {h.attended===true ? <IcoCheck s={16} c={color}/> : <IcoX s={16} c={color}/>}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:15, fontWeight:700, color:C.text }}>{sess?.disciplines?.name||"Séance"}</div>
                  <div style={{ fontSize:13, color:C.textSoft }}>{sess?.teacher} · {sess?.session_date ? new Date(sess.session_date).toLocaleDateString("fr-FR") : ""}</div>
                </div>
                <Tag s={h.attended===true?"présent":(h.sessions?.session_date < new Date().toISOString().slice(0,10)?"absent":"réservé")}/>
              </div>
            );
          })}
        </Card>
      </div>
    );
  }

  // ── Paiement / Abonnement ───────────────────────────────────────────────────

  // ── Mes achats ──────────────────────────────────────────────────────────────
  function AdhPurchases() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading]   = useState(true);

    useEffect(() => {
      if (!me?.id) return;
      createClient().from("member_payments")
        .select("id, amount, payment_date, payment_type, source, notes, status, stripe_payment_id")
        .eq("member_id", me.id)
        .order("payment_date", { ascending: false })
        .limit(50)
        .then(({ data }) => { setPayments(data || []); setLoading(false); });
    }, [me?.id]);

    if (loading) return <div style={{ padding:p, color:C.textMuted, fontSize:14 }}>Chargement…</div>;

    return (
      <div style={{ padding:p }}>
        <SectionHead>Mes achats</SectionHead>
        {payments.length === 0
          ? <EmptyState icon={<IcoTag2 s={40} c={C.textMuted}/>} title="Aucun achat" sub="Vos achats apparaîtront ici après paiement"/>
          : <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {payments.map(p => (
                <Card key={p.id} style={{ display:"flex", alignItems:"center", gap:14 }}>
                  <div style={{ width:38, height:38, borderRadius:10, background:C.accentBg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <IcoCreditCard2 s={18} c={C.accent}/>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:C.text }}>{p.notes || "Achat"}</div>
                    <div style={{ fontSize:12, color:C.textSoft, marginTop:2 }}>
                      {new Date(p.payment_date).toLocaleDateString("fr-FR", { day:"numeric", month:"long", year:"numeric" })}
                      {" · "}{p.payment_type || "Carte"}
                    </div>
                  </div>
                  <div style={{ textAlign:"right", flexShrink:0, display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6 }}>
                    <div style={{ fontSize:15, fontWeight:800, color:C.accent }}>{parseFloat(p.amount||0).toFixed(2)} €</div>
                    <Pill color={p.status==="payé"?C.ok:C.warn} bg={p.status==="payé"?C.okBg:C.warnBg}>
                      {p.status || "payé"}
                    </Pill>
                    {p.stripe_payment_id
                      ? <a href={`/api/invoice?paymentId=${p.id}`} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize:11, fontWeight:600, color:C.accent, textDecoration:"none", padding:"3px 10px", border:`1px solid ${C.accent}40`, borderRadius:6, background:C.accentBg, whiteSpace:"nowrap" }}>
                          🧾 Facture
                        </a>
                      : <span style={{ fontSize:11, fontWeight:500, color:C.textMuted, padding:"3px 10px", border:`1px solid ${C.border}`, borderRadius:6, background:C.bg, whiteSpace:"nowrap", cursor:"not-allowed", opacity:0.45 }}
                          title="Facture non disponible">
                          🧾 Facture
                        </span>
                    }
                  </div>
                </Card>
              ))}
            </div>
        }
      </div>
    );
  }

  function AdhPayment() {
    const [subs, setSubs]               = useState([]);
    const [packs, setPacks]             = useState([]);
    const [subsLoading, setSubsLoading] = useState(true);
    const [redirecting, setRedirecting] = useState(null);

    const [paymentMode, setPaymentMode] = useState(null); // null=chargement, "connect"|"direct"|"disabled"

    useEffect(() => {
      if (!studioId) return;
      createClient().from("studios")
        .select("payment_mode, stripe_connect_id, stripe_connect_status, stripe_pk")
        .eq("id", studioId).single()
        .then(({ data }) => {
          const mode = data?.payment_mode;
          if (!mode) { setPaymentMode("disabled"); return; }
          if (mode === "connect" && data?.stripe_connect_status !== "active") { setPaymentMode("disabled"); return; }
          if (mode === "direct" && !data?.stripe_pk) { setPaymentMode("disabled"); return; }
          setPaymentMode(mode);
        })
        .catch(() => setPaymentMode("disabled"));
    }, [studioId]);

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
        const origin = window.location.origin;
        const body = {
          studioId, memberId: me?.id, type,
          successUrl: `${origin}/?payment=success`,
          cancelUrl:  `${origin}/?payment=canceled`,
        };
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

    // Guard paiements désactivés / non configurés
    if (paymentMode === null) return <div style={{ padding:p, color:C.textMuted, fontSize:14 }}>Chargement…</div>;
    if (paymentMode === "disabled") return (
      <div style={{ padding:p }}>
        <div style={{ textAlign:"center", padding:"40px 20px", color:C.textMuted }}>
          <div style={{ fontSize:32, marginBottom:12 }}>🔒</div>
          <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:6 }}>Paiements non disponibles</div>
          <div style={{ fontSize:13 }}>Le studio n'a pas encore activé les paiements en ligne. Contactez votre studio pour régler votre abonnement.</div>
        </div>
      </div>
    );

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
        <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:12 }}>📋 Formules</div>
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
                  {redirecting===sub.id ? "Redirection…" : ["once","séance","carnet","session","unit"].includes(sub.period) ? "Acheter →" : "Souscrire →"}
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
  // profile_complete === null + nom générique ("Nouveau"/"Membre") → forcer onboarding
  // Si le membre a un vrai nom, on ne force pas l'onboarding même si profile_complete est null
  // Onboarding requis si profile_complete n'est pas explicitement true
  // Une fois profile_complete = true sauvegardé en base, le F5 ne revient plus sur l'onboarding
  const needsOnboarding = !loading && me && me.profile_complete !== true
  if (needsOnboarding) {
    return (
      <OnboardingView
        studioName={studioName}
        onComplete={async () => {
          // Recharger le membre via API service role (contourne RLS)
          try {
            const res = await fetch(`/api/member-profile?studioId=${studioId}`, { credentials: "include" });
            const result = await res.json();
            if (result.member) { setMe(result.member); return; }
          } catch {}
          // Fallback local
          setMe(m => ({ ...m, profile_complete: true }));
        }}
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
        <div style={{ position:"fixed", bottom: isMobile ? 78 : 24, left:"50%", transform:"translateX(-50%)", zIndex:600, display:"flex", alignItems:"center", gap:8, padding:"11px 20px", borderRadius:12, background:toast.ok?C.ok:C.warn, color:"white", fontSize:14, fontWeight:600, boxShadow:"0 4px 20px rgba(0,0,0,.2)", whiteSpace:"nowrap", animation:"toastIn .2s ease-out", pointerEvents:"none" }}>
          <style>{`@keyframes toastIn { from { opacity:0; transform:translateX(-50%) translateY(10px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }`}</style>
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
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                {me.credits_total > 0 && (
                  <div style={{ display:"flex", alignItems:"center", gap:5, padding:"4px 10px", background:me.credits<=0?C.warnBg:C.accentBg, borderRadius:20, border:`1px solid ${me.credits<=0?C.warn:C.accent}20` }}>
                    <IcoCreditCard2 s={12} c={me.credits<=0?C.warn:C.accent}/>
                    <span style={{ fontSize:12, fontWeight:700, color:me.credits<=0?C.warn:C.accent }}>{me.credits||0} crédit{(me.credits||0)!==1?"s":""}</span>
                  </div>
                )}
                <div style={{ width:30, height:30, borderRadius:"50%", background:C.accentBg, border:`1.5px solid ${C.accent}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:C.accent, flexShrink:0 }}>
                  {`${me.first_name?.[0]||""}${me.last_name?.[0]||""}`.toUpperCase()||"?"}
                </div>
                <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{me.first_name} {me.last_name}</div>
                <button onClick={async()=>{ const sb = createClient(); await sb.auth.signOut(); window.location.reload(); }}
                  style={{ marginLeft:4, padding:"5px 12px", borderRadius:8, border:`1px solid ${C.border}`, background:C.bg, color:C.textSoft, fontSize:12, fontWeight:600, cursor:"pointer" }}>
                  Déconnexion
                </button>
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
                {me.credits_total > 0 && (
                  <span style={{ fontSize:11, fontWeight:700, color:me.credits<=0?C.warn:C.accent, background:me.credits<=0?C.warnBg:C.accentBg, padding:"2px 8px", borderRadius:12 }}>
                    {me.credits||0} cr.
                  </span>
                )}
                <div style={{ width:28, height:28, borderRadius:"50%", background:C.accentBg, border:`1.5px solid ${C.accent}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:C.accent }}>
                  {`${me.first_name?.[0]||""}${me.last_name?.[0]||""}`.toUpperCase()||"?"}
                </div>
                <button onClick={async()=>{ const sb = createClient(); await sb.auth.signOut(); window.location.reload(); }}
                  style={{ padding:"4px 8px", borderRadius:6, border:`1px solid ${C.border}`, background:"none", color:C.textSoft, fontSize:11, fontWeight:600, cursor:"pointer" }}>
                  ⏻
                </button>
              </div>
            )}
          </div>
        )}
        <div style={{ flex:1, overflowY:"auto" }}>
          <div style={{ paddingBottom: isMobile ? 62 : 0 }}>
          {page === "planning" && <AdhPlanning/>}
          {page === "account"  && <AdhAccountPanel
              me={me} loading={loading} history={history} p={p}
              editing={accountEditing} setEditing={setAccountEditing}
              saving={accountSaving}
              form={accountForm} setForm={setAccountForm}
              setFirst={accountSetFirst} setLast={accountSetLast}
              setPhone={accountSetPhone} setBirth={accountSetBirth}
              setAddress={accountSetAddress} setPostal={accountSetPostal}
              setCity={accountSetCity} setProfession={accountSetProfession}
              save={accountSave}
            />}
          {page === "history"  && <AdhHistory/>}
          {page === "purchases" && <AdhPurchases/>}
          {page === "payment"  && <AdhPayment/>}
          </div>
        </div>
      </div>

      {/* Bottom nav mobile */}
      {isMobile && (
        <nav style={{ position:"fixed", bottom:0, left:0, right:0, background:C.surface, borderTop:`1px solid ${C.border}`, display:"flex", zIndex:400, height:62, boxShadow:"0 -2px 16px rgba(42,31,20,.07)" }}>
          {ADH_MOBILE_NAV.map(item=>{
            const isA = page===item.key;
            const Ico = item.icon;
            return (
              <button key={item.key} onClick={()=>setPage(item.key)}
                style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:2, border:"none", background:"none", cursor:"pointer", color:isA?C.accent:C.textMuted, fontSize:12, fontWeight:isA?700:400, transition:"color .15s", padding:"6px 0 4px", position:"relative" }}>
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