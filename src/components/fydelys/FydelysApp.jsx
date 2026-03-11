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

// ── DIAGNOSTIC: log any undefined imports at module evaluation time ──────────
if (typeof window !== "undefined") {
  const _check = { Dashboard, Planning, Members, Subscriptions, Payments, DisciplinesPage, Settings, AidePage, SuperAdminView, CoachView, AdherentView, Sidebar, BottomNav, TopBar, C, useWidth, DISCIPLINES, MY_COACH_NAME, AppCtx };
  const _bad = Object.entries(_check).filter(([,v]) => v === undefined || v === null);
  if (_bad.length > 0) console.error("🔴 FYDELYS UNDEFINED IMPORTS:", _bad.map(([k]) => k).join(", "));
  else console.log("✅ FYDELYS: all imports resolved");
}

const PAGE_TITLES = {
  dashboard:"Tableau de bord", planning:"Planning", members:"Adhérents",
  subscriptions:"Abonnements", payments:"Paiements", disciplines:"Disciplines",
  settings:"Paramètres", aide:"Aide"
};

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
  const [role, setRole] = useState(initialRole);

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

  // Disciplines persistées dans localStorage
  const discStorageKey = `fydelys_discs_${studioSlug||"default"}`;
  const [discs, setDiscs] = useState(() => {
    try {
      const saved = typeof window !== "undefined" && localStorage.getItem(discStorageKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DISCIPLINES.map(d => ({ ...d, slots: [] }));
  });

  useEffect(() => {
    try { localStorage.setItem(discStorageKey, JSON.stringify(discs)); } catch {}
  }, [discs, discStorageKey]);

  const width = useWidth();
  const isMobile = width < 768;

  // ── ALL HOOKS MUST BE BEFORE CONDITIONAL RETURNS ──────────────────────────
  const [sharedStudioId, setSharedStudioId] = useState(propStudioId || null);
  useEffect(() => {
    if (propStudioId) { setSharedStudioId(propStudioId); return; }
    if (sharedStudioId) return;
    createClient().auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: prof } = await createClient().from("profiles").select("studio_id").eq("id", user.id).single();
      if (prof?.studio_id) setSharedStudioId(prof.studio_id);
    });
  }, [propStudioId]);

  const trialDaysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000))
    : 0;
  const showTrialBanner   = billingStatus === "trialing" && trialDaysLeft <= 7;
  const showPastDueBanner = billingStatus === "past_due";

  // ── CONDITIONAL RENDERS (after all hooks) ─────────────────────────────────
  if (role === "superadmin") return <SuperAdminView onSwitch={setRole} isMobile={isMobile} onSignOut={onSignOut}/>;
  if (role === "coach")      return <CoachView onSwitch={setRole} isMobile={isMobile} coachName={coachName||MY_COACH_NAME} coachDisciplines={coachDisciplines}/>;
  if (role === "adherent")   return <AdherentView onSwitch={setRole} isMobile={isMobile}/>;

  const Page = PAGES[page] || Dashboard;

  const appCtxValue = {
    studioName, studioSlug, userName, planName, membersCount,
    userRole, userEmail: "", discs, setDiscs,
    studioId: sharedStudioId, setStudioId: setSharedStudioId,
  };

  return (
    <AppCtx.Provider value={appCtxValue}>
      <div style={{ display:"flex", minHeight:"100vh", background:C.bg }}>
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
        {!isMobile && <Sidebar active={page} onNav={handleNav} studioName={studioName} planName={planName} membersCount={membersCount} userName={userName} userRole={userRole}/>}
        <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, paddingBottom:isMobile?60:0 }}>
          <TopBar title={PAGE_TITLES[page]} isMobile={isMobile} onSignOut={onSignOut} isSuperAdmin={initialRole==="superadmin"} studioName={studioName}/>
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
            <Page isMobile={isMobile}/>
          </div>
        </div>
        {isMobile && <BottomNav active={page} onNav={handleNav}/>}
      </div>
    </AppCtx.Provider>
  );
}
