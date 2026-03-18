// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { AppCtx } from "./context";
import { C, useWidth } from "./theme";
import { DISCIPLINES, MY_COACH_NAME } from "./demoData";
import { Sidebar, BottomNav, TopBar } from "./layout";
import { Dashboard } from "./Dashboard";
import { Planning } from "./Planning";
import { Members } from "./Members";
import { Subscriptions } from "./Subscriptions";
import { Payments } from "./Payments";
import { DisciplinesPage } from "./Disciplines";
import { Settings } from "./Settings";
import { AidePage } from "./Aide";
import { SuperAdminView } from "./SuperAdmin";
import { CoachView } from "./CoachView";
import { AdherentView } from "./AdherentView";



export default function App({
  initialRole = "admin", studioSlug = "", studioName = "",
  studioId: propStudioId = "", planName = "", membersCount = 0,
  userName = "", userRole = "", coachName = "", coachDisciplines = [],
  billingStatus = "trialing", trialEndsAt = null, onSignOut = null
}) {
  const PAGES = {
    dashboard:Dashboard, planning:Planning, members:Members,
    subscriptions:Subscriptions, payments:Payments, disciplines:DisciplinesPage,
    settings:Settings, aide:AidePage,
  };
const PAGE_TITLES = {
  dashboard:"Tableau de bord", planning:"Planning", members:"Adhérents",
  subscriptions:"Abonnements", payments:"Paiements", disciplines:"Disciplines",
  settings:"Paramètres", aide:"Aide"
};
  const [sharedStudioId, setSharedStudioId] = useState(propStudioId || null);
  const [dynamicMembersCount, setDynamicMembersCount] = useState<number|null>(null);
  useEffect(() => {
    // propStudioId arrive en async depuis layout — on le sync dès qu'il est disponible
    if (propStudioId) { setSharedStudioId(propStudioId); return; }
    // Fallback : lire depuis Supabase si propStudioId n'arrive jamais
    createClient().auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: prof } = await createClient().from("profiles").select("studio_id").eq("id", user.id).single();
      if (prof?.studio_id) setSharedStudioId(prof.studio_id);
    });
  }, [propStudioId]);

  const [role, setRole] = useState(initialRole);
  const [impersonating, setImpersonating] = useState(null);
  const [impersonatedCoach, setImpersonatedCoach] = useState({ name:"", disciplines:[] });
  const [impersonatedStudioName, setImpersonatedStudioName] = useState("");

  const startImpersonate = React.useCallback(async (asRole, userId=null, nameHint="") => {
    if (asRole === "coach" && userId) {
      try {
        const sb = createClient();
        // Charger les disciplines du coach
        const { data: discLinks } = await sb.from("coach_disciplines")
          .select("discipline_id, disciplines(id,name,icon,color)").eq("profile_id", userId);
        const disciplines = discLinks?.map(r=>r.disciplines).filter(Boolean) || [];
        // Utiliser le nom passé directement depuis Settings (déjà chargé)
        // Fallback sur Supabase seulement si nameHint vide
        let name = nameHint;
        if (!name) {
          const { data: prof } = await sb.from("profiles").select("first_name, last_name").eq("id", userId).single();
          name = prof ? `${prof.first_name||""} ${prof.last_name||""}`.trim() : "";
        }
        setImpersonatedCoach({ name, disciplines });
        setImpersonating({ as: asRole, fromRole: role, userId });
        setRole(asRole);
      } catch(e) {
        setImpersonatedCoach({ name: nameHint || "", disciplines:[] });
        setImpersonating({ as: asRole, fromRole: role, userId });
        setRole(asRole);
      }
    } else {
      setImpersonating({ as: asRole, fromRole: role, userId });
      setRole(asRole);
    }
  }, [role]);

  const stopImpersonate = React.useCallback(() => {
    if (!impersonating) return;
    setRole(impersonating.fromRole);
    setImpersonating(null);
    setSharedStudioId(propStudioId || null);
    setImpersonatedStudioName("");
  }, [impersonating, propStudioId]);

  const startImpersonateStudio = React.useCallback(async (studioSlugTarget) => {
    setImpersonating({ as: "admin", fromRole: "superadmin", studioSlug: studioSlugTarget });
    setRole("admin");
    // Charger le studioId via l'API service role (bypass RLS depuis fydelys.fr)
    try {
      const res = await fetch("/api/sa/studios");
      const { studios, memberCounts } = await res.json();
      const target = (studios || []).find((s: any) => s.slug === studioSlugTarget);
      if (target) {
        setSharedStudioId(target.id);
        setImpersonatedStudioName(target.name || studioSlugTarget);
        const count = (memberCounts || {})[target.id] ?? null;
        setDynamicMembersCount(count !== null ? Number(count) : null);
      }
    } catch(e) { console.error("impersonate studioId load error", e); }
  }, []);

  // Lire la page initiale depuis l'URL (ex: /members → "members")
  const getPageFromUrl = () => {
    if (typeof window === "undefined") return "planning";
    const path = window.location.pathname.replace(/^\//, "").split("/")[0];
    const validPages = ["dashboard","planning","members","subscriptions","payments","disciplines","settings","aide"];
    return validPages.includes(path) ? path : "planning";
  };
  const [page, setPage] = useState(getPageFromUrl);

  // Synchroniser l'URL quand on change de page
  const handleNav = (newPage) => {
    setPage(newPage);
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", `/${newPage}`);
    }
  };

  // Écouter les events de navigation inter-composants (ex: Dashboard → Settings)
  React.useEffect(() => {
    const handler = (e: CustomEvent) => { if (e.detail) handleNav(e.detail); };
    window.addEventListener("fydelys:nav", handler as EventListener);
    return () => window.removeEventListener("fydelys:nav", handler as EventListener);
  }, []);

  const [discs, setDiscs] = useState([]);

  // membersCount chargé depuis /api/sa/studios lors de l'impersonation (service role)

  // Charger disciplines dès que studioId est connu (propStudioId OU sharedStudioId)
  useEffect(() => {
    const id = propStudioId || sharedStudioId;
    if (!id) return;
    createClient()
      .from("disciplines")
      .select("id,name,icon,color,slots")
      .eq("studio_id", id)
      .order("created_at")
      .then(({ data }) => {
        if (data?.length) {
          setDiscs(data.map(d => ({ ...d, slots: d.slots||[] })));
        } else {
          // Fallback démo uniquement si aucune discipline en base
          setDiscs(DISCIPLINES.map(d => ({ ...d, slots: [] })));
        }
      });
  }, [propStudioId, sharedStudioId]);

  const width = useWidth();
  const isMobile = width < 768;

  // ── ALL HOOKS MUST BE BEFORE CONDITIONAL RETURNS ──────────────────────────

  const trialDaysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000))
    : 0;
  const showTrialBanner   = billingStatus === "trialing" && trialDaysLeft <= 7;
  const showPastDueBanner = billingStatus === "past_due";

  // ── CONDITIONAL RENDERS (after all hooks) ─────────────────────────────────
  if (role === "superadmin") return <SuperAdminView onSwitch={setRole} isMobile={isMobile} onSignOut={onSignOut} onImpersonateStudio={startImpersonateStudio}/>;
  if (role === "coach") return (
    <>
      {impersonating && (
        <div style={{ position:"fixed", top:0, left:0, right:0, zIndex:9999, background:"#2A1F14", color:"white", padding:"8px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, fontSize:13, fontWeight:600 }}>
          <span>👁 Vue coach — {impersonating.fromRole === "superadmin" ? "Super Admin" : "Admin"}</span>
          <button onClick={stopImpersonate} style={{ background:"rgba(255,255,255,.15)", border:"1px solid rgba(255,255,255,.3)", color:"white", padding:"4px 14px", borderRadius:6, cursor:"pointer", fontWeight:700, fontSize:12 }}>
            ← Retour {impersonating.fromRole === "superadmin" ? "Super Admin" : "Admin"}
          </button>
        </div>
      )}
      <div style={{ marginTop: impersonating ? 38 : 0 }}>
        <CoachView onSwitch={setRole} isMobile={isMobile} coachName={impersonating?.userId ? (impersonatedCoach.name||coachName||MY_COACH_NAME) : (coachName||MY_COACH_NAME)} coachDisciplines={impersonating?.userId ? impersonatedCoach.disciplines : coachDisciplines} studioName={studioName} studioId={propStudioId||sharedStudioId||""}/>
      </div>
    </>
  );
  const activeStudioName = (impersonating?.as === "admin" && impersonatedStudioName) ? impersonatedStudioName : studioName;
  const appCtxValue = {
    studioName: activeStudioName, studioSlug, userName, planName,
    membersCount: dynamicMembersCount !== null ? dynamicMembersCount : membersCount,
    userRole, userEmail: "", discs, setDiscs,
    studioId: sharedStudioId, setStudioId: setSharedStudioId,
  };

  if (role === "adherent") return (
    <AppCtx.Provider value={appCtxValue}>
      {impersonating && (
        <div style={{ position:"fixed", top:0, left:0, right:0, zIndex:9999, background:"#2A1F14", color:"white", padding:"8px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, fontSize:13, fontWeight:600 }}>
          <span>👁 Vue membre — {impersonating.fromRole === "superadmin" ? "Super Admin" : "Admin"}</span>
          <button onClick={stopImpersonate} style={{ background:"rgba(255,255,255,.15)", border:"1px solid rgba(255,255,255,.3)", color:"white", padding:"4px 14px", borderRadius:6, cursor:"pointer", fontWeight:700, fontSize:12 }}>
            ← Retour {impersonating.fromRole === "superadmin" ? "Super Admin" : "Admin"}
          </button>
        </div>
      )}
      <div style={{ marginTop: impersonating ? 38 : 0 }}>
        <AdherentView onSwitch={setRole} isMobile={isMobile} studioName={studioName} impersonateUserId={impersonating?.userId || null}/>
      </div>
    </AppCtx.Provider>
  );

  const Page = PAGES[page] || Dashboard;
  const isImpersonatingAdmin = impersonating?.as === "admin" && impersonating?.fromRole === "superadmin";

  return (
    <AppCtx.Provider value={appCtxValue}>
      {isImpersonatingAdmin && (
        <div style={{ position:"fixed", top:0, left:0, right:0, zIndex:9999, background:"#4C1D95", color:"white", padding:"8px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, fontSize:13, fontWeight:600 }}>
          <span>👁 Vue Studio : {activeStudioName || studioSlug}</span>
          <button onClick={stopImpersonate} style={{ background:"rgba(255,255,255,.15)", border:"1px solid rgba(255,255,255,.3)", color:"white", padding:"4px 14px", borderRadius:6, cursor:"pointer", fontWeight:700, fontSize:12 }}>
            ← Retour Super Admin
          </button>
        </div>
      )}
      <div style={{ display:"flex", minHeight:"100vh", background:C.bg, marginTop: isImpersonatingAdmin ? 38 : 0 }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          * { box-sizing:border-box; font-family:-apple-system,'Inter',sans-serif; }
          body { margin:0; }
          select { cursor:pointer; }
          input[type=date]::-webkit-calendar-picker-indicator { opacity:.5; cursor:pointer; }
          ::-webkit-scrollbar { width:5px; height:5px; }
          ::-webkit-scrollbar-thumb { background:#D0C4B8; border-radius:3px; }
          ::-webkit-scrollbar-track { background:transparent; }
        `}</style>
        {!isMobile && <Sidebar active={page} onNav={handleNav} studioName={activeStudioName} planName={planName} membersCount={dynamicMembersCount !== null ? dynamicMembersCount : membersCount} userName={userName} userRole={userRole} trialEndsAt={trialEndsAt} billingStatus={billingStatus}/>}
        <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, paddingBottom:isMobile?60:0 }}>
          <TopBar title={PAGE_TITLES[page]} isMobile={isMobile} onSignOut={onSignOut} isSuperAdmin={initialRole==="superadmin" && !isImpersonatingAdmin} studioName={activeStudioName}/>
          {showTrialBanner && (
            <div style={{ background:trialDaysLeft<=3?"#F5EAE6":"#FDF4E3", borderBottom:`1px solid ${trialDaysLeft<=3?"#F5C2B5":"rgba(196,146,42,.25)"}`, padding:"10px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
              <div style={{ fontSize:13, color:trialDaysLeft<=3?"#A85030":"#C4922A", fontWeight:600 }}>
                ⏳ {trialDaysLeft > 0 ? `${trialDaysLeft} jour${trialDaysLeft>1?"s":""} d'essai gratuit restant${trialDaysLeft>1?"s":""}` : "Essai expiré"} — Activez votre abonnement pour continuer
              </div>
              <a href="/billing" style={{ fontSize:12, fontWeight:700, padding:"6px 14px", borderRadius:8, background:trialDaysLeft<=3?"#A85030":"#C4922A", color:"#fff", textDecoration:"none", whiteSpace:"nowrap" }}>
                Choisir une formule →
              </a>
            </div>
          )}
          {showPastDueBanner && (
            <div style={{ background:"#F5EAE6", borderBottom:"1px solid #F5C2B5", padding:"10px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
              <div style={{ fontSize:13, color:"#A85030", fontWeight:600 }}>
                ⚠️ Paiement échoué — Mettez à jour votre carte bancaire pour éviter la suspension
              </div>
              <a href="/billing" style={{ fontSize:12, fontWeight:700, padding:"6px 14px", borderRadius:8, background:"#A85030", color:"#fff", textDecoration:"none", whiteSpace:"nowrap" }}>
                Mettre à jour →
              </a>
            </div>
          )}
          {isMobile && (
            <div style={{ padding:"16px 16px 4px", fontSize:28, fontWeight:800, color:C.text, letterSpacing:-0.6 }}>
              {PAGE_TITLES[page]}
            </div>
          )}
          <div style={{ flex:1, overflowY:"auto" }}>
            {page === "settings"
              ? <Settings isMobile={isMobile} onImpersonate={startImpersonate}/>
              : <Page isMobile={isMobile}/>
            }
          </div>
        </div>
        {isMobile && <BottomNav active={page} onNav={handleNav}/>}
      </div>
    </AppCtx.Provider>
  );
}