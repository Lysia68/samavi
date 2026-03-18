import { createClient } from "@/lib/supabase";
import React, { useState, useEffect, useContext, createContext } from "react";

const AppCtx = createContext({ studioName:"", studioSlug:"", userName:"", userEmail:"", planName:"", membersCount:0, userRole:"", discs:[], setDiscs:()=>{}, studioId:null, setStudioId:()=>{} });

// ── ConfirmModal — remplace window.confirm ────────────────────────────────────
function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div onClick={e=>e.target===e.currentTarget&&onCancel()}
      style={{ position:"fixed", inset:0, background:"rgba(42,31,20,.45)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div style={{ background:"#FDFAF7", border:"1.5px solid #DDD5C8", borderRadius:16, padding:"28px 28px 24px", maxWidth:340, width:"100%", boxShadow:"0 24px 48px rgba(42,31,20,.15)", textAlign:"center" }}>
        <div style={{ fontSize:32, marginBottom:14 }}>🚪</div>
        <div style={{ fontSize:16, fontWeight:700, color:"#2A1F14", marginBottom:8 }}>Déconnexion</div>
        <div style={{ fontSize:14, color:"#8C7B6C", lineHeight:1.6, marginBottom:24 }}>{message}</div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onCancel}
            style={{ flex:1, padding:"10px", background:"transparent", border:"1.5px solid #DDD5C8", borderRadius:9, color:"#8C7B6C", fontSize:14, fontWeight:600, cursor:"pointer" }}>
            Annuler
          </button>
          <button onClick={onConfirm}
            style={{ flex:1, padding:"10px", background:"linear-gradient(145deg,#B88050,#9A6030)", border:"none", borderRadius:9, color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer" }}>
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}


// ══════════════════════════════════════════════════════════════════════════════
// DONNÉES DE DÉMONSTRATION — remplacées automatiquement par les vraies données
// dès que le studio aura des enregistrements en base Supabase.
// ══════════════════════════════════════════════════════════════════════════════
const DISC_IDS = {
  yoga:   "demo-disc-yoga-vinyasa",
  pilates:"demo-disc-pilates",
  medit:  "demo-disc-meditation",
  yin:    "demo-disc-yin-yoga",
};

const MEMBERS_DEMO = [
  { id:"dm1", firstName:"Sophie",   lastName:"Martin",    email:"sophie.martin@gmail.com",   phone:"06 12 34 56 78", status:"actif",    subscription:"Mensuel illimité",  credits:null, joinedAt:"2025-09-15", notes:"Pratique avancée" },
  { id:"dm2", firstName:"Lucas",    lastName:"Bernard",   email:"lucas.bernard@gmail.com",    phone:"06 23 45 67 89", status:"actif",    subscription:"Carnet 10 séances", credits:6,    joinedAt:"2025-11-02", notes:"" },
  { id:"dm3", firstName:"Emma",     lastName:"Dubois",    email:"emma.dubois@yahoo.fr",       phone:"06 34 56 78 90", status:"actif",    subscription:"Mensuel illimité",  credits:null, joinedAt:"2025-10-20", notes:"Genou droit fragile" },
  { id:"dm4", firstName:"Thomas",   lastName:"Petit",     email:"thomas.petit@outlook.com",   phone:"06 45 67 89 01", status:"actif",    subscription:"Trimestriel",       credits:null, joinedAt:"2026-01-08", notes:"" },
  { id:"dm5", firstName:"Léa",      lastName:"Robert",    email:"lea.robert@gmail.com",       phone:"06 56 78 90 12", status:"actif",    subscription:"Mensuel illimité",  credits:null, joinedAt:"2025-08-30", notes:"" },
  { id:"dm6", firstName:"Julien",   lastName:"Moreau",    email:"julien.moreau@gmail.com",    phone:"06 67 89 01 23", status:"actif",    subscription:"Carnet 10 séances", credits:2,    joinedAt:"2026-02-14", notes:"Rappeler renouvellement" },
  { id:"dm7", firstName:"Marie",    lastName:"Lefebvre",  email:"marie.lefebvre@orange.fr",   phone:"06 78 90 12 34", status:"actif",    subscription:"Mensuel illimité",  credits:null, joinedAt:"2025-07-12", notes:"" },
  { id:"dm8", firstName:"Antoine",  lastName:"Garcia",    email:"antoine.garcia@gmail.com",   phone:"06 89 01 23 45", status:"inactif",  subscription:"Carnet 10 séances", credits:0,    joinedAt:"2025-12-01", notes:"Carnet épuisé" },
  { id:"dm9", firstName:"Camille",  lastName:"Roux",      email:"camille.roux@gmail.com",     phone:"06 90 12 34 56", status:"actif",    subscription:"Mensuel illimité",  credits:null, joinedAt:"2026-01-22", notes:"" },
  { id:"dm10",firstName:"Nicolas",  lastName:"Simon",     email:"nicolas.simon@sfr.fr",       phone:"07 01 23 45 67", status:"actif",    subscription:"Trimestriel",       credits:null, joinedAt:"2025-10-05", notes:"Professeur de collège" },
  { id:"dm11",firstName:"Inès",     lastName:"Laurent",   email:"ines.laurent@gmail.com",     phone:"07 12 34 56 78", status:"actif",    subscription:"Mensuel illimité",  credits:null, joinedAt:"2025-09-01", notes:"" },
  { id:"dm12",firstName:"Paul",     lastName:"Michel",    email:"paul.michel@gmail.com",      phone:"07 23 45 67 89", status:"suspendu", subscription:"Mensuel illimité",  credits:null, joinedAt:"2025-06-15", notes:"Impayé février" },
];

const SESSIONS_DEMO = [
  // Lundi 9 mars
  { id:"ds1",  disciplineId:DISC_IDS.yoga,    discName:"Yoga Vinyasa", discColor:"#C4956A", discIcon:"🧘", teacher:"Brigitte GUTHMANN", room:"Studio A", level:"Tous niveaux",  date:"2026-03-09", time:"09:00", duration:60,  spots:12, status:"scheduled" },
  { id:"ds2",  disciplineId:DISC_IDS.pilates,  discName:"Pilates",      discColor:"#6B9E7A", discIcon:"⚡", teacher:"Brigitte GUTHMANN", room:"Studio B", level:"Intermédiaire", date:"2026-03-09", time:"17:30", duration:60,  spots:10, status:"scheduled" },
  // Mardi 10 mars
  { id:"ds3",  disciplineId:DISC_IDS.medit,   discName:"Méditation",   discColor:"#6A8FAE", discIcon:"☯",  teacher:"Brigitte GUTHMANN", room:"Studio A", level:"Débutant",      date:"2026-03-10", time:"07:30", duration:30,  spots:15, status:"scheduled" },
  { id:"ds4",  disciplineId:DISC_IDS.yoga,    discName:"Yoga Vinyasa", discColor:"#C4956A", discIcon:"🧘", teacher:"Brigitte GUTHMANN", room:"Studio A", level:"Avancé",        date:"2026-03-10", time:"19:00", duration:75,  spots:8,  status:"scheduled" },
  // Mercredi 11 mars (aujourd'hui)
  { id:"ds5",  disciplineId:DISC_IDS.yoga,    discName:"Yoga Vinyasa", discColor:"#C4956A", discIcon:"🧘", teacher:"Brigitte GUTHMANN", room:"Studio A", level:"Tous niveaux",  date:"2026-03-11", time:"09:00", duration:60,  spots:12, status:"scheduled" },
  { id:"ds6",  disciplineId:DISC_IDS.medit,   discName:"Méditation",   discColor:"#6A8FAE", discIcon:"☯",  teacher:"Brigitte GUTHMANN", room:"Studio A", level:"Tous niveaux",  date:"2026-03-11", time:"18:30", duration:45,  spots:15, status:"scheduled" },
  // Jeudi 12 mars
  { id:"ds7",  disciplineId:DISC_IDS.pilates,  discName:"Pilates",      discColor:"#6B9E7A", discIcon:"⚡", teacher:"Brigitte GUTHMANN", room:"Studio B", level:"Débutant",      date:"2026-03-12", time:"12:00", duration:45,  spots:10, status:"scheduled" },
  { id:"ds8",  disciplineId:DISC_IDS.yin,     discName:"Yin Yoga",     discColor:"#AE7A7A", discIcon:"🌙", teacher:"Brigitte GUTHMANN", room:"Studio A", level:"Tous niveaux",  date:"2026-03-12", time:"19:00", duration:75,  spots:12, status:"scheduled" },
  // Vendredi 13 mars
  { id:"ds9",  disciplineId:DISC_IDS.yoga,    discName:"Yoga Vinyasa", discColor:"#C4956A", discIcon:"🧘", teacher:"Brigitte GUTHMANN", room:"Studio A", level:"Tous niveaux",  date:"2026-03-13", time:"09:00", duration:60,  spots:12, status:"scheduled" },
  { id:"ds10", disciplineId:DISC_IDS.yin,     discName:"Yin Yoga",     discColor:"#AE7A7A", discIcon:"🌙", teacher:"Brigitte GUTHMANN", room:"Studio A", level:"Débutant",      date:"2026-03-13", time:"18:00", duration:75,  spots:12, status:"cancelled" },
  // Samedi 14 mars
  { id:"ds11", disciplineId:DISC_IDS.yoga,    discName:"Yoga Vinyasa", discColor:"#C4956A", discIcon:"🧘", teacher:"Brigitte GUTHMANN", room:"Studio A", level:"Tous niveaux",  date:"2026-03-14", time:"10:00", duration:75,  spots:16, status:"scheduled" },
  { id:"ds12", disciplineId:DISC_IDS.medit,   discName:"Méditation",   discColor:"#6A8FAE", discIcon:"☯",  teacher:"Brigitte GUTHMANN", room:"Studio A", level:"Tous niveaux",  date:"2026-03-15", time:"09:30", duration:45,  spots:15, status:"scheduled" },
];

const BOOKINGS_DEMO = {
  "ds1":  [
    { id:"b1",  st:"confirmed", member:"Sophie Martin",   avatar:"SM" },
    { id:"b2",  st:"confirmed", member:"Emma Dubois",     avatar:"ED" },
    { id:"b3",  st:"confirmed", member:"Thomas Petit",    avatar:"TP" },
    { id:"b4",  st:"confirmed", member:"Léa Robert",      avatar:"LR" },
    { id:"b5",  st:"confirmed", member:"Marie Lefebvre",  avatar:"ML" },
    { id:"b6",  st:"confirmed", member:"Camille Roux",    avatar:"CR" },
    { id:"b7",  st:"confirmed", member:"Nicolas Simon",   avatar:"NS" },
    { id:"b8",  st:"confirmed", member:"Inès Laurent",    avatar:"IL" },
    { id:"b9",  st:"waitlist",  member:"Lucas Bernard",   avatar:"LB" },
  ],
  "ds2":  [
    { id:"b10", st:"confirmed", member:"Sophie Martin",  avatar:"SM" },
    { id:"b11", st:"confirmed", member:"Lucas Bernard",  avatar:"LB" },
    { id:"b12", st:"confirmed", member:"Emma Dubois",    avatar:"ED" },
    { id:"b13", st:"confirmed", member:"Julien Moreau",  avatar:"JM" },
    { id:"b14", st:"confirmed", member:"Camille Roux",   avatar:"CR" },
  ],
  "ds5":  [
    { id:"b20", st:"confirmed", member:"Sophie Martin",  avatar:"SM" },
    { id:"b21", st:"confirmed", member:"Thomas Petit",   avatar:"TP" },
    { id:"b22", st:"confirmed", member:"Léa Robert",     avatar:"LR" },
    { id:"b23", st:"confirmed", member:"Nicolas Simon",  avatar:"NS" },
    { id:"b24", st:"confirmed", member:"Inès Laurent",   avatar:"IL" },
    { id:"b25", st:"waitlist",  member:"Marie Lefebvre", avatar:"ML" },
  ],
  "ds11": [
    { id:"b30", st:"confirmed", member:"Sophie Martin",  avatar:"SM" },
    { id:"b31", st:"confirmed", member:"Emma Dubois",    avatar:"ED" },
    { id:"b32", st:"confirmed", member:"Thomas Petit",   avatar:"TP" },
    { id:"b33", st:"confirmed", member:"Léa Robert",     avatar:"LR" },
    { id:"b34", st:"confirmed", member:"Marie Lefebvre", avatar:"ML" },
    { id:"b35", st:"confirmed", member:"Camille Roux",   avatar:"CR" },
    { id:"b36", st:"confirmed", member:"Nicolas Simon",  avatar:"NS" },
    { id:"b37", st:"confirmed", member:"Inès Laurent",   avatar:"IL" },
    { id:"b38", st:"confirmed", member:"Lucas Bernard",  avatar:"LB" },
    { id:"b39", st:"confirmed", member:"Julien Moreau",  avatar:"JM" },
    { id:"b40", st:"waitlist",  member:"Antoine Garcia", avatar:"AG" },
  ],
};

const SUBSCRIPTIONS_DEMO = [
  { id:"sub1", name:"Mensuel illimité",  price:89,  period:"mois",      credits:null, members:7,  revenue:623 },
  { id:"sub2", name:"Carnet 10 séances", price:120, period:"carnet",    credits:10,   members:3,  revenue:240 },
  { id:"sub3", name:"Trimestriel",       price:229, period:"trimestre", credits:null, members:2,  revenue:152 },
  { id:"sub4", name:"Séance à l'unité",  price:18,  period:"séance",    credits:1,    members:0,  revenue:0   },
];

const PAYMENTS_DEMO = [
  { id:"p1",  member:"Sophie Martin",  amount:89,  date:"2026-03-01", type:"Prélèvement", status:"payé",    subscription:"Mensuel illimité"  },
  { id:"p2",  member:"Emma Dubois",    amount:89,  date:"2026-03-01", type:"Prélèvement", status:"payé",    subscription:"Mensuel illimité"  },
  { id:"p3",  member:"Thomas Petit",   amount:229, date:"2026-01-08", type:"Carte",       status:"payé",    subscription:"Trimestriel"       },
  { id:"p4",  member:"Léa Robert",     amount:89,  date:"2026-03-01", type:"Prélèvement", status:"payé",    subscription:"Mensuel illimité"  },
  { id:"p5",  member:"Julien Moreau",  amount:120, date:"2026-02-14", type:"Carte",       status:"impayé",  subscription:"Carnet 10 séances" },
  { id:"p6",  member:"Marie Lefebvre", amount:89,  date:"2026-03-01", type:"Prélèvement", status:"payé",    subscription:"Mensuel illimité"  },
  { id:"p7",  member:"Camille Roux",   amount:89,  date:"2026-03-01", type:"Prélèvement", status:"payé",    subscription:"Mensuel illimité"  },
  { id:"p8",  member:"Nicolas Simon",  amount:229, date:"2026-01-05", type:"Virement",    status:"payé",    subscription:"Trimestriel"       },
  { id:"p9",  member:"Inès Laurent",   amount:89,  date:"2026-03-01", type:"Prélèvement", status:"payé",    subscription:"Mensuel illimité"  },
  { id:"p10", member:"Paul Michel",    amount:89,  date:"2026-02-01", type:"Prélèvement", status:"impayé",  subscription:"Mensuel illimité"  },
  { id:"p11", member:"Lucas Bernard",  amount:120, date:"2026-02-20", type:"Espèces",     status:"payé",    subscription:"Carnet 10 séances" },
];
// ══════════════════════════════════════════════════════════════════════════════
const MEMBERS = MEMBERS_DEMO;
const DISCIPLINES = [
  { id:"demo-disc-yoga-vinyasa", name:"Yoga Vinyasa", icon:"🧘", color:"#C4956A", slots:[{day:"Lun",time:"09:00",duration:60},{day:"Mer",time:"09:00",duration:60},{day:"Sam",time:"10:00",duration:75}] },
  { id:"demo-disc-pilates",      name:"Pilates",      icon:"⚡", color:"#6B9E7A", slots:[{day:"Lun",time:"17:30",duration:60},{day:"Jeu",time:"12:00",duration:45}] },
  { id:"demo-disc-meditation",   name:"Méditation",   icon:"☯",  color:"#6A8FAE", slots:[{day:"Mar",time:"07:30",duration:30},{day:"Mer",time:"18:30",duration:45}] },
  { id:"demo-disc-yin-yoga",     name:"Yin Yoga",     icon:"🌙", color:"#AE7A7A", slots:[{day:"Jeu",time:"19:00",duration:75},{day:"Dim",time:"17:00",duration:75}] },
];
const SESSIONS_INIT = SESSIONS_DEMO;
const BOOKINGS_INIT = BOOKINGS_DEMO;
const SUBSCRIPTIONS_INIT = SUBSCRIPTIONS_DEMO;

// ── Plans Fydelys — modifier ici pour changer tarifs/limites ─────────────────
// NOTE : toutes les formules incluent 15 jours d'essai gratuit avant paiement.
// "Paiements adhérents" = module Stripe côté studio pour encaisser ses membres.
const FYDELYS_PLANS = [
  {
    id: "essentiel",
    name: "Essentiel",
    price: 9,            // ← tarif mensuel (après essai 15j)
    desc: "Pour démarrer",
    color: "#5D6D7E",
    limits: {
      members:      50,   // ← adhérents max
      coaches:       1,   // ← coachs max
      disciplines:   1,   // ← disciplines max
    },
    features: [
      { label: "1 discipline",                    ok: true  },
      { label: "1 coach",                         ok: true  },
      { label: "50 adhérents",                    ok: true  },
      { label: "Planning + présences",            ok: true  },
      { label: "Espace adhérent (magic link)",    ok: true  },
      { label: "Séances récurrentes",             ok: true  },
      { label: "Paiements adhérents (Stripe)",    ok: false },
      { label: "Invitation d'équipe",             ok: false },
      { label: "Rappel cours 1h avant",           ok: false },
      { label: "SMS notifications",               ok: false },
      { label: "Support prioritaire",             ok: false },
    ]
  },
  {
    id: "standard",
    name: "Standard",
    price: 29,           // ← tarif mensuel (après essai 15j)
    desc: "Pour les studios actifs",
    color: "#A06838",
    popular: true,
    limits: {
      members:      100,  // ← adhérents max
      coaches:       3,   // ← coachs max
      disciplines:   3,   // ← disciplines max
    },
    features: [
      { label: "3 disciplines",                   ok: true  },
      { label: "3 coachs",                        ok: true  },
      { label: "100 adhérents",                   ok: true  },
      { label: "Planning + présences",            ok: true  },
      { label: "Espace adhérent (magic link)",    ok: true  },
      { label: "Séances récurrentes",             ok: true  },
      { label: "Paiements adhérents (Stripe)",    ok: true  },
      { label: "Invitation d'équipe",             ok: true  },
      { label: "Rappel cours 1h avant",           ok: true  },
      { label: "50 SMS/mois inclus",              ok: true  },
      { label: "Support prioritaire",             ok: false },
    ]
  },
  {
    id: "pro",
    name: "Pro",
    price: 69,           // ← tarif mensuel (après essai 15j)
    desc: "Pour les grands studios",
    color: "#7B52A8",
    limits: {
      members:      null, // illimité
      coaches:      null, // illimité
      disciplines:  null, // illimité
    },
    features: [
      { label: "Disciplines illimitées",          ok: true  },
      { label: "Coachs illimités",                ok: true  },
      { label: "Adhérents illimités",             ok: true  },
      { label: "Planning + présences",            ok: true  },
      { label: "Espace adhérent (magic link)",    ok: true  },
      { label: "Séances récurrentes",             ok: true  },
      { label: "Paiements adhérents (Stripe)",    ok: true  },
      { label: "Invitation d'équipe",             ok: true  },
      { label: "Rappel cours 1h avant",           ok: true  },
      { label: "100 SMS/mois inclus",             ok: true  },
      { label: "Support prioritaire",             ok: true  },
    ]
  },
];
const PAYMENTS = PAYMENTS_DEMO;

// ── SVG ICON SYSTEM ───────────────────────────────────────────────────────────
const IC = ({d,size=16,color="currentColor",sw=1.5,fill="none"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p,i)=><path key={i} d={p}/>) : <path d={d}/>}
  </svg>
);
const ICG = ({children,size=16,color="currentColor",sw=1.5}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);

// Navigation icons
const IcoHome      = ({s,c}) => <ICG size={s} color={c}><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></ICG>;
const IcoCalendar  = ({s,c}) => <ICG size={s} color={c}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/></ICG>;
const IcoUsers     = ({s,c}) => <ICG size={s} color={c}><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/><path d="M16 3.13a4 4 0 010 7.75"/><path d="M21 21v-2a4 4 0 00-3-3.87"/></ICG>;
const IcoUser      = ({s,c}) => <ICG size={s} color={c}><circle cx="12" cy="8" r="4"/><path d="M4 20v-2a4 4 0 014-4h8a4 4 0 014 4v2"/></ICG>;
const IcoCreditCard= ({s,c}) => <ICG size={s} color={c}><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></ICG>;
const IcoTag       = ({s,c}) => <ICG size={s} color={c}><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></ICG>;
const IcoLayers    = ({s,c}) => <ICG size={s} color={c}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></ICG>;
const IcoSettings  = ({s,c}) => <ICG size={s} color={c}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></ICG>;

// KPI icons
const IcoTrend     = ({s,c}) => <ICG size={s} color={c}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></ICG>;
const IcoBarChart  = ({s,c}) => <ICG size={s} color={c}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></ICG>;
const IcoEuro      = ({s,c}) => <ICG size={s} color={c}><path d="M4 10h12M4 14h12M19 6a7 7 0 100 12"/></ICG>;

// Action icons
const IcoCheck     = ({s,c}) => <ICG size={s} color={c}><polyline points="20 6 9 17 4 12"/></ICG>;
const IcoX         = ({s,c}) => <ICG size={s} color={c}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></ICG>;
const IcoUndo      = ({s,c}) => <ICG size={s} color={c}><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></ICG>;
const IcoMail      = ({s,c}) => <ICG size={s} color={c}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></ICG>;
const IcoUserPlus  = ({s,c}) => <ICG size={s} color={c}><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="17" y1="11" x2="23" y2="11"/></ICG>;
const IcoChevron   = ({s,c,up}) => <ICG size={s} color={c}><polyline points={up?"18 15 12 9 6 15":"6 9 12 15 18 9"}/></ICG>;
const IcoAlert     = ({s,c}) => <ICG size={s} color={c}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></ICG>;

// Discipline icons (SVG custom)
const IcoYoga      = ({s,c}) => <ICG size={s} color={c}><circle cx="12" cy="4" r="2"/><path d="M12 6v4M8 10c0 0 1 4 4 4s4-4 4-4"/><path d="M6 14l2-2M18 14l-2-2"/><path d="M8 19l4-3 4 3"/></ICG>;
const IcoPilates   = ({s,c}) => <ICG size={s} color={c}><circle cx="12" cy="5" r="2"/><path d="M12 7v5l3 3"/><path d="M12 12l-3 3"/><path d="M9 21v-4a3 3 0 016 0v4"/></ICG>;
const IcoMeditation= ({s,c}) => <ICG size={s} color={c}><circle cx="12" cy="5" r="2"/><path d="M7 12c0-2.8 2.2-5 5-5s5 2.2 5 5"/><path d="M5 17c0 0 2-2 7-2s7 2 7 2"/><path d="M12 12v5"/></ICG>;
const IcoMoon      = ({s,c}) => <ICG size={s} color={c}><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></ICG>;

const DISC_ICONS = { 1: IcoYoga, 2: IcoPilates, 3: IcoMeditation, 4: IcoMoon };
const NAV_ICONS  = { dashboard: IcoHome, planning: IcoCalendar, members: IcoUsers, subscriptions: IcoTag, payments: IcoCreditCard, disciplines: IcoLayers, settings: IcoSettings, aide: IcoHelpCircle };

function useWidth() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return w;
}

const C = {
  bg:"#F4EFE8", bgDeep:"#EDE6DC", surface:"#FFFFFF", surfaceWarm:"#FBF8F4",
  border:"#DDD5C8", borderSoft:"#EAE4DA",
  accent:"#B07848", accentDark:"#8C5E38", accentBg:"#F5EBE0", accentLight:"#F9F1E8",
  text:"#2A1F14", textMid:"#5C4A38", textSoft:"#8C7B6C", textMuted:"#B0A090",
  ok:"#4E8A58", okBg:"#E6F2E8", warn:"#A85030", warnBg:"#F5EAE6", info:"#3A6E90", infoBg:"#E6EFF5",
};

const statusMap = {
  actif:[C.ok,C.okBg], suspendu:[C.warn,C.warnBg], nouveau:[C.info,C.infoBg],
  payé:[C.ok,C.okBg], impayé:[C.warn,C.warnBg],
};

function Tag({ s }) {
  const [color, bg] = statusMap[s] || [C.textMuted, C.bgDeep];
  return <span style={{ background:bg, color, padding:"4px 12px", borderRadius:20, fontSize:13, fontWeight:600, letterSpacing:0.3 }}>{s.charAt(0).toUpperCase()+s.slice(1)}</span>;
}

function Pill({ children, color=C.textSoft, bg=C.bgDeep }) {
  return <span style={{ background:bg, color, padding:"3px 10px", borderRadius:12, fontSize:13, fontWeight:500 }}>{children}</span>;
}

function Button({ children, onClick, variant="primary", sm, block }) {
  const base = { display:"inline-flex", alignItems:"center", justifyContent:"center", gap:6, padding:sm?"6px 14px":"10px 22px", borderRadius:8, cursor:"pointer", fontSize:sm?14:15, fontWeight:600, letterSpacing:0.3, whiteSpace:"nowrap", transition:"all 0.18s", width:block?"100%":undefined, border:"none" };
  const variants = {
    primary:   { ...base, background:C.accent,       color:"#fff",       boxShadow:"0 2px 8px rgba(176,120,72,.25)" },
    secondary: { ...base, background:C.surface,      color:C.text,       border:`1.5px solid ${C.border}` },
    ghost:     { ...base, background:"transparent",  color:C.textMid,    border:`1.5px solid ${C.border}` },
    danger:    { ...base, background:C.surface,      color:C.warn,       border:`1.5px solid #E0C8C0` },
    accent:    { ...base, background:C.accentBg,     color:C.accentDark, border:`1.5px solid #DFC0A0` },
  };
  return <button onClick={onClick} style={variants[variant]||variants.primary} onMouseEnter={e=>e.currentTarget.style.opacity=".85"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>{children}</button>;
}

function FieldLabel({ children }) {
  return <div style={{ fontSize:13, fontWeight:600, color:C.textSoft, letterSpacing:0.8, textTransform:"uppercase", marginBottom:6 }}>{children}</div>;
}

function Field({ label, value, onChange, type="text", placeholder, opts }) {
  const s = { width:"100%", padding:"10px 14px", border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:16, outline:"none", boxSizing:"border-box", color:C.text, background:C.surfaceWarm, transition:"border-color .15s" };
  return (
    <div>
      {label && <FieldLabel>{label}</FieldLabel>}
      {opts
        ? <select value={value} onChange={e=>onChange(e.target.value)} style={{...s,height:42}}>{opts.map(o=><option key={o.v??o} value={o.v??o}>{o.l??o}</option>)}</select>
        : <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={s} onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/>
      }
    </div>
  );
}

function Card({ children, style, noPad }) {
  return <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:noPad?0:18, overflow:noPad?"hidden":undefined, ...style }}>{children}</div>;
}

function SectionHead({ children, action }) {
  return (
    <div style={{ padding:"12px 16px", borderBottom:`1.5px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", background:C.surfaceWarm }}>
      <span style={{ fontSize:15, fontWeight:700, color:C.text, letterSpacing:0.2 }}>{children}</span>
      {action}
    </div>
  );
}

function DateLabel({ date }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
      <div style={{ width:20, height:2, background:C.accent, borderRadius:1 }}/>
      <span style={{ fontSize:13, fontWeight:700, color:C.accent, textTransform:"uppercase", letterSpacing:0.2 }}>
        {new Date(date).toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})}
      </span>
    </div>
  );
}

const NAV = [
  {key:"dashboard",     label:"Tableau de bord"},
  {key:"planning",      label:"Planning"},
  {key:"members",       label:"Adhérents"},
  {key:"subscriptions", label:"Abonnements"},
  {key:"payments",      label:"Paiements"},
  {key:"disciplines",   label:"Disciplines"},
  {key:"settings",      label:"Paramètres"},
  {key:"aide",          label:"Aide"},
];

function Sidebar({ active, onNav, studioName = "Mon studio", planName = "Essentiel", membersCount = 0, userName = "", userRole = "Admin" }) {
  return (
    <aside style={{ width:220, background:C.surface, borderRight:`1.5px solid ${C.border}`, minHeight:"100vh", display:"flex", flexDirection:"column", flexShrink:0 }}>
      <div style={{ padding:"24px 20px 18px" }}>
        <div style={{ fontSize:24, fontWeight:700, color:C.text, letterSpacing:-0.3, lineHeight:1 }}>Fyde<span style={{ color:C.accent }}>lys</span></div>
        <div style={{ fontSize:12, color:C.textMuted, letterSpacing:0.2, textTransform:"uppercase", marginTop:4 }}>Studio Manager</div>
      </div>
      <div style={{ margin:"0 12px 12px", padding:"10px 12px", background:C.accentLight, borderRadius:10, border:`1.5px solid ${C.border}`, display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:34, height:34, borderRadius:8, background:C.accentBg, border:`1.5px solid #DFC0A0`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><IcoYoga s={18} c={C.accent}/></div>
        <div>
          <div style={{ fontSize:15, fontWeight:700, color:C.text }}>{studioName || "Mon studio"}</div>
          <div style={{ fontSize:12, color:C.textSoft }}>{planName ? planName.charAt(0).toUpperCase()+planName.slice(1) : "Essentiel"} · {membersCount} membre{membersCount!==1?"s":""}</div>
        </div>
      </div>
      <nav style={{ flex:1 }}>
        {NAV.map(item => (
          <button key={item.key} onClick={()=>onNav(item.key)}
            style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"11px 20px", background:active===item.key?C.accentLight:"none", border:"none", cursor:"pointer", color:active===item.key?C.accent:C.textMid, fontSize:15, fontWeight:active===item.key?700:500, borderLeft:`3px solid ${active===item.key?C.accent:"transparent"}`, textAlign:"left", transition:"all .15s" }}
            onMouseEnter={e=>{if(active!==item.key){e.currentTarget.style.background=C.bg;e.currentTarget.style.color=C.text;}}}
            onMouseLeave={e=>{if(active!==item.key){e.currentTarget.style.background="none";e.currentTarget.style.color=C.textMid;}}}>
            {(() => { const Ico = NAV_ICONS[item.key]; return Ico ? <Ico s={18} c={active===item.key?C.accent:C.textMuted}/> : null; })()}
            {item.label}
          </button>
        ))}
      </nav>
      <div style={{ padding:"14px 20px", borderTop:`1.5px solid ${C.border}`, display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:32, height:32, borderRadius:"50%", background:C.accentBg, border:`1.5px solid #DFC0A0`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:C.accent, flexShrink:0 }}>
          {userName ? userName.split(" ").map(n=>n[0]).join("").toUpperCase().slice(0,2) : "?"}
        </div>
        <div>
          <div style={{ fontSize:14, fontWeight:600, color:C.text }}>{userName || "Utilisateur"}</div>
          <div style={{ fontSize:12, color:C.textMuted }}>{userRole === "admin" ? "Admin" : userRole === "coach" ? "Coach" : userRole === "adherent" ? "Adhérent" : "Admin"}</div>
        </div>
      </div>
    </aside>
  );
}

const MOBILE_NAV = [
  {key:"dashboard", label:"Accueil"},
  {key:"planning",  label:"Planning"},
  {key:"members",   label:"Membres"},
  {key:"payments",  label:"Paiements"},
  {key:"settings",  label:"Plus"},
];

function BottomNav({ active, onNav }) {
  return (
    <nav style={{ position:"fixed", bottom:0, left:0, right:0, background:C.surface, borderTop:`1px solid ${C.border}`, display:"flex", zIndex:200, height:62, boxShadow:"0 -2px 16px rgba(42,31,20,.07)" }}>
      {MOBILE_NAV.map(item => {
        const isA = active===item.key;
        return (
          <button key={item.key} onClick={()=>onNav(item.key)}
            style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:2, background:"none", border:"none", cursor:"pointer", color:isA?C.accent:C.textMuted, fontSize:12, fontWeight:isA?700:400, transition:"color .15s", padding:"6px 0 4px", position:"relative" }}>
            {isA && <div style={{ position:"absolute", top:0, left:"50%", transform:"translateX(-50%)", width:20, height:2, background:C.accent, borderRadius:"0 0 2px 2px" }}/>}
            {(() => { const Ico = NAV_ICONS[item.key]; return Ico ? <Ico s={22} c={isA?C.accent:C.textMuted}/> : null; })()}
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function IcoHelpCircle({s,c}) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
      <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="2"/>
    </svg>
  );
}

function IcoLogOut({s,c}) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  );
}

function TopBar({ title, isMobile, onSignOut, isSuperAdmin, studioName = "" }) {
  const [confirmLogout, setConfirmLogout] = useState(false);
  return (
    <>
      {confirmLogout && <ConfirmModal message="Voulez-vous vous déconnecter de Fydelys ?" onConfirm={()=>{ setConfirmLogout(false); onSignOut?.(); }} onCancel={()=>setConfirmLogout(false)}/>}
      <div style={{ background:C.surface, borderBottom:`1.5px solid ${C.border}`, padding:`0 ${isMobile?16:28}px`, height:isMobile?48:56, display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0, position:"sticky", top:0, zIndex:50 }}>
        <div style={{ fontSize:isMobile?18:20, fontWeight:700, color:C.text, letterSpacing:isMobile?-0.3:0 }}>
          {isMobile ? <>Fyde<span style={{ color:C.accent }}>lys</span></> : title}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {!isMobile && studioName && <Pill color={C.textSoft} bg={C.bg}>{studioName}</Pill>}
          {isSuperAdmin && (
            <a href="https://fydelys.fr/dashboard"
              style={{ fontSize:11, padding:"5px 12px", borderRadius:8, border:`1px solid ${C.border}`, background:C.bg, color:C.textSoft, textDecoration:"none", fontWeight:600, display:"flex", alignItems:"center", gap:5, whiteSpace:"nowrap" }}>
              ⬅ SuperAdmin
            </a>
          )}
          <div style={{ display:"flex", alignItems:"center", gap:7, padding:"4px 10px 4px 5px", background:C.bg, border:`1px solid ${C.border}`, borderRadius:20 }}>
            <div style={{ width:24, height:24, borderRadius:"50%", background:C.accentBg, border:`1px solid #DFC0A0`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color:C.accent, flexShrink:0 }}>{studioName?studioName.charAt(0).toUpperCase():"?"}</div>
            <span style={{ fontSize:13, fontWeight:600, color:C.text, whiteSpace:"nowrap" }}>{studioName || "Mon studio"}</span>
          </div>
          <button
            title="Se déconnecter"
            onClick={()=>setConfirmLogout(true)}
            style={{ display:"flex", alignItems:"center", justifyContent:"center", width:32, height:32, borderRadius:8, border:`1px solid ${C.border}`, background:C.bg, cursor:"pointer", flexShrink:0, transition:"all .15s" }}
            onMouseEnter={e=>{e.currentTarget.style.background=C.warnBg; e.currentTarget.style.borderColor="#EFC8BC";}}
            onMouseLeave={e=>{e.currentTarget.style.background=C.bg; e.currentTarget.style.borderColor=C.border;}}>
            <IcoLogOut s={15} c={C.warn}/>
          </button>
        </div>
      </div>
    </>
  );
}

function SessionRow({ sess, isMobile }) {
  const disc = DISCIPLINES.find(d=>d.id===sess.disciplineId)||DISCIPLINES[0];
  const pct = sess.booked/sess.spots;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:isMobile?8:14, padding:isMobile?"10px 14px":"14px 20px", borderBottom:`1px solid ${C.borderSoft}` }}>
      <div style={{ fontSize:isMobile?15:16, fontWeight:700, color:C.accent, width:isMobile?34:38, flexShrink:0, letterSpacing:-0.2 }}>{sess.time}</div>
      <div style={{ width:3, height:isMobile?30:36, background:disc.color, borderRadius:2, flexShrink:0 }}/>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:isMobile?15:16, fontWeight:700, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{disc.name}</div>
        <div style={{ fontSize:isMobile?15:16, color:C.textSoft, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{sess.teacher} · {sess.room}</div>
      </div>
      <div style={{ flexShrink:0, textAlign:"right" }}>
        <div style={{ fontSize:isMobile?14:15, fontWeight:700, color:pct>=1?C.warn:C.text }}>{sess.booked}/{sess.spots}</div>
        <div style={{ width:isMobile?44:54, height:3, background:C.bgDeep, borderRadius:2, marginTop:3 }}>
          <div style={{ height:"100%", width:`${Math.min(pct*100,100)}%`, background:pct>=1?C.warn:pct>.75?C.accent:C.ok, borderRadius:2 }}/>
        </div>
        {sess.waitlist>0 && <span style={{ fontSize:12, color:C.accent, fontWeight:600 }}>+{sess.waitlist}</span>}
      </div>
    </div>
  );
}

function MemberRow({ m, onSelect, selected }) {
  return (
    <div onClick={()=>onSelect(m)}
      style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 16px", borderBottom:`1px solid ${C.borderSoft}`, cursor:"pointer", background:selected?C.accentLight:"transparent", transition:"background .15s" }}
      onMouseEnter={e=>{if(!selected)e.currentTarget.style.background=C.bg;}}
      onMouseLeave={e=>{if(!selected)e.currentTarget.style.background="transparent";}}>
      <div style={{ width:38, height:38, borderRadius:"50%", background:C.accentBg, border:`1.5px solid #DFC0A0`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700, color:C.accent, flexShrink:0 }}>{m.avatar}</div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:16, fontWeight:700, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{m.firstName} {m.lastName}</div>
        <div style={{ fontSize:14, color:C.textSoft, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{m.subscription}</div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:5, flexShrink:0 }}>
        <Tag s={m.status}/>
        {m.credits>0 && <Pill color={C.info} bg={C.infoBg}>{m.credits} crédits</Pill>}
      </div>
    </div>
  );
}

function KpiCard({ icon, label, value, delta, accentColor, isMobile }) {
  if (isMobile) return (
    <Card style={{ padding:"12px 14px" }}>
      {/* Icône + delta sur la même ligne */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
        <div style={{ width:30, height:30, borderRadius:8, background:C.bg, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{icon}</div>
        {delta && <span style={{ fontSize:11, color:accentColor||C.ok, fontWeight:700, background:C.bg, padding:"2px 7px", borderRadius:10 }}>↑ {delta}</span>}
      </div>
      {/* Valeur */}
      <div style={{ fontSize:22, fontWeight:800, color:C.text, lineHeight:1, marginBottom:3 }}>{value}</div>
      {/* Label */}
      <div style={{ fontSize:12, color:C.textSoft, fontWeight:500, lineHeight:1.3 }}>{label}</div>
    </Card>
  );
  return (
    <Card style={{ padding:"18px 20px" }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:10 }}>
        <div style={{ width:40, height:40, borderRadius:10, background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, border:`1.5px solid ${C.border}` }}>{icon}</div>
        {delta && <span style={{ fontSize:12, color:accentColor||C.ok, fontWeight:700, background:C.bg, padding:"2px 8px", borderRadius:10 }}>↑ {delta}</span>}
      </div>
      <div style={{ fontSize:28, fontWeight:800, color:C.text, lineHeight:1, marginBottom:4 }}>{value}</div>
      <div style={{ fontSize:13, color:C.textSoft, fontWeight:500 }}>{label}</div>
    </Card>
  );
}




// ── EMPTY STATE générique ────────────────────────────────────────────────────
function EmptyState({ icon="📋", title, sub }) {
  return (
    <div style={{ padding:"48px 24px", textAlign:"center" }}>
      <div style={{ fontSize:36, marginBottom:12 }}>{icon}</div>
      <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:6 }}>{title}</div>
      {sub && <div style={{ fontSize:13, color:C.textSoft, lineHeight:1.6, maxWidth:320, margin:"0 auto" }}>{sub}</div>}
    </div>
  );
}

function DemoBanner() {
  const [hidden, setHidden] = React.useState(false);
  if (hidden) return null;
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, padding:"8px 16px", background:"#FEF3C7", borderBottom:"1.5px solid #F59E0B", fontSize:13, color:"#92400E" }}>
      <span>⚠️ <strong>Données de démonstration</strong> — Ces données illustrent l'interface. Elles seront automatiquement remplacées par vos vraies données dès votre premier enregistrement.</span>
      <button onClick={()=>setHidden(true)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:16, color:"#92400E", flexShrink:0 }}>✕</button>
    </div>
  );
}

function Dashboard({ isMobile }) {
  const p = isMobile?12:28;
  const { studioId, discs } = useContext(AppCtx);
  const [expandedId, setExpandedId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [bookings, setBookings] = useState({});
  const [members, setMembers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleToggle = (id) => setExpandedId(prev => prev===id ? null : id);
  const handleChangeStatus = (bid, sid, ns) => {
    setBookings(prev => { const nb={...prev}; nb[sid]=(nb[sid]||[]).map(b=>b.id===bid?{...b,st:ns}:b); return nb; });
  };

  useEffect(() => {
    if (!studioId) return;
    const sb = createClient();
    const today = new Date().toISOString().slice(0,10);
    const monthStart = today.slice(0,7);

    Promise.all([
      sb.from("sessions").select("id,discipline_id,teacher,room,duration_min,spots,session_date,session_time,status").eq("studio_id", studioId),
      sb.from("profiles").select("id,status").eq("studio_id", studioId).eq("role","member"),
      sb.from("member_payments").select("id,amount,status,payment_date").eq("studio_id", studioId),
    ]).then(([sessRes, membRes, payRes]) => {
      const sessData = sessRes.data || [];
      const membData = membRes.data || [];
      const payData  = payRes.data  || [];

      if (sessData.length === 0 && membData.length === 0) {
        // Données démo
        setSessions(SESSIONS_INIT);
        setBookings(JSON.parse(JSON.stringify(BOOKINGS_INIT)));
        setMembers(MEMBERS);
        setPayments(PAYMENTS);
        setIsDemo(true);
      } else {
        setSessions(sessData.map(s=>({
          id: s.id, disciplineId: s.discipline_id,
          teacher: s.teacher||"", room: s.room||"Studio A",
          duration: s.duration_min||60, spots: s.spots||12,
          date: s.session_date, time: s.session_time?.slice(0,5)||"09:00",
          status: s.status||"scheduled", booked:0, waitlist:0,
        })));
        setMembers(membData);
        setPayments(payData.map(p=>({...p, date:p.payment_date, status:p.status})));
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
  const activeMembers = members.filter(m=>m.status==="active"||m.status==="actif").length;
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
          <KpiCard icon={<IcoUsers s={isMobile?16:18} c={C.ok}/>}      label="Adhérents actifs" value={activeMembers>0?String(activeMembers):"—"}  delta={null} accentColor={C.ok}     isMobile={isMobile}/>
          <KpiCard icon={<IcoCalendar s={isMobile?16:18} c="#6B9E7A"/>} label="Séances ce mois"  value={monthSessions>0?String(monthSessions):"—"}   delta={null} accentColor="#6B9E7A"  isMobile={isMobile}/>
          <KpiCard icon={<IcoBarChart s={isMobile?16:18} c="#6A8FAE"/>} label="Taux remplissage" value={totalCap>0?fillRate+" %":"—"}                 delta={null} accentColor="#6A8FAE"  isMobile={isMobile}/>
          <KpiCard icon={<IcoEuro s={isMobile?16:18} c={C.accent}/>}   label="CA du mois"        value={monthRevenue>0?monthRevenue.toLocaleString("fr-FR")+" €":"—"} delta={null} accentColor={C.accent} isMobile={isMobile}/>
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
              <SectionHead><span style={{display:"flex",alignItems:"center",gap:6}}><IcoAlert s={15} c={C.warn}/>Alertes</span></SectionHead>
              {loading
                ? <EmptyCard label="Chargement…"/>
                : alerts.length === 0
                  ? <EmptyCard label="Aucune alerte pour le moment"/>
                  : alerts.map(a=>(
                    <div key={a.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 16px", borderBottom:`1.5px solid ${C.borderSoft}` }}>
                      <span style={{ fontSize:15, color:C.textMid }}>{a.label}</span>
                      <span style={{ fontSize:15, fontWeight:700, color:a.c, background:a.bg, padding:"3px 12px", borderRadius:12 }}>{a.value}</span>
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
function creditColor(credits, total) {
  if (credits === null) return { color:"#5C8A6A", bg:"#E8F5EE" }; // vert doux illimité
  const pct = credits / total;
  if (pct <= 0.15) return { color:"#C0392B", bg:"#FDECEA" }; // rouge critique
  if (pct <= 0.35) return { color:"#D46A1A", bg:"#FDF0E6" }; // orange bas
  if (pct <= 0.6)  return { color:"#B07848", bg:"#F5EBE0" }; // terracotta moyen
  return { color:"#3A7A50", bg:"#E4F4EC" };                   // vert bon
}

function CreditBadge({ credits, total, sub }) {
  if (credits === null) {
    return (
      <div style={{ display:"flex", alignItems:"center", gap:5 }}>
        <span style={{ fontSize:13, color:"#5C8A6A", fontWeight:700, background:"#E8F5EE", padding:"3px 9px", borderRadius:10, whiteSpace:"nowrap" }}>∞ illimité</span>
        <span style={{ fontSize:13, color:C.textMuted, whiteSpace:"nowrap" }}>{sub}</span>
      </div>
    );
  }
  const { color, bg } = creditColor(credits, total);
  const pct = credits / total;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
      <div style={{ width:40, height:3, background:"#EAE4DA", borderRadius:2, overflow:"hidden", flexShrink:0 }}>
        <div style={{ height:"100%", width:`${pct*100}%`, background:color, borderRadius:2 }}/>
      </div>
      <span style={{ fontSize:14, fontWeight:800, color, background:bg, padding:"2px 8px", borderRadius:10, whiteSpace:"nowrap" }}>
        {credits}/{total}
      </span>
      <span style={{ fontSize:13, color:C.textMuted, whiteSpace:"nowrap" }}>{sub}</span>
    </div>
  );
}

// ── PLANNING ACCORDION ────────────────────────────────────────────────────────

function stLbl(s) { return s==="confirmed"?"Confirmé":s==="waitlist"?"En attente":"Annulé"; }
function stStyle(s) {
  if (s==="confirmed") return { color:C.ok,    background:C.okBg    };
  if (s==="waitlist")  return { color:C.accent, background:C.accentBg };
  return { color:C.warn, background:C.warnBg };
}

function PlanningAccordion({ sessId, bookings, onChangeStatus, onAddBooking, onSendReminder }) {
  const bl   = bookings[sessId] || [];
  const conf = bl.filter(b=>b.st==="confirmed");
  const wait = bl.filter(b=>b.st==="waitlist");
  const canc = bl.filter(b=>b.st==="cancelled");

  if (!bl.length) return (
    <div style={{ padding:"20px", textAlign:"center", color:C.textMuted, fontSize:15, borderTop:`1px solid ${C.borderSoft}`, background:"#FDFAF7" }}>
      Aucune réservation pour cette séance
    </div>
  );

  return (
    <div style={{ borderTop:`1px solid ${C.borderSoft}`, background:"#FDFAF7" }}>
      <div style={{ display:"flex", gap:5, padding:"8px 13px 0", flexWrap:"wrap" }}>
        <span style={{ fontSize:12, fontWeight:700, padding:"2px 9px", borderRadius:20, color:C.ok, background:C.okBg }}>{conf.length} confirmé{conf.length>1?"s":""}</span>
        {wait.length>0 && <span style={{ fontSize:12, fontWeight:700, padding:"2px 9px", borderRadius:20, color:C.accent, background:C.accentBg }}>{wait.length} en attente</span>}
        {canc.length>0 && <span style={{ fontSize:12, fontWeight:700, padding:"2px 9px", borderRadius:20, color:C.warn, background:C.warnBg }}>{canc.length} annulé{canc.length>1?"s":""}</span>}
      </div>
      {bl.map(b => (
        <div key={b.id}
          style={{ padding:"10px 13px", borderBottom:`1px solid ${C.borderSoft}`, opacity:b.st==="cancelled"?.45:1, transition:"background .1s" }}
          onMouseEnter={e=>e.currentTarget.style.background="#F5F0EA"}
          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:6 }}>
            <div style={{ width:30, height:30, borderRadius:"50%", background:C.accentBg, border:`1px solid #DFC0A0`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:C.accent, flexShrink:0 }}>{b.fn[0]}{b.ln[0]}</div>
            <div style={{ fontSize:15, fontWeight:700, color:C.text, flex:1 }}>{b.fn} {b.ln}</div>
            <CreditBadge credits={b.credits} total={b.total} sub={b.sub}/>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8, paddingLeft:39 }}>
            <span style={{ padding:"3px 10px", borderRadius:20, fontSize:13, fontWeight:600, whiteSpace:"nowrap", flexShrink:0, ...stStyle(b.st) }}>{stLbl(b.st)}</span>
            <span style={{ fontSize:13, color:C.textSoft, flex:1 }}>{b.phone}</span>
            <div style={{ flexShrink:0 }}>
              {b.st==="waitlist"  && <button onClick={()=>onChangeStatus(b.id,sessId,"confirmed")} style={{ display:"flex",alignItems:"center",gap:5, fontSize:12, padding:"4px 12px", borderRadius:7, fontWeight:600, border:`1px solid #B8DFC4`, color:C.ok,   background:C.okBg,   cursor:"pointer", whiteSpace:"nowrap" }}><IcoCheck s={13} c={C.ok}/>Confirmer</button>}
              {b.st==="confirmed" && <button onClick={()=>onChangeStatus(b.id,sessId,"cancelled")} style={{ display:"flex",alignItems:"center",gap:5, fontSize:12, padding:"4px 12px", borderRadius:7, fontWeight:600, border:`1px solid #EFC8BC`, color:C.warn, background:C.warnBg, cursor:"pointer", whiteSpace:"nowrap" }}><IcoX s={13} c={C.warn}/>Annuler</button>}
              {b.st==="cancelled" && <button onClick={()=>onChangeStatus(b.id,sessId,"confirmed")} style={{ display:"flex",alignItems:"center",gap:5, fontSize:12, padding:"4px 12px", borderRadius:7, fontWeight:600, border:`1px solid #B8CED8`, color:C.info, background:C.infoBg, cursor:"pointer", whiteSpace:"nowrap" }}><IcoUndo s={13} c={C.info}/>Remettre</button>}
            </div>
          </div>
        </div>
      ))}
      <div style={{ padding:"8px 13px", display:"flex", gap:7, flexWrap:"wrap" }}>
        <button onClick={()=>onAddBooking&&onAddBooking(sessId)} style={{ display:"flex",alignItems:"center",gap:6, fontSize:12, padding:"5px 12px", borderRadius:8, fontWeight:600, border:`1px solid #DFC0A0`, color:C.accentDark, background:C.accentBg, cursor:"pointer" }}><IcoUserPlus s={14} c={C.accentDark}/>Inscrire un adhérent</button>
        <button onClick={()=>onSendReminder&&onSendReminder(sessId)} style={{ display:"flex",alignItems:"center",gap:6, fontSize:12, padding:"5px 12px", borderRadius:8, fontWeight:600, border:`1px solid ${C.border}`, color:C.textSoft, background:C.surfaceWarm, cursor:"pointer" }}><IcoMail s={14} c={C.textSoft}/>Envoyer rappel</button>
      </div>
    </div>
  );
}

function PlanningSessionCard({ sess, expandedId, bookings, discs, onToggle, onChangeStatus, onDelete, onCancel }) {
  const allDiscs = discs?.length ? discs : DISCIPLINES;
  const disc = allDiscs.find(d=>String(d.id)===String(sess.disciplineId)) || allDiscs[0] || { name:"Cours", color:C.accent, icon:"🧘" };
  const bl     = bookings[sess.id]||[];
  const booked = bl.length ? bl.filter(b=>b.st==="confirmed").length : sess.booked;
  const wait   = bl.length ? bl.filter(b=>b.st==="waitlist").length  : sess.waitlist;
  const pct    = booked/sess.spots;
  const isExp  = expandedId===sess.id;

  return (
    <div style={{ border:`1px solid ${isExp?C.accent:C.border}`, borderRadius:12, overflow:"hidden", marginBottom:8, boxShadow:isExp?`0 0 0 3px rgba(176,120,72,.1)`:"none", transition:"all .2s" }}>
      <div
        onClick={()=>onToggle(sess.id)}
        style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 13px", cursor:"pointer", background:isExp?C.accentBg:C.surface, transition:"background .15s" }}
        onMouseEnter={e=>{ if(!isExp) e.currentTarget.style.background=C.surfaceWarm; }}
        onMouseLeave={e=>{ if(!isExp) e.currentTarget.style.background=C.surface; }}>
        <div style={{ width:3, height:32, borderRadius:2, background:disc.color, flexShrink:0 }}/>
        <div style={{ fontSize:13, fontWeight:700, color:C.accent, width:36, flexShrink:0 }}>{sess.time}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:15, fontWeight:700, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{disc.name}</div>
          <div style={{ fontSize:13, color:C.textSoft, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{sess.teacher} · {sess.room} · {sess.duration}min</div>
        </div>
        <div style={{ flexShrink:0, textAlign:"right", marginRight:4 }}>
          <div style={{ fontSize:14, fontWeight:700, color:pct>=1?C.warn:C.text }}>{booked}/{sess.spots}</div>
          <div style={{ width:44, height:3, background:C.bgDeep, borderRadius:2, marginTop:3 }}>
            <div style={{ height:"100%", width:`${Math.min(pct*100,100)}%`, background:pct>=1?C.warn:pct>.75?C.accent:C.ok, borderRadius:2 }}/>
          </div>
          {wait>0 && <div style={{ fontSize:11, color:C.accent, fontWeight:700, marginTop:1 }}>+{wait} att.</div>}
        </div>
        <span style={{ flexShrink:0, display:"inline-flex", transition:"transform .2s", transform:isExp?"rotate(180deg)":"none" }}><IcoChevron s={16} c={C.textMuted}/></span>
        {/* Actions rapides — visibles au hover ou si expanded */}
        {isExp && (
          <div onClick={e=>e.stopPropagation()} style={{ display:"flex", gap:4, flexShrink:0 }}>
            {sess.status !== "cancelled" && onCancel && (
              <button onClick={()=>onCancel(sess.id)}
                style={{ fontSize:11, padding:"3px 8px", borderRadius:6, border:`1px solid ${C.border}`, background:C.surface, color:C.textMuted, cursor:"pointer", fontWeight:600 }}>
                Annuler
              </button>
            )}
            {onDelete && (
              <button onClick={()=>{ if(window.confirm("Supprimer cette séance définitivement ?")) onDelete(sess.id); }}
                style={{ fontSize:11, padding:"3px 8px", borderRadius:6, border:`1px solid #EFC8BC`, background:"#FFF5F5", color:C.warn, cursor:"pointer", fontWeight:600 }}>
                ✕
              </button>
            )}
          </div>
        )}
      </div>
      {sess.status === "cancelled" && (
        <div style={{ background:"#FFF5F5", padding:"4px 14px", fontSize:12, color:C.warn, fontWeight:600 }}>⚠ Séance annulée</div>
      )}
      {isExp && <PlanningAccordion sessId={sess.id} bookings={bookings} onChangeStatus={onChangeStatus}/>}
    </div>
  );
}

// ── DASHBOARD SESSION CARD (réutilise PlanningAccordion) ─────────────────────
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
function Planning({ isMobile }) {
  const { discs, studioId } = useContext(AppCtx);
  const [sessions, setSessions] = useState([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [bookings, setBookings] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const [fd, setFd] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [nS, setNS] = useState({ disciplineId:null, teacher:"", date:"", time:"09:00", duration:60, spots:12, level:"Tous niveaux", room:"Studio A" });
  const [coachesList, setCoachesList] = useState([]);
  // Mode récurrence
  const [recMode, setRecMode] = useState(false); // false = séance unique, true = récurrence
  const [recFrom, setRecFrom] = useState("");
  const [recTo, setRecTo]     = useState("");
  const [recSlots, setRecSlots] = useState([]); // créneaux sélectionnés [{day,time,duration,disciplineId}]
  const [recPreview, setRecPreview] = useState([]); // dates générées prévisualisées
  const [recFilterDisc, setRecFilterDisc] = useState(null); // filtre discipline étape 1
  const [isDemoData, setIsDemoData] = useState(false);
  const p = isMobile?12:28;

  // Utilitaire : convertir "Lun/Mar/…" → numéro JS getDay()
  const DAY_NUM = { Lun:1, Mar:2, Mer:3, Jeu:4, Ven:5, Sam:6, Dim:0 };

  // Charger la liste des coachs (utilise studioId du context)
  useEffect(() => {
    if (!studioId) return;
    createClient().from("profiles")
      .select("id, first_name, last_name")
      .eq("studio_id", studioId)
      .in("role", ["coach", "admin"])
      .then(({ data: coaches }) => {
        if (coaches) setCoachesList(coaches.map(c => ({ id: c.id, name: `${c.first_name || ""} ${c.last_name || ""}`.trim() })));
      });
  }, []);

  // Charger les sessions dès que studioId est disponible dans le context
  useEffect(() => {
    if (!studioId) return;
    setDbLoading(true);
    createClient().from("sessions")
      .select("id, discipline_id, teacher, room, level, session_date, session_time, duration_min, spots, status")
      .eq("studio_id", studioId).order("session_date").order("session_time")
      .then(({ data, error }) => {
        if (error) console.error("load sessions", error);
        else if (data && data.length > 0) setSessions(data.map(s => ({
          id: s.id, disciplineId: s.discipline_id,
          teacher: s.teacher || "", room: s.room || "Studio A", level: s.level || "Tous niveaux",
          date: s.session_date, time: s.session_time?.slice(0,5) || "09:00",
          duration: s.duration_min || 60, spots: s.spots || 12,
          status: s.status || "scheduled", booked: 0, waitlist: 0,
        })));
        // Données démo si base vide
        else if (!error && (!data || data.length === 0)) { setSessions(SESSIONS_DEMO); setIsDemoData(true); }
        setDbLoading(false);
      });
  }, [studioId]);

  // Recalcule le preview quand les paramètres récurrence changent
  useEffect(() => {
    if (!recMode || !recFrom || !recTo || recSlots.length === 0) { setRecPreview([]); return; }
    const from = new Date(recFrom); from.setHours(0,0,0,0);
    const to   = new Date(recTo);   to.setHours(23,59,59,0);
    if (from > to) { setRecPreview([]); return; }
    const generated = [];
    recSlots.forEach(slot => {
      const targetDay = DAY_NUM[slot.day];
      const cur = new Date(from);
      // Avancer jusqu'au bon jour de la semaine
      while (cur.getDay() !== targetDay) cur.setDate(cur.getDate() + 1);
      while (cur <= to) {
        generated.push({
          id: Date.now() + Math.random(),
          disciplineId: slot.disciplineId,
          teacher: slot.teacher || nS.teacher || "",
          date: cur.toISOString().slice(0,10),
          time: slot.time,
          duration: slot.duration || 60,
          spots: nS.spots || 12,
          level: nS.level || "Tous niveaux",
          room: nS.room || "Studio A",
          booked: 0, waitlist: 0,
        });
        cur.setDate(cur.getDate() + 7); // semaine suivante
      }
    });
    generated.sort((a,b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
    setRecPreview(generated);
  }, [recMode, recFrom, recTo, recSlots, nS.teacher, nS.spots, nS.level, nS.room]);

  const filtered = fd ? sessions.filter(s=>s.disciplineId===fd) : sessions;

  const dates = [...new Set(filtered.map(s=>s.date))].sort();

  const addSession = async () => {
    if (!nS.date || !studioId) return;
    const sess = { ...nS, disciplineId: nS.disciplineId || null };
    const tempId = `tmp-${Date.now()}`;
    setSessions(prev => [...prev, { id:tempId, ...sess, booked:0, waitlist:0 }]);
    setShowAdd(false);
    setNS({ disciplineId:null, teacher:"", date:"", time:"09:00", duration:60, spots:12, level:"Tous niveaux", room:"Studio A" });
    try {
      const sb = createClient();
      console.log("INSERT session — studioId:", studioId, "disciplineId:", sess.disciplineId, "date:", sess.date);
      const { data, error } = await sb.from("sessions").insert({
        studio_id: studioId, discipline_id: sess.disciplineId || null,
        teacher: sess.teacher || "", room: sess.room || "Studio A", level: sess.level || "Tous niveaux",
        session_date: sess.date, session_time: sess.time,
        duration_min: parseInt(sess.duration) || 60, spots: parseInt(sess.spots) || 12,
        status: "scheduled",
      }).select("id").single();
      if (error) {
        console.error("insert session ERROR — code:", error.code, "msg:", error.message, "hint:", error.hint);
        setSessions(prev=>prev.filter(s=>s.id!==tempId));
        alert("❌ Erreur Supabase:\n" + error.message + "\nCode: " + error.code + (error.hint ? "\nHint: " + error.hint : ""));
      } else if (data?.id) {
        if (isDemoData) {
          setSessions([{ id:data.id, ...sess, booked:0, waitlist:0 }]);
          setIsDemoData(false);
        } else {
          setSessions(prev => prev.map(s => s.id===tempId ? {...s, id:data.id} : s));
        }
      }
    } catch(e) { console.error("insert session", e); setSessions(prev=>prev.filter(s=>s.id!==tempId)); }
  };

  const deleteSession = async (id) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    if (!studioId) return;
    try { await createClient().from("sessions").delete().eq("id", id); }
    catch(e) { console.error("delete session", e); }
  };

  const cancelSession = async (id) => {
    setSessions(prev => prev.map(s => s.id===id ? {...s, status:"cancelled"} : s));
    if (!studioId) return;
    try { await createClient().from("sessions").update({ status:"cancelled" }).eq("id", id); }
    catch(e) { console.error("cancel session", e); }
  };

  const addRecurringSessions = async () => {
    if (recPreview.length === 0 || !studioId) return;
    setSessions(prev => [...prev, ...recPreview]);
    setShowAdd(false); setRecMode(false);
    setRecFrom(""); setRecTo(""); setRecSlots([]); setRecPreview([]);
    try {
      const rows = recPreview.map(s => ({
        studio_id: studioId, discipline_id: s.disciplineId || null,
        teacher: s.teacher || "", room: s.room || "Studio A", level: s.level || "Tous niveaux",
        session_date: s.date, session_time: s.time,
        duration_min: parseInt(s.duration) || 60, spots: parseInt(s.spots) || 12,
        status: "scheduled",
      }));
      const { error } = await createClient().from("sessions").insert(rows);
      if (error) console.error("insert recurring", error);
      else if (isDemoData) {
        // Remplacer les démos par les vraies données récurrentes
        setSessions(recPreview);
        setIsDemoData(false);
      }
    } catch(e) { console.error("insert recurring", e); }
  };

  const handleToggle = (id) => setExpandedId(prev => prev===id ? null : id);

  const handleChangeStatus = (bid, sid, ns) => {
    setBookings(prev => {
      const nb = { ...prev };
      nb[sid] = (nb[sid]||[]).map(b => b.id===bid ? { ...b, st:ns } : b);
      return nb;
    });
  };

  const handleAddBooking = (sessId) => {
    const name = prompt("Nom de l'adhérent à inscrire :");
    if (!name) return;
    const [fn, ...rest] = name.trim().split(" ");
    const ln = rest.join(" ") || "—";
    setBookings(prev => {
      const nb = { ...prev };
      nb[sessId] = [...(nb[sessId]||[]), { id:Date.now(), fn, ln, st:"confirmed", phone:"", credits:0, total:10, sub:"Mensuel illimité" }];
      return nb;
    });
  };

  const handleSendReminder = (sessId) => {
    const sess = sessions.find(s=>s.id===sessId);
    const count = (bookings[sessId]||[]).filter(b=>b.st==="confirmed").length;
    alert(`✉ Rappel envoyé à ${count} adhérent${count>1?"s":""} pour la séance ${sess?.time||""}`);
  };

  return (
    <div>
      {isDemoData && <DemoBanner/>}
      <div style={{ padding:p }}>
      <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:4, marginBottom:18, alignItems:"center", WebkitOverflowScrolling:"touch" }}>
        <Button sm variant={fd===null?"primary":"ghost"} onClick={()=>setFd(null)}>Toutes</Button>
        {(discs||DISCIPLINES).map(d=>{ const Ico=DISC_ICONS[d.id]; return <Button key={d.id} sm variant={fd===d.id?"primary":"ghost"} onClick={()=>setFd(d.id)}><span style={{display:"flex",alignItems:"center",gap:5}}>{Ico&&<Ico s={13} c={fd===d.id?C.surface:d.color}/>}{d.name}</span></Button>; })}
        <div style={{ marginLeft:"auto", flexShrink:0 }}><Button sm variant="primary" onClick={()=>setShowAdd(!showAdd)}>＋ Séance</Button></div>
      </div>

      {showAdd && (
        <Card style={{ marginBottom:18, borderTop:`3px solid ${C.accent}` }}>
          {/* Toggle séance unique / récurrence */}
          <div style={{ display:"flex", gap:6, marginBottom:18 }}>
            <button onClick={()=>setRecMode(false)}
              style={{ flex:1, padding:"8px", borderRadius:8, border:`1.5px solid ${recMode?C.border:C.accent}`, background:recMode?"none":C.accentLight, color:recMode?C.textMuted:C.accent, fontSize:13, fontWeight:recMode?400:700, cursor:"pointer" }}>
              📅 Séance unique
            </button>
            <button onClick={()=>setRecMode(true)}
              style={{ flex:1, padding:"8px", borderRadius:8, border:`1.5px solid ${recMode?C.accent:C.border}`, background:recMode?C.accentLight:"none", color:recMode?C.accent:C.textMuted, fontSize:13, fontWeight:recMode?700:400, cursor:"pointer" }}>
              🔁 Récurrence
            </button>
          </div>

          {/* ── MODE SÉANCE UNIQUE ── */}
          {!recMode && (
            <>
              <div style={{ fontSize:13, fontWeight:700, color:C.accent, textTransform:"uppercase", letterSpacing:.5, marginBottom:14 }}>Créer une séance</div>
              <div style={{ display:"grid", gridTemplateColumns:`repeat(${isMobile?2:4},1fr)`, gap:14 }}>
                <Field label="Discipline" value={nS.disciplineId} onChange={v=>{
                  const disc = DISCIPLINES.find(d=>d.id===parseInt(v));
                  const slot = disc?.slots?.[0];
                  setNS({...nS, disciplineId:v, ...(slot?{time:slot.time, duration:slot.duration||60}:{})});
                }} opts={(discs||DISCIPLINES).map(d=>({v:d.id,l:d.name}))}/>
                <div>
                  <label style={{fontSize:11,fontWeight:700,color:C.textMuted,textTransform:"uppercase",letterSpacing:.8,display:"block",marginBottom:5}}>Professeur</label>
                  <select value={nS.teacher} onChange={e=>setNS({...nS,teacher:e.target.value})}
                    style={{width:"100%",padding:"9px 12px",border:`1.5px solid ${C.border}`,borderRadius:8,fontSize:14,color:C.text,background:C.surface,outline:"none",boxSizing:"border-box"}}>
                    <option value="">— Choisir un coach —</option>
                    {coachesList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    {coachesList.length === 0 && <option disabled>Aucun coach configuré</option>}
                  </select>
                </div>
                <DatePicker label="Date" value={nS.date} onChange={v=>setNS({...nS,date:v})}/>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:C.textMuted,textTransform:"uppercase",letterSpacing:.8,marginBottom:5}}>Heure</div>
                  <TimePicker value={nS.time} onChange={v=>setNS({...nS,time:v})}/>
                </div>
                <Field label="Durée (min)" type="number" value={nS.duration} onChange={v=>setNS({...nS,duration:v})}/>
                <Field label="Places" type="number" value={nS.spots} onChange={v=>setNS({...nS,spots:v})}/>
                <Field label="Niveau" value={nS.level} onChange={v=>setNS({...nS,level:v})} opts={["Tous niveaux","Débutant","Intermédiaire","Avancé"]}/>
                <Field label="Salle" value={nS.room} onChange={v=>setNS({...nS,room:v})} placeholder="Studio A"/>
              </div>
              <div style={{ marginTop:16, display:"flex", gap:10 }}>
                <Button variant="primary" onClick={addSession}>Créer la séance</Button>
                <Button variant="ghost" onClick={()=>setShowAdd(false)}>Annuler</Button>
              </div>
            </>
          )}

          {/* ── MODE RÉCURRENCE ── */}
          {recMode && (() => {
            // Utiliser les discs du context (modifiés dans DisciplinesPage)
            const allSlotsRaw = (discs||[]).flatMap(d =>
              (d.slots||[]).map((s,i) => ({ key:`${d.id}-${i}`, disciplineId:d.id, discName:d.name, discColor:d.color||C.accent, discIcon:d.icon||"🏃", day:s.day, time:s.time, duration:s.duration||60, teacher:"" }))
            );
            // Filtre par discipline
            const allSlots = recFilterDisc ? allSlotsRaw.filter(s=>s.disciplineId===recFilterDisc) : allSlotsRaw;
            const isSelected = (k) => recSlots.some(s=>s.key===k);
            const dayLabel = (d) => ({Lun:"Lundi",Mar:"Mardi",Mer:"Mercredi",Jeu:"Jeudi",Ven:"Vendredi",Sam:"Samedi",Dim:"Dimanche"}[d]||d);

            // Sélectionner/désélectionner un créneau
            const toggleSlot = (slot) => {
              setRecSlots(prev => isSelected(slot.key)
                ? prev.filter(s=>s.key!==slot.key)
                : [...prev, {...slot, teacher: nS.teacher}]
              );
            };

            // Changer le coach d'un créneau sélectionné
            const updateSlotCoach = (key, teacher) => {
              setRecSlots(prev => prev.map(s => s.key===key ? {...s, teacher} : s));
            };

            // Supprimer une séance précise dans le preview
            const removePreviewItem = (previewId) => {
              setRecPreview(prev => prev.filter(s => s.id !== previewId));
            };

            // Changer le coach d'une séance précise dans le preview
            const updatePreviewCoach = (previewId, teacher) => {
              setRecPreview(prev => prev.map(s => s.id===previewId ? {...s, teacher} : s));
            };

            return (
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:C.accent, textTransform:"uppercase", letterSpacing:.5, marginBottom:14 }}>Générer des séances récurrentes</div>

                {/* ── ÉTAPE 1 : Créneaux ── */}
                <div style={{ marginBottom:4 }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:.8 }}>
                      1 · Créneaux à inclure
                    </div>
                    {allSlotsRaw.length > 0 && (
                      <select value={recFilterDisc||""} onChange={e=>setRecFilterDisc(e.target.value?Number(e.target.value):null)}
                        style={{ fontSize:12, padding:"5px 10px", border:`1.5px solid ${C.border}`, borderRadius:8, background:C.surface, color:C.text, outline:"none", cursor:"pointer", maxWidth:160 }}>
                        <option value="">Toutes les disciplines</option>
                        {(discs||[]).filter(d=>(d.slots||[]).length>0).map(d=>(
                          <option key={d.id} value={d.id}>{d.icon||""} {d.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  {allSlotsRaw.length === 0 ? (
                    <div style={{ padding:"14px", background:"#FFF8F0", borderRadius:10, border:`1px dashed ${C.border}`, fontSize:13, color:C.textSoft, marginBottom:12 }}>
                      {recFilterDisc
                        ? <>ℹ Aucun créneau pour cette discipline. Allez dans <strong>Disciplines</strong> pour en ajouter.</>
                        : <>ℹ Aucun créneau configuré. Allez dans <strong>Disciplines</strong> pour définir les horaires.</>
                      }
                    </div>
                  ) : (
                    <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:16 }}>
                      {allSlots.map(slot => {
                        const sel = isSelected(slot.key);
                        const selSlot = recSlots.find(s=>s.key===slot.key);
                        return (
                          <div key={slot.key} style={{ borderRadius:10, border:`1.5px solid ${sel?C.accent:C.border}`, background:sel?C.accentLight:C.surface, overflow:"hidden", transition:"all .15s" }}>
                            {/* Ligne principale — clic pour sélectionner */}
                            <div onClick={()=>toggleSlot(slot)}
                              style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", cursor:"pointer" }}>
                              <div style={{ width:20, height:20, borderRadius:5, border:`2px solid ${sel?C.accent:C.border}`, background:sel?C.accent:"transparent", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                                {sel && <span style={{color:"#fff",fontSize:12,lineHeight:1}}>✓</span>}
                              </div>
                              <span style={{fontSize:15}}>{slot.discIcon}</span>
                              <div style={{flex:1}}>
                                <div style={{ fontSize:13, fontWeight:700, color:sel?C.accent:C.text }}>{slot.discName}</div>
                                <div style={{ fontSize:11, color:C.textSoft }}>{dayLabel(slot.day)} · {slot.time} · {slot.duration} min</div>
                              </div>
                            </div>
                            {/* Coach par créneau — visible seulement si sélectionné */}
                            {sel && (
                              <div style={{ borderTop:`1px solid ${C.border}`, padding:"8px 14px 10px", display:"flex", alignItems:"center", gap:10, background:"rgba(160,104,56,.04)" }}>
                                <span style={{fontSize:11,fontWeight:700,color:C.textMuted,flexShrink:0,textTransform:"uppercase",letterSpacing:.6}}>Coach</span>
                                <select value={selSlot?.teacher||""} onChange={e=>updateSlotCoach(slot.key, e.target.value)}
                                  style={{flex:1,padding:"6px 10px",border:`1.5px solid ${C.border}`,borderRadius:7,fontSize:13,color:C.text,background:C.surface,outline:"none"}}>
                                  <option value="">— Coach par défaut ({nS.teacher||"non défini"}) —</option>
                                  {coachesList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                </select>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ── ÉTAPE 2 : Coach par défaut + paramètres ── */}
                <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:.8, marginBottom:8 }}>2 · Paramètres</div>
                <div style={{ display:"grid", gridTemplateColumns:`repeat(${isMobile?2:4},1fr)`, gap:12, marginBottom:16 }}>
                  <div style={{ gridColumn:"span 2" }}>
                    <label style={{fontSize:11,fontWeight:700,color:C.textMuted,textTransform:"uppercase",letterSpacing:.8,display:"block",marginBottom:5}}>Coach par défaut</label>
                    <select value={nS.teacher} onChange={e=>{
                        const t = e.target.value;
                        setNS(s=>({...s,teacher:t}));
                        // Appliquer aux créneaux sans coach spécifique
                        setRecSlots(prev=>prev.map(s=>(!s.teacher)?{...s,teacher:t}:s));
                      }}
                      style={{width:"100%",padding:"9px 12px",border:`1.5px solid ${C.border}`,borderRadius:8,fontSize:14,color:C.text,background:C.surface,outline:"none",boxSizing:"border-box"}}>
                      <option value="">— Choisir un coach —</option>
                      {coachesList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <Field label="Places" type="number" value={nS.spots} onChange={v=>setNS({...nS,spots:v})}/>
                  <Field label="Salle" value={nS.room} onChange={v=>setNS({...nS,room:v})} placeholder="Studio A"/>
                </div>

                {/* ── ÉTAPE 3 : Période ── */}
                <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:.8, marginBottom:8 }}>3 · Période</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20 }}>
                  <DatePicker label="Du" value={recFrom} onChange={v=>setRecFrom(v)}/>
                  <DatePicker label="Au" value={recTo} onChange={v=>setRecTo(v)} minDate={recFrom}/>
                </div>

                {/* ── PRÉVISUALISATION éditable ── */}
                {recPreview.length > 0 && (
                  <div style={{ marginBottom:16 }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:.8 }}>
                        4 · Séances générées
                      </div>
                      <span style={{ fontSize:12, fontWeight:700, color:"#3A6E46", background:"#EAF5EC", border:"1px solid #A8D5B0", borderRadius:6, padding:"2px 8px" }}>
                        {recPreview.length} séance{recPreview.length>1?"s":""}
                      </span>
                    </div>
                    <div style={{ maxHeight:280, overflowY:"auto", display:"flex", flexDirection:"column", gap:4, paddingRight:2 }}>
                      {recPreview.map((s) => {
                        const disc = DISCIPLINES.find(d=>d.id===s.disciplineId)||DISCIPLINES[0];
                        const d = new Date(s.date);
                        const label = d.toLocaleDateString("fr-FR",{weekday:"short",day:"numeric",month:"short"});
                        return (
                          <div key={s.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 10px", background:"#F8FBF8", border:"1px solid #D4E8D6", borderRadius:8 }}>
                            <span style={{fontSize:13,flexShrink:0}}>{disc.icon}</span>
                            <span style={{fontSize:12,fontWeight:600,color:"#2A5E38",flex:"0 0 160px",whiteSpace:"nowrap"}}>{label} · {s.time} · {s.duration}min</span>
                            {/* Coach modifiable par séance */}
                            <select value={s.teacher||""} onChange={e=>updatePreviewCoach(s.id, e.target.value)}
                              style={{flex:1,padding:"4px 8px",border:`1px solid ${C.border}`,borderRadius:6,fontSize:12,color:C.text,background:"#fff",outline:"none",minWidth:0}}>
                              <option value="">— coach —</option>
                              {coachesList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </select>
                            {/* Bouton supprimer */}
                            <button onClick={()=>removePreviewItem(s.id)}
                              style={{background:"none",border:"none",cursor:"pointer",padding:"2px 4px",color:"#F87171",fontSize:16,lineHeight:1,flexShrink:0}}
                              title="Supprimer cette séance">
                              ✕
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div style={{ display:"flex", gap:10 }}>
                  <Button variant="primary" onClick={addRecurringSessions} disabled={recPreview.length===0}>
                    ✦ Créer {recPreview.length>0?`${recPreview.length} séance${recPreview.length>1?"s":""}`:"les séances"}
                  </Button>
                  <Button variant="ghost" onClick={()=>setShowAdd(false)}>Annuler</Button>
                </div>
              </div>
            );
          })()}
        </Card>
      )}

      {dates.map(date=>(
        <div key={date} style={{ marginBottom:22 }}>
          <DateLabel date={date}/>
          {filtered.filter(s=>s.date===date).map(s=>(
            <PlanningSessionCard
              key={s.id}
              sess={s}
              expandedId={expandedId}
              bookings={bookings}
              discs={discs}
              onToggle={handleToggle}
              onChangeStatus={handleChangeStatus}
              onAddBooking={handleAddBooking}
              onSendReminder={handleSendReminder}
              onDelete={deleteSession}
              onCancel={cancelSession}
            />
          ))}
        </div>
      ))}
    </div>
    </div>
  );
}

function Members({ isMobile }) {
  const { studioId } = useContext(AppCtx);
  const [members, setMembers] = useState([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [isDemoData, setIsDemoData] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [nM, setNM] = useState({ firstName:"", lastName:"", email:"", phone:"" });
  const [modal, setModal] = useState(null);
  const p = isMobile?12:28;
  const filtered = members.filter(m=>`${m.firstName} ${m.lastName} ${m.email}`.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    if (!studioId) return;
    setDbLoading(true);
    createClient().from("members")
      .select("id, first_name, last_name, email, phone, status, credits, joined_at, next_payment, notes, subscriptions(name)")
      .eq("studio_id", studioId).order("last_name")
      .then(({ data, error }) => {
        if (error) { console.error("load members", error); setDbLoading(false); return; }
        if (!data || data.length === 0) { setMembers(MEMBERS_DEMO); setIsDemoData(true); setDbLoading(false); return; }
        if (data) setMembers(data.map(m => ({
          id: m.id, firstName: m.first_name, lastName: m.last_name,
          email: m.email, phone: m.phone || "", status: m.status || "actif",
          credits: m.credits || 0, joined: m.joined_at, nextPayment: m.next_payment,
          notes: m.notes || "", subscription: m.subscriptions?.name || "—",
          avatar: (m.first_name?.[0]||"")+(m.last_name?.[0]||""),
        })));
        setDbLoading(false);
      });
  }, [studioId]);

  const add = async () => {
    if (!nM.firstName||!nM.email||!studioId) return;
    const tempId = `tmp-${Date.now()}`;
    setMembers(prev=>[...prev, { id:tempId, ...nM, joined:new Date().toISOString().split("T")[0], status:"nouveau", credits:0, nextPayment:null, subscription:"—", avatar:(nM.firstName[0]||"")+(nM.lastName[0]||"") }]);
    setShowAdd(false);
    setNM({ firstName:"", lastName:"", email:"", phone:"" });
    try {
      const { data, error } = await createClient().from("members").insert({
        studio_id: studioId, first_name: nM.firstName, last_name: nM.lastName,
        email: nM.email, phone: nM.phone || "", status: "nouveau", credits: 0,
        joined_at: new Date().toISOString().split("T")[0],
      }).select("id").single();
      if (error) { console.error("insert member", error); setMembers(prev=>prev.filter(m=>m.id!==tempId)); }
      else if (data?.id) setMembers(prev=>prev.map(m=>m.id===tempId?{...m,id:data.id}:m));
    } catch(e) { console.error("insert member", e); }
  };

  const updateMember = async (id, updates) => {
    setMembers(prev=>prev.map(m=>m.id===id?{...m,...updates}:m));
    const map = {};
    if (updates.status !== undefined)  map.status = updates.status;
    if (updates.credits !== undefined) map.credits = updates.credits;
    if (updates.notes !== undefined)   map.notes = updates.notes;
    if (updates.nextPayment !== undefined) map.next_payment = updates.nextPayment;
    if (updates.firstName !== undefined) map.first_name = updates.firstName;
    if (updates.lastName !== undefined)  map.last_name = updates.lastName;
    if (updates.phone !== undefined)     map.phone = updates.phone;
    if (Object.keys(map).length) {
      try { await createClient().from("members").update(map).eq("id", id); }
      catch(e) { console.error("update member", e); }
    }
  };

  const deleteMember = async (id) => {
    setMembers(prev=>prev.filter(m=>m.id!==id));
    try { await createClient().from("members").delete().eq("id", id); }
    catch(e) { console.error("delete member", e); }
  };

  // Mock session history per member
  const SESSION_HISTORY = [
    { date:"2026-03-09", disc:"Yoga Vinyasa",  teacher:"Sophie Laurent", status:"présent" },
    { date:"2026-03-05", disc:"Pilates",        teacher:"Marie Dubois",   status:"présent" },
    { date:"2026-02-28", disc:"Méditation",     teacher:"Camille Morin",  status:"présent" },
    { date:"2026-02-24", disc:"Yoga Vinyasa",   teacher:"Sophie Laurent", status:"absent" },
    { date:"2026-02-18", disc:"Yin Yoga",       teacher:"Camille Morin",  status:"présent" },
  ];

  // ── Modals ────────────────────────────────────────────────────────────────
  const Modal = ({ children }) => (
    <div style={{ position:"fixed", inset:0, background:"rgba(42,31,20,.45)", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
      onClick={e=>{ if(e.target===e.currentTarget) setModal(null); }}>
      <div style={{ background:C.surface, borderRadius:16, padding:24, width:"100%", maxWidth:480, boxShadow:"0 24px 60px rgba(0,0,0,.18)", maxHeight:"85vh", overflowY:"auto" }}>
        {children}
      </div>
    </div>
  );

  const ModalHeader = ({ title, onClose }) => (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
      <div style={{ fontSize:16, fontWeight:800, color:C.text }}>{title}</div>
      <button onClick={onClose} style={{ background:"none", border:`1.5px solid ${C.border}`, borderRadius:8, padding:"4px 7px", cursor:"pointer", display:"flex" }}><IcoX s={15} c={C.textSoft}/></button>
    </div>
  );

  const EmailModal = () => {
    const [subject, setSubject] = useState(`Bonjour ${modal.member.firstName}`);
    const [body, setBody] = useState("");
    const [sent, setSent] = useState(false);
    return (
      <Modal>
        <ModalHeader title={`Email à ${modal.member.firstName} ${modal.member.lastName}`} onClose={()=>setModal(null)}/>
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", background:C.bg, borderRadius:8, marginBottom:14 }}>
          <IcoMail s={14} c={C.textSoft}/>
          <span style={{ fontSize:13, color:C.textSoft }}>{modal.member.email}</span>
        </div>
        <div style={{ marginBottom:12 }}>
          <FieldLabel>Objet</FieldLabel>
          <input value={subject} onChange={e=>setSubject(e.target.value)}
            style={{ width:"100%", padding:"9px 12px", border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:14, outline:"none", boxSizing:"border-box", color:C.text, background:C.surfaceWarm }}
            onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/>
        </div>
        <div style={{ marginBottom:16 }}>
          <FieldLabel>Message</FieldLabel>
          <textarea value={body} onChange={e=>setBody(e.target.value)} rows={5} placeholder="Votre message…"
            style={{ width:"100%", padding:"9px 12px", border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:14, outline:"none", boxSizing:"border-box", color:C.text, background:C.surfaceWarm, resize:"vertical", fontFamily:"inherit" }}
            onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/>
        </div>
        {sent
          ? <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px", background:C.okBg, borderRadius:8, color:C.ok, fontWeight:600, fontSize:14 }}><IcoCheck s={16} c={C.ok}/>Email envoyé avec succès !</div>
          : <div style={{ display:"flex", gap:10 }}>
              <Button variant="primary" onClick={()=>setSent(true)}><span style={{display:"flex",alignItems:"center",gap:6}}><IcoMail s={14} c="white"/>Envoyer</span></Button>
              <Button variant="ghost" onClick={()=>setModal(null)}>Annuler</Button>
            </div>
        }
      </Modal>
    );
  };

  const SubscriptionModal = () => {
    const [sub, setSub] = useState(modal.member.subscription);
    const [saved, setSaved] = useState(false);
    return (
      <Modal>
        <ModalHeader title={`Abonnement — ${modal.member.firstName} ${modal.member.lastName}`} onClose={()=>setModal(null)}/>
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:12, color:C.textMuted, fontWeight:600, marginBottom:8, textTransform:"uppercase" }}>Abonnement actuel</div>
          <div style={{ padding:"10px 14px", background:C.accentBg, borderRadius:8, fontSize:15, fontWeight:700, color:C.accentDark }}>{modal.member.subscription}</div>
        </div>
        <div style={{ marginBottom:18 }}>
          <FieldLabel>Nouvel abonnement</FieldLabel>
          <Field value={sub} onChange={setSub} opts={SUBSCRIPTIONS_INIT.map(s=>({v:s.name,l:s.name}))}/>
        </div>
        {saved
          ? <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px", background:C.okBg, borderRadius:8, color:C.ok, fontWeight:600, fontSize:14 }}><IcoCheck s={16} c={C.ok}/>Abonnement mis à jour !</div>
          : <div style={{ display:"flex", gap:10 }}>
              <Button variant="primary" onClick={()=>{ setMembers(prev=>prev.map(m=>m.id===modal.member.id?{...m,subscription:sub}:m)); setSaved(true); }}>Enregistrer</Button>
              <Button variant="ghost" onClick={()=>setModal(null)}>Annuler</Button>
            </div>
        }
      </Modal>
    );
  };

  const HistoryModal = () => (
    <Modal>
      <ModalHeader title={`Séances — ${modal.member.firstName} ${modal.member.lastName}`} onClose={()=>setModal(null)}/>
      <div style={{ display:"flex", gap:14, marginBottom:16 }}>
        {[["Séances",SESSION_HISTORY.length],["Présences",SESSION_HISTORY.filter(s=>s.status==="présent").length],["Absences",SESSION_HISTORY.filter(s=>s.status==="absent").length]].map(([l,v])=>(
          <div key={l} style={{ flex:1, textAlign:"center", padding:"10px 8px", background:C.bg, borderRadius:10, border:`1.5px solid ${C.border}` }}>
            <div style={{ fontSize:22, fontWeight:800, color:C.text }}>{v}</div>
            <div style={{ fontSize:11, color:C.textSoft }}>{l}</div>
          </div>
        ))}
      </div>
      {SESSION_HISTORY.map((s,i)=>(
        <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"9px 0", borderBottom:`1px solid ${C.borderSoft}` }}>
          <div style={{ width:32, height:32, borderRadius:8, background:s.status==="présent"?C.okBg:C.warnBg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            {s.status==="présent" ? <IcoCheck s={14} c={C.ok}/> : <IcoX s={14} c={C.warn}/>}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:700, color:C.text }}>{s.disc}</div>
            <div style={{ fontSize:12, color:C.textSoft }}>{s.teacher} · {new Date(s.date).toLocaleDateString("fr-FR")}</div>
          </div>
          <span style={{ fontSize:12, fontWeight:600, color:s.status==="présent"?C.ok:C.warn }}>{s.status}</span>
        </div>
      ))}
    </Modal>
  );

  return (
    <div>
      {isDemoData && <DemoBanner/>}
      <div style={{ padding:p }}>
      {modal?.type==="email"        && <EmailModal/>}
      {modal?.type==="subscription" && <SubscriptionModal/>}
      {modal?.type==="history"      && <HistoryModal/>}

      <div style={{ display:"flex", gap:10, marginBottom:18, alignItems:"center" }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  Rechercher…"
          style={{ flex:1, padding:isMobile?"9px 12px":"10px 14px", border:`1px solid ${C.border}`, borderRadius:8, fontSize:16, outline:"none", color:C.text, background:C.surfaceWarm }}
          onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/>
        <Button sm variant="primary" onClick={()=>setShowAdd(!showAdd)}>＋ {!isMobile&&"Adhérent"}</Button>
      </div>
      {showAdd && (
        <Card style={{ marginBottom:16, borderTop:`3px solid ${C.accent}` }}>
          <div style={{ fontSize:14, fontWeight:700, color:C.accent, textTransform:"uppercase", marginBottom:16 }}>Nouvel adhérent</div>
          <div style={{ display:"grid", gridTemplateColumns:`repeat(${isMobile?1:3},1fr)`, gap:14 }}>
            <Field label="Prénom"     value={nM.firstName}    onChange={v=>setNM({...nM,firstName:v})}    placeholder="Prénom"/>
            <Field label="Nom"        value={nM.lastName}     onChange={v=>setNM({...nM,lastName:v})}     placeholder="Nom"/>
            <Field label="Email"      value={nM.email}        onChange={v=>setNM({...nM,email:v})}        placeholder="email@..."/>
            <Field label="Téléphone"  value={nM.phone}        onChange={v=>setNM({...nM,phone:v})}        placeholder="06..."/>
            <Field label="Abonnement" value={nM.subscription} onChange={v=>setNM({...nM,subscription:v})} opts={SUBSCRIPTIONS_INIT.map(s=>({v:s.name,l:s.name}))}/>
          </div>
          <div style={{ marginTop:14, display:"flex", gap:10 }}>
            <Button variant="primary" onClick={add}>Créer l'adhérent</Button>
            <Button variant="ghost" onClick={()=>setShowAdd(false)}>Annuler</Button>
          </div>
        </Card>
      )}
      {<Card noPad>{filtered.map(m=><MemberRow key={m.id} m={m} onSelect={m=>setSelected(selected?.id===m.id?null:m)} selected={selected?.id===m.id}/>)}</Card>
      }
      {selected && (
        <Card style={{ marginTop:16, borderTop:`3px solid ${C.accent}` }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
            <div style={{ display:"flex", alignItems:"center", gap:14 }}>
              <div style={{ width:46, height:46, borderRadius:"50%", background:C.accentBg, border:`1.5px solid #DFC0A0`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:700, color:C.accent }}>{selected.avatar}</div>
              <div>
                <div style={{ fontSize:20, fontWeight:700, color:C.text }}>{selected.firstName} {selected.lastName}</div>
                <div style={{ fontSize:14, color:C.textSoft }}>{selected.email} · {selected.phone}</div>
              </div>
            </div>
            <button onClick={()=>setSelected(null)} style={{ background:"none", border:`1.5px solid ${C.border}`, borderRadius:8, padding:"5px 8px", cursor:"pointer", color:C.textSoft, display:"flex", alignItems:"center" }}><IcoX s={16} c={C.textSoft}/></button>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:`repeat(${isMobile?2:4},1fr)`, gap:12, marginBottom:16 }}>
            {[["Abonnement",selected.subscription],["Statut",selected.status],["Depuis",new Date(selected.joined).toLocaleDateString("fr-FR")],["Crédits",selected.credits>0?`${selected.credits} séances`:"Illimité"]].map(([l,v])=>(
              <div key={l} style={{ background:C.bg, borderRadius:8, padding:"12px 14px", border:`1.5px solid ${C.border}` }}>
                <div style={{ fontSize:12, fontWeight:700, color:C.textMuted, textTransform:"uppercase", marginBottom:4 }}>{l}</div>
                <div style={{ fontSize:16, fontWeight:600, color:C.text, textTransform:"capitalize" }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            <Button variant="primary" sm onClick={()=>setModal({type:"email",member:selected})}><span style={{display:"flex",alignItems:"center",gap:5}}><IcoMail s={13} c="white"/>Envoyer un email</span></Button>
            <Button variant="ghost" sm onClick={()=>setModal({type:"subscription",member:selected})}><span style={{display:"flex",alignItems:"center",gap:5}}><IcoTag s={13} c={C.textMid}/>Modifier l'abonnement</span></Button>
            <Button variant="ghost" sm onClick={()=>setModal({type:"history",member:selected})}><span style={{display:"flex",alignItems:"center",gap:5}}><IcoCalendar s={13} c={C.textMid}/>Historique séances</span></Button>
          </div>
        </Card>
      )}
    </div>
    </div>
  );
}

function Subscriptions({ isMobile }) {
  const { studioId } = useContext(AppCtx);
  const [subs, setSubs] = useState([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [isDemoData, setIsDemoData] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState(null);
  const [nSub, setNSub] = useState({ name:"", price:"", period:"mois", description:"" });
  const [editData, setEditData] = useState({});
  const p = isMobile?12:28;

  useEffect(() => {
    if (!studioId) return;
    setDbLoading(true);
    createClient().from("subscriptions")
      .select("id, name, price, period, description, popular, color")
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
    setEditData({ name:sub.name, price:sub.price, period:sub.period, description:sub.description, popular:sub.popular });
  };
  const saveEdit = async (id) => {
    setSubs(prev=>prev.map(s=>s.id===id?{...s,...editData,price:parseFloat(editData.price)||0}:s));
    setEditId(null);
    try {
      await createClient().from("subscriptions").update({
        name: editData.name, price: parseFloat(editData.price)||0,
        period: editData.period, description: editData.description||"", popular: editData.popular||false,
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
                  <Button sm variant="ghost" onClick={()=>startEdit(sub)}><span style={{display:"flex",alignItems:"center",gap:5}}><IcoSettings s={13} c={C.textMid}/>Modifier</span></Button>
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
    {lbl:"Encaissé ce mois", val:`${total} €`,      icon:<IcoCreditCard s={20} c={C.ok}/>,  c:C.ok,   bg:C.okBg},
    {lbl:"Impayés",          val:`${unpaid} €`,      icon:<IcoAlert s={20} c={C.warn}/>,     c:C.warn, bg:C.warnBg},
    {lbl:"Transactions",     val:payments.length,    icon:<IcoBarChart s={20} c={C.info}/>,  c:C.info, bg:C.infoBg},
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
function DatePicker({ value, onChange, label, minDate }) {
  const [open, setOpen] = useState(false);
  const ref = React.useRef(null);

  // value = "YYYY-MM-DD" ou ""
  const parsed = value ? new Date(value + "T12:00:00") : null;
  const today = new Date(); today.setHours(0,0,0,0);

  const [viewYear, setViewYear] = useState(() => parsed?.getFullYear() || today.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => parsed?.getMonth() ?? today.getMonth());

  React.useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  // Sync view au changement de value
  React.useEffect(() => {
    if (parsed) { setViewYear(parsed.getFullYear()); setViewMonth(parsed.getMonth()); }
  }, [value]);

  const MONTHS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
  const DAYS_H = ["Lu","Ma","Me","Je","Ve","Sa","Di"];

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y=>y-1); } else setViewMonth(m=>m-1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y=>y+1); } else setViewMonth(m=>m+1); };

  // Jours du mois + padding pour commencer lundi
  const firstDay = new Date(viewYear, viewMonth, 1);
  const startPad = (firstDay.getDay() + 6) % 7; // 0=Lun
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = Array(startPad).fill(null).concat(Array.from({length:daysInMonth},(_,i)=>i+1));

  const minD = minDate ? new Date(minDate + "T12:00:00") : null;

  const selectDay = (day) => {
    const m = String(viewMonth+1).padStart(2,"0"), d = String(day).padStart(2,"0");
    onChange(`${viewYear}-${m}-${d}`);
    setOpen(false);
  };

  const isSelected = (day) => {
    if (!parsed || !day) return false;
    return parsed.getFullYear()===viewYear && parsed.getMonth()===viewMonth && parsed.getDate()===day;
  };
  const isToday = (day) => {
    return today.getFullYear()===viewYear && today.getMonth()===viewMonth && today.getDate()===day;
  };
  const isDisabled = (day) => {
    if (!day || !minD) return false;
    return new Date(viewYear, viewMonth, day) < minD;
  };

  const displayValue = parsed
    ? parsed.toLocaleDateString("fr-FR", {weekday:"short", day:"numeric", month:"long", year:"numeric"})
    : "";

  // Position (au-dessus si manque de place)
  const triggerRef = React.useRef(null);
  const [dropUp, setDropUp] = React.useState(false);
  React.useEffect(() => {
    if (open && triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setDropUp(window.innerHeight - r.bottom < 300 && r.top > 300);
    }
  }, [open]);

  return (
    <div ref={ref} style={{ position:"relative" }}>
      {label && <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:.8, marginBottom:5 }}>{label}</div>}
      <button ref={triggerRef} onClick={()=>setOpen(o=>!o)}
        style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"9px 12px", border:`1.5px solid ${open?C.accent:C.border}`, borderRadius:9, background:C.surfaceWarm, cursor:"pointer", transition:"border-color .15s", textAlign:"left" }}>
        <span style={{ fontSize:16, color:C.textMuted }}>📅</span>
        <span style={{ flex:1, fontSize:13, color:displayValue?C.text:C.textMuted, fontWeight:displayValue?600:400 }}>
          {displayValue || "Choisir une date…"}
        </span>
        <span style={{ fontSize:10, color:C.textMuted }}>{open?"▲":"▼"}</span>
      </button>

      {open && (
        <div style={{ position:"absolute", left:0, [dropUp?"bottom":"top"]:"calc(100% + 6px)", zIndex:9999, background:C.surface, border:`1.5px solid ${C.accent}`, borderRadius:14, boxShadow:"0 12px 40px rgba(42,31,20,.2)", padding:16, minWidth:260 }}>
          {/* Navigation mois */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
            <button onClick={prevMonth} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:8, width:32, height:32, cursor:"pointer", fontSize:14, color:C.textMid, display:"flex", alignItems:"center", justifyContent:"center" }}>‹</button>
            <div style={{ fontSize:14, fontWeight:700, color:C.text }}>{MONTHS[viewMonth]} {viewYear}</div>
            <button onClick={nextMonth} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:8, width:32, height:32, cursor:"pointer", fontSize:14, color:C.textMid, display:"flex", alignItems:"center", justifyContent:"center" }}>›</button>
          </div>

          {/* Entêtes jours */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2, marginBottom:4 }}>
            {DAYS_H.map(d=>(
              <div key={d} style={{ textAlign:"center", fontSize:11, fontWeight:700, color:C.textMuted, padding:"2px 0" }}>{d}</div>
            ))}
          </div>

          {/* Cellules jours */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2 }}>
            {cells.map((day,i)=>{
              const sel = isSelected(day);
              const tod = isToday(day);
              const dis = isDisabled(day);
              return (
                <button key={i} disabled={!day||dis} onClick={()=>day&&!dis&&selectDay(day)}
                  style={{
                    height:34, borderRadius:8, border:"none", fontSize:13, fontWeight:sel?700:400,
                    background: sel ? C.accent : tod ? C.accentLight : "transparent",
                    color: !day ? "transparent" : sel ? "#fff" : dis ? C.textMuted : C.text,
                    cursor: !day||dis ? "default" : "pointer",
                    opacity: dis ? .4 : 1,
                    transition:"background .1s",
                  }}
                  onMouseEnter={e=>{ if(day&&!dis&&!sel) e.currentTarget.style.background=C.accentLight; }}
                  onMouseLeave={e=>{ if(!sel&&!tod) e.currentTarget.style.background="transparent"; if(tod&&!sel) e.currentTarget.style.background=C.accentLight; }}>
                  {day||""}
                </button>
              );
            })}
          </div>

          {/* Aujourd'hui */}
          <div style={{ marginTop:10, textAlign:"center" }}>
            <button onClick={()=>{ const d=today; selectDay(d.getDate()); setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); }}
              style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:7, padding:"5px 14px", fontSize:12, color:C.accent, fontWeight:600, cursor:"pointer" }}>
              Aujourd'hui
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── DURATION PICKER — durées prédéfinies + saisie libre ─────────────────────
const DURATIONS = [30, 45, 60, 75, 90, 105, 120];
function DurationPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = React.useRef(null);
  const triggerRef = React.useRef(null);
  const [dropUp, setDropUp] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  React.useEffect(() => {
    if (open && triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setDropUp(window.innerHeight - r.bottom < 200 && r.top > 200);
    }
  }, [open]);

  const step = (dir) => {
    const cur = value || 60;
    onChange(Math.max(15, Math.min(240, cur + dir * 15)));
  };

  const label = (n) => n < 60 ? `${n}mn` : n % 60 === 0 ? `${n}mn` : `${Math.floor(n/60)}h${String(n%60).padStart(2,"0")}`;
  const cur = value || 60;

  return (
    <div ref={ref} style={{ position:"relative" }}>
      <div ref={triggerRef} style={{ display:"flex", alignItems:"center", height:38, border:`1.5px solid ${open?C.accent:C.border}`, borderRadius:9, background:C.surfaceWarm, overflow:"hidden", transition:"border-color .15s" }}>
        <button onMouseDown={e=>{e.preventDefault();step(-1);}} tabIndex={-1}
          style={{ background:"none", border:"none", borderRight:`1px solid ${C.border}`, padding:"0 7px", height:"100%", cursor:"pointer", color:C.textMuted, fontSize:12, flexShrink:0 }}>▼</button>
        <button onMouseDown={e=>{e.preventDefault();setOpen(o=>!o);}} tabIndex={-1}
          style={{ flex:1, background:"none", border:"none", height:"100%", cursor:"pointer", fontSize:13, color:C.text, fontWeight:700, textAlign:"center", padding:"0 2px", minWidth:0, overflow:"hidden", whiteSpace:"nowrap" }}>
          {label(cur)}
        </button>
        <button onMouseDown={e=>{e.preventDefault();step(1);}} tabIndex={-1}
          style={{ background:"none", border:"none", borderLeft:`1px solid ${C.border}`, padding:"0 7px", height:"100%", cursor:"pointer", color:C.textMuted, fontSize:12, flexShrink:0 }}>▲</button>
      </div>
      {open && (
        <div style={{ position:"absolute", left:0, right:0, [dropUp?"bottom":"top"]:"calc(100% + 4px)", background:C.surface, border:`1.5px solid ${C.accent}`, borderRadius:10, boxShadow:"0 8px 32px rgba(42,31,20,.18)", zIndex:9999, maxHeight:200, overflowY:"auto" }}>
          {DURATIONS.map(d => (
            <button key={d} onMouseDown={e=>{e.preventDefault();onChange(d);setOpen(false);}}
              style={{ display:"block", width:"100%", textAlign:"center", padding:"9px 12px", border:"none",
                background:d===cur?C.accentLight:"transparent", color:d===cur?C.accent:C.text,
                fontWeight:d===cur?700:400, fontSize:13, cursor:"pointer", borderBottom:`1px solid ${C.border}20` }}
              onMouseEnter={e=>{if(d!==cur)e.currentTarget.style.background="rgba(160,104,56,.06)";}}
              onMouseLeave={e=>{e.currentTarget.style.background=d===cur?C.accentLight:"transparent";}}>
              {label(d)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── TIME PICKER ──────────────────────────────────────────────────────────────
function TimePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState(value || "09:00");
  const ref = React.useRef(null);
  const inputRef = React.useRef(null);
  const triggerRef = React.useRef(null);
  const [dropUp, setDropUp] = React.useState(false);

  React.useEffect(() => { if (!editing) setInputVal(value || "09:00"); }, [value, editing]);

  React.useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  React.useEffect(() => {
    if (open && triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setDropUp(window.innerHeight - r.bottom < 220 && r.top > 220);
    }
    if (open) {
      setTimeout(() => {
        const el = ref.current?.querySelector('[data-active="true"]');
        if (el) el.scrollIntoView({ block:"center" });
      }, 30);
    }
  }, [open]);

  const slots = [];
  for (let h = 6; h <= 22; h++) {
    [0, 15, 30, 45].forEach(m => {
      if (h === 22 && m > 0) return;
      slots.push(`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`);
    });
  }

  const toMin = (v) => { const m = v?.match(/^([01]?\d|2[0-3]):([0-5]\d)$/); return m ? parseInt(m[1])*60+parseInt(m[2]) : null; };
  const fromMin = (m) => `${String(Math.floor(m/60)).padStart(2,"0")}:${String(m%60).padStart(2,"0")}`;

  const commit = (v) => {
    setEditing(false);
    // Accepter "1615" ou "16h15" ou "16:15"
    const normalized = v.replace(/[h\s]/,":");
    const min = toMin(normalized);
    if (min !== null) { const c = fromMin(Math.max(0, Math.min(1439, min))); setInputVal(c); onChange(c); }
    else setInputVal(value || "09:00");
  };

  const step = (dir) => {
    const min = toMin(value || "09:00") ?? 540;
    const v = fromMin(Math.max(360, Math.min(1320, min + dir*15)));
    setInputVal(v); onChange(v);
  };

  return (
    <div ref={ref} style={{ position:"relative" }}>
      <div ref={triggerRef} style={{ display:"flex", alignItems:"center", height:38, border:`1.5px solid ${editing||open?C.accent:C.border}`, borderRadius:9, background:C.surfaceWarm, overflow:"hidden", transition:"border-color .15s" }}>
        <button onMouseDown={e=>{e.preventDefault();step(-1);}} tabIndex={-1}
          style={{ background:"none", border:"none", borderRight:`1px solid ${C.border}`, padding:"0 7px", height:"100%", cursor:"pointer", color:C.textMuted, fontSize:12, flexShrink:0 }}>▼</button>
        <input ref={inputRef} value={inputVal}
          onChange={e=>{setEditing(true);setInputVal(e.target.value);}}
          onFocus={()=>{setEditing(true);setOpen(false);}}
          onBlur={e=>commit(e.target.value)}
          onKeyDown={e=>{
            if(e.key==="Enter") e.target.blur();
            if(e.key==="ArrowUp"){e.preventDefault();step(1);}
            if(e.key==="ArrowDown"){e.preventDefault();step(-1);}
          }}
          style={{ flex:1, border:"none", outline:"none", background:"transparent", padding:"0 2px", fontSize:14, color:C.text, fontWeight:700, minWidth:0, textAlign:"center", height:"100%", cursor:"pointer" }}
          onClick={()=>setOpen(o=>!o)}
        />
        <button onMouseDown={e=>{e.preventDefault();step(1);}} tabIndex={-1}
          style={{ background:"none", border:"none", borderLeft:`1px solid ${C.border}`, padding:"0 7px", height:"100%", cursor:"pointer", color:C.textMuted, fontSize:12, flexShrink:0 }}>▲</button>
      </div>
      {open && (
        <div style={{ position:"absolute", left:0, right:0, [dropUp?"bottom":"top"]:"calc(100% + 4px)", background:C.surface, border:`1.5px solid ${C.accent}`, borderRadius:10, boxShadow:"0 8px 32px rgba(42,31,20,.18)", zIndex:9999, maxHeight:200, overflowY:"auto" }}>
          {slots.map(t => (
            <button key={t} data-active={t===value?"true":"false"}
              onMouseDown={e=>{e.preventDefault();setInputVal(t);onChange(t);setOpen(false);}}
              style={{ display:"block", width:"100%", textAlign:"center", padding:"8px 14px", border:"none",
                background:t===value?C.accentLight:"transparent", color:t===value?C.accent:C.text,
                fontWeight:t===value?700:400, fontSize:13, cursor:"pointer", borderBottom:`1px solid ${C.border}20` }}
              onMouseEnter={e=>{if(t!==value)e.currentTarget.style.background="rgba(160,104,56,.06)";}}
              onMouseLeave={e=>{e.currentTarget.style.background=t===value?C.accentLight:"transparent";}}>
              {t}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── DAY SELECT — joli select jour ────────────────────────────────────────────
function DaySelect({ value, onChange }) {
  const DAYS_FULL = [
    { short:"Lun", label:"Lundi" }, { short:"Mar", label:"Mardi" },
    { short:"Mer", label:"Mercredi" }, { short:"Jeu", label:"Jeudi" },
    { short:"Ven", label:"Vendredi" }, { short:"Sam", label:"Samedi" },
    { short:"Dim", label:"Dimanche" }
  ];
  return (
    <div style={{ position:"relative", width:"100%" }}>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width:"100%", padding:"9px 24px 9px 8px", borderRadius:9, border:`1.5px solid ${C.border}`, fontSize:12, color:C.text, background:C.surfaceWarm, outline:"none", appearance:"none", WebkitAppearance:"none", cursor:"pointer", fontWeight:600, minWidth:0, boxSizing:"border-box" }}>
        {DAYS_FULL.map(d => <option key={d.short} value={d.short}>{d.label}</option>)}
      </select>
      <span style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", pointerEvents:"none", fontSize:10, color:C.textMuted }}>▼</span>
    </div>
  );
}

const DAYS_FR = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];

function DisciplinesPage({ isMobile }) {
  const { discs, setDiscs, studioId: ctxStudioId } = useContext(AppCtx);
  const [nD, setND]         = useState({ name:"", icon:"🏃", color:C.accent });
  const [editDisc, setEditDisc]   = useState(null);
  const [editName, setEditName]   = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [loadingDb, setLoadingDb] = useState(false);
  const [isDemoData, setIsDemoData] = useState(false);
  const [toast, setToast] = useState(null);
  const showToast = (msg, ok=true) => { setToast({msg,ok}); setTimeout(()=>setToast(null),3500); };
  const p = isMobile?16:28;

  // ── Charger les disciplines depuis Supabase quand studioId dispo ─────────
  useEffect(() => {
    if (!ctxStudioId) return;
    setLoadingDb(true);
    createClient().from("disciplines")
      .select("id,name,icon,color,slots").eq("studio_id", ctxStudioId).order("created_at")
      .then(({ data, error }) => {
        if (error) { console.error("load disciplines", error); setLoadingDb(false); return; }
        if (data && data.length > 0) {
          setDiscs(data.map(d=>({ ...d, slots: d.slots||[] })));
          setIsDemoData(false);
        } else {
          // Garder DISCIPLINES par défaut et marquer comme démo
          setIsDemoData(true);
        }
        setLoadingDb(false);
      });
  }, [ctxStudioId]);

  // ── Helpers DB ──────────────────────────────────────────────────────────
  const dbSaveSlots = async (discId, slots) => {
    try { await createClient().from("disciplines").update({ slots }).eq("id", discId); }
    catch(e) { console.error("save slots", e); }
  };

  const dbAddDisc = async (disc) => {
    if (!ctxStudioId) return null;
    try {
      const { data } = await createClient().from("disciplines")
        .insert({ studio_id:ctxStudioId, name:disc.name, icon:disc.icon, color:disc.color||C.accent, slots:[] }).select().single();
      return data;
    } catch(e) { console.error("add disc", e); return null; }
  };

  const dbUpdateDisc = async (discId, updates) => {
    try { await createClient().from("disciplines").update(updates).eq("id", discId); }
    catch(e) { console.error("update disc", e); }
  };

  const dbDeleteDisc = async (discId) => {
    try { await createClient().from("disciplines").delete().eq("id", discId); }
    catch(e) { console.error("delete disc", e); }
  };

  // Slots helpers (state local + sync DB)
  const addSlot = (id) => setDiscs(prev=>prev.map(d=>{
    if(d.id!==id) return d;
    const lastSlot = (d.slots||[]).at(-1);
    let nextTime = "09:00";
    if (lastSlot?.time) {
      const [h, m] = lastSlot.time.split(":").map(Number);
      const next = Math.min(h + 1, 22);
      nextTime = `${String(next).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
    }
    return {...d, slots:[...(d.slots||[]), {day: lastSlot?.day||"Lun", time: nextTime, duration: lastSlot?.duration||60}]};
  }));
  const rmSlot  = (id,si) => setDiscs(prev=>prev.map(d=>d.id===id?{...d,slots:d.slots.filter((_,j)=>j!==si)}:d));
  const upSlot  = (id,si,field,val) => setDiscs(prev=>prev.map(d=>d.id===id?{...d,slots:d.slots.map((s,j)=>j===si?{...s,[field]:val}:s)}:d));

  const ScheduleModal = ({ disc: discProp }) => {
    // Lire la discipline LIVE depuis le state pour voir les slots ajoutés en temps réel
    const disc = discs.find(d=>d.id===discProp.id) || discProp;
    return (
    <div onClick={e=>e.target===e.currentTarget&&setEditDisc(null)}
      style={{position:"fixed",inset:0,background:"rgba(42,31,20,.45)",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:C.surface,borderRadius:16,width:"100%",maxWidth:480,boxShadow:"0 24px 60px rgba(0,0,0,.18)",overflow:"hidden"}}>
        <div style={{padding:"18px 22px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",background:disc.color+"10"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:38,height:38,borderRadius:10,background:disc.color+"20",border:`1.5px solid ${disc.color}40`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>
              {(() => { const Ico = DISC_ICONS[disc.id]; return Ico ? <Ico s={20} c={disc.color}/> : null; })()}
            </div>
            <div>
              <div style={{fontSize:15,fontWeight:800,color:C.text}}>{disc.name}</div>
              <div style={{fontSize:12,color:C.textMuted}}>{disc.slots?.length||0} créneau{disc.slots?.length!==1?"x":""}</div>
            </div>
          </div>
          <button onClick={()=>setEditDisc(null)} style={{background:"none",border:`1.5px solid ${C.border}`,borderRadius:8,padding:"5px 9px",cursor:"pointer",fontSize:14,color:C.textSoft}}>✕</button>
        </div>

        <div style={{padding:"18px 22px",maxHeight:"55vh",overflowY:"auto"}}>
          {(!disc.slots||disc.slots.length===0) ? (
            <div style={{textAlign:"center",padding:"24px 0",color:C.textMuted,fontSize:13}}>
              Aucun créneau — cliquez sur "Ajouter" pour commencer
            </div>
          ) : disc.slots.map((slot,si)=>(
            <div key={si} style={{
              marginBottom:8, padding:"10px 12px", borderRadius:10,
              background:C.surfaceWarm, border:`1px solid ${C.border}`
            }}>
              {/* Ligne 1 : Jour + numéro + supprimer */}
              <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8}}>
                <div style={{display:"flex", alignItems:"center", gap:8}}>
                  <span style={{fontSize:11,fontWeight:700,color:C.textMuted,textTransform:"uppercase",letterSpacing:.6}}>
                    Créneau {si+1}
                  </span>
                </div>
                <button onClick={()=>rmSlot(disc.id,si)}
                  style={{width:26,height:26,borderRadius:7,border:`1px solid ${C.border}`,background:C.surface,color:"#F87171",cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>✕</button>
              </div>
              {/* Ligne 2 : Jour / Heure / Durée */}
              <div style={{display:"grid", gridTemplateColumns:"1.6fr 0.7fr 1.1fr", gap:8}}>
                <div>
                  <div style={{fontSize:10,fontWeight:700,color:C.textMuted,textTransform:"uppercase",letterSpacing:.6,marginBottom:4}}>Jour</div>
                  <DaySelect value={slot.day} onChange={v=>upSlot(disc.id,si,"day",v)}/>
                </div>
                <div>
                  <div style={{fontSize:10,fontWeight:700,color:C.textMuted,textTransform:"uppercase",letterSpacing:.6,marginBottom:4}}>Heure</div>
                  <TimePicker value={slot.time} onChange={v=>upSlot(disc.id,si,"time",v)}/>
                </div>
                <div>
                  <div style={{fontSize:10,fontWeight:700,color:C.textMuted,textTransform:"uppercase",letterSpacing:.6,marginBottom:4}}>Durée</div>
                  <DurationPicker value={slot.duration||60} onChange={v=>upSlot(disc.id,si,"duration",v)}/>
                </div>
              </div>
            </div>
          ))}
          <button onClick={()=>addSlot(disc.id)}
            style={{width:"100%",padding:"9px",borderRadius:9,border:"1.5px dashed #C4A87A",background:C.accentLight,color:C.accent,fontSize:13,fontWeight:600,cursor:"pointer",marginTop:8}}>
            + Ajouter un créneau
          </button>
        </div>

        <div style={{padding:"14px 22px",borderTop:`1px solid ${C.border}`,display:"flex",justifyContent:"flex-end",gap:10}}>
          <Button variant="ghost" onClick={()=>setEditDisc(null)}>Fermer</Button>
          <Button variant="primary" onClick={async ()=>{
            const d = discs.find(x=>x.id===editDisc.id);
            await dbSaveSlots(editDisc.id, d?.slots||[]);
            showToast("Horaires enregistrés !");
            setEditDisc(null);
          }}>Enregistrer</Button>
        </div>
      </div>
    </div>
    );
  };

  return (
    <div style={{ padding:p }}>
      {isDemoData && <DemoBanner/>}
      {loadingDb && (
        <div style={{ textAlign:"center", padding:"24px", color:C.textMuted, fontSize:13 }}>
          Chargement des disciplines…
        </div>
      )}
      {/* Toast local DisciplinesPage */}
      {toast && (
        <div style={{ position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)", zIndex:9999,
          background:toast.ok?"#2A1F14":"#7F1D1D", color:"#fff", borderRadius:12, padding:"11px 22px",
          fontSize:13, fontWeight:600, boxShadow:"0 4px 20px rgba(0,0,0,.25)", whiteSpace:"nowrap",
          display:"flex", alignItems:"center", gap:8 }}>
          {toast.ok ? "✓" : "✕"} {toast.msg}
        </div>
      )}
      {editDisc && <ScheduleModal disc={editDisc}/>}

      <div style={{ display:"grid", gridTemplateColumns:`repeat(${isMobile?2:4},1fr)`, gap:14, marginBottom:22 }}>
        {/* Modal renommage discipline */}
        {editName && (
          <div style={{position:"fixed",inset:0,background:"rgba(42,31,20,.45)",zIndex:700,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
            <div style={{background:C.surface,borderRadius:16,width:"100%",maxWidth:360,padding:24,boxShadow:"0 24px 60px rgba(0,0,0,.18)"}}>
              <div style={{fontSize:15,fontWeight:800,color:C.text,marginBottom:16}}>Modifier la discipline</div>
              <div style={{display:"grid",gridTemplateColumns:"56px 1fr",gap:10,marginBottom:16}}>
                <Field label="Icône" value={editName.icon} onChange={v=>setEditName(e=>({...e,icon:v}))}/>
                <Field label="Nom" value={editName.name} onChange={v=>setEditName(e=>({...e,name:v}))} placeholder="Nom de la discipline"/>
              </div>
              <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
                <Button variant="ghost" onClick={()=>setEditName(null)}>Annuler</Button>
                <Button variant="primary" onClick={async ()=>{
                  if(!editName.name)return;
                  setDiscs(prev=>prev.map(d=>d.id===editName.id?{...d,name:editName.name,icon:editName.icon}:d));
                  await dbUpdateDisc(editName.id, { name:editName.name, icon:editName.icon });
                  showToast(`"${editName.name}" mis à jour ✓`);
                  setEditName(null);
                }}>Enregistrer</Button>
              </div>
            </div>
          </div>
        )}
        {/* Modal confirmation suppression */}
        {confirmDel && (
          <div style={{position:"fixed",inset:0,background:"rgba(42,31,20,.45)",zIndex:700,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
            <div style={{background:C.surface,borderRadius:16,width:"100%",maxWidth:360,padding:24,boxShadow:"0 24px 60px rgba(0,0,0,.18)"}}>
              <div style={{fontSize:15,fontWeight:800,color:C.text,marginBottom:8}}>Supprimer la discipline ?</div>
              <div style={{fontSize:13,color:C.textSoft,marginBottom:20}}>
                Cette action supprimera <strong>{discs.find(d=>d.id===confirmDel)?.name}</strong> et tous ses créneaux. Les séances existantes ne seront pas affectées.
              </div>
              <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
                <Button variant="ghost" onClick={()=>setConfirmDel(null)}>Annuler</Button>
                <Button variant="danger" onClick={async ()=>{
                  const name = discs.find(d=>d.id===confirmDel)?.name;
                  setDiscs(prev=>prev.filter(x=>x.id!==confirmDel));
                  await dbDeleteDisc(confirmDel);
                  showToast(`"${name}" supprimée`, false);
                  setConfirmDel(null);
                }}>Supprimer</Button>
              </div>
            </div>
          </div>
        )}

        {discs.map(d=>(
          <Card key={d.id} style={{ textAlign:"center", borderTop:`3px solid ${d.color}`, padding:"16px 14px" }}>
            <div style={{ width:52, height:52, borderRadius:12, background:d.color+"18", border:`1.5px solid ${d.color}40`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:10, marginLeft:"auto", marginRight:"auto" }}>
              {(() => { const Ico = DISC_ICONS[d.id]; return Ico ? <Ico s={26} c={d.color}/> : <span style={{fontSize:22}}>{d.icon||"🏃"}</span>; })()}
            </div>
            <div style={{ fontWeight:700, fontSize:15, color:C.text, marginBottom:4 }}>{d.name}</div>
            <div style={{ fontSize:11, color:C.textMuted, marginBottom:12 }}>
              {d.slots?.length>0 ? `${d.slots.length} créneau${d.slots.length>1?"x":""}` : "Aucun horaire"}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              <Button sm variant="primary" onClick={()=>setEditDisc(d)}>🗓 Horaires</Button>
              <Button sm variant="ghost" onClick={()=>setEditName({id:d.id,name:d.name,icon:d.icon||"🏃"})}>✏ Renommer</Button>
              <Button sm variant="danger" onClick={()=>setConfirmDel(d.id)}>Supprimer</Button>
            </div>
          </Card>
        ))}
      </div>

      <Card style={{ maxWidth:480 }}>
        <div style={{ fontSize:14, fontWeight:700, color:C.accent, textTransform:"uppercase", marginBottom:16 }}>Ajouter une discipline</div>
        <div style={{ display:"grid", gridTemplateColumns:"56px 1fr auto", gap:10, alignItems:"end" }}>
          <Field label="Icône" value={nD.icon} onChange={v=>setND({...nD,icon:v})}/>
          <Field label="Nom" value={nD.name} onChange={v=>setND({...nD,name:v})} placeholder="Ex: Hot Yoga"/>
          <div style={{ paddingTop:22 }}>
            <Button variant="primary" onClick={async ()=>{
              if(!nD.name)return;
              const tempId = Date.now();
              setDiscs(prev=>[...prev,{id:tempId,...nD,slots:[]}]);
              setND({name:"",icon:"🏃",color:C.accent});
              const saved = await dbAddDisc(nD);
              if(saved) {
                // Remplacer l'id temporaire par l'uuid Supabase
                if (isDemoData) {
                  // Remplacer toutes les démos par cette première vraie discipline
                  setDiscs([{...nD, id:saved.id, slots:[]}]);
                  setIsDemoData(false);
                } else {
                  setDiscs(prev=>prev.map(d=>d.id===tempId?{...d,id:saved.id}:d));
                }
              }
              showToast(`"${nD.name}" créée ✓`);
            }}>＋</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ── MOCK DATA MULTI-TENANT ────────────────────────────────────────────────────
const TENANTS_DATA = [
  { id:"t1", name:"Yogalate Paris",    plan:"Pro",     members:124, revenue:"6 240 €", status:"actif",    city:"Paris 1er",    since:"Jan 2025" },
  { id:"t2", name:"Zen Studio Lyon",   plan:"Essentiel", members:48,  revenue:"1 890 €", status:"actif",    city:"Lyon 2e",      since:"Mar 2025" },
  { id:"t3", name:"Flow Bordeaux",     plan:"Pro",     members:87,  revenue:"4 120 €", status:"actif",    city:"Bordeaux",     since:"Fév 2025" },
  { id:"t4", name:"Pilates Nice",      plan:"Essentiel", members:31,  revenue:"980 €",   status:"suspendu", city:"Nice",         since:"Avr 2025" },
  { id:"t5", name:"Ashtanga Nantes",   plan:"Pro",     members:105, revenue:"5 100 €", status:"actif",    city:"Nantes",       since:"Nov 2024" },
];
const USERS_DATA = [
  { id:"u1", fn:"Marie",   ln:"Laurent",  email:"marie.l@yogalate.fr",  role:"admin",    tenant:"t1", status:"actif",   lastLogin:"Aujourd'hui" },
  { id:"u2", fn:"Thomas",  ln:"Blanc",    email:"thomas.b@yogalate.fr", role:"staff",    tenant:"t1", status:"actif",   lastLogin:"Hier" },
  { id:"u3", fn:"Sophie",  ln:"Leroux",   email:"sophie@yogalate.fr",   role:"adherent", tenant:"t1", status:"actif",   lastLogin:"Il y a 3j" },
  { id:"u4", fn:"Claire",  ln:"Martin",   email:"claire@yogalate.fr",   role:"adherent", tenant:"t1", status:"actif",   lastLogin:"Aujourd'hui" },
  { id:"u5", fn:"Paul",    ln:"Dubois",   email:"paul@zenstudio.fr",    role:"admin",    tenant:"t2", status:"actif",   lastLogin:"Il y a 2j" },
  { id:"u6", fn:"Julie",   ln:"Bernard",  email:"julie@zenstudio.fr",   role:"staff",    tenant:"t2", status:"actif",   lastLogin:"Il y a 5j" },
  { id:"u7", fn:"Antoine", ln:"Girard",   email:"ant@flow.fr",          role:"admin",    tenant:"t3", status:"actif",   lastLogin:"Hier" },
  { id:"u8", fn:"Nadia",   ln:"Blanco",   email:"nadia@flow.fr",        role:"adherent", tenant:"t3", status:"suspendu",lastLogin:"Il y a 14j" },
];
const ROLES_DEF = {
  superadmin: { label:"Super Admin", color:"#7C3AED", bg:"#F3EEFF", desc:"Accès complet à tous les tenants, configuration plateforme, facturation" },
  admin:      { label:"Admin",       color:"#B07848", bg:"#F5EBE0", desc:"Gestion complète du studio : membres, planning, paiements, paramètres" },
  staff:      { label:"Staff",       color:"#3A6E90", bg:"#E6EFF5", desc:"Accès planning et membres, pas d'accès aux paramètres ni paiements" },
  adherent:   { label:"Adhérent",    color:"#4E8A58", bg:"#E6F2E8", desc:"Accès à son espace personnel, réservations et historique de séances" },
};

function RoleBadge({ role }) {
  const r = ROLES_DEF[role] || ROLES_DEF.adherent;
  return <span style={{ fontSize:11, fontWeight:700, color:r.color, background:r.bg, padding:"3px 9px", borderRadius:10, whiteSpace:"nowrap" }}>{r.label}</span>;
}




// ── AIDE ILLUSTRATIONS — visuels SVG pour les guides ────────────────────────
function AideIllustration({ type, color = "#3A6E90" }) {
  const bg = "#F8F4EE";
  const border = "#DDD5C8";
  const text = "#2A1F14";
  const muted = "#8C7B6C";
  const soft = "#B0A090";
  const accent = color;
  const accentLight = `${color}18`;

  const w = "100%";
  const h = 130;

  if (type === "rec_open") return (
    <svg width={w} height={h} viewBox="0 0 500 130" style={{ borderRadius: 10, border: `1px solid ${border}` }}>
      <rect width="500" height="130" fill={bg}/>
      {/* Bouton + Séance */}
      <rect x="20" y="16" width="100" height="32" rx="8" fill={accent}/>
      <text x="70" y="37" textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff">＋ Séance</text>
      {/* Flèche */}
      <path d="M128 32 L170 32" stroke={accent} strokeWidth="2" markerEnd="url(#arr)"/>
      <defs><marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill={accent}/></marker></defs>
      {/* Panel toggle */}
      <rect x="175" y="8" width="305" height="114" rx="10" fill="#fff" stroke={border} strokeWidth="1.5"/>
      {/* Tab unique */}
      <rect x="185" y="18" width="136" height="30" rx="7" fill={accentLight} stroke={accent} strokeWidth="1.5"/>
      <text x="253" y="38" textAnchor="middle" fontSize="12" fontWeight="700" fill={accent}>📅 Séance unique</text>
      {/* Tab récurrence — actif */}
      <rect x="328" y="18" width="142" height="30" rx="7" fill={accent}/>
      <text x="399" y="38" textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff">🔁 Récurrence</text>
      {/* Sous-titre */}
      <text x="328" y="75" textAnchor="middle" fontSize="11" fill={muted}>Sélectionnez l&apos;onglet</text>
      <text x="328" y="92" textAnchor="middle" fontSize="11" fontWeight="700" fill={accent}>🔁 Récurrence</text>
    </svg>
  );

  if (type === "rec_slots") return (
    <svg width={w} height={h} viewBox="0 0 500 130" style={{ borderRadius: 10, border: `1px solid ${border}` }}>
      <rect width="500" height="130" fill={bg}/>
      <text x="16" y="22" fontSize="10" fontWeight="700" fill={muted} style={{textTransform:"uppercase",letterSpacing:1}}>CRÉNEAUX À INCLURE</text>
      {/* Créneau 1 coché — Pilates */}
      <rect x="16" y="30" width="224" height="38" rx="8" fill={accentLight} stroke={accent} strokeWidth="1.5"/>
      <rect x="28" y="43" width="14" height="14" rx="3" fill={accent}/>
      <text x="43" y="53" fontSize="11" fill="#fff" fontWeight="800">✓</text>
      <text x="52" y="48" fontSize="12" fontWeight="700" fill={accent}>⚡ Pilates</text>
      <text x="52" y="62" fontSize="10" fill={muted}>Mardi · 17:30 · 60 min</text>
      {/* Select coach visible sous créneau 1 */}
      <rect x="16" y="70" width="224" height="26" rx="0 0 8 8" fill="rgba(160,104,56,.06)" stroke={accent} strokeWidth="1" strokeDasharray="0"/>
      <text x="28" y="88" fontSize="10" fontWeight="700" fill={muted}>COACH</text>
      <rect x="68" y="76" width="160" height="18" rx="5" fill="#fff" stroke={border} strokeWidth="1"/>
      <text x="78" y="89" fontSize="10" fill={text}>Sophie Laurent</text>
      {/* Créneau 2 coché — Yoga */}
      <rect x="252" y="30" width="232" height="38" rx="8" fill={accentLight} stroke={accent} strokeWidth="1.5"/>
      <rect x="264" y="43" width="14" height="14" rx="3" fill={accent}/>
      <text x="279" y="53" fontSize="11" fill="#fff" fontWeight="800">✓</text>
      <text x="288" y="48" fontSize="12" fontWeight="700" fill={accent}>🧘 Yoga Vinyasa</text>
      <text x="288" y="62" fontSize="10" fill={muted}>Mercredi · 18:30 · 60 min</text>
      <rect x="252" y="70" width="232" height="26" rx="0 0 8 8" fill="rgba(160,104,56,.06)" stroke={accent} strokeWidth="1"/>
      <text x="264" y="88" fontSize="10" fontWeight="700" fill={muted}>COACH</text>
      <rect x="304" y="76" width="168" height="18" rx="5" fill="#fff" stroke={border} strokeWidth="1"/>
      <text x="314" y="89" fontSize="10" fill={text}>Marie Dubois</text>
      {/* Créneau non coché */}
      <rect x="16" y="102" width="150" height="22" rx="6" fill="#fff" stroke={border} strokeWidth="1"/>
      <rect x="26" y="109" width="12" height="12" rx="3" fill="none" stroke={border} strokeWidth="1.5"/>
      <text x="45" y="122" fontSize="10" fill={muted}>☯ Méditation · Dim 09:30</text>
    </svg>
  );

  if (type === "rec_params") return (
    <svg width={w} height={h} viewBox="0 0 500 130" style={{ borderRadius: 10, border: `1px solid ${border}` }}>
      <rect width="500" height="130" fill={bg}/>
      <text x="16" y="20" fontSize="10" fontWeight="700" fill={muted} style={{textTransform:"uppercase",letterSpacing:1}}>2 · PARAMÈTRES</text>
      {/* Coach par défaut */}
      <text x="16" y="38" fontSize="10" fontWeight="700" fill={muted}>COACH PAR DÉFAUT</text>
      <rect x="16" y="44" width="230" height="28" rx="7" fill="#fff" stroke={accent} strokeWidth="1.5"/>
      <text x="28" y="63" fontSize="12" fill={text}>Marie Dubois</text>
      <text x="230" y="63" fontSize="14" fill={muted}>▾</text>
      <text x="255" y="40" fontSize="10" fill={soft} fontStyle="italic">→ S&apos;applique aux créneaux</text>
      <text x="255" y="53" fontSize="10" fill={soft} fontStyle="italic">  sans coach spécifique</text>
      {/* Places */}
      <text x="16" y="88" fontSize="10" fontWeight="700" fill={muted}>PLACES</text>
      <rect x="16" y="94" width="100" height="28" rx="7" fill="#fff" stroke={border} strokeWidth="1.5"/>
      <text x="66" y="113" textAnchor="middle" fontSize="13" fill={text}>12</text>
      {/* Salle */}
      <text x="130" y="88" fontSize="10" fontWeight="700" fill={muted}>SALLE</text>
      <rect x="130" y="94" width="116" height="28" rx="7" fill="#fff" stroke={border} strokeWidth="1.5"/>
      <text x="188" y="113" textAnchor="middle" fontSize="12" fill={text}>Studio A</text>
    </svg>
  );

  if (type === "rec_period") return (
    <svg width={w} height={h} viewBox="0 0 500 130" style={{ borderRadius: 10, border: `1px solid ${border}` }}>
      <rect width="500" height="130" fill={bg}/>
      <text x="16" y="20" fontSize="10" fontWeight="700" fill={muted} style={{textTransform:"uppercase",letterSpacing:1}}>3 · PÉRIODE</text>
      {/* Du */}
      <text x="16" y="40" fontSize="10" fontWeight="700" fill={muted}>DU</text>
      <rect x="16" y="46" width="180" height="32" rx="8" fill="#fff" stroke={accent} strokeWidth="1.5"/>
      <text x="26" y="67" fontSize="13" fontWeight="600" fill={text}>04 / 07 / 2026</text>
      {/* Au */}
      <text x="210" y="40" fontSize="10" fontWeight="700" fill={muted}>AU</text>
      <rect x="210" y="46" width="180" height="32" rx="8" fill="#fff" stroke={accent} strokeWidth="1.5"/>
      <text x="220" y="67" fontSize="13" fontWeight="600" fill={text}>12 / 12 / 2026</text>
      {/* Flèche et résultat */}
      <path d="M402 62 L430 62" stroke={accent} strokeWidth="2"/>
      <rect x="432" y="46" width="60" height="32" rx="8" fill={accent}/>
      <text x="462" y="58" textAnchor="middle" fontSize="10" fontWeight="800" fill="#fff">23</text>
      <text x="462" y="71" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,.8)">séances</text>
      {/* Ligne du temps */}
      <line x1="16" y1="106" x2="484" y2="106" stroke={border} strokeWidth="1.5"/>
      {[0,1,2,3,4,5,6,7].map(i => (
        <g key={i}>
          <circle cx={16 + i*66} cy={106} r={4} fill={i===0||i===7?accent:accentLight} stroke={accent} strokeWidth="1"/>
          {i===0&&<text x={16} y={122} textAnchor="middle" fontSize="9" fill={accent} fontWeight="700">Juil</text>}
          {i===7&&<text x={484} y={122} textAnchor="middle" fontSize="9" fill={accent} fontWeight="700">Déc</text>}
        </g>
      ))}
    </svg>
  );

  if (type === "rec_preview") return (
    <svg width={w} height={h} viewBox="0 0 500 130" style={{ borderRadius: 10, border: `1px solid ${border}` }}>
      <rect width="500" height="130" fill={bg}/>
      <text x="16" y="20" fontSize="10" fontWeight="700" fill={muted}>4 · SÉANCES GÉNÉRÉES — modifiables avant validation</text>
      {/* Lignes séances */}
      {[
        { icon:"⚡", date:"mar. 7 juil. · 17:30 · 60min", coach:"Sophie Laurent", i:0 },
        { icon:"🧘", date:"mer. 8 juil. · 18:30 · 60min", coach:"Marie Dubois",   i:1 },
        { icon:"⚡", date:"mar. 14 juil. · 17:30 · 60min", coach:"Sophie Laurent", del:true, i:2 },
        { icon:"🧘", date:"mer. 15 juil. · 18:30 · 60min", coach:"Marie Dubois",   i:3 },
      ].map(row => (
        <g key={row.i}>
          <rect x="16" y={28+row.i*23} width="468" height="20" rx="5" fill={row.del?"#FFF0F0":"#F0FAF0"} stroke={row.del?"#F8C8C8":"#C8E6CC"} strokeWidth="1"/>
          <text x="26" y={42+row.i*23} fontSize="12">{row.icon}</text>
          <text x="44" y={42+row.i*23} fontSize="11" fontWeight="600" fill={row.del?"#C0392B":"#2A5E38"}>{row.date}</text>
          {/* Select coach */}
          <rect x="260" y={31+row.i*23} width="170" height="14" rx="4" fill="#fff" stroke={row.del?"#F8C8C8":border} strokeWidth="1"/>
          <text x="268" y={42+row.i*23} fontSize="10" fill={row.del?"#C0392B":text}>{row.coach}</text>
          {/* Bouton ✕ */}
          <text x="450" y={42+row.i*23} fontSize="13" fill={row.del?"#F87171":"#D0C8C0"} fontWeight="700">✕</text>
          {row.del && <line x1="44" y1={38+row.i*23} x2="250" y2={38+row.i*23} stroke="#F87171" strokeWidth="1" strokeOpacity="0.6"/>}
        </g>
      ))}
      <text x="16" y="126" fontSize="10" fill={muted} fontStyle="italic">Cliquez ✕ pour supprimer une date (ex: jour férié) · Modifiez le coach par séance</text>
    </svg>
  );

  if (type === "rec_confirm") return (
    <svg width={w} height={h} viewBox="0 0 500 130" style={{ borderRadius: 10, border: `1px solid ${border}` }}>
      <rect width="500" height="130" fill={bg}/>
      {/* Badge compteur */}
      <rect x="16" y="16" width="120" height="40" rx="10" fill="#EAF5EC" stroke="#A8D5B0" strokeWidth="1.5"/>
      <text x="76" y="30" textAnchor="middle" fontSize="11" fill="#3A6E46">Total</text>
      <text x="76" y="48" textAnchor="middle" fontSize="22" fontWeight="800" fill="#3A6E46">22</text>
      <text x="152" y="32" fontSize="11" fill={muted}>séances générées</text>
      <text x="152" y="46" fontSize="10" fill={soft}>du 4 juil. au 12 déc. 2026</text>
      {/* Bouton Créer */}
      <rect x="16" y="72" width="220" height="40" rx="10" fill={accent}/>
      <text x="126" y="97" textAnchor="middle" fontSize="14" fontWeight="800" fill="#fff">✦ Créer 22 séances</text>
      {/* Bouton Annuler */}
      <rect x="248" y="72" width="100" height="40" rx="10" fill="#fff" stroke={border} strokeWidth="1.5"/>
      <text x="298" y="97" textAnchor="middle" fontSize="13" fill={muted}>Annuler</text>
      {/* Confirmation */}
      <rect x="16" y="118" width="468" height="0" rx="0"/>
      <text x="260" y="122" textAnchor="middle" fontSize="10" fill={muted} fontStyle="italic">→ Les séances apparaissent immédiatement dans le planning</text>
    </svg>
  );


  // ── Tableau de bord ───────────────────────────────────────────────────────
  if (type === "dash_overview") return (
    <svg width={w} height={h} viewBox="0 0 500 130" style={{ borderRadius:10, border:`1px solid ${border}` }}>
      <rect width="500" height="130" fill={bg}/>
      {/* KPI cards */}
      {[{x:16,label:"Séances",val:"8",delta:"+2"},{x:136,label:"Adhérents",val:"42",delta:"+5"},{x:256,label:"Revenus",val:"1 240 €",delta:"+8%"}].map((k,i)=>(
        <g key={i}>
          <rect x={k.x} y="14" width="108" height="46" rx="9" fill="#fff" stroke={border} strokeWidth="1.5"/>
          <text x={k.x+10} y="30" fontSize="10" fill={muted}>{k.label}</text>
          <text x={k.x+10} y="48" fontSize="17" fontWeight="800" fill={text}>{k.val}</text>
          <text x={k.x+90} y="48" fontSize="10" fill="#34D399" fontWeight="700" textAnchor="end">{k.delta}</text>
        </g>
      ))}
      {/* Prochaine séance */}
      <rect x="16" y="70" width="348" height="48" rx="9" fill="#fff" stroke={border} strokeWidth="1.5"/>
      <rect x="16" y="70" width="5" height="48" rx="3 0 0 3" fill={accent}/>
      <text x="30" y="88" fontSize="12" fontWeight="700" fill={text}>🧘 Yoga Vinyasa</text>
      <text x="30" y="105" fontSize="11" fill={muted}>Aujourd'hui 18:30 · Sophie Laurent · 8/12 places</text>
      <rect x="374" y="70" width="110" height="48" rx="9" fill={accentLight} stroke={accent} strokeWidth="1"/>
      <text x="429" y="94" textAnchor="middle" fontSize="10" fontWeight="700" fill={accent}>Prochaines</text>
      <text x="429" y="108" textAnchor="middle" fontSize="10" fill={muted}>séances →</text>
    </svg>
  );

  if (type === "nav_overview") return (
    <svg width={w} height={h} viewBox="0 0 500 130" style={{ borderRadius:10, border:`1px solid ${border}` }}>
      <rect width="500" height="130" fill={bg}/>
      {/* Sidebar */}
      <rect x="16" y="10" width="148" height="110" rx="10" fill="#fff" stroke={border} strokeWidth="1.5"/>
      <text x="30" y="28" fontSize="14" fontWeight="800" fill={text}>Fyde<tspan fill={accent}>lys</tspan></text>
      {[
        {y:38,label:"Tableau de bord",active:true},
        {y:54,label:"Planning"},
        {y:70,label:"Adhérents"},
        {y:86,label:"Paiements"},
        {y:102,label:"Paramètres"},
      ].map((n,i)=>(
        <g key={i}>
          {n.active && <rect x="16" y={n.y-10} width="148" height="18" fill={accentLight}/>}
          {n.active && <rect x="16" y={n.y-10} width="3" height="18" fill={accent}/>}
          <text x="30" y={n.y+2} fontSize="11" fontWeight={n.active?"700":"400"} fill={n.active?accent:muted}>{n.label}</text>
        </g>
      ))}
      {/* Mobile nav */}
      <rect x="180" y="98" width="304" height="32" rx="8" fill="#fff" stroke={border} strokeWidth="1.5"/>
      <text x="332" y="110" textAnchor="middle" fontSize="9" fill={muted}>Version mobile : barre de navigation en bas</text>
      {["🏠","📅","👥","💳","⚙️"].map((ic,i)=>(
        <text key={i} x={196+i*56} y="124" fontSize="14" textAnchor="middle">{ic}</text>
      ))}
    </svg>
  );

  if (type === "subdomain_overview") return (
    <svg width={w} height={h} viewBox="0 0 500 130" style={{ borderRadius:10, border:`1px solid ${border}` }}>
      <rect width="500" height="130" fill={bg}/>
      {/* URL bar */}
      <rect x="16" y="20" width="468" height="32" rx="8" fill="#fff" stroke={border} strokeWidth="1.5"/>
      <rect x="22" y="26" width="20" height="20" rx="4" fill="#34D399" opacity="0.2"/>
      <text x="32" y="40" fontSize="11" fill="#34D399" textAnchor="middle">🔒</text>
      <text x="52" y="40" fontSize="13" fill={muted}>yogalatestudio</text>
      <text x="168" y="40" fontSize="13" fontWeight="700" fill={accent}>.fydelys.fr</text>
      <text x="260" y="40" fontSize="13" fill={muted}>/dashboard</text>
      {/* Flèches rôles */}
      {[
        {x:50, role:"Admin", color:"#A06838", bg:"#F5EBE0"},
        {x:200, role:"Coach", color:"#3A6E90", bg:"#E6EFF5"},
        {x:350, role:"Adhérent", color:"#4E8A58", bg:"#EAF5EC"},
      ].map((r,i)=>(
        <g key={i}>
          <rect x={r.x} y="72" width="100" height="44" rx="9" fill={r.bg} stroke={r.color} strokeWidth="1.5"/>
          <text x={r.x+50} y="92" textAnchor="middle" fontSize="11" fontWeight="700" fill={r.color}>{r.role}</text>
          <text x={r.x+50} y="107" textAnchor="middle" fontSize="10" fill={r.color} opacity="0.7">→ son espace</text>
          <path d={`M${r.x+50} 55 L${r.x+50} 70`} stroke={r.color} strokeWidth="1.5" markerEnd="url(#arr2)"/>
        </g>
      ))}
      <defs><marker id="arr2" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill={muted}/></marker></defs>
      <text x="250" y="58" textAnchor="middle" fontSize="10" fill={muted}>Même URL — espace différent selon le rôle</text>
    </svg>
  );

  // ── Adhérents ─────────────────────────────────────────────────────────────
  if (type === "member_add") return (
    <svg width={w} height={h} viewBox="0 0 500 130" style={{ borderRadius:10, border:`1px solid ${border}` }}>
      <rect width="500" height="130" fill={bg}/>
      <text x="16" y="22" fontSize="12" fontWeight="700" fill={text}>👥 Adhérents</text>
      {/* Liste */}
      {[{y:30,n:"Dupont Marie"},{y:52,n:"Martin Pierre"},{y:74,n:"Bernard Lucie"}].map((r,i)=>(
        <g key={i}><rect x="16" y={r.y} width="300" height="20" rx="5" fill="#fff" stroke={border} strokeWidth="1"/>
        <text x="28" y={r.y+14} fontSize="11" fill={text}>{r.n}</text></g>
      ))}
      {/* Bouton + Ajouter */}
      <rect x="350" y="20" width="134" height="34" rx="9" fill={accent}/>
      <text x="417" y="42" textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff">+ Ajouter</text>
      <path d="M340 37 L352 37" stroke={accent} strokeWidth="2"/>
      <circle cx="336" cy="37" r="6" fill={accentLight} stroke={accent} strokeWidth="1.5"/>
      <text x="336" y="41" textAnchor="middle" fontSize="10" fill={accent}>←</text>
    </svg>
  );

  if (type === "member_form") return (
    <svg width={w} height={h} viewBox="0 0 500 130" style={{ borderRadius:10, border:`1px solid ${border}` }}>
      <rect width="500" height="130" fill={bg}/>
      <rect x="16" y="10" width="468" height="110" rx="10" fill="#fff" stroke={border} strokeWidth="1.5"/>
      <text x="28" y="28" fontSize="13" fontWeight="700" fill={text}>Nouvel adhérent</text>
      {[{x:28,y:38,label:"PRÉNOM",val:"Marie"},{x:260,y:38,label:"NOM",val:"Dupont"},{x:28,y:74,label:"EMAIL",val:"marie@gmail.com"},{x:260,y:74,label:"TÉLÉPHONE",val:"06 12 34 56 78"}].map((f,i)=>(
        <g key={i}>
          <text x={f.x} y={f.y+8} fontSize="9" fontWeight="700" fill={muted}>{f.label}</text>
          <rect x={f.x} y={f.y+12} width="200" height="22" rx="6" fill={bg} stroke={i===2?accent:border} strokeWidth={i===2?"1.5":"1"}/>
          <text x={f.x+8} y={f.y+27} fontSize="12" fill={text}>{f.val}</text>
        </g>
      ))}
      <rect x="28" y="105" width="120" height="8" rx="4" fill={accent} opacity="0.8"/>
      <text x="88" y="113" textAnchor="middle" fontSize="9" fill="#fff" fontWeight="700">Enregistrer</text>
    </svg>
  );

  if (type === "member_link") return (
    <svg width={w} height={h} viewBox="0 0 500 130" style={{ borderRadius:10, border:`1px solid ${border}` }}>
      <rect width="500" height="130" fill={bg}/>
      {/* Email */}
      <rect x="16" y="10" width="220" height="110" rx="10" fill="#fff" stroke={border} strokeWidth="1.5"/>
      <rect x="16" y="10" width="220" height="28" rx="10 10 0 0" fill="#2A1F14"/>
      <text x="126" y="29" textAnchor="middle" fontSize="12" fontWeight="800" fill="#fff">Yoga Flow Paris</text>
      <text x="26" y="54" fontSize="11" fontWeight="700" fill={text}>Bonjour Marie 👋</text>
      <text x="26" y="70" fontSize="10" fill={muted} style={{lineHeight:1.5}}>Votre lien d'accès</text>
      <text x="26" y="83" fontSize="10" fill={muted}>à Yoga Flow Paris</text>
      <rect x="26" y="92" width="190" height="22" rx="7" fill={accent}/>
      <text x="121" y="107" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">Accéder à mon espace ✦</text>
      {/* Flèche */}
      <path d="M244 65 L272 65" stroke={accent} strokeWidth="2"/>
      <text x="258" y="60" textAnchor="middle" fontSize="10" fill={muted}>1 clic</text>
      {/* Espace membre */}
      <rect x="278" y="10" width="206" height="110" rx="10" fill={accentLight} stroke={accent} strokeWidth="1.5"/>
      <text x="381" y="34" textAnchor="middle" fontSize="12" fontWeight="700" fill={accent}>Espace Membre</text>
      <text x="381" y="52" textAnchor="middle" fontSize="10" fill={muted}>Planning · Historique</text>
      <text x="381" y="66" textAnchor="middle" fontSize="10" fill={muted}>Abonnement · Paiement</text>
      <rect x="298" y="78" width="166" height="28" rx="8" fill={accent}/>
      <text x="381" y="97" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">✓ Connecté automatiquement</text>
    </svg>
  );

  // ── Disciplines ───────────────────────────────────────────────────────────
  if (type === "disc_create") return (
    <svg width={w} height={h} viewBox="0 0 500 130" style={{ borderRadius:10, border:`1px solid ${border}` }}>
      <rect width="500" height="130" fill={bg}/>
      <rect x="16" y="10" width="468" height="110" rx="10" fill="#fff" stroke={border} strokeWidth="1.5"/>
      <text x="28" y="28" fontSize="13" fontWeight="700" fill={text}>Nouvelle discipline</text>
      {/* Icône selector */}
      <text x="28" y="50" fontSize="9" fontWeight="700" fill={muted}>ICÔNE</text>
      {["🧘","⚡","☯","🌙","💃","🔥"].map((ic,i)=>(
        <g key={i}>
          <rect x={28+i*42} y="55" width="34" height="34" rx="8" fill={i===0?accentLight:bg} stroke={i===0?accent:border} strokeWidth={i===0?"1.5":"1"}/>
          <text x={45+i*42} y="78" textAnchor="middle" fontSize="18">{ic}</text>
        </g>
      ))}
      {/* Nom + couleur */}
      <text x="28" y="104" fontSize="9" fontWeight="700" fill={muted}>NOM</text>
      <rect x="28" y="108" width="160" height="18" rx="5" fill={bg} stroke={accent} strokeWidth="1.5"/>
      <text x="36" y="121" fontSize="11" fill={text}>Yoga Vinyasa</text>
      <text x="205" y="104" fontSize="9" fontWeight="700" fill={muted}>COULEUR</text>
      {["#C4956A","#6B9E7A","#6A8FAE","#AE7A7A"].map((col,i)=>(
        <circle key={i} cx={212+i*22} cy={117} r="8" fill={col} stroke={i===0?"#2A1F14":"none"} strokeWidth="2"/>
      ))}
    </svg>
  );

  if (type === "disc_slots") return (
    <svg width={w} height={h} viewBox="0 0 500 130" style={{ borderRadius:10, border:`1px solid ${border}` }}>
      <rect width="500" height="130" fill={bg}/>
      <text x="16" y="18" fontSize="10" fontWeight="700" fill={muted}>CRÉNEAUX RÉCURRENTS</text>
      {[
        {y:24,day:"Mardi",time:"17:30",dur:"60 min",col:accent},
        {y:56,day:"Jeudi",time:"12:00",dur:"45 min",col:accent},
        {y:88,day:"+ Ajouter",isAdd:true},
      ].map((s,i)=>(
        <g key={i}>
          <rect x="16" y={s.y} width="468" height="26" rx="7" fill={s.isAdd?"transparent":"#fff"} stroke={s.isAdd?"#DDD5C8":s.col} strokeWidth={s.isAdd?"1":"1.5"} strokeDasharray={s.isAdd?"4 3":"0"}/>
          {s.isAdd
            ? <text x="250" y={s.y+17} textAnchor="middle" fontSize="11" fill={muted}>{s.day}</text>
            : <>
              <rect x="24" y={s.y+5} width="80" height="16" rx="5" fill={accentLight}/>
              <text x="64" y={s.y+17} textAnchor="middle" fontSize="11" fontWeight="600" fill={accent}>{s.day}</text>
              <rect x="116" y={s.y+5} width="60" height="16" rx="5" fill={bg}/>
              <text x="146" y={s.y+17} textAnchor="middle" fontSize="11" fill={text}>{s.time}</text>
              <text x="220" y={s.y+17} fontSize="11" fill={muted}>{s.dur}</text>
              <text x="472" y={s.y+17} textAnchor="end" fontSize="12" fill="#F87171">✕</text>
            </>
          }
        </g>
      ))}
      <text x="16" y="122" fontSize="10" fill={muted} fontStyle="italic">Ces créneaux sont proposés automatiquement dans Planning → Récurrence</text>
    </svg>
  );

  if (type === "disc_coaches") return (
    <svg width={w} height={h} viewBox="0 0 500 130" style={{ borderRadius:10, border:`1px solid ${border}` }}>
      <rect width="500" height="130" fill={bg}/>
      <text x="16" y="18" fontSize="10" fontWeight="700" fill={muted}>DISCIPLINES PAR COACH</text>
      {[
        {y:26,name:"Sophie Laurent",discs:["🧘 Yoga","⚡ Pilates"]},
        {y:70,name:"Marie Dubois",discs:["☯ Méditation","🌙 Yin Yoga"]},
      ].map((c,i)=>(
        <g key={i}>
          <rect x="16" y={c.y} width="468" height="38" rx="9" fill="#fff" stroke={border} strokeWidth="1.5"/>
          <circle cx="38" cy={c.y+19} r="14" fill={accentLight} stroke={accent} strokeWidth="1"/>
          <text x="38" y={c.y+23} textAnchor="middle" fontSize="11" fontWeight="700" fill={accent}>{c.name.split(" ").map(n=>n[0]).join("")}</text>
          <text x="58" y={c.y+17} fontSize="12" fontWeight="600" fill={text}>{c.name}</text>
          {c.discs.map((d,j)=>(
            <g key={j}>
              <rect x={58+j*110} y={c.y+22} width="100" height="14" rx="5" fill={accentLight}/>
              <text x={108+j*110} y={c.y+32} textAnchor="middle" fontSize="10" fill={accent}>{d}</text>
            </g>
          ))}
        </g>
      ))}
    </svg>
  );

  // ── Abonnements ───────────────────────────────────────────────────────────
  if (type === "sub_monthly") return (
    <svg width={w} height={h} viewBox="0 0 500 130" style={{ borderRadius:10, border:`1px solid ${border}` }}>
      <rect width="500" height="130" fill={bg}/>
      <rect x="16" y="16" width="140" height="100" rx="12" fill={accent}/>
      <text x="86" y="38" textAnchor="middle" fontSize="11" fill="rgba(255,255,255,.7)">MENSUEL ILLIMITÉ</text>
      <text x="86" y="62" textAnchor="middle" fontSize="28" fontWeight="800" fill="#fff">∞</text>
      <text x="86" y="82" textAnchor="middle" fontSize="12" fill="rgba(255,255,255,.9)">séances / mois</text>
      <text x="86" y="104" textAnchor="middle" fontSize="14" fontWeight="700" fill="#fff">49 €/mois</text>
      <text x="185" y="38" fontSize="12" fontWeight="700" fill={text}>Idéal pour les pratiquants réguliers</text>
      <text x="185" y="58" fontSize="11" fill={muted}>✓  Accès illimité à toutes les séances</text>
      <text x="185" y="74" fontSize="11" fill={muted}>✓  Prélèvement mensuel automatique</text>
      <text x="185" y="90" fontSize="11" fill={muted}>✓  Annulation à tout moment</text>
    </svg>
  );

  if (type === "sub_credits") return (
    <svg width={w} height={h} viewBox="0 0 500 130" style={{ borderRadius:10, border:`1px solid ${border}` }}>
      <rect width="500" height="130" fill={bg}/>
      <rect x="16" y="16" width="140" height="100" rx="12" fill="#3A6E90"/>
      <text x="86" y="38" textAnchor="middle" fontSize="11" fill="rgba(255,255,255,.7)">CARNET</text>
      <text x="86" y="66" textAnchor="middle" fontSize="32" fontWeight="800" fill="#fff">10</text>
      <text x="86" y="84" textAnchor="middle" fontSize="11" fill="rgba(255,255,255,.8)">séances</text>
      <text x="86" y="104" textAnchor="middle" fontSize="14" fontWeight="700" fill="#fff">85 €</text>
      {/* Barre crédit */}
      <text x="185" y="38" fontSize="12" fontWeight="700" fill={text}>Crédits restants : 7 / 10</text>
      <rect x="185" y="44" width="280" height="10" rx="5" fill={border}/>
      <rect x="185" y="44" width="196" height="10" rx="5" fill="#3A6E90"/>
      <text x="185" y="70" fontSize="11" fill={muted}>✓  Valable 3 mois</text>
      <text x="185" y="85" fontSize="11" fill={muted}>✓  -1 crédit par séance</text>
      <text x="185" y="100" fontSize="11" fill={muted}>✓  Rechargeable à tout moment</text>
    </svg>
  );

  if (type === "sub_single") return (
    <svg width={w} height={h} viewBox="0 0 500 130" style={{ borderRadius:10, border:`1px solid ${border}` }}>
      <rect width="500" height="130" fill={bg}/>
      <rect x="16" y="16" width="140" height="100" rx="12" fill="#4E8A58"/>
      <text x="86" y="38" textAnchor="middle" fontSize="11" fill="rgba(255,255,255,.7)">À L'UNITÉ</text>
      <text x="86" y="70" textAnchor="middle" fontSize="28" fill="#fff">1️⃣</text>
      <text x="86" y="88" textAnchor="middle" fontSize="11" fill="rgba(255,255,255,.8)">séance</text>
      <text x="86" y="104" textAnchor="middle" fontSize="14" fontWeight="700" fill="#fff">12 €</text>
      <text x="185" y="38" fontSize="12" fontWeight="700" fill={text}>Idéal pour les adhérents occasionnels</text>
      <text x="185" y="58" fontSize="11" fill={muted}>✓  Sans engagement</text>
      <text x="185" y="74" fontSize="11" fill={muted}>✓  Facturé à chaque séance</text>
      <text x="185" y="90" fontSize="11" fill={muted}>✓  Règlement à la séance</text>
    </svg>
  );

  // ── Paiements ─────────────────────────────────────────────────────────────
  if (type === "pay_list") return (
    <svg width={w} height={h} viewBox="0 0 500 130" style={{ borderRadius:10, border:`1px solid ${border}` }}>
      <rect width="500" height="130" fill={bg}/>
      <text x="16" y="18" fontSize="12" fontWeight="700" fill={text}>💳 Paiements</text>
      {[
        {y:24,name:"Dupont Marie",date:"10/03",amt:"49 €",mode:"CB",ok:true},
        {y:48,name:"Martin Pierre",date:"09/03",amt:"85 €",mode:"Virement",ok:true},
        {y:72,name:"Bernard Lucie",date:"08/03",amt:"12 €",mode:"Espèces",ok:true},
        {y:96,name:"Moreau Claire",date:"—",amt:"49 €",mode:"En attente",ok:false},
      ].map((r,i)=>(
        <g key={i}>
          <rect x="16" y={r.y} width="468" height="20" rx="5" fill="#fff" stroke={border} strokeWidth="1"/>
          <text x="28" y={r.y+14} fontSize="11" fontWeight="600" fill={text}>{r.name}</text>
          <text x="180" y={r.y+14} fontSize="11" fill={muted}>{r.date}</text>
          <text x="250" y={r.y+14} fontSize="11" fontWeight="700" fill={r.ok?text:"#F87171"}>{r.amt}</text>
          <rect x="330" y={r.y+4} width="70" height="14" rx="4" fill={r.ok?"#EAF5EC":"#FFF0F0"}/>
          <text x="365" y={r.y+14} textAnchor="middle" fontSize="9" fontWeight="700" fill={r.ok?"#3A6E46":"#C0392B"}>{r.mode}</text>
        </g>
      ))}
    </svg>
  );

  if (type === "pay_form") return (
    <svg width={w} height={h} viewBox="0 0 500 130" style={{ borderRadius:10, border:`1px solid ${border}` }}>
      <rect width="500" height="130" fill={bg}/>
      <rect x="16" y="10" width="468" height="110" rx="10" fill="#fff" stroke={border} strokeWidth="1.5"/>
      <text x="28" y="28" fontSize="13" fontWeight="700" fill={text}>Enregistrer un paiement</text>
      {[
        {x:28,y:36,label:"ADHÉRENT",val:"Dupont Marie",w:200},
        {x:244,y:36,label:"MONTANT",val:"49 €",w:120},
        {x:28,y:72,label:"DATE",val:"10/03/2026",w:120},
        {x:164,y:72,label:"MODE",val:"Carte bancaire",w:140},
      ].map((f,i)=>(
        <g key={i}>
          <text x={f.x} y={f.y+8} fontSize="9" fontWeight="700" fill={muted}>{f.label}</text>
          <rect x={f.x} y={f.y+12} width={f.w} height="20" rx="6" fill={bg} stroke={i===0?accent:border} strokeWidth={i===0?"1.5":"1"}/>
          <text x={f.x+8} y={f.y+26} fontSize="11" fill={text}>{f.val}</text>
        </g>
      ))}
      <rect x="28" y="102" width="130" height="10" rx="5" fill={accent} opacity="0.9"/>
      <text x="93" y="111" textAnchor="middle" fontSize="9" fill="#fff" fontWeight="700">Enregistrer</text>
    </svg>
  );

  if (type === "pay_link") return (
    <svg width={w} height={h} viewBox="0 0 500 130" style={{ borderRadius:10, border:`1px solid ${border}` }}>
      <rect width="500" height="130" fill={bg}/>
      {/* Paiement */}
      <rect x="16" y="20" width="140" height="90" rx="10" fill="#fff" stroke={border} strokeWidth="1.5"/>
      <text x="86" y="40" textAnchor="middle" fontSize="11" fontWeight="700" fill={text}>Paiement</text>
      <text x="86" y="60" textAnchor="middle" fontSize="20" fontWeight="800" fill={accent}>49 €</text>
      <text x="86" y="76" textAnchor="middle" fontSize="10" fill={muted}>Dupont Marie</text>
      <text x="86" y="90" textAnchor="middle" fontSize="10" fill={muted}>10/03/2026</text>
      {/* Lien */}
      <path d="M158 65 L190 65" stroke={accent} strokeWidth="2"/>
      <text x="174" y="60" textAnchor="middle" fontSize="9" fill={muted}>lié à</text>
      {/* Abonnement */}
      <rect x="195" y="20" width="140" height="90" rx="10" fill={accentLight} stroke={accent} strokeWidth="1.5"/>
      <text x="265" y="40" textAnchor="middle" fontSize="11" fontWeight="700" fill={accent}>Abonnement</text>
      <text x="265" y="58" textAnchor="middle" fontSize="11" fill={text}>Mensuel illimité</text>
      <text x="265" y="73" textAnchor="middle" fontSize="10" fill={muted}>Mars 2026</text>
      {/* Solde mis à jour */}
      <path d="M337 65 L368 65" stroke="#34D399" strokeWidth="2"/>
      <rect x="372" y="20" width="112" height="90" rx="10" fill="#EAF5EC" stroke="#A8D5B0" strokeWidth="1.5"/>
      <text x="428" y="40" textAnchor="middle" fontSize="10" fontWeight="700" fill="#3A6E46">Solde mis à jour</text>
      <text x="428" y="60" textAnchor="middle" fontSize="20" fontWeight="800" fill="#3A6E46">✓</text>
      <text x="428" y="78" textAnchor="middle" fontSize="10" fill="#4E8A58">En règle</text>
    </svg>
  );

  // ── Paramètres équipe ─────────────────────────────────────────────────────
  if (type === "team_list") return (
    <svg width={w} height={h} viewBox="0 0 500 130" style={{ borderRadius:10, border:`1px solid ${border}` }}>
      <rect width="500" height="130" fill={bg}/>
      <text x="16" y="18" fontSize="12" fontWeight="700" fill={text}>⚙️ Paramètres → Équipe</text>
      {[
        {y:26,name:"Sophie Laurent",role:"Coach",discs:"Yoga · Pilates",status:"actif",sc:"#EAF5EC",tc:"#3A6E46"},
        {y:60,name:"Marie Dubois",role:"Admin + Coach",discs:"Méditation · Yin Yoga",status:"actif",sc:"#EAF5EC",tc:"#3A6E46"},
        {y:94,name:"Thomas Petit",role:"Coach",discs:"Aucune discipline",status:"invité",sc:"#FFF8E8",tc:"#B07000"},
      ].map((r,i)=>(
        <g key={i}>
          <rect x="16" y={r.y} width="468" height="30" rx="8" fill="#fff" stroke={border} strokeWidth="1"/>
          <circle cx="36" cy={r.y+15} r="11" fill={accentLight}/>
          <text x="36" y={r.y+19} textAnchor="middle" fontSize="10" fontWeight="700" fill={accent}>{r.name.split(" ").map(n=>n[0]).join("")}</text>
          <text x="54" y={r.y+13} fontSize="12" fontWeight="600" fill={text}>{r.name}</text>
          <text x="54" y={r.y+25} fontSize="10" fill={muted}>{r.discs}</text>
          <rect x="340" y={r.y+8} width="70" height="14" rx="5" fill={r.sc}/>
          <text x="375" y={r.y+18} textAnchor="middle" fontSize="9" fontWeight="700" fill={r.tc}>{r.status}</text>
          <text x="458" y={r.y+18} fontSize="14" fill={muted}>···</text>
        </g>
      ))}
    </svg>
  );

  if (type === "team_invite") return (
    <svg width={w} height={h} viewBox="0 0 500 130" style={{ borderRadius:10, border:`1px solid ${border}` }}>
      <rect width="500" height="130" fill={bg}/>
      <rect x="16" y="10" width="220" height="110" rx="10" fill="#fff" stroke={border} strokeWidth="1.5"/>
      <text x="28" y="30" fontSize="13" fontWeight="700" fill={text}>Inviter un coach</text>
      {[{y:38,l:"PRÉNOM",v:"Thomas"},{y:65,l:"NOM",v:"Petit"},{y:92,l:"EMAIL",v:"thomas@studio.fr"}].map((f,i)=>(
        <g key={i}><text x="28" y={f.y+8} fontSize="9" fontWeight="700" fill={muted}>{f.l}</text>
        <rect x="28" y={f.y+11} width="190" height="18" rx="5" fill={bg} stroke={border} strokeWidth="1"/>
        <text x="36" y={f.y+23} fontSize="11" fill={text}>{f.v}</text></g>
      ))}
      {/* Email envoyé */}
      <rect x="254" y="10" width="230" height="110" rx="10" fill="#fff" stroke={border} strokeWidth="1.5"/>
      <rect x="254" y="10" width="230" height="28" rx="10 10 0 0" fill="#2A1F14"/>
      <text x="369" y="29" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">Yoga Flow Paris</text>
      <text x="264" y="54" fontSize="11" fontWeight="600" fill={text}>Bonjour Thomas 👋</text>
      <text x="264" y="70" fontSize="10" fill={muted}>Vous êtes invité(e)</text>
      <text x="264" y="83" fontSize="10" fill={muted}>à rejoindre l'équipe</text>
      <rect x="264" y="92" width="204" height="20" rx="7" fill={accent}/>
      <text x="366" y="106" textAnchor="middle" fontSize="10" fontWeight="700" fill="#fff">Rejoindre Yoga Flow Paris ✦</text>
    </svg>
  );

  if (type === "team_disciplines") return (
    <svg width={w} height={h} viewBox="0 0 500 130" style={{ borderRadius:10, border:`1px solid ${border}` }}>
      <rect width="500" height="130" fill={bg}/>
      <text x="16" y="18" fontSize="11" fontWeight="700" fill={text}>Gérer les disciplines de Sophie Laurent</text>
      <text x="16" y="32" fontSize="10" fill={muted}>Cochez les disciplines que ce coach peut enseigner</text>
      {[
        {x:16,y:40,name:"🧘 Yoga Vinyasa",checked:true},
        {x:16,y:68,name:"⚡ Pilates",checked:true},
        {x:16,y:96,name:"☯ Méditation",checked:false},
        {x:260,y:40,name:"🌙 Yin Yoga",checked:false},
        {x:260,y:68,name:"💃 Danse",checked:false},
      ].map((d,i)=>(
        <g key={i}>
          <rect x={d.x} y={d.y} width="224" height="22" rx="7" fill={d.checked?accentLight:"#fff"} stroke={d.checked?accent:border} strokeWidth={d.checked?"1.5":"1"}/>
          <rect x={d.x+8} y={d.y+5} width="12" height="12" rx="3" fill={d.checked?accent:"none"} stroke={d.checked?accent:border} strokeWidth="1.5"/>
          {d.checked && <text x={d.x+14} y={d.y+15} textAnchor="middle" fontSize="9" fill="#fff" fontWeight="700">✓</text>}
          <text x={d.x+28} y={d.y+15} fontSize="12" fill={d.checked?accent:text}>{d.name}</text>
        </g>
      ))}
    </svg>
  );

  // ── Login ─────────────────────────────────────────────────────────────────
  if (type === "login_email") return (
    <svg width={w} height={h} viewBox="0 0 500 130" style={{ borderRadius:10, border:`1px solid ${border}` }}>
      <rect width="500" height="130" fill={bg}/>
      <rect x="100" y="10" width="300" height="110" rx="14" fill="#fff" stroke={border} strokeWidth="1.5"/>
      <text x="250" y="34" textAnchor="middle" fontSize="14" fontWeight="800" fill={text}>Fyde<tspan fill={accent}>lys</tspan></text>
      <text x="250" y="50" textAnchor="middle" fontSize="11" fill={muted}>Connexion / Inscription</text>
      <text x="116" y="68" fontSize="10" fontWeight="700" fill={muted}>ADRESSE EMAIL</text>
      <rect x="116" y="72" width="268" height="24" rx="7" fill={bg} stroke={accent} strokeWidth="1.5"/>
      <text x="126" y="88" fontSize="12" fill={text}>marie@gmail.com</text>
      <rect x="116" y="104" width="268" height="10" rx="5" fill={accent}/>
      <text x="250" y="113" textAnchor="middle" fontSize="9" fill="#fff" fontWeight="700">Recevoir le lien ✦</text>
    </svg>
  );

  if (type === "login_email_sent") return (
    <svg width={w} height={h} viewBox="0 0 500 130" style={{ borderRadius:10, border:`1px solid ${border}` }}>
      <rect width="500" height="130" fill={bg}/>
      {/* Confirmation */}
      <rect x="16" y="10" width="200" height="110" rx="12" fill="#fff" stroke={border} strokeWidth="1.5"/>
      <circle cx="116" cy="44" r="20" fill="#EAF5EC" stroke="#A8D5B0" strokeWidth="1.5"/>
      <text x="116" y="52" textAnchor="middle" fontSize="20">✉</text>
      <text x="116" y="76" textAnchor="middle" fontSize="12" fontWeight="700" fill={text}>Vérifiez vos emails !</text>
      <text x="116" y="92" textAnchor="middle" fontSize="10" fill={muted}>Lien envoyé à</text>
      <rect x="40" y="98" width="152" height="16" rx="5" fill={accentLight}/>
      <text x="116" y="110" textAnchor="middle" fontSize="10" fontWeight="700" fill={accent}>marie@gmail.com</text>
      {/* Email */}
      <rect x="230" y="10" width="254" height="110" rx="12" fill="#fff" stroke={border} strokeWidth="1.5"/>
      <rect x="230" y="10" width="254" height="24" rx="12 12 0 0" fill="#2A1F14"/>
      <text x="357" y="27" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">Yoga Flow Paris</text>
      <text x="242" y="50" fontSize="11" fontWeight="600" fill={text}>Votre lien de connexion</text>
      <text x="242" y="65" fontSize="10" fill={muted}>Valable 1 heure · Usage unique</text>
      <rect x="242" y="74" width="228" height="22" rx="7" fill={accent}/>
      <text x="356" y="89" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">Accéder à mon espace ✦</text>
      <text x="242" y="112" fontSize="10" fill={soft} fontStyle="italic">Vérifiez vos spams si non reçu</text>
    </svg>
  );

  if (type === "login_connected") return (
    <svg width={w} height={h} viewBox="0 0 500 130" style={{ borderRadius:10, border:`1px solid ${border}` }}>
      <rect width="500" height="130" fill={bg}/>
      <path d="M16 65 L140 65" stroke={border} strokeWidth="1.5" strokeDasharray="6 3"/>
      <text x="78" y="58" textAnchor="middle" fontSize="10" fill={muted}>1 clic</text>
      <circle cx="156" cy="65" r="20" fill="#EAF5EC" stroke="#A8D5B0" strokeWidth="2"/>
      <text x="156" y="72" textAnchor="middle" fontSize="20">✓</text>
      <path d="M178 65 L210 65" stroke={accent} strokeWidth="1.5"/>
      {[
        {x:218,y:20,label:"Admin",color:"#A06838",bg:"#F5EBE0",desc:"Planning complet · Adhérents · Paiements · Paramètres"},
        {x:335,y:20,label:"Coach",color:"#3A6E90",bg:"#E6EFF5",desc:"Mes séances · Liste inscrits · Présences"},
      ].map((r,i)=>(
        <g key={i}>
          <rect x={r.x} y={r.y} width="108" height="90" rx="10" fill={r.bg} stroke={r.color} strokeWidth="1.5"/>
          <text x={r.x+54} y={r.y+20} textAnchor="middle" fontSize="12" fontWeight="700" fill={r.color}>{r.label}</text>
          {r.desc.split(" · ").map((l,j)=>(
            <text key={j} x={r.x+10} y={r.y+38+j*16} fontSize="10" fill={r.color} opacity="0.8">{l}</text>
          ))}
        </g>
      ))}
      <text x="16" y="112" fontSize="10" fill={muted} fontStyle="italic">Chaque utilisateur est redirigé vers son espace selon son rôle</text>
    </svg>
  );


  // ── Plans Fydelys ────────────────────────────────────────────────────────
  const PlanFeature = ({x, y, label, ok}) => (
    <g>
      <text x={x} y={y} fontSize="11" fill={ok?"#3A6E46":"#C8B8A8"}>{ok?"✓":"✕"}</text>
      <text x={x+14} y={y} fontSize="11" fill={ok?text:soft}>{label}</text>
    </g>
  );

  if (type === "plan_essentiel") return (
    <svg width={w} height={160} viewBox="0 0 500 160" style={{ borderRadius:10, border:`1px solid ${border}` }}>
      <rect width="500" height="160" fill={bg}/>
      <rect x="16" y="12" width="140" height="136" rx="12" fill="#5D6D7E"/>
      <text x="86" y="34" textAnchor="middle" fontSize="14" fontWeight="800" fill="#fff">Essentiel</text>
      <text x="86" y="52" textAnchor="middle" fontSize="28" fontWeight="800" fill="#fff">9€</text>
      <text x="86" y="68" textAnchor="middle" fontSize="10" fill="rgba(255,255,255,.7)">/mois</text>
      <text x="86" y="84" textAnchor="middle" fontSize="11" fill="rgba(255,255,255,.8)">1 discipline</text>
      <text x="86" y="100" textAnchor="middle" fontSize="11" fill="rgba(255,255,255,.8)">1 coach</text>
      <text x="86" y="116" textAnchor="middle" fontSize="11" fill="rgba(255,255,255,.8)">50 adhérents</text>
      <text x="86" y="140" textAnchor="middle" fontSize="10" fill="rgba(255,255,255,.5)">9 €/mois après essai</text>
      <PlanFeature x={174} y={34}  label="Planning + présences"          ok={true}  />
      <PlanFeature x={174} y={52}  label="Espace adhérent magic link"    ok={true}  />
      <PlanFeature x={174} y={70}  label="Abonnements & paiements"       ok={true}  />
      <PlanFeature x={174} y={88}  label="Séances récurrentes"           ok={true}  />
      <PlanFeature x={174} y={106} label="Invitation d'équipe"           ok={false} />
      <PlanFeature x={174} y={124} label="Rappel cours 1h avant"                   ok={false} />
      <PlanFeature x={174} y={142} label="Support prioritaire"           ok={false} />
    </svg>
  );

  if (type === "plan_standard") return (
    <svg width={w} height={160} viewBox="0 0 500 160" style={{ borderRadius:10, border:`1.5px solid #A06838` }}>
      <rect width="500" height="160" fill="#FBF6F0"/>
      <rect x="360" y="0" width="140" height="22" rx="0 12 0 0" fill="#A06838"/>
      <text x="430" y="15" textAnchor="middle" fontSize="10" fontWeight="800" fill="#fff">⭐ POPULAIRE</text>
      <rect x="16" y="12" width="140" height="136" rx="12" fill="#A06838"/>
      <text x="86" y="34" textAnchor="middle" fontSize="14" fontWeight="800" fill="#fff">Standard</text>
      <text x="86" y="52" textAnchor="middle" fontSize="28" fontWeight="800" fill="#fff">29€</text>
      <text x="86" y="68" textAnchor="middle" fontSize="10" fill="rgba(255,255,255,.7)">/mois après essai</text>
      <text x="86" y="84" textAnchor="middle" fontSize="11" fill="rgba(255,255,255,.8)">3 disciplines</text>
      <text x="86" y="100" textAnchor="middle" fontSize="11" fill="rgba(255,255,255,.8)">3 coachs</text>
      <text x="86" y="116" textAnchor="middle" fontSize="11" fill="rgba(255,255,255,.8)">100 adhérents</text>
      <text x="86" y="140" textAnchor="middle" fontSize="10" fill="rgba(255,255,255,.5)">Pour les studios actifs</text>
      <PlanFeature x={174} y={34}  label="Planning + présences"          ok={true}  />
      <PlanFeature x={174} y={52}  label="Espace adhérent magic link"    ok={true}  />
      <PlanFeature x={174} y={70}  label="Abonnements & paiements"       ok={true}  />
      <PlanFeature x={174} y={88}  label="Séances récurrentes"           ok={true}  />
      <PlanFeature x={174} y={106} label="Invitation d'équipe"           ok={true}  />
      <PlanFeature x={174} y={124} label="Rappel cours 1h avant"                   ok={true}  />
      <PlanFeature x={174} y={142} label="Support prioritaire"           ok={false} />
    </svg>
  );

  if (type === "plan_pro") return (
    <svg width={w} height={160} viewBox="0 0 500 160" style={{ borderRadius:10, border:`1px solid ${border}` }}>
      <rect width="500" height="160" fill={bg}/>
      <rect x="16" y="12" width="140" height="136" rx="12" fill="#7B52A8"/>
      <text x="86" y="34" textAnchor="middle" fontSize="14" fontWeight="800" fill="#fff">Pro</text>
      <text x="86" y="52" textAnchor="middle" fontSize="28" fontWeight="800" fill="#fff">69€</text>
      <text x="86" y="68" textAnchor="middle" fontSize="10" fill="rgba(255,255,255,.7)">/mois après essai</text>
      <text x="86" y="90" textAnchor="middle" fontSize="11" fill="rgba(255,255,255,.8)">Adhérents illimités</text>
      <text x="86" y="106" textAnchor="middle" fontSize="11" fill="rgba(255,255,255,.8)">Coachs illimités</text>
      <text x="86" y="122" textAnchor="middle" fontSize="11" fill="rgba(255,255,255,.8)">Disciplines illimitées</text>
      <text x="86" y="140" textAnchor="middle" fontSize="10" fill="rgba(255,255,255,.5)">Pour les grands studios</text>
      <PlanFeature x={174} y={34}  label="Planning + présences"          ok={true}  />
      <PlanFeature x={174} y={52}  label="Espace adhérent magic link"    ok={true}  />
      <PlanFeature x={174} y={70}  label="Abonnements & paiements"       ok={true}  />
      <PlanFeature x={174} y={88}  label="Séances récurrentes"           ok={true}  />
      <PlanFeature x={174} y={106} label="Invitation d'équipe"           ok={true}  />
      <PlanFeature x={174} y={124} label="Rappel cours 1h avant"                   ok={true}  />
      <PlanFeature x={174} y={142} label="Support prioritaire"           ok={true}  />
    </svg>
  );

  return null;
}

function AidePage({ isMobile }) {
  const p = isMobile ? 16 : 28;
  const [open, setOpen] = React.useState(null);
  const { studioName, userName, userEmail } = useContext(AppCtx);
  const [form, setForm] = React.useState({ name: userName||"", email: userEmail||"", subject: "", message: "" });
  const [sending, setSending] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [formError, setFormError] = React.useState("");

  // Sync si les données du contexte arrivent après le montage
  React.useEffect(() => {
    setForm(f => ({
      ...f,
      name:  f.name  || userName  || "",
      email: f.email || userEmail || "",
    }));
  }, [userName, userEmail]);

  const handleSend = async () => {
    if (!form.name || !form.email || !form.message) {
      setFormError("Veuillez renseigner votre nom, email et message.");
      return;
    }
    setSending(true); setFormError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, studio: studioName }),
      });
      if (res.ok) {
        setSent(true);
        setForm(f => ({ ...f, subject: "", message: "" }));
      } else {
        setFormError("Erreur lors de l'envoi. Réessayez ou écrivez à info@lysia.fr");
      }
    } catch {
      setFormError("Erreur réseau. Réessayez dans quelques instants.");
    }
    setSending(false);
  };

  const sections = [
    // ── 0. Démarrer ─────────────────────────────────────────────────────────
    {
      id: "start", icon: "🚀", title: "Démarrer avec Fydelys", color: "#A06838",
      items: [
        { q: "Vue d'ensemble de l'application", type: "guide", steps: [
          { num: "1", title: "Le tableau de bord", text: "Dès la connexion, vous voyez vos KPIs du jour (séances, adhérents actifs, revenus) et les prochaines séances. C'est votre point de départ.", visual: "dash_overview" },
          { num: "2", title: "La barre de navigation", text: "À gauche (desktop) ou en bas (mobile) : Tableau de bord · Planning · Adhérents · Abonnements · Paiements · Disciplines · Paramètres · Aide.", visual: "nav_overview" },
          { num: "3", title: "Votre studio en sous-domaine", text: "Chaque studio a son URL unique : votre-studio.fydelys.fr. Vos adhérents s'y connectent directement. Vous les administrez depuis cette même URL.", visual: "subdomain_overview" },
        ]},
        { q: "Comment configurer mon studio ?", a: "Allez dans Paramètres → Studio pour renseigner le nom, l'adresse, le téléphone et l'email de contact. Ces informations apparaissent sur les emails envoyés à vos adhérents." },
        { q: "Comment créer mes premières disciplines ?", a: "Dans le menu Disciplines, définissez vos cours (Yoga, Pilates…) avec leur nom, couleur, icône et créneaux récurrents. Ces créneaux alimentent ensuite la génération automatique de séances." },
        { q: "Comment inviter mon équipe ?", a: "Dans Paramètres → Équipe, cliquez sur + Inviter un coach. Un magic link est envoyé par email au nom de votre studio. Le coach clique dessus et accède directement à son espace." },
      ]
    },
    // ── 1. Planning ──────────────────────────────────────────────────────────
    {
      id: "planning", icon: "📅", title: "Planning", color: "#3A6E90",
      items: [
        { q: "Comment créer une séance unique ?", a: "Dans Planning, cliquez sur + Séance → onglet 📅 Séance unique. Choisissez la discipline (l'heure et durée se pré-remplissent), sélectionnez le coach dans la liste déroulante, la date et les paramètres. Cliquez Créer la séance." },
        { q: "Comment générer des séances récurrentes ?", type: "guide", steps: [
          { num: "1", title: "Ouvrir le mode Récurrence", text: "Cliquez sur + Séance puis sélectionnez l'onglet 🔁 Récurrence.", visual: "rec_open" },
          { num: "2", title: "Choisir les créneaux", text: "Les créneaux configurés dans Disciplines s'affichent sous forme de cases à cocher. Cochez ceux à inclure. Chaque créneau coché révèle un sélecteur de coach spécifique.", visual: "rec_slots" },
          { num: "3", title: "Configurer les paramètres", text: "Définissez le coach par défaut (appliqué aux créneaux sans coach spécifique), le nombre de places et la salle.", visual: "rec_params" },
          { num: "4", title: "Choisir la période", text: "Saisissez la date de début et de fin. Fydelys calcule toutes les dates selon le jour de la semaine de chaque créneau.", visual: "rec_period" },
          { num: "5", title: "Réviser et ajuster", text: "La liste des séances générées s'affiche. Changez le coach d'une séance précise ou cliquez ✕ pour supprimer une date (jour férié, fermeture…).", visual: "rec_preview" },
          { num: "6", title: "Valider", text: "Cliquez sur ✦ Créer N séances. Toutes apparaissent immédiatement dans le planning.", visual: "rec_confirm" },
        ]},
        { q: "Comment gérer les présences ?", a: "Cliquez sur une séance dans le planning pour la développer. Vous voyez la liste des inscrits et pouvez marquer chaque adhérent présent, absent ou en liste d'attente." },
        { q: "Comment inscrire manuellement un adhérent ?", a: "Dans le détail d'une séance (clic pour développer), cliquez sur + Inscrire. Tapez le nom de l'adhérent. Il apparaît dans la liste avec le statut Confirmé." },
        { q: "Comment envoyer un rappel ?", a: "Dans le détail d'une séance développée, cliquez sur Rappel. Un email est envoyé automatiquement à tous les adhérents confirmés pour cette séance." },
      ]
    },
    // ── 2. Adhérents ─────────────────────────────────────────────────────────
    {
      id: "members", icon: "👥", title: "Adhérents", color: "#4E8A58",
      items: [
        { q: "Comment ajouter un adhérent ?", type: "guide", steps: [
          { num: "1", title: "Ouvrir le formulaire", text: "Dans Adhérents, cliquez sur + Ajouter en haut à droite.", visual: "member_add" },
          { num: "2", title: "Renseigner les informations", text: "Saisissez le prénom, nom, email et téléphone. L'email est l'identifiant de connexion : il doit être unique.", visual: "member_form" },
          { num: "3", title: "L'adhérent reçoit son lien", text: "Un magic link est envoyé à son email au nom de votre studio. Il clique dessus et accède à son espace membre sans créer de mot de passe.", visual: "member_link" },
        ]},
        { q: "Comment chercher et filtrer les adhérents ?", a: "La barre de recherche en haut de la liste filtre en temps réel par nom, prénom ou email. Les badges colorés indiquent le statut (actif, suspendu, nouveau) et le niveau de crédit." },
        { q: "Comment voir la fiche d'un adhérent ?", a: "Cliquez sur un adhérent dans la liste pour ouvrir sa fiche complète : informations personnelles, abonnement actif, crédits restants, historique des séances et des paiements." },
        { q: "Comment suspendre ou supprimer un adhérent ?", a: "Dans la fiche adhérent, utilisez le menu Actions (⋯) pour suspendre l'accès temporairement ou archiver le profil. Un adhérent suspendu ne peut plus se connecter mais ses données sont conservées." },
      ]
    },
    // ── 3. Disciplines ───────────────────────────────────────────────────────
    {
      id: "disciplines", icon: "🎯", title: "Disciplines", color: "#7B52A8",
      items: [
        { q: "Comment créer une discipline ?", type: "guide", steps: [
          { num: "1", title: "Ajouter une discipline", text: "Dans Disciplines, cliquez sur + Ajouter. Donnez un nom, choisissez une icône et une couleur d'identification.", visual: "disc_create" },
          { num: "2", title: "Définir les créneaux récurrents", text: "Ajoutez un ou plusieurs créneaux : jour de la semaine + heure + durée. Ces créneaux apparaîtront ensuite dans le générateur de séances récurrentes du Planning.", visual: "disc_slots" },
          { num: "3", title: "Affecter des coaches", text: "Dans l'onglet Équipe, chaque coach peut être associé à une ou plusieurs disciplines. Cette association est utilisée comme suggestion lors de la création de séances.", visual: "disc_coaches" },
        ]},
        { q: "À quoi servent les créneaux récurrents ?", a: "Les créneaux définis dans Disciplines (ex : Pilates Mardi 17:30 60min) sont proposés automatiquement dans le générateur de séances récurrentes du Planning. Ils évitent de ressaisir les infos à chaque création." },
        { q: "Comment modifier une discipline existante ?", a: "Cliquez sur le nom d'une discipline dans la liste pour l'éditer. Vous pouvez changer le nom, l'icône, la couleur et les créneaux. Les séances déjà créées ne sont pas affectées." },
      ]
    },
    // ── 4. Abonnements ───────────────────────────────────────────────────────
    {
      id: "subscriptions", icon: "🎫", title: "Abonnements", color: "#C0392B",
      items: [
        { q: "Quels types d'abonnements existent ?", type: "guide", steps: [
          { num: "1", title: "Mensuel illimité", text: "L'adhérent paie un forfait mensuel fixe et peut assister à autant de séances qu'il le souhaite.", visual: "sub_monthly" },
          { num: "2", title: "Carnet de séances", text: "L'adhérent achète un nombre fixe de séances (ex : 10 séances). Chaque participation déduit 1 crédit. Quand le solde atteint 0, il faut recharger.", visual: "sub_credits" },
          { num: "3", title: "Séance à l'unité", text: "Chaque séance est facturée individuellement, sans engagement. Idéal pour les adhérents occasionnels.", visual: "sub_single" },
        ]},
        { q: "Comment attribuer un abonnement à un adhérent ?", a: "Dans la fiche de l'adhérent (Adhérents → clic sur le nom), cliquez sur Attribuer un abonnement. Choisissez le type, la date de début et le montant. Les crédits se mettent à jour automatiquement." },
        { q: "Comment fonctionne la déduction de crédits ?", a: "Lorsqu'un adhérent s'inscrit à une séance, un crédit est réservé. Si l'adhérent est marqué présent, le crédit est définitivement déduit. En cas d'annulation, le crédit est restitué selon votre politique." },
        { q: "Comment renouveler un abonnement ?", a: "Dans la fiche adhérent ou dans Abonnements, cliquez sur Renouveler à côté de l'abonnement échu. Le nouveau cycle démarre à la date de fin du précédent." },
      ]
    },
    // ── 5. Paiements ─────────────────────────────────────────────────────────
    {
      id: "payments", icon: "💳", title: "Paiements", color: "#9B59B6",
      items: [
        { q: "Comment enregistrer un paiement ?", type: "guide", steps: [
          { num: "1", title: "Accéder à Paiements", text: "Dans le menu Paiements, vous voyez tous les règlements enregistrés triés par date.", visual: "pay_list" },
          { num: "2", title: "Créer un paiement", text: "Cliquez sur + Enregistrer. Choisissez l'adhérent, le montant, la date et le mode de règlement (espèces, virement, carte, chèque).", visual: "pay_form" },
          { num: "3", title: "Lier à un abonnement", text: "Le paiement est automatiquement lié à l'abonnement en cours de l'adhérent. Le solde est mis à jour en temps réel.", visual: "pay_link" },
        ]},
        { q: "Comment voir les paiements en attente ?", a: "Dans Paiements, le filtre En attente liste les adhérents dont l'abonnement est actif mais dont le paiement du mois n'a pas encore été enregistré." },
        { q: "Comment gérer mon abonnement Fydelys ?", a: "Dans Paramètres → Mon compte, la section Formule Fydelys affiche votre plan actuel. Chaque formule inclut 15 jours d'essai gratuit. Essentiel (9€/mois) : planification sans module paiements adhérents. Standard (29€) et Pro (69€) incluent les paiements adhérents via Stripe." },
        { q: "La période d'essai gratuite dure combien de temps ?", a: "14 jours à compter de la création de votre studio, sans carte bancaire requise. Un email de rappel est envoyé 3 jours avant la fin de l'essai." },
      ]
    },
    // ── 6. Paramètres ────────────────────────────────────────────────────────
    {
      id: "settings", icon: "⚙️", title: "Paramètres", color: "#5D6D7E",
      items: [
        { q: "Comment configurer les informations du studio ?", a: "Dans Paramètres → Studio : nom, adresse, téléphone, email, site web. Ces données apparaissent dans les emails envoyés à vos adhérents et sur votre page de connexion." },
        { q: "Comment gérer l'équipe (coachs) ?", type: "guide", steps: [
          { num: "1", title: "Voir l'équipe", text: "Dans Paramètres → Équipe, la liste des coachs affiche leur statut (actif / invité) et leurs disciplines associées.", visual: "team_list" },
          { num: "2", title: "Inviter un coach", text: "Cliquez sur + Inviter un coach. Renseignez prénom, nom et email. Un email d'invitation brandé au nom de votre studio est envoyé avec un lien de connexion.", visual: "team_invite" },
          { num: "3", title: "Affecter des disciplines", text: "Cliquez sur les ··· d'un coach pour gérer ses disciplines. Ces associations apparaissent comme suggestions dans la création de séances.", visual: "team_disciplines" },
        ]},
        { q: "Quelles sont les limites de chaque plan ?", type: "guide", steps: [
          { num: "E", title: "Essentiel — 9 €/mois", text: "1 discipline, 1 coach, 50 adhérents. Planning, présences, espace adhérent magic link, séances récurrentes. Sans module paiements adhérents. 15 jours d'essai gratuit.", visual: "plan_essentiel" },
          { num: "S", title: "Standard — 29 €/mois", text: "3 disciplines, 3 coachs, 100 adhérents. Tout Essentiel + paiements adhérents (Stripe), invitation d'équipe, rappel cours 1h avant. 15 jours d'essai gratuit.", visual: "plan_standard" },
          { num: "★", title: "Pro — 69 €/mois", text: "Adhérents, coachs et disciplines illimités. Tout Studio + support prioritaire. Pour les grands studios.", visual: "plan_pro" },
        ]},
        { q: "Comment gérer les rôles et permissions ?", a: "Dans Paramètres → Rôles : Admin a accès à tout, Coach voit le planning et ses séances, Adhérent accède à son espace membre. Les rôles sont attribués automatiquement à la connexion." },
      ]
    },
    // ── 7. Accès et connexion ────────────────────────────────────────────────
    {
      id: "access", icon: "🔐", title: "Accès et connexion", color: "#E67E22",
      items: [
        { q: "Comment fonctionne la connexion sans mot de passe ?", type: "guide", steps: [
          { num: "1", title: "Saisir son email", text: "Sur votre-studio.fydelys.fr, l'utilisateur entre son adresse email et clique sur Recevoir le lien.", visual: "login_email" },
          { num: "2", title: "Recevoir le magic link", text: "Un email est envoyé en quelques secondes au nom de votre studio. Il contient un bouton de connexion valable 1 heure.", visual: "login_email_sent" },
          { num: "3", title: "Accéder à son espace", text: "Un clic sur le bouton et l'utilisateur est connecté — admin, coach ou adhérent selon son rôle. Pas de mot de passe à retenir.", visual: "login_connected" },
        ]},
        { q: "Première connexion d'un nouvel adhérent ?", a: "Si l'adhérent n'a jamais eu de compte, son profil est créé automatiquement lors de sa première connexion via magic link. Il est redirigé vers son espace membre avec le statut Nouveau." },
        { q: "Comment révoquer l'accès d'un coach ?", a: "Dans Paramètres → Équipe, cliquez sur ··· à côté du coach puis Désactiver. Il ne pourra plus se connecter mais son historique est conservé." },
        { q: "Le lien magic link a expiré, que faire ?", a: "Les magic links expirent après 1 heure. Il suffit de revenir sur votre-studio.fydelys.fr et de saisir à nouveau l'email pour recevoir un nouveau lien." },
      ]
    },
  ];

  return (
    <div style={{ padding: p, maxWidth: 720 }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: isMobile?22:28, fontWeight: 800, color: C.text, letterSpacing: -0.5, marginBottom: 6 }}>Centre d'aide ✦</div>
        <div style={{ fontSize: 14, color: C.textSoft }}>Tout ce qu'il faut savoir pour gérer votre studio avec Fydelys.</div>
      </div>

      {/* Formulaire de contact */}
      <div style={{ background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 14, padding: "20px 20px", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `${C.accent}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>💬</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Contacter le support</div>
            <div style={{ fontSize: 12, color: C.textSoft, marginTop: 1 }}>Réponse sous 24h · info@lysia.fr</div>
          </div>
        </div>

        {sent ? (
          <div style={{ padding: "18px", background: "#F0FAF2", border: "1.5px solid #A8D5B0", borderRadius: 10, textAlign: "center" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#2A6638" }}>Message envoyé !</div>
            <div style={{ fontSize: 13, color: "#4E8A58", marginTop: 4 }}>Nous vous répondrons sous 24h à <strong>{form.email}</strong>.</div>
            <button onClick={() => setSent(false)}
              style={{ marginTop: 12, background: "none", border: `1.5px solid #A8D5B0`, borderRadius: 8, padding: "6px 16px", fontSize: 13, color: "#4E8A58", cursor: "pointer", fontWeight: 600 }}>
              Envoyer un autre message
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: .8, display: "block", marginBottom: 5 }}>Votre nom</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Marie Dupont"
                  style={{ width: "100%", padding: "9px 12px", border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.text, background: C.bg, outline: "none", boxSizing: "border-box" }}
                  onFocus={e => e.target.style.borderColor = C.accent} onBlur={e => e.target.style.borderColor = C.border}/>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: .8, display: "block", marginBottom: 5 }}>Email</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="vous@studio.fr"
                  style={{ width: "100%", padding: "9px 12px", border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.text, background: C.bg, outline: "none", boxSizing: "border-box" }}
                  onFocus={e => e.target.style.borderColor = C.accent} onBlur={e => e.target.style.borderColor = C.border}/>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: .8, display: "block", marginBottom: 5 }}>Sujet</label>
              <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                placeholder="Ex : Problème de connexion, question sur les abonnements…"
                style={{ width: "100%", padding: "9px 12px", border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.text, background: C.bg, outline: "none", boxSizing: "border-box" }}
                onFocus={e => e.target.style.borderColor = C.accent} onBlur={e => e.target.style.borderColor = C.border}/>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: .8, display: "block", marginBottom: 5 }}>Message <span style={{ color: "#F87171" }}>*</span></label>
              <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                placeholder="Décrivez votre problème ou votre question en détail…"
                rows={4}
                style={{ width: "100%", padding: "9px 12px", border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.text, background: C.bg, outline: "none", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit" }}
                onFocus={e => e.target.style.borderColor = C.accent} onBlur={e => e.target.style.borderColor = C.border}/>
            </div>
            {formError && (
              <div style={{ padding: "8px 12px", background: "#FFF0F0", border: "1px solid #F8C8C8", borderRadius: 8, fontSize: 13, color: "#C0392B" }}>{formError}</div>
            )}
            <button onClick={handleSend} disabled={sending}
              style={{ alignSelf: "flex-start", padding: "10px 22px", background: sending ? C.border : "linear-gradient(145deg,#B88050,#9A6030)", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: sending ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              {sending ? "Envoi…" : "✦ Envoyer le message"}
            </button>
          </div>
        )}
      </div>

      {/* Sections FAQ accordéon */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {sections.map(sec => (
          <div key={sec.id} style={{ background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
            {/* Header section */}
            <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, borderBottom: open===sec.id ? `1px solid ${C.border}` : "none" }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${sec.color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{sec.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text, flex: 1 }}>{sec.title}</div>
              <div style={{ fontSize: 12, color: C.textMuted }}>{sec.items.length} articles</div>
            </div>
            {/* Items */}
            <div style={{ padding: "8px 0" }}>
              {sec.items.map((item, i) => (
                <div key={i}>
                  <button onClick={() => setOpen(open === `${sec.id}-${i}` ? null : `${sec.id}-${i}`)}
                    style={{ width: "100%", textAlign: "left", padding: "12px 18px", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <span style={{ fontSize: 14, color: C.accent, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{open===`${sec.id}-${i}` ? "▾" : "▸"}</span>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: C.text, lineHeight: 1.4 }}>{item.q}</span>
                      {item.type === "guide" && <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, color: sec.color, background: `${sec.color}15`, borderRadius: 4, padding: "2px 6px" }}>Guide {item.steps?.length} étapes</span>}
                    </div>
                  </button>
                  {open === `${sec.id}-${i}` && (
                    <div style={{ padding: "0 18px 18px 44px" }}>
                      {/* Réponse simple */}
                      {!item.type && <div style={{ fontSize: 14, color: C.textSoft, lineHeight: 1.7 }}>{item.a}</div>}

                      {/* Guide pas-à-pas avec illustrations */}
                      {item.type === "guide" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                          {item.steps.map((step, si) => (
                            <div key={si} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                              {/* Numéro étape */}
                              <div style={{ width: 28, height: 28, borderRadius: "50%", background: sec.color, color: "#fff", fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>{step.num}</div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 4 }}>{step.title}</div>
                                <div style={{ fontSize: 13, color: C.textSoft, lineHeight: 1.7, marginBottom: step.visual ? 12 : 0 }}>{step.text}</div>
                                {/* Illustration SVG selon step.visual */}
                                {step.visual && <AideIllustration type={step.visual} color={sec.color}/>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Version */}
      <div style={{ marginTop: 32, textAlign: "center", fontSize: 12, color: C.textMuted }}>
        Fydelys · Version 1.0 · <a href="https://fydelys.fr" style={{ color: C.accent, textDecoration: "none" }}>fydelys.fr</a>
      </div>
    </div>
  );
}

function InviteCoachModal({ C, inviteEmail, setInviteEmail, inviteName, setInviteName, onClose, onSubmit }) {
  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()}
      style={{position:"fixed",inset:0,background:"rgba(42,31,20,.45)",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:C.surface,borderRadius:16,padding:24,width:"100%",maxWidth:440,boxShadow:"0 24px 60px rgba(0,0,0,.18)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
          <div style={{fontSize:16,fontWeight:800,color:C.text}}>Inviter un coach</div>
          <button onClick={onClose} style={{background:"none",border:`1.5px solid ${C.border}`,borderRadius:8,padding:"4px 8px",cursor:"pointer"}}><IcoX s={14} c={C.textSoft}/></button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
          {[["Prénom","fn","Marie"],["Nom","ln","Laurent"]].map(([lbl,k,ph])=>(
            <div key={k}>
              <FieldLabel>{lbl}</FieldLabel>
              <input value={inviteName[k]} onChange={e=>setInviteName(p=>({...p,[k]:e.target.value}))} placeholder={ph}
                style={{width:"100%",padding:"9px 12px",border:`1.5px solid ${C.border}`,borderRadius:8,fontSize:14,outline:"none",boxSizing:"border-box",color:C.text,background:C.surfaceWarm}}
                onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/>
            </div>
          ))}
        </div>
        <div style={{marginBottom:16}}>
          <FieldLabel>Email professionnel</FieldLabel>
          <input autoFocus type="email" value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} placeholder="coach@studio.fr"
            style={{width:"100%",padding:"9px 12px",border:`1.5px solid ${C.border}`,borderRadius:8,fontSize:14,outline:"none",boxSizing:"border-box",color:C.text,background:C.surfaceWarm}}
            onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/>
        </div>
        <div style={{padding:"10px 14px",background:C.accentLight,borderRadius:8,fontSize:12,color:C.accentDark,marginBottom:16}}>
          🔗 Un magic link sera envoyé à <strong>{inviteEmail||"…"}</strong>. Le coach accédera au studio via <strong>slug.fydelys.fr</strong>
        </div>
        <div style={{display:"flex",gap:10}}>
          <Button variant="primary" onClick={onSubmit}>
            <IcoMail s={14} c="white"/> Envoyer l'invitation
          </Button>
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
        </div>
      </div>
    </div>
  );
}

function Settings({ isMobile }) {
  const { studioName, userName, userEmail, planName, membersCount, userRole, studioId } = useContext(AppCtx);
  const p = isMobile?12:28;
  const realRole = userRole || "admin";
  const [currentRole, setCurrentRole] = useState(realRole);
  // ── Données studio depuis Supabase
  const [studioForm, setStudioForm] = useState({ name:"", address:"", phone:"", email:"", website:"", cancel_delay_h:12, booking_days_ahead:7, waitlist_max:10 });
  const [studioSaving, setStudioSaving] = useState(false);
  const [studioToast, setStudioToast] = useState(null);
  const showStudioToast = (msg, ok=true) => { setStudioToast({msg,ok}); setTimeout(()=>setStudioToast(null),3000); };

  React.useEffect(() => {
    if (!studioId) return;
    createClient().from("studios")
      .select("name, address, city, phone, email, website, cancel_delay_h, booking_days_ahead, waitlist_max")
      .eq("id", studioId).single()
      .then(({ data }) => {
        if (data) setStudioForm({
          name: data.name || "",
          address: data.address || "",
          city: data.city || "",
          phone: data.phone || "",
          email: data.email || "",
          website: data.website || "",
          cancel_delay_h: data.cancel_delay_h ?? 12,
          booking_days_ahead: data.booking_days_ahead ?? 7,
          waitlist_max: data.waitlist_max ?? 10,
        });
      });
  }, [studioId]);

  const saveStudio = async () => {
    if (!studioId) return;
    setStudioSaving(true);
    const { error } = await createClient().from("studios").update({
      name: studioForm.name,
      address: studioForm.address,
      city: studioForm.city,
      phone: studioForm.phone,
      email: studioForm.email,
      website: studioForm.website,
      cancel_delay_h: parseInt(studioForm.cancel_delay_h) || 12,
      booking_days_ahead: parseInt(studioForm.booking_days_ahead) || 7,
      waitlist_max: parseInt(studioForm.waitlist_max) || 10,
    }).eq("id", studioId);
    setStudioSaving(false);
    if (error) showStudioToast("Erreur : " + error.message, false);
    else showStudioToast("Paramètres enregistrés ✓");
  };
  // Sync si userRole change (chargement async)
  React.useEffect(() => {
    if (userRole) {
      setCurrentRole(userRole);
      // Remettre l'onglet par défaut si le tab courant n'est pas accessible
      setTab(t => {
        if (userRole !== "superadmin" && t === "superadmin") return "studio";
        return t;
      });
    }
  }, [userRole]);
  const [tab, setTab] = useState("studio"); // toujours "studio" par défaut — sera "superadmin" si SA
  const [users, setUsers] = useState(USERS_DATA);
  const [tenants, setTenants] = useState(TENANTS_DATA);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [modal, setModal] = useState(null); // type: "newTenant"|"inviteUser"|"editUser"|"password"|"2fa"|"sessions"|"deleteAccount"
  const [toast, setToast] = useState(null);
  // States invitation coach remontés ici pour éviter perte de focus (TabTeam recréé à chaque render)
  const [inviteModal, setInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName]   = useState({ fn:"", ln:"" });

  const isSA = realRole === "superadmin";       // vrai rôle pour les onglets/accès
  const isAdmin = realRole === "admin" || isSA; // vrai rôle pour les permissions
  const isSAPreview = currentRole === "superadmin"; // aperçu uniquement (demo switcher)

  const showToast = (msg, ok=true) => { setToast({msg,ok}); setTimeout(()=>setToast(null),3000); };

  // ── Shared Modal shell ────────────────────────────────────────────────────
  const Modal = ({ children, maxW=440 }) => (
    <div style={{ position:"fixed", inset:0, background:"rgba(42,31,20,.45)", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
      onClick={e=>{ if(e.target===e.currentTarget) setModal(null); }}>
      <div style={{ background:C.surface, borderRadius:16, padding:24, width:"100%", maxWidth:maxW, boxShadow:"0 24px 60px rgba(0,0,0,.18)", maxHeight:"85vh", overflowY:"auto" }}>
        {children}
      </div>
    </div>
  );
  const MHead = ({ title }) => (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
      <div style={{ fontSize:16, fontWeight:800, color:C.text }}>{title}</div>
      <button onClick={()=>setModal(null)} style={{ background:"none", border:`1.5px solid ${C.border}`, borderRadius:8, padding:"4px 7px", cursor:"pointer", display:"flex" }}><IcoX s={15} c={C.textSoft}/></button>
    </div>
  );

  // ── Modal: Nouveau tenant ────────────────────────────────────────────────
  const NewTenantModal = () => {
    const [f, setF] = useState({ name:"", city:"", plan:"Essentiel" });
    return (
      <Modal>
        <MHead title="Nouveau tenant"/>
        <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:18 }}>
          <div><FieldLabel>Nom du studio</FieldLabel><input value={f.name} onChange={e=>setF({...f,name:e.target.value})} placeholder="Ex: Hot Yoga Lyon" style={{ width:"100%", padding:"9px 12px", border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:14, outline:"none", boxSizing:"border-box", color:C.text, background:C.surfaceWarm }} onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/></div>
          <div><FieldLabel>Ville</FieldLabel><input value={f.city} onChange={e=>setF({...f,city:e.target.value})} placeholder="Paris, Lyon…" style={{ width:"100%", padding:"9px 12px", border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:14, outline:"none", boxSizing:"border-box", color:C.text, background:C.surfaceWarm }} onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/></div>
          <Field label="Plan" value={f.plan} onChange={v=>setF({...f,plan:v})} opts={FYDELYS_PLANS.map(p=>({v:p.name,l:p.name}))}/>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <Button variant="primary" onClick={()=>{ if(!f.name) return; setTenants(prev=>[...prev,{id:`t${Date.now()}`,name:f.name,city:f.city,plan:f.plan,members:0,revenue:"0 €",status:"actif",since:"Mars 2026"}]); setModal(null); showToast(`Tenant "${f.name}" créé !`); }}>Créer le tenant</Button>
          <Button variant="ghost" onClick={()=>setModal(null)}>Annuler</Button>
        </div>
      </Modal>
    );
  };

  // ── Modal: Inviter utilisateur ────────────────────────────────────────────
  const InviteUserModal = () => {
    const [f, setF] = useState({ fn:"", ln:"", email:"", role:"adherent", tenant:"t1" });
    return (
      <Modal>
        <MHead title="Inviter un utilisateur"/>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
          <div><FieldLabel>Prénom</FieldLabel><input value={f.fn} onChange={e=>setF({...f,fn:e.target.value})} style={{ width:"100%", padding:"9px 12px", border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:14, outline:"none", boxSizing:"border-box", color:C.text, background:C.surfaceWarm }} onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/></div>
          <div><FieldLabel>Nom</FieldLabel><input value={f.ln} onChange={e=>setF({...f,ln:e.target.value})} style={{ width:"100%", padding:"9px 12px", border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:14, outline:"none", boxSizing:"border-box", color:C.text, background:C.surfaceWarm }} onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/></div>
        </div>
        <div style={{ marginBottom:12 }}><FieldLabel>Email</FieldLabel><input type="email" value={f.email} onChange={e=>setF({...f,email:e.target.value})} placeholder="prenom@studio.fr" style={{ width:"100%", padding:"9px 12px", border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:14, outline:"none", boxSizing:"border-box", color:C.text, background:C.surfaceWarm }} onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/></div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:18 }}>
          <Field label="Rôle" value={f.role} onChange={v=>setF({...f,role:v})} opts={Object.entries(ROLES_DEF).map(([v,r])=>({v,l:r.label}))}/>
          {isSA && <Field label="Tenant" value={f.tenant} onChange={v=>setF({...f,tenant:v})} opts={tenants.map(t=>({v:t.id,l:t.name}))}/>}
        </div>
        <div style={{ padding:"10px 14px", background:C.accentBg, borderRadius:8, fontSize:12, color:C.accentDark, marginBottom:16 }}>
          Un email d'invitation sera envoyé à <strong>{f.email||"…"}</strong>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <Button variant="primary" onClick={()=>{ if(!f.fn||!f.email) return; setUsers(prev=>[...prev,{id:`u${Date.now()}`,fn:f.fn,ln:f.ln,email:f.email,role:f.role,tenant:f.tenant,status:"actif",lastLogin:"Jamais"}]); setModal(null); showToast(`Invitation envoyée à ${f.email}`); }}><span style={{display:"flex",alignItems:"center",gap:6}}><IcoMail s={14} c="white"/>Envoyer l'invitation</span></Button>
          <Button variant="ghost" onClick={()=>setModal(null)}>Annuler</Button>
        </div>
      </Modal>
    );
  };

  // ── Modal: Modifier utilisateur ───────────────────────────────────────────
  const EditUserModal = () => {
    const u = modal.user;
    const [role, setRole] = useState(u.role);
    const [status, setStatus] = useState(u.status);
    return (
      <Modal>
        <MHead title={`Modifier — ${u.fn} ${u.ln}`}/>
        <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", background:C.bg, borderRadius:10, marginBottom:18 }}>
          <div style={{ width:36, height:36, borderRadius:"50%", background:C.accentBg, border:`1px solid #DFC0A0`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:C.accent }}>{u.fn[0]}{u.ln[0]}</div>
          <div><div style={{ fontSize:14, fontWeight:700, color:C.text }}>{u.fn} {u.ln}</div><div style={{ fontSize:12, color:C.textSoft }}>{u.email}</div></div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:18 }}>
          <Field label="Rôle" value={role} onChange={setRole} opts={Object.entries(ROLES_DEF).map(([v,r])=>({v,l:r.label}))}/>
          <Field label="Statut" value={status} onChange={setStatus} opts={["actif","suspendu"].map(v=>({v,l:v.charAt(0).toUpperCase()+v.slice(1)}))}/>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <Button variant="primary" onClick={()=>{ setUsers(prev=>prev.map(x=>x.id===u.id?{...x,role,status}:x)); setModal(null); showToast("Utilisateur mis à jour"); }}>Enregistrer</Button>
          <Button variant="ghost" onClick={()=>setModal(null)}>Annuler</Button>
        </div>
      </Modal>
    );
  };

  // ── Modal: Mot de passe ───────────────────────────────────────────────────
  const PasswordModal = () => {
    const [f, setF] = useState({ old:"", new1:"", new2:"" });
    const [done, setDone] = useState(false);
    const valid = f.old && f.new1.length >= 8 && f.new1===f.new2;
    return (
      <Modal>
        <MHead title="Changer le mot de passe"/>
        {done ? (
          <div style={{ display:"flex", alignItems:"center", gap:10, padding:"14px", background:C.okBg, borderRadius:10, color:C.ok, fontWeight:600 }}><IcoCheck s={18} c={C.ok}/>Mot de passe mis à jour !</div>
        ) : (
          <>
            <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:18 }}>
              {[["Mot de passe actuel","old"],["Nouveau mot de passe","new1"],["Confirmer","new2"]].map(([lbl,key])=>(
                <div key={key}><FieldLabel>{lbl}</FieldLabel><input type="password" value={f[key]} onChange={e=>setF({...f,[key]:e.target.value})} style={{ width:"100%", padding:"9px 12px", border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:14, outline:"none", boxSizing:"border-box", color:C.text, background:C.surfaceWarm }} onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/></div>
              ))}
            </div>
            {f.new1 && f.new1!==f.new2 && <div style={{ fontSize:12, color:C.warn, marginBottom:10 }}>Les mots de passe ne correspondent pas.</div>}
            {f.new1 && f.new1.length < 8 && <div style={{ fontSize:12, color:C.warn, marginBottom:10 }}>Minimum 8 caractères.</div>}
            <div style={{ display:"flex", gap:10 }}>
              <Button variant="primary" onClick={()=>{ if(valid) setDone(true); }} >Changer</Button>
              <Button variant="ghost" onClick={()=>setModal(null)}>Annuler</Button>
            </div>
          </>
        )}
      </Modal>
    );
  };

  // ── Modal: 2FA ────────────────────────────────────────────────────────────
  const TwoFAModal = () => {
    const [step, setStep] = useState(1);
    const [code, setCode] = useState("");
    return (
      <Modal>
        <MHead title="Authentification à 2 facteurs"/>
        {step===1 && (
          <>
            <div style={{ textAlign:"center", padding:"20px 0" }}>
              <div style={{ width:160, height:160, background:"#F0EBE3", borderRadius:12, margin:"0 auto 16px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, color:C.textMuted }}>QR Code<br/>2FA</div>
              <div style={{ fontSize:13, color:C.textSoft }}>Scannez ce QR code avec<br/><strong>Google Authenticator</strong> ou <strong>Authy</strong></div>
            </div>
            <div style={{ padding:"8px 14px", background:C.bg, borderRadius:8, fontFamily:"monospace", fontSize:13, color:C.text, textAlign:"center", marginBottom:16, letterSpacing:2 }}>JBSWY3DPEHPK3PXP</div>
            <Button variant="primary" onClick={()=>setStep(2)} block>J'ai scanné le QR code</Button>
          </>
        )}
        {step===2 && (
          <>
            <div style={{ fontSize:14, color:C.textSoft, marginBottom:16 }}>Entrez le code à 6 chiffres généré par votre application :</div>
            <input value={code} onChange={e=>setCode(e.target.value)} maxLength={6} placeholder="000000"
              style={{ width:"100%", padding:"12px", border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:24, outline:"none", boxSizing:"border-box", color:C.text, background:C.surfaceWarm, textAlign:"center", letterSpacing:8, fontWeight:700, marginBottom:16 }}
              onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/>
            <div style={{ display:"flex", gap:10 }}>
              <Button variant="primary" onClick={()=>{ if(code.length===6){ setModal(null); showToast("2FA activé avec succès !"); }}}>Activer</Button>
              <Button variant="ghost" onClick={()=>setModal(null)}>Annuler</Button>
            </div>
          </>
        )}
      </Modal>
    );
  };

  // ── Modal: Sessions ───────────────────────────────────────────────────────
  const SessionsModal = () => {
    const [sessions, setSessions] = useState([
      { id:1, device:"iPhone 14 Pro", location:"Paris, France", current:true,  last:"Maintenant",      icon:"📱" },
      { id:2, device:"MacBook Pro",   location:"Paris, France", current:false, last:"Il y a 2 heures", icon:"💻" },
      { id:3, device:"Chrome / Windows", location:"Lyon, France", current:false, last:"Il y a 3 jours", icon:"🌐" },
    ]);
    return (
      <Modal>
        <MHead title="Sessions actives"/>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {sessions.map(s=>(
            <div key={s.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", borderRadius:10, background:s.current?C.okBg:C.bg, border:`1.5px solid ${s.current?"#B8DFC4":C.border}` }}>
              <span style={{ fontSize:22 }}>{s.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:700, color:C.text }}>{s.device} {s.current && <span style={{ fontSize:11, color:C.ok, fontWeight:600 }}>● Session actuelle</span>}</div>
                <div style={{ fontSize:12, color:C.textSoft }}>{s.location} · {s.last}</div>
              </div>
              {!s.current && <button onClick={()=>setSessions(prev=>prev.filter(x=>x.id!==s.id))} style={{ fontSize:12, padding:"4px 10px", borderRadius:7, border:`1px solid #EFC8BC`, background:C.warnBg, color:C.warn, cursor:"pointer", fontWeight:600 }}>Déconnecter</button>}
            </div>
          ))}
        </div>
        {sessions.filter(s=>!s.current).length > 0 && (
          <button onClick={()=>setSessions(prev=>prev.filter(s=>s.current))} style={{ marginTop:14, width:"100%", padding:"10px", borderRadius:8, border:`1.5px solid #EFC8BC`, background:C.warnBg, color:C.warn, cursor:"pointer", fontWeight:700, fontSize:13 }}>
            Déconnecter toutes les autres sessions
          </button>
        )}
      </Modal>
    );
  };

  // ── Modal: Supprimer compte ───────────────────────────────────────────────
  const DeleteAccountModal = () => {
    const [confirm, setConfirm] = useState("");
    return (
      <Modal>
        <MHead title="Supprimer mon compte"/>
        <div style={{ padding:"14px", background:C.warnBg, borderRadius:10, border:`1px solid #EFC8BC`, marginBottom:18 }}>
          <div style={{ fontSize:14, fontWeight:700, color:C.warn, marginBottom:6 }}>⚠ Action irréversible</div>
          <div style={{ fontSize:13, color:C.textMid }}>Toutes vos données seront définitivement supprimées. Cette action ne peut pas être annulée.</div>
        </div>
        <div style={{ marginBottom:18 }}>
          <FieldLabel>Tapez <strong>SUPPRIMER</strong> pour confirmer</FieldLabel>
          <input value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="SUPPRIMER"
            style={{ width:"100%", padding:"9px 12px", border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:14, outline:"none", boxSizing:"border-box", color:C.text, background:C.surfaceWarm }}
            onFocus={e=>e.target.style.borderColor=C.warn} onBlur={e=>e.target.style.borderColor=C.border}/>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <Button variant="danger" onClick={()=>{ if(confirm==="SUPPRIMER"){ setModal(null); showToast("Compte supprimé", false); }}}>Supprimer définitivement</Button>
          <Button variant="ghost" onClick={()=>setModal(null)}>Annuler</Button>
        </div>
      </Modal>
    );
  };

  const tabs = [
    ...(isSA ? [{ key:"superadmin", label:"Super Admin", icon:<IcoLayers s={14} c="currentColor"/> }] : []),
    { key:"studio",  label:"Studio",       icon:<IcoSettings s={14} c="currentColor"/> },
    { key:"team",    label:"Équipe",        icon:<IcoUsers s={14} c="currentColor"/> },
    { key:"users",   label:"Utilisateurs", icon:<IcoTag s={14} c="currentColor"/> },
    { key:"roles", label:"Rôles", icon:<IcoTag s={14} c="currentColor"/> },
    { key:"account", label:"Mon compte",   icon:<IcoHome s={14} c="currentColor"/> },
  ].filter(Boolean);

  // ── Preview role switcher (superadmin seulement) ────────────────────────
  const RoleSwitcher = () => {
    if (!isSA) return null; // N'afficher que pour le superadmin réel
    return (
      <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 14px", background:C.cardAlt||"#F5EEE6", border:`1px solid ${C.border}`, borderRadius:10, marginBottom:16, flexWrap:"wrap" }}>
        <span style={{ fontSize:12, color:C.accent, fontWeight:600 }}>👁 Aperçu rôle :</span>
        {["superadmin","admin","staff","adherent"].map(r=>(
          <button key={r} onClick={()=>{ setCurrentRole(r); setTab(r==="superadmin"?"superadmin":"studio"); }}
            style={{ fontSize:11, padding:"3px 10px", borderRadius:8, border:`1.5px solid ${currentRole===r?C.accent:C.border}`, background:currentRole===r?C.accent:"white", color:currentRole===r?"white":C.textMid, fontWeight:700, cursor:"pointer" }}>
            {ROLES_DEF[r].label}
          </button>
        ))}
      </div>
    );
  };

  // ── Tab: Super Admin ──────────────────────────────────────────────────────
  const TabSuperAdmin = () => (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)", gap:10, marginBottom:20 }}>
        {[
          { lbl:"Tenants actifs",    val:tenants.filter(t=>t.status==="actif").length,  icon:<IcoLayers s={16} c="#7C3AED"/>, c:"#7C3AED", bg:"#F3EEFF" },
          { lbl:"Total membres",     val:tenants.reduce((s,t)=>s+t.members,0),          icon:<IcoUsers s={16} c={C.ok}/>,     c:C.ok,      bg:C.okBg },
          { lbl:"CA plateforme",     val:"18 330 €",                                    icon:<IcoEuro s={16} c={C.accent}/>,  c:C.accent,  bg:C.accentBg },
          { lbl:"Tenants suspendus", val:tenants.filter(t=>t.status==="suspendu").length,icon:<IcoAlert s={16} c={C.warn}/>,  c:C.warn,    bg:C.warnBg },
        ].map(s=>(
          <Card key={s.lbl} style={{ padding:"12px 14px" }}>
            <div style={{ width:28, height:28, borderRadius:7, background:s.bg, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:6 }}>{s.icon}</div>
            <div style={{ fontSize:20, fontWeight:800, color:s.c, lineHeight:1, marginBottom:3 }}>{s.val}</div>
            <div style={{ fontSize:11, color:C.textSoft }}>{s.lbl}</div>
          </Card>
        ))}
      </div>
      <Card noPad>
        <SectionHead action={<Button sm variant="primary" onClick={()=>setModal({type:"newTenant"})}><span style={{display:"flex",alignItems:"center",gap:5}}><IcoUserPlus s={13} c="white"/>Nouveau tenant</span></Button>}>
          Tous les tenants
        </SectionHead>
        {tenants.map(t=>(
          <div key={t.id} style={{ padding:"12px 16px", borderBottom:`1px solid ${C.borderSoft}`, transition:"background .1s" }}
            onMouseEnter={e=>e.currentTarget.style.background=C.bg}
            onMouseLeave={e=>e.currentTarget.style.background=""}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:5 }}>
              <div style={{ width:32, height:32, borderRadius:8, background:"#F3EEFF", border:"1px solid #C4A8F0", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><IcoYoga s={16} c="#7C3AED"/></div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:700, color:C.text }}>{t.name}</div>
                <div style={{ fontSize:11, color:C.textSoft }}>{t.city} · depuis {t.since}</div>
              </div>
              <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:8, background:t.plan==="Pro"?"#F3EEFF":"#EEE", color:t.plan==="Pro"?"#7C3AED":C.textMid }}>{t.plan}</span>
              <Tag s={t.status}/>
            </div>
            <div style={{ display:"flex", gap:16, paddingLeft:42 }}>
              <span style={{ fontSize:11, color:C.textSoft }}><span style={{ fontWeight:600, color:C.text }}>{t.members}</span> membres</span>
              <span style={{ fontSize:11, color:C.textSoft }}><span style={{ fontWeight:600, color:C.accent }}>{t.revenue}</span> / mois</span>
              <div style={{ marginLeft:"auto", display:"flex", gap:6 }}>
                <button onClick={()=>showToast(`Accès à "${t.name}" simulé`)} style={{ fontSize:11, padding:"3px 10px", borderRadius:6, border:`1px solid ${C.border}`, background:C.bg, color:C.textMid, cursor:"pointer", fontWeight:600 }}>Accéder</button>
                {t.status==="actif"
                  ? <button onClick={()=>{ setTenants(prev=>prev.map(x=>x.id===t.id?{...x,status:"suspendu"}:x)); showToast(`"${t.name}" suspendu`, false); }} style={{ fontSize:11, padding:"3px 10px", borderRadius:6, border:`1px solid #EFC8BC`, background:C.warnBg, color:C.warn, cursor:"pointer", fontWeight:600 }}>Suspendre</button>
                  : <button onClick={()=>{ setTenants(prev=>prev.map(x=>x.id===t.id?{...x,status:"actif"}:x)); showToast(`"${t.name}" réactivé`); }} style={{ fontSize:11, padding:"3px 10px", borderRadius:6, border:`1px solid #B8DFC4`, background:C.okBg, color:C.ok, cursor:"pointer", fontWeight:600 }}>Réactiver</button>
                }
              </div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );

  // ── Tab: Studio settings ──────────────────────────────────────────────────
  const TabStudio = () => {
    const SI = ({ label, fkey, type="text", placeholder="" }) => (
      <div>
        <FieldLabel>{label}</FieldLabel>
        <input type={type} value={studioForm[fkey]||""} placeholder={placeholder} disabled={!isAdmin}
          onChange={e=>setStudioForm(f=>({...f,[fkey]:e.target.value}))}
          style={{ width:"100%", padding:"9px 12px", border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:14, outline:"none", boxSizing:"border-box", color:C.text, background:isAdmin?C.surfaceWarm:"#F8F5F2", opacity:isAdmin?1:0.7, transition:"border-color .15s" }}
          onFocus={e=>{ if(isAdmin) e.target.style.borderColor=C.accent; }}
          onBlur={e=>e.target.style.borderColor=C.border}/>
      </div>
    );
    return (
      <div>
        {studioToast && (
          <div style={{ marginBottom:12, padding:"10px 14px", borderRadius:9, background:studioToast.ok?"#D1FAE5":"#FEE2E2", color:studioToast.ok?"#065F46":"#991B1B", fontSize:13, fontWeight:600 }}>
            {studioToast.ok?"✓":"✗"} {studioToast.msg}
          </div>
        )}
        {!studioId && (
          <div style={{ padding:"12px 16px", background:"#FEF3C7", borderRadius:9, marginBottom:14, fontSize:13, color:"#92400E" }}>
            ⏳ Chargement des données studio…
          </div>
        )}
        <Card noPad style={{ marginBottom:14 }}>
          <SectionHead>Informations du studio</SectionHead>
          <div style={{ padding:"16px 18px", display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr", gap:12 }}>
            <div style={{ gridColumn:isMobile?"1":"1 / -1" }}>
              <SI label="Nom du studio" fkey="name" placeholder="Mon Studio Yoga"/>
            </div>
            <SI label="Adresse" fkey="address" placeholder="12 rue de la Paix"/>
            <SI label="Ville" fkey="city" placeholder="Paris"/>
            <SI label="Téléphone" fkey="phone" type="tel" placeholder="06 00 00 00 00"/>
            <SI label="Email de contact" fkey="email" type="email" placeholder="contact@studio.fr"/>
            <SI label="Site web" fkey="website" placeholder="https://monstudio.fr"/>
          </div>
          {isAdmin && (
            <div style={{ padding:"0 18px 16px", display:"flex", alignItems:"center", gap:10 }}>
              <Button sm variant="primary" onClick={saveStudio}>{studioSaving?"Enregistrement…":"Enregistrer"}</Button>
            </div>
          )}
        </Card>

        <Card noPad style={{ marginBottom:14 }}>
          <SectionHead>Paramètres de réservation</SectionHead>
          <div style={{ padding:"16px 18px", display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr 1fr", gap:12 }}>
            <SI label="Délai annulation (h)" fkey="cancel_delay_h" type="number"/>
            <SI label="Ouverture résa (j avant)" fkey="booking_days_ahead" type="number"/>
            <SI label="Liste d'attente max" fkey="waitlist_max" type="number"/>
          </div>
          {isAdmin && (
            <div style={{ padding:"0 18px 16px" }}>
              <Button sm variant="primary" onClick={saveStudio}>{studioSaving?"Enregistrement…":"Enregistrer"}</Button>
            </div>
          )}
        </Card>

        <Card noPad>
          <SectionHead>Votre forfait</SectionHead>
          <div style={{ padding:"16px 18px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div>
              <div style={{ fontSize:16, fontWeight:800, color:C.text }}>{planName || "Essentiel"}</div>
              <div style={{ fontSize:12, color:C.textMuted, marginTop:2 }}>{membersCount} adhérent{membersCount>1?"s":""} actif{membersCount>1?"s":""}</div>
            </div>
            <Button sm variant="ghost" onClick={()=>window.open("https://fydelys.fr/#pricing","_blank")}>Changer de forfait</Button>
          </div>
        </Card>
      </div>
    );
  };

  // ── Tab: Users ────────────────────────────────────────────────────────────
  const TabUsers = () => {
    const tenantUsers = isSA ? users : users.filter(u=>u.tenant==="t1");
    return (
      <div>
        {isAdmin && (
          <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:12 }}>
            <Button sm variant="primary" onClick={()=>setModal({type:"inviteUser"})}><span style={{display:"flex",alignItems:"center",gap:5}}><IcoUserPlus s={13} c="white"/>Inviter un utilisateur</span></Button>
          </div>
        )}
        <Card noPad>
          {tenantUsers.map(u=>(
            <div key={u.id} style={{ padding:"11px 16px", borderBottom:`1px solid ${C.borderSoft}`, transition:"background .1s" }}
              onMouseEnter={e=>e.currentTarget.style.background=C.bg}
              onMouseLeave={e=>e.currentTarget.style.background=""}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:5 }}>
                <div style={{ width:32, height:32, borderRadius:"50%", background:C.accentBg, border:`1px solid #DFC0A0`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:C.accent, flexShrink:0 }}>{u.fn[0]}{u.ln[0]}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:C.text }}>{u.fn} {u.ln}</div>
                  <div style={{ fontSize:11, color:C.textSoft }}>{u.email}</div>
                </div>
                <RoleBadge role={u.role}/>
                {isSA && <span style={{ fontSize:10, color:C.textMuted, background:C.bg, padding:"2px 7px", borderRadius:8, border:`1px solid ${C.border}` }}>{tenants.find(t=>t.id===u.tenant)?.name}</span>}
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8, paddingLeft:42 }}>
                <Tag s={u.status}/>
                <span style={{ fontSize:11, color:C.textMuted, flex:1 }}>Connecté : {u.lastLogin}</span>
                {isAdmin && (
                  <div style={{ display:"flex", gap:5 }}>
                    <button onClick={()=>setModal({type:"editUser",user:u})} style={{ fontSize:11, padding:"3px 10px", borderRadius:6, border:`1px solid ${C.border}`, background:C.bg, color:C.textMid, cursor:"pointer", fontWeight:600 }}>Modifier</button>
                    {confirmDelete===u.id
                      ? <button onClick={()=>{ setUsers(prev=>prev.filter(x=>x.id!==u.id)); setConfirmDelete(null); showToast("Utilisateur supprimé", false); }}
                          style={{ fontSize:11, padding:"3px 10px", borderRadius:6, border:`1px solid #EFC8BC`, background:C.warnBg, color:C.warn, cursor:"pointer", fontWeight:700 }}>Confirmer</button>
                      : <button onClick={()=>setConfirmDelete(u.id)}
                          style={{ fontSize:11, padding:"3px 10px", borderRadius:6, border:`1px solid ${C.border}`, background:C.bg, color:C.textMuted, cursor:"pointer" }}>Supprimer</button>
                    }
                  </div>
                )}
              </div>
            </div>
          ))}
        </Card>
      </div>
    );
  };

  // ── Tab: Roles ────────────────────────────────────────────────────────────
  const TabRoles = () => (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      {Object.entries(ROLES_DEF).filter(([key])=> isSA || key !== "superadmin").map(([key, r])=>(
        <Card key={key} style={{ borderLeft:`3px solid ${r.color}` }}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, marginBottom:10 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:36, height:36, borderRadius:9, background:r.bg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                {key==="superadmin"&&<IcoLayers s={18} c={r.color}/>}{key==="admin"&&<IcoSettings s={18} c={r.color}/>}
                {key==="staff"&&<IcoCalendar s={18} c={r.color}/>}{key==="adherent"&&<IcoUsers s={18} c={r.color}/>}
              </div>
              <div>
                <div style={{ fontSize:15, fontWeight:700, color:C.text }}>{r.label}</div>
                <div style={{ fontSize:12, color:C.textSoft, marginTop:2 }}>{r.desc}</div>
              </div>
            </div>
            <span style={{ fontSize:12, fontWeight:700, color:r.color, background:r.bg, padding:"3px 10px", borderRadius:10, flexShrink:0 }}>
              {users.filter(u=>u.role===key).length} utilisateur{users.filter(u=>u.role===key).length>1?"s":""}
            </span>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr", gap:6 }}>
            {[["Planning",["superadmin","admin","staff"]],["Membres",["superadmin","admin","staff"]],["Paiements",["superadmin","admin"]],["Paramètres",["superadmin","admin"]],["Tous les tenants",["superadmin"]],["Config plateforme",["superadmin"]]].map(([perm,roles])=>{
              const has = roles.includes(key);
              return (
                <div key={perm} style={{ display:"flex", alignItems:"center", gap:7, padding:"5px 8px", borderRadius:7, background:has?r.bg+"80":C.bg }}>
                  <div style={{ width:16, height:16, borderRadius:"50%", background:has?r.color:"#D0C8C0", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{has?<IcoCheck s={9} c="white"/>:<IcoX s={9} c="white"/>}</div>
                  <span style={{ fontSize:12, color:has?r.color:C.textMuted, fontWeight:has?600:400 }}>{perm}</span>
                </div>
              );
            })}
          </div>
        </Card>
      ))}
    </div>
  );

  // ── Tab: Mon compte ───────────────────────────────────────────────────────
  const [accountForm, setAccountForm] = useState({ firstName:"", lastName:"", email:"", phone:"" });
  const [accountSaving, setAccountSaving] = useState(false);
  const [accountToast, setAccountToast] = useState(null);
  const showAccountToast = (msg, ok=true) => { setAccountToast({msg,ok}); setTimeout(()=>setAccountToast(null),3000); };

  useEffect(() => {
    createClient().auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: prof } = await createClient().from("profiles")
        .select("first_name, last_name, phone").eq("id", user.id).single();
      setAccountForm({
        firstName: prof?.first_name || "",
        lastName:  prof?.last_name  || "",
        email:     user.email || "",
        phone:     prof?.phone || "",
      });
    });
  }, []);

  const saveAccount = async () => {
    setAccountSaving(true);
    try {
      const { data: { user } } = await createClient().auth.getUser();
      if (!user) { showAccountToast("Non connecté", false); return; }
      const { error } = await createClient().from("profiles").update({
        first_name: accountForm.firstName,
        last_name:  accountForm.lastName,
        phone:      accountForm.phone,
      }).eq("id", user.id);
      if (error) showAccountToast("Erreur : " + error.message, false);
      else showAccountToast("Profil enregistré !");
    } catch(e) { showAccountToast("Erreur", false); }
    finally { setAccountSaving(false); }
  };

  const TabAccount = () => (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      {accountToast && (
        <div style={{ position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)", zIndex:9999,
          background:accountToast.ok?"#2A1F14":"#7F1D1D", color:"#fff", borderRadius:12, padding:"11px 22px",
          fontSize:13, fontWeight:600, boxShadow:"0 4px 20px rgba(0,0,0,.25)", whiteSpace:"nowrap" }}>
          {accountToast.ok?"✓":"✕"} {accountToast.msg}
        </div>
      )}
      <Card>
        <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:18 }}>
          <div style={{ width:56, height:56, borderRadius:14, background:C.accentBg, border:`2px solid #DFC0A0`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:800, color:C.accent }}>
            {(accountForm.firstName?.[0]||"")+(accountForm.lastName?.[0]||"")||"?"}
          </div>
          <div>
            <div style={{ fontSize:17, fontWeight:800, color:C.text }}>{[accountForm.firstName, accountForm.lastName].filter(Boolean).join(" ")||"Utilisateur"}</div>
            <div style={{ fontSize:13, color:C.textSoft, marginTop:2 }}>{accountForm.email}</div>
            <div style={{ marginTop:5 }}><RoleBadge role={currentRole}/></div>
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr", gap:12 }}>
          {[
            ["Prénom",    accountForm.firstName, v => setAccountForm(f=>({...f, firstName:v}))],
            ["Nom",       accountForm.lastName,  v => setAccountForm(f=>({...f, lastName:v}))],
            ["Email",     accountForm.email,     null],
            ["Téléphone", accountForm.phone,     v => setAccountForm(f=>({...f, phone:v}))],
          ].map(([lbl, val, onChange]) => (
            <div key={lbl}><FieldLabel>{lbl}</FieldLabel>
              <input
                value={val}
                readOnly={!onChange}
                onChange={onChange ? e=>onChange(e.target.value) : undefined}
                style={{ width:"100%", padding:"9px 12px", border:`1.5px solid ${C.border}`, borderRadius:8,
                  fontSize:14, outline:"none", boxSizing:"border-box", color:C.text,
                  background: onChange ? C.surfaceWarm : "#F0EBE4",
                  cursor: onChange ? "text" : "default" }}
                onFocus={e=>{ if(onChange) e.target.style.borderColor=C.accent; }}
                onBlur={e=>e.target.style.borderColor=C.border}
              />
            </div>
          ))}
        </div>
        <div style={{ marginTop:14 }}>
          <Button sm variant="primary" onClick={saveAccount} disabled={accountSaving}>
            {accountSaving ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </Card>
      {/* ── Facturation ── */}
      <Card noPad>
        <SectionHead>Formule Fydelys</SectionHead>
        <div style={{ padding:"16px 18px" }}>
          {/* Plan actuel */}
          {(() => {
            const currentPlan = FYDELYS_PLANS.find(p=>p.name===planName) || FYDELYS_PLANS[0];
            return (
              <div style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 16px", background:C.accentLight, borderRadius:10, marginBottom:20, border:`1.5px solid ${currentPlan.color}40` }}>
                <div style={{ width:44, height:44, borderRadius:11, background:currentPlan.color, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <span style={{ fontSize:20 }}>⭐</span>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:15, fontWeight:800, color:C.text }}>Plan <span style={{ color:currentPlan.color }}>{currentPlan.name}</span></div>
                  <div style={{ fontSize:12, color:C.textSoft, marginTop:2 }}>{currentPlan.price} €/mois · {currentPlan.limits.members ? `${currentPlan.limits.members} adhérents max` : "Adhérents illimités"}</div>
                </div>
                <div style={{ fontSize:11, fontWeight:700, padding:"3px 9px", borderRadius:6, background:"#EAF5EC", color:"#3A6E46", flexShrink:0 }}>Actif</div>
              </div>
            );
          })()}

          {/* Cards 3 plans */}
          <div style={{ fontSize:12, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:.8, marginBottom:12 }}>Changer de formule</div>
          <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)", gap:12, marginBottom:16 }}>
            {FYDELYS_PLANS.map(plan => {
              const isCurrent = plan.name === planName;
              return (
                <div key={plan.id} style={{ borderRadius:12, border:`2px solid ${isCurrent?plan.color:C.border}`, background:isCurrent?`${plan.color}08`:C.surface, padding:"16px", position:"relative", transition:"border-color .15s" }}>
                  {plan.popular && !isCurrent && (
                    <div style={{ position:"absolute", top:-1, right:12, background:plan.color, color:"#fff", fontSize:9, fontWeight:800, padding:"2px 8px", borderRadius:"0 0 7px 7px", textTransform:"uppercase" }}>Populaire</div>
                  )}
                  {isCurrent && (
                    <div style={{ position:"absolute", top:-1, right:12, background:"#3A6E46", color:"#fff", fontSize:9, fontWeight:800, padding:"2px 8px", borderRadius:"0 0 7px 7px", textTransform:"uppercase" }}>✓ Actuel</div>
                  )}
                  <div style={{ fontSize:15, fontWeight:800, color:plan.color, marginBottom:2 }}>{plan.name}</div>
                  <div style={{ fontSize:10, color:C.textSoft, marginBottom:10 }}>{plan.desc}</div>
                  <div style={{ fontSize:24, fontWeight:800, color:C.text, lineHeight:1, marginBottom:12 }}>
                    {plan.price} €<span style={{ fontSize:12, fontWeight:400, color:C.textSoft }}>/mois</span>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:5, marginBottom:14 }}>
                    {plan.features.map((f,i) => (
                      <div key={i} style={{ display:"flex", alignItems:"center", gap:7 }}>
                        <span style={{ fontSize:11, flexShrink:0, color:f.ok?"#3A6E46":"#C8B8A8" }}>{f.ok?"✓":"✕"}</span>
                        <span style={{ fontSize:12, color:f.ok?C.text:C.textSoft, textDecoration:f.ok?"none":"none" }}>{f.label}</span>
                      </div>
                    ))}
                  </div>
                  {!isCurrent && (
                    <button onClick={()=>window.location.href="/billing"}
                      style={{ width:"100%", padding:"8px 12px", borderRadius:8, border:`1.5px solid ${plan.color}`, background:"transparent", color:plan.color, fontSize:12, fontWeight:700, cursor:"pointer" }}>
                      Choisir {plan.name} →
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ fontSize:11, color:C.textSoft, textAlign:"center" }}>
            15 jours d'essai gratuit inclus · Sans engagement · Résiliable à tout moment
          </div>
        </div>
      </Card>

      <Card noPad>
        <SectionHead>Sécurité</SectionHead>
        <div style={{ padding:"14px 18px", display:"flex", flexDirection:"column", gap:10 }}>
          {[
            ["Changer le mot de passe", ()=>setModal({type:"password"}),   "Modifier"],
            ["Authentification 2 facteurs", ()=>setModal({type:"2fa"}),    "Configurer"],
            ["Sessions actives",         ()=>setModal({type:"sessions"}),  "3 appareils"],
          ].map(([lbl, action, label])=>(
            <div key={lbl} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", borderRadius:8, background:C.bg }}>
              <span style={{ fontSize:14, color:C.text, fontWeight:500 }}>{lbl}</span>
              <button onClick={action} style={{ fontSize:12, padding:"4px 12px", borderRadius:7, border:`1px solid ${C.border}`, background:C.surface, color:C.accent, cursor:"pointer", fontWeight:600 }}>{label}</button>
            </div>
          ))}
        </div>
      </Card>
      <Card style={{ background:C.warnBg, border:`1px solid #EFC8BC` }}>
        <div style={{ fontSize:14, fontWeight:700, color:C.warn, marginBottom:6 }}>Zone de danger</div>
        <div style={{ fontSize:12, color:C.textMid, marginBottom:12 }}>La suppression de votre compte est irréversible.</div>
        <Button sm variant="danger" onClick={()=>setModal({type:"deleteAccount"})}>Supprimer mon compte</Button>
      </Card>
    </div>
  );

  // ── Tab: Équipe — coachs et leurs disciplines ─────────────────────────────
  const COACHES_INIT = [];

  const TabTeam = () => {
    const [coaches, setCoaches]         = useState(COACHES_INIT);
    const [editCoach, setEditCoach]     = useState(null); // coach en cours d'édition disciplines
    // inviteModal/inviteEmail/inviteName remontés dans Settings pour éviter perte de focus

    // Sauvegarder disciplines d'un coach
    const saveDisciplines = (coachId, discIds) => {
      setCoaches(prev => prev.map(c => c.id===coachId ? {...c, disciplines:discIds} : c));
      setEditCoach(null);
      showToast("Disciplines mises à jour ✓");
    };

    // Modal affectation disciplines
    const DiscModal = ({ coach }) => {
      const [selected, setSelected] = useState([...coach.disciplines]);
      const toggle = (id) => setSelected(prev =>
        prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id]
      );
      return (
        <div onClick={e=>e.target===e.currentTarget&&setEditCoach(null)}
          style={{position:"fixed",inset:0,background:"rgba(42,31,20,.45)",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
          <div style={{background:C.surface,borderRadius:16,padding:24,width:"100%",maxWidth:460,boxShadow:"0 24px 60px rgba(0,0,0,.18)"}}>
            {/* Header */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
              <div>
                <div style={{fontSize:16,fontWeight:800,color:C.text}}>Disciplines de {coach.fn} {coach.ln}</div>
                <div style={{fontSize:12,color:C.textMuted,marginTop:2}}>Sélectionnez les disciplines que ce coach enseigne</div>
              </div>
              <button onClick={()=>setEditCoach(null)} style={{background:"none",border:`1.5px solid ${C.border}`,borderRadius:8,padding:"4px 8px",cursor:"pointer"}}>
                <IcoX s={14} c={C.textSoft}/>
              </button>
            </div>
            {/* Grid disciplines */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:20}}>
              {DISCIPLINES.map(d => {
                const on = selected.includes(d.id);
                return (
                  <div key={d.id} onClick={()=>toggle(d.id)}
                    style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",borderRadius:12,border:`2px solid ${on?d.color:C.border}`,background:on?`${d.color}14`:C.surface,cursor:"pointer",userSelect:"none",transition:"all .15s"}}>
                    <div style={{width:32,height:32,borderRadius:8,background:on?d.color:C.bgDeep,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0,transition:"all .15s"}}>
                      {d.icon}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:700,color:on?d.color:C.text}}>{d.name}</div>
                    </div>
                    <div style={{width:18,height:18,borderRadius:"50%",border:`2px solid ${on?d.color:C.border}`,background:on?d.color:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      {on && <span style={{color:"#fff",fontSize:10,fontWeight:800}}>✓</span>}
                    </div>
                  </div>
                );
              })}
            </div>
            {selected.length===0 && (
              <div style={{padding:"8px 14px",background:C.warnBg,borderRadius:8,fontSize:12,color:C.warn,marginBottom:14}}>
                ⚠ Ce coach n'aura aucune discipline affectée
              </div>
            )}
            <div style={{display:"flex",gap:10}}>
              <Button variant="primary" onClick={()=>saveDisciplines(coach.id, selected)}>
                Enregistrer ({selected.length} discipline{selected.length!==1?"s":""})
              </Button>
              <Button variant="ghost" onClick={()=>setEditCoach(null)}>Annuler</Button>
            </div>
          </div>
        </div>
      );
    };

    // InviteCoachModal est rendu depuis Settings (parent) pour éviter la perte de focus

    return (
      <div>
        {editCoach && <DiscModal coach={editCoach}/>}
        {inviteModal && <InviteCoachModal
        C={C}
        inviteEmail={inviteEmail}
        setInviteEmail={setInviteEmail}
        inviteName={inviteName}
        setInviteName={setInviteName}
        onClose={()=>setInviteModal(false)}
        onSubmit={async ()=>{
          if(!inviteEmail||!inviteName.fn) return;
          const newCoach = { id:`c${Date.now()}`, fn:inviteName.fn, ln:inviteName.ln, email:inviteEmail, isCoach:true, disciplines:[], status:"invité" };
          setCoaches(prev=>[...prev, newCoach]);
          setInviteModal(false); setInviteEmail(""); setInviteName({fn:"",ln:""});
          // Appel API pour envoyer le magic link d'invitation
          try {
            await fetch("/api/invite-coach", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: inviteEmail,
                firstName: inviteName.fn,
                lastName: inviteName.ln,
              }),
            });
          } catch(e) { console.error("invite error", e); }
          showToast(`Invitation envoyée à ${inviteEmail} ✓`);
        }}
      />}

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:10}}>
          <div>
            <div style={{fontSize:18,fontWeight:800,color:C.text,letterSpacing:-0.3}}>Équipe & Coachs</div>
            <div style={{fontSize:13,color:C.textMuted,marginTop:2}}>{coaches.length} intervenant{coaches.length!==1?"s":""} · Gérez les disciplines par coach</div>
          </div>
          <Button sm variant="primary" onClick={()=>setInviteModal(true)}>
            + Inviter un coach
          </Button>
        </div>

        {/* Liste des coachs */}
        {coaches.map(coach => {
          const assignedDiscs = DISCIPLINES.filter(d => coach.disciplines.includes(d.id));
          const initials = (coach.fn[0]||"")+(coach.ln[0]||"");
          return (
            <div key={coach.id} style={{background:C.surface,borderRadius:14,border:`1px solid ${C.border}`,padding:"16px 18px",marginBottom:10}}>
              <div style={{display:"flex",alignItems:"flex-start",gap:14,flexWrap:isMobile?"wrap":"nowrap"}}>
                {/* Avatar */}
                <div style={{width:44,height:44,borderRadius:"50%",background:`linear-gradient(135deg,${C.accent},${C.accentDark})`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:15,fontWeight:800,flexShrink:0}}>
                  {initials}
                </div>
                {/* Infos */}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                    <div style={{fontSize:15,fontWeight:700,color:C.text}}>{coach.fn} {coach.ln}</div>
                    <span style={{fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:8,background:coach.status==="invité"?C.infoBg:C.okBg,color:coach.status==="invité"?C.info:C.ok}}>
                      {coach.status==="invité"?"⏳ Invitation envoyée":"✓ Actif"}
                    </span>
                  </div>
                  <div style={{fontSize:12,color:C.textMuted,marginTop:2}}>{coach.email}</div>
                  {/* Disciplines assignées */}
                  <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:10}}>
                    {assignedDiscs.length===0 ? (
                      <span style={{fontSize:12,color:C.textMuted,fontStyle:"italic"}}>Aucune discipline affectée</span>
                    ) : assignedDiscs.map(d=>(
                      <span key={d.id} style={{display:"inline-flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:20,background:`${d.color}18`,border:`1px solid ${d.color}40`,fontSize:12,fontWeight:600,color:d.color}}>
                        {d.icon} {d.name}
                      </span>
                    ))}
                  </div>
                </div>
                {/* Action */}
                <button onClick={()=>setEditCoach(coach)}
                  style={{flexShrink:0,padding:"7px 14px",borderRadius:9,border:`1.5px solid ${C.border}`,background:C.surface,color:C.accent,fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
                  ✏ Disciplines
                </button>
              </div>
            </div>
          );
        })}

        {coaches.length===0 && (
          <div style={{textAlign:"center",padding:"48px 16px",color:C.textMuted}}>
            <div style={{fontSize:36,marginBottom:12}}>👥</div>
            <div style={{fontSize:15,fontWeight:600,color:C.textSoft,marginBottom:8}}>Aucun coach dans l'équipe</div>
            <Button sm variant="primary" onClick={()=>setInviteModal(true)}>+ Inviter le premier coach</Button>
          </div>
        )}
      </div>
    );
  };

  const TAB_CONTENT = { superadmin:<TabSuperAdmin/>, studio:<TabStudio/>, team:<TabTeam/>, users:<TabUsers/>, roles:<TabRoles/>, account:<TabAccount/> };

  return (
    <div style={{ padding:p, maxWidth:isSA?"none":720 }}>
      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", top:20, right:20, zIndex:600, display:"flex", alignItems:"center", gap:10, padding:"12px 18px", background:toast.ok!==false?C.ok:C.warn, borderRadius:10, color:"white", fontSize:14, fontWeight:600, boxShadow:"0 8px 24px rgba(0,0,0,.15)" }}>
          {toast.ok!==false ? <IcoCheck s={16} c="white"/> : <IcoAlert s={16} c="white"/>}{toast.msg}
        </div>
      )}
      {/* Modals */}
      {modal?.type==="newTenant"     && <NewTenantModal/>}
      {modal?.type==="inviteUser"    && <InviteUserModal/>}
      {modal?.type==="editUser"      && <EditUserModal/>}
      {modal?.type==="password"      && <PasswordModal/>}
      {modal?.type==="2fa"           && <TwoFAModal/>}
      {modal?.type==="sessions"      && <SessionsModal/>}
      {modal?.type==="deleteAccount" && <DeleteAccountModal/>}

      <RoleSwitcher/>
      <div style={{ display:"flex", gap:4, marginBottom:20, flexWrap:"wrap" }}>
        {tabs.map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:10, border:`1.5px solid ${tab===t.key?C.accent:C.border}`, background:tab===t.key?C.accentBg:C.surface, color:tab===t.key?C.accentDark:C.textMid, fontSize:13, fontWeight:tab===t.key?700:500, cursor:"pointer", transition:"all .15s" }}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>
      {TAB_CONTENT[tab] || <TabStudio/>}
    </div>
  );
}

const PAGE_TITLES = { dashboard:"Tableau de bord", planning:"Planning", members:"Adhérents", subscriptions:"Abonnements", payments:"Paiements", disciplines:"Disciplines", settings:"Paramètres", aide:"Aide" };
const PAGES = { dashboard:Dashboard, planning:Planning, members:Members, subscriptions:Subscriptions, payments:Payments, disciplines:DisciplinesPage, settings:Settings, aide:AidePage };

// ─── TENANTS DATA (Super Admin) ───────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
// SUPER ADMIN VIEW
// ══════════════════════════════════════════════════════════════════════════════

// Palette beige/marron Super Admin
const SA_C = {
  bg:"#F4EFE8", surface:"#FFFFFF", surfaceWarm:"#FBF8F4",
  border:"#DDD5C8", borderSoft:"#EAE4DA",
  text:"#2A1F14", textMid:"#5C4A38", textSoft:"#8C7B6C", textMuted:"#B0A090",
  accent:"#A06838", accentDark:"#8C5E38", accentBg:"#F5EBE0", accentLight:"#FBF6EE",
  ok:"#4E8A58", okBg:"#E6F2E8", warn:"#A85030", warnBg:"#F5EAE6",
  info:"#3A6E90", infoBg:"#E6EFF5", gold:"#C4922A", goldBg:"#FDF4E3",
};
const saInp = (f=false,err=false) => ({
  width:"100%", padding:"9px 12px",
  border:`1.5px solid ${err?"#F87171":f?"#A06838":"#DDD5C8"}`,
  borderRadius:9, fontSize:13, outline:"none",
  color:"#2A1F14", background:"#FDFAF7",
  boxSizing:"border-box",
  boxShadow: f?"0 0 0 3px rgba(160,104,56,.07)":"none"
});
const TENANTS_INIT = [];

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

function SuperAdminView({ onSwitch, isMobile, onSignOut }) {
  const [tenants, setTenants] = useState(TENANTS_INIT);
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState("tous");
  const [modal, setModal]     = useState(null); // null | {type:"new"} | {type:"edit",tenant} | {type:"delete",tenant}
  const [toast, setToast]     = useState(null);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [loading, setLoading] = useState(true);
  const showToast = (msg, ok=true) => { setToast({msg,ok}); setTimeout(()=>setToast(null),3500); };
  const p = isMobile ? 16 : 28;

  // Charger les vrais studios depuis Supabase
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("studios")
      .select("id, name, slug, city, email, status, billing_status, trial_ends_at, plan_slug, created_at")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) { console.error("Studios load error:", error); setLoading(false); return; }
        if (data && data.length > 0) {
          const mois = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
          const mapped = data.map(s => ({
            id:      s.id,
            name:    s.name || "Sans nom",
            slug:    s.slug || "",
            city:    s.city || "",
            email:   s.email || "",
            status:  s.status === "actif" ? "actif" : s.billing_status === "canceled" ? "suspendu" : "actif",
            plan:    s.plan_slug || "Essentiel",
            since:   (() => { const d = new Date(s.created_at); return `${mois[d.getMonth()]} ${d.getFullYear()}`; })(),
            members: 0,
            revenue: 0,
            growth:  0,
          }));
          setTenants(mapped);
        } else {
          setTenants([]);
        }
        setLoading(false);
      });
  }, []);

  const filtered = tenants
    .filter(t => filter==="tous" || t.status===filter)
    .filter(t => (t.name+" "+t.city+" "+(t.contact||"")).toLowerCase().includes(search.toLowerCase()));

  const totalRev   = tenants.filter(t=>t.status==="actif").reduce((s,t)=>s+(t.revenue||0),0);
  const totalMem   = tenants.reduce((s,t)=>s+(t.members||0),0);
  const actifCount = tenants.filter(t=>t.status==="actif").length;
  const suspCount  = tenants.filter(t=>t.status==="suspendu").length;

  // ── Helpers slug ─────────────────────────────────────────────────────────────
  const toSlug = (s) =>
    s.toLowerCase()
     .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
     .replace(/[^a-z0-9]/g,"");

  const validateSlug = (s) => /^[a-z0-9]+$/.test(s);

  // ── Shared styles ─────────────────────────────────────────────────────────────
  const SA = saInp();

  // ── Form Modal (New + Edit) ───────────────────────────────────────────────────
  function TenantFormModal({ editing }) {
    const emptyF = editing
      ? { name:editing.name, slug:editing.slug||"", email:editing.email||"", firstName:editing.firstName||"", lastName:editing.lastName||"", phone:editing.phone||"", city:editing.city||"", zip:editing.zip||"", address:editing.address||"", plan:editing.plan||"Essentiel", type:editing.type||"Yoga", notes:editing.notes||"", isCoach:editing.isCoach||false }
      : { name:"", slug:"", email:"", firstName:"", lastName:"", phone:"", city:"", zip:"", address:"", plan:"Essentiel", type:"Yoga", notes:"", isCoach:false };
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

    const save = () => {
      const now = new Date();
      const mois = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
      const since = `${mois[now.getMonth()]} ${now.getFullYear()}`;
      if(editing) {
        setTenants(prev=>prev.map(t=>t.id===editing.id ? {
          ...t, name:f.name, slug:f.slug, city:f.city, zip:f.zip, address:f.address,
          plan:f.plan, type:f.type, email:f.email,
          contact:`${f.firstName} ${f.lastName}`,
          firstName:f.firstName, lastName:f.lastName, phone:f.phone, notes:f.notes,
          isCoach:f.isCoach
        } : t));
        showToast(`✅ "${f.name}" mis à jour`);
      } else {
        const newT = {
          id:`t${Date.now()}`, name:f.name, slug:f.slug, city:f.city, zip:f.zip, address:f.address,
          plan:f.plan, type:f.type, email:f.email,
          contact:`${f.firstName} ${f.lastName}`,
          firstName:f.firstName, lastName:f.lastName, phone:f.phone, notes:f.notes,
          isCoach:f.isCoach,
          members:0, revenue:FYDELYS_PLANS.find(p=>p.name===f.plan)?.price||9,
          status:"actif", since, growth:0
        };
        setTenants(prev=>[newT, ...prev]);
        showToast(`🚀 "${f.name}" créé — seed injecté !`);
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
              {!editing&&(
                <div style={{padding:"12px 16px",background:"#FBF6EE",borderRadius:10,border:"1px solid rgba(160,104,56,.2)",fontSize:12,color:"#8C7B6C",lineHeight:1.6}}>
                  🌱 <strong>Seed automatique :</strong> disciplines, abonnements et 1 séance de démo seront créés dans Supabase pour ce studio.
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
  function DeleteModal({ tenant }) {
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
      {modal?.type==="new"    && <TenantFormModal/>}
      {modal?.type==="edit"   && <TenantFormModal editing={modal.tenant}/>}
      {modal?.type==="delete" && <DeleteModal tenant={modal.tenant}/>}

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
                  onClick={()=>window.open(`https://${t.slug}.fydelys.fr/dashboard`,"_blank")}
                  style={{fontSize:11,padding:"4px 10px",borderRadius:6,border:"1px solid rgba(160,104,56,.3)",background:"rgba(160,104,56,.08)",color:"#A06838",cursor:"pointer",fontWeight:600}}>
                  🔗 Accéder
                </button>
                <button onClick={()=>setModal({type:"edit",tenant:t})}
                  style={{fontSize:11,padding:"4px 10px",borderRadius:6,border:"1px solid rgba(167,139,250,.3)",background:"rgba(167,139,250,.1)",color:"#8C5E38",cursor:"pointer",fontWeight:600}}>✏ Modifier</button>
                {t.status==="actif"
                  ? <button onClick={()=>{ setTenants(p=>p.map(x=>x.id===t.id?{...x,status:"suspendu"}:x)); showToast(`"${t.name}" suspendu`,false); }}
                      style={{fontSize:11,padding:"4px 10px",borderRadius:6,border:"1px solid rgba(248,113,113,.3)",background:"rgba(248,113,113,.1)",color:"#F87171",cursor:"pointer",fontWeight:600}}>Suspendre</button>
                  : <button onClick={()=>{ setTenants(p=>p.map(x=>x.id===t.id?{...x,status:"actif"}:x)); showToast(`"${t.name}" réactivé`); }}
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
const COACH_NAV = [
  { key:"planning",  label:"Mes cours",     icon:IcoCalendar  },
  { key:"students",  label:"Mes inscrits",  icon:IcoUsers     },
  { key:"profile",   label:"Mon profil",    icon:IcoUser      },
];

// Données mock — le coach voit uniquement ses propres séances
const MY_COACH_NAME = "Sophie Laurent"; // sera remplacé par le profil réel
const MY_SESSIONS = SESSIONS_INIT.filter(s => s.teacher === MY_COACH_NAME);

function CoachView({ onSwitch, isMobile, coachName = MY_COACH_NAME, coachDisciplines = [] }) {
  const [page, setPage]  = useState("planning");
  const [toast, setToast] = useState(null);
  const showToast = (msg, ok=true) => { setToast({msg,ok}); setTimeout(()=>setToast(null),3000); };
  const p = isMobile ? 16 : 28;

  // Séances du coach uniquement
  const [sessions, setSessions] = useState(
    SESSIONS_INIT.filter(s => s.teacher === coachName)
  );
  const [selectedSession, setSelectedSession] = useState(null);

  const initials = coachName.split(" ").map(n=>n[0]).join("").toUpperCase();
  const totalStudents = sessions.reduce((sum,s)=>sum+s.booked, 0);
  const nextSession = [...sessions]
    .filter(s=>s.date >= new Date().toISOString().split("T")[0])
    .sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time))[0];

  // ── Nav bar ──────────────────────────────────────────────────────────────────
  const NavBar = () => (
    isMobile ? (
      <div style={{ position:"fixed", bottom:0, left:0, right:0, background:C.surface, borderTop:`1px solid ${C.border}`, display:"flex", zIndex:100, paddingBottom:"env(safe-area-inset-bottom)" }}>
        {COACH_NAV.map(n=>{
          const Ic = n.icon;
          const active = page === n.key;
          return (
            <button key={n.key} onClick={()=>setPage(n.key)}
              style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"10px 0", background:"none", border:"none", cursor:"pointer", gap:3 }}>
              <Ic s={20} c={active ? C.accent : C.textMuted}/>
              <span style={{ fontSize:10, fontWeight:active?700:500, color:active?C.accent:C.textMuted }}>{n.label}</span>
            </button>
          );
        })}
      </div>
    ) : (
      <div style={{ width:220, minHeight:"100vh", background:C.surface, borderRight:`1px solid ${C.border}`, display:"flex", flexDirection:"column", flexShrink:0 }}>
        {/* Logo */}
        <div style={{ padding:"24px 20px 20px", borderBottom:`1px solid ${C.borderSoft}` }}>
          <div style={{ fontSize:22, fontWeight:800, color:C.text, letterSpacing:-0.5 }}>
            Fyde<span style={{ color:C.accent }}>lys</span>
          </div>
          <div style={{ fontSize:11, color:C.textMuted, fontWeight:600, textTransform:"uppercase", letterSpacing:1, marginTop:2 }}>Espace Coach</div>
        </div>
        {/* Profil mini */}
        <div style={{ padding:"16px 20px", borderBottom:`1px solid ${C.borderSoft}`, display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:38, height:38, borderRadius:"50%", background:`linear-gradient(135deg,${C.accent},${C.accentDark})`, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:14, fontWeight:700, flexShrink:0 }}>{initials}</div>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:C.text, lineHeight:1.2 }}>{coachName}</div>
            <div style={{ fontSize:11, color:C.textMuted }}>🎯 Coach</div>
          </div>
        </div>
        {/* Nav links */}
        <nav style={{ padding:"12px 10px", flex:1 }}>
          {COACH_NAV.map(n=>{
            const Ic = n.icon;
            const active = page === n.key;
            return (
              <button key={n.key} onClick={()=>setPage(n.key)}
                style={{ display:"flex", alignItems:"center", gap:10, width:"100%", padding:"10px 12px", borderRadius:10, border:"none", background:active?C.accentLight:"transparent", color:active?C.accentDark:C.textMid, fontWeight:active?700:500, fontSize:14, cursor:"pointer", marginBottom:2, textAlign:"left" }}>
                <Ic s={18} c={active?C.accent:C.textMuted}/>
                {n.label}
              </button>
            );
          })}
        </nav>
      </div>
    )
  );

  // ── Header ────────────────────────────────────────────────────────────────────
  const Header = ({ title, sub }) => (
    <div style={{ padding:`${p}px ${p}px 0`, marginBottom:20 }}>
      {isMobile && (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
          <div style={{ fontSize:18, fontWeight:800, color:C.text, letterSpacing:-0.3 }}>Fyde<span style={{ color:C.accent }}>lys</span></div>
          <div style={{ width:32, height:32, borderRadius:"50%", background:C.accentLight, display:"flex", alignItems:"center", justifyContent:"center", color:C.accent, fontSize:13, fontWeight:700 }}>{initials}</div>
        </div>
      )}
      <div style={{ fontSize:isMobile?20:24, fontWeight:800, color:C.text, letterSpacing:-0.5 }}>{title}</div>
      {sub && <div style={{ fontSize:13, color:C.textSoft, marginTop:3 }}>{sub}</div>}
    </div>
  );

  // ── VUE PLANNING COACH ─────────────────────────────────────────────────────
  function CoachPlanning() {
    const grouped = sessions.reduce((acc,s)=>{
      (acc[s.date]=acc[s.date]||[]).push(s); return acc;
    }, {});
    const dates = Object.keys(grouped).sort();

    const fillColor = (booked, spots) => {
      const pct = booked / spots;
      if (pct >= 1)    return C.warn;
      if (pct >= 0.75) return C.ok;
      return C.accent;
    };

    return (
      <>
        <Header title="Mes cours" sub={`${sessions.length} séance${sessions.length>1?"s":""} à venir`}/>

        {/* KPIs rapides */}
        <div style={{ padding:`0 ${p}px`, display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:20 }}>
          {[
            { label:"Séances", value:sessions.length, icon:"📅", color:C.accent, bg:C.accentLight },
            { label:"Inscrits total", value:totalStudents, icon:"👥", color:C.ok, bg:C.okBg },
            { label:"Prochain cours", value:nextSession ? nextSession.time : "—", icon:"⏰", color:C.info, bg:C.infoBg },
          ].map(k=>(
            <div key={k.label} style={{ background:k.bg, borderRadius:12, padding:"12px 10px", border:`1px solid ${k.color}22` }}>
              <div style={{ fontSize:20, marginBottom:4 }}>{k.icon}</div>
              <div style={{ fontSize:isMobile?18:22, fontWeight:800, color:k.color, lineHeight:1 }}>{k.value}</div>
              <div style={{ fontSize:10, color:C.textMuted, marginTop:3 }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* Liste séances par date */}
        <div style={{ padding:`0 ${p}px ${isMobile?90:p}px` }}>
          {dates.length === 0 && (
            <div style={{ textAlign:"center", padding:"48px 16px", color:C.textMuted }}>
              <div style={{ fontSize:36, marginBottom:12 }}>📭</div>
              <div style={{ fontSize:16, fontWeight:600, color:C.textSoft }}>Aucun cours planifié</div>
            </div>
          )}
          {dates.map(date=>(
            <div key={date} style={{ marginBottom:20 }}>
              <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>
                {new Date(date).toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})}
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {grouped[date].sort((a,b)=>a.time.localeCompare(b.time)).map(s=>{
                  const disc = DISCIPLINES.find(d=>d.id===s.disciplineId);
                  const pct  = Math.round(s.booked/s.spots*100);
                  const fc   = fillColor(s.booked, s.spots);
                  return (
                    <div key={s.id} onClick={()=>setSelectedSession(s)}
                      style={{ background:C.surface, borderRadius:12, padding:"14px 16px", border:`1px solid ${C.border}`, cursor:"pointer", display:"flex", alignItems:"center", gap:14 }}
                      onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent}
                      onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                      {/* Heure */}
                      <div style={{ textAlign:"center", minWidth:44, flexShrink:0 }}>
                        <div style={{ fontSize:16, fontWeight:800, color:C.text }}>{s.time}</div>
                        <div style={{ fontSize:10, color:C.textMuted }}>{s.duration}min</div>
                      </div>
                      {/* Barre séparatrice colorée */}
                      <div style={{ width:3, height:40, borderRadius:2, background:disc?.color||C.accent, flexShrink:0 }}/>
                      {/* Infos */}
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:14, fontWeight:700, color:C.text }}>{disc?.name || "Cours"}</div>
                        <div style={{ fontSize:12, color:C.textSoft }}>{s.room} · {s.level}</div>
                      </div>
                      {/* Taux remplissage */}
                      <div style={{ textAlign:"right", flexShrink:0 }}>
                        <div style={{ fontSize:15, fontWeight:800, color:fc }}>{s.booked}/{s.spots}</div>
                        <div style={{ width:56, height:4, background:C.bgDeep, borderRadius:2, marginTop:4, overflow:"hidden" }}>
                          <div style={{ height:"100%", width:`${pct}%`, background:fc, borderRadius:2 }}/>
                        </div>
                        {s.waitlist>0 && <div style={{ fontSize:10, color:C.warn, marginTop:2 }}>+{s.waitlist} liste att.</div>}
                      </div>
                      <div style={{ color:C.textMuted, fontSize:12 }}>›</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Modal détail séance + inscrits */}
        {selectedSession && (() => {
          const s    = selectedSession;
          const disc = DISCIPLINES.find(d=>d.id===s.disciplineId);
          const bks  = BOOKINGS_INIT[s.id] || [];
          const confirmed = bks.filter(b=>b.st==="confirmed");
          const waiting   = bks.filter(b=>b.st==="waitlist");
          return (
            <div onClick={e=>e.target===e.currentTarget&&setSelectedSession(null)}
              style={{ position:"fixed", inset:0, background:"rgba(42,31,20,.45)", zIndex:800, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
              <div style={{ background:C.surface, borderRadius:20, width:"100%", maxWidth:500, maxHeight:"88vh", overflowY:"auto", boxShadow:"0 24px 56px rgba(42,31,20,.18)" }}>
                {/* En-tête */}
                <div style={{ padding:"20px 22px 16px", borderBottom:`1px solid ${C.borderSoft}`, position:"sticky", top:0, background:C.surface, zIndex:1 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                    <div>
                      <div style={{ fontSize:18, fontWeight:800, color:C.text }}>{disc?.name}</div>
                      <div style={{ fontSize:13, color:C.textSoft, marginTop:2 }}>
                        {new Date(s.date).toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})} · {s.time} · {s.duration} min
                      </div>
                      <div style={{ fontSize:12, color:C.textMuted, marginTop:1 }}>{s.room} · {s.level}</div>
                    </div>
                    <button onClick={()=>setSelectedSession(null)} style={{ background:C.bgDeep, border:`1px solid ${C.border}`, borderRadius:8, padding:"4px 10px", cursor:"pointer", color:C.textSoft, fontSize:15 }}>✕</button>
                  </div>
                  {/* Barre remplissage */}
                  <div style={{ marginTop:12, padding:"10px 14px", background:C.accentLight, borderRadius:10, display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, color:C.textSoft, marginBottom:5 }}>Remplissage</div>
                      <div style={{ height:6, background:C.bgDeep, borderRadius:3, overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${Math.min(100,Math.round(s.booked/s.spots*100))}%`, background:s.booked>=s.spots?C.warn:C.ok, borderRadius:3 }}/>
                      </div>
                    </div>
                    <div style={{ fontSize:18, fontWeight:800, color:C.text, flexShrink:0 }}>{s.booked}/{s.spots}</div>
                  </div>
                </div>

                {/* Liste inscrits confirmés */}
                <div style={{ padding:"16px 22px" }}>
                  <div style={{ fontSize:13, fontWeight:700, color:C.textMid, marginBottom:10 }}>
                    ✅ Inscrits confirmés ({confirmed.length})
                  </div>
                  {confirmed.length === 0 && (
                    <div style={{ padding:"16px 0", color:C.textMuted, fontSize:13 }}>Aucun inscrit pour l'instant</div>
                  )}
                  {confirmed.map((b,i)=>(
                    <div key={b.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 0", borderBottom:i<confirmed.length-1?`1px solid ${C.borderSoft}`:"none" }}>
                      <div style={{ width:32, height:32, borderRadius:"50%", background:C.accentLight, display:"flex", alignItems:"center", justifyContent:"center", color:C.accent, fontSize:12, fontWeight:700, flexShrink:0 }}>
                        {(b.fn[0]||"")+( b.ln[0]||"")}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{b.fn} {b.ln}</div>
                        <div style={{ fontSize:11, color:C.textMuted }}>{b.sub}{b.credits!=null ? ` · ${b.credits}/${b.total} crédits` : ""}</div>
                      </div>
                      <div style={{ fontSize:11, color:C.textMuted }}>{b.phone}</div>
                    </div>
                  ))}

                  {/* Liste d'attente */}
                  {waiting.length > 0 && (
                    <>
                      <div style={{ fontSize:13, fontWeight:700, color:C.textMid, marginTop:18, marginBottom:10 }}>
                        ⏳ Liste d'attente ({waiting.length})
                      </div>
                      {waiting.map((b,i)=>(
                        <div key={b.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 0", borderBottom:i<waiting.length-1?`1px solid ${C.borderSoft}`:"none", opacity:.7 }}>
                          <div style={{ width:32, height:32, borderRadius:"50%", background:"#F5EBE0", display:"flex", alignItems:"center", justifyContent:"center", color:C.warn, fontSize:12, fontWeight:700, flexShrink:0 }}>
                            {(b.fn[0]||"")+(b.ln[0]||"")}
                          </div>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{b.fn} {b.ln}</div>
                            <div style={{ fontSize:11, color:C.textMuted }}>{b.sub}</div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </>
    );
  }

  // ── VUE INSCRITS COACH ────────────────────────────────────────────────────
  function CoachStudents() {
    // Tous les inscrits uniques sur les séances du coach
    const allStudents = Object.entries(BOOKINGS_INIT)
      .filter(([sid]) => sessions.some(s=>String(s.id)===String(sid)))
      .flatMap(([sid, bks]) => bks.filter(b=>b.st==="confirmed").map(b=>({...b, sessionId:Number(sid)})))

    const uniqueEmails = new Set();
    const unique = allStudents.filter(b=>{
      const key = `${b.fn}${b.ln}`;
      if(uniqueEmails.has(key)) return false;
      uniqueEmails.add(key); return true;
    });

    const [search, setSearch] = useState("");
    const filtered = unique.filter(b=>`${b.fn} ${b.ln}`.toLowerCase().includes(search.toLowerCase()));

    return (
      <>
        <Header title="Mes inscrits" sub={`${unique.length} élève${unique.length>1?"s":""} uniques sur mes cours`}/>
        <div style={{ padding:`0 ${p}px ${isMobile?90:p}px` }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Rechercher un élève…"
            style={{ width:"100%", padding:"10px 14px", border:`1.5px solid ${C.border}`, borderRadius:10, fontSize:14, outline:"none", color:C.text, background:C.surface, boxSizing:"border-box", marginBottom:16 }}/>
          {filtered.map((b,i)=>{
            const nbSessions = allStudents.filter(x=>`${x.fn}${x.ln}`===`${b.fn}${b.ln}`).length;
            return (
              <div key={`${b.fn}${b.ln}`} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", background:C.surface, borderRadius:12, border:`1px solid ${C.border}`, marginBottom:8 }}>
                <div style={{ width:38, height:38, borderRadius:"50%", background:C.accentLight, display:"flex", alignItems:"center", justifyContent:"center", color:C.accent, fontSize:14, fontWeight:700, flexShrink:0 }}>
                  {(b.fn[0]||"")+(b.ln[0]||"")}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:C.text }}>{b.fn} {b.ln}</div>
                  <div style={{ fontSize:12, color:C.textMuted }}>{b.sub}</div>
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:C.accent }}>{nbSessions}</div>
                  <div style={{ fontSize:10, color:C.textMuted }}>séance{nbSessions>1?"s":""}</div>
                </div>
              </div>
            );
          })}
          {filtered.length===0 && <div style={{ textAlign:"center", padding:"32px", color:C.textMuted }}>Aucun résultat pour « {search} »</div>}
        </div>
      </>
    );
  }

  // ── VUE PROFIL COACH ──────────────────────────────────────────────────────
  function CoachProfile() {
    const totalHours = sessions.reduce((sum,s)=>sum+s.duration, 0);
    const avgFill = sessions.length
      ? Math.round(sessions.reduce((sum,s)=>sum+s.booked/s.spots*100, 0) / sessions.length)
      : 0;
    return (
      <>
        <Header title="Mon profil"/>
        <div style={{ padding:`0 ${p}px ${isMobile?90:p}px` }}>
          {/* Carte profil */}
          <div style={{ background:C.surface, borderRadius:16, border:`1px solid ${C.border}`, overflow:"hidden", marginBottom:16 }}>
            <div style={{ height:60, background:`linear-gradient(135deg,${C.accentLight},${C.accentBg})` }}/>
            <div style={{ padding:"0 20px 20px", marginTop:-24 }}>
              <div style={{ width:48, height:48, borderRadius:"50%", background:`linear-gradient(135deg,${C.accent},${C.accentDark})`, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:18, fontWeight:800, border:`3px solid ${C.surface}` }}>{initials}</div>
              <div style={{ fontSize:20, fontWeight:800, color:C.text, marginTop:10 }}>{coachName}</div>
              <div style={{ fontSize:13, color:C.textMuted, marginTop:2 }}>🎯 Coach · Fydelys Studio</div>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
            {[
              { label:"Séances planifiées", value:sessions.length, icon:"📅", color:C.accent, bg:C.accentLight },
              { label:"Élèves suivis",       value:totalStudents,   icon:"👥", color:C.ok,     bg:C.okBg },
              { label:"Heures de cours",     value:`${Math.round(totalHours/60)}h`, icon:"⏱", color:C.info, bg:C.infoBg },
              { label:"Taux remplissage",    value:`${avgFill}%`,   icon:"📊", color:C.accent, bg:C.accentLight },
            ].map(k=>(
              <div key={k.label} style={{ background:k.bg, borderRadius:12, padding:"14px", border:`1px solid ${k.color}22` }}>
                <div style={{ fontSize:22, marginBottom:6 }}>{k.icon}</div>
                <div style={{ fontSize:24, fontWeight:800, color:k.color, lineHeight:1 }}>{k.value}</div>
                <div style={{ fontSize:11, color:C.textMuted, marginTop:4 }}>{k.label}</div>
              </div>
            ))}
          </div>

          {/* Disciplines affectées par l'admin */}
          <div style={{ background:C.surface, borderRadius:14, border:`1px solid ${C.border}`, padding:"16px 18px" }}>
            <div style={{ fontSize:13, fontWeight:700, color:C.textMid, marginBottom:12 }}>Mes disciplines</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {coachDisciplines.length > 0
                ? coachDisciplines.map(disc => (
                    <span key={disc.id} style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"6px 14px", borderRadius:20, background:`${disc.color}18`, border:`1.5px solid ${disc.color}40`, fontSize:13, fontWeight:600, color:disc.color }}>
                      {disc.icon} {disc.name}
                    </span>
                  ))
                // Fallback : disciplines inférées depuis les séances
                : [...new Set(sessions.map(s=>s.disciplineId))].map(id => {
                    const disc = DISCIPLINES.find(d=>d.id===id);
                    return disc ? (
                      <span key={id} style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"6px 14px", borderRadius:20, background:`${disc.color}18`, border:`1.5px solid ${disc.color}40`, fontSize:13, fontWeight:600, color:disc.color }}>
                        {disc.icon} {disc.name}
                      </span>
                    ) : null;
                  })
              }
              {coachDisciplines.length===0 && sessions.length===0 && (
                <span style={{ color:C.textMuted, fontSize:13 }}>Aucune discipline affectée — contactez l'administrateur</span>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── Rendu principal ────────────────────────────────────────────────────────
  const CurrentPage = { planning:CoachPlanning, students:CoachStudents, profile:CoachProfile }[page] || CoachPlanning;

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:C.bg }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing:border-box; font-family:-apple-system,'Inter',sans-serif; }
        body { margin:0; }
      `}</style>
      {!isMobile && <NavBar/>}
      <div style={{ flex:1, overflowY:"auto" }}>
        {toast && (
          <div style={{ position:"fixed", top:20, right:20, zIndex:900, display:"flex", alignItems:"center", gap:8, padding:"11px 18px", background:toast.ok?C.ok:C.warn, borderRadius:10, color:"white", fontSize:14, fontWeight:600, boxShadow:"0 8px 24px rgba(0,0,0,.12)" }}>
            {toast.msg}
          </div>
        )}
        <CurrentPage/>
      </div>
      {isMobile && <NavBar/>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ADHÉRENT VIEW  — reprend exactement les styles C.* du v3
// ══════════════════════════════════════════════════════════════════════════════
const ADH_NAV = [
  { key:"planning",  label:"Planning",    icon:IcoCalendar },
  { key:"account",   label:"Mon compte",  icon:IcoUsers    },
  { key:"history",   label:"Historique",  icon:IcoBarChart },
  { key:"payment",   label:"Paiement",    icon:IcoCreditCard },
];
const ADH_MOBILE_NAV = ADH_NAV;

function AdherentView({ onSwitch, isMobile }) {
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
            <IcoCreditCard s={20} c={C.accent}/>
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
              { l:"Abonnement",        v:ME.sub,                                              icon:<IcoTag s={16} c={C.accent}/>   },
              { l:"Crédits restants",  v:`${ME.credits} / ${ME.total}`,                       icon:<IcoCreditCard s={16} c={C.ok}/>  },
              { l:"Membre depuis",     v:new Date(ME.joined).toLocaleDateString("fr-FR"),     icon:<IcoCalendar s={16} c={C.info}/>  },
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
            <IcoCreditCard s={28} c={C.accent}/>
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
          {toast.ok ? <IcoCheck s={16} c="white"/> : <IcoAlert s={16} c="white"/>}{toast.msg}
        </div>
      )}

      {/* Sidebar desktop */}
      {!isMobile && (
        <aside style={{ width:220, background:C.surface, borderRight:`1.5px solid ${C.border}`, minHeight:"100vh", display:"flex", flexDirection:"column", flexShrink:0 }}>
          <div style={{ padding:"24px 20px 18px" }}>
            <div style={{ fontSize:24, fontWeight:700, color:C.text, letterSpacing:-0.3, lineHeight:1 }}>Fyde<span style={{ color:C.accent }}>lys</span></div>
            <div style={{ fontSize:12, color:C.textMuted, letterSpacing:0.2, textTransform:"uppercase", marginTop:4 }}>Mon espace</div>
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
            {isMobile ? <>Fyde<span style={{ color:C.accent }}>lys</span></> : ADH_PAGE_TITLES[page]}
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

// ══════════════════════════════════════════════════════════════════════════════
// ROOT — switch automatique par rôle
// ══════════════════════════════════════════════════════════════════════════════
export default function App({ initialRole = "admin", studioSlug = "", studioName = "", studioId: propStudioId = "", planName = "", membersCount = 0, userName = "", userRole = "", coachName = "", coachDisciplines = [], billingStatus = "trialing", trialEndsAt = null, onSignOut = null }) {
  const [role, setRole] = useState(initialRole); // "superadmin" | "admin" | "coach" | "adherent"
  const [page, setPage] = useState("planning");

  // ── Disciplines persistées dans localStorage ──────────────────────────────
  // Clé unique par studio pour éviter les collisions entre tenants
  const discStorageKey = `fydelys_discs_${studioSlug||"default"}`;
  const [discs, setDiscs] = useState(() => {
    try {
      const saved = typeof window !== "undefined" && localStorage.getItem(discStorageKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DISCIPLINES.map(d => ({ ...d, slots: [] }));
  });

  // Sauvegarder automatiquement à chaque modification
  useEffect(() => {
    try { localStorage.setItem(discStorageKey, JSON.stringify(discs)); } catch {}
  }, [discs, discStorageKey]);
  // ─────────────────────────────────────────────────────────────────────────

  const width = useWidth();
  const isMobile = width < 768;

  // Calcul jours trial restants
  const trialDaysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000))
    : 0;
  const showTrialBanner  = billingStatus === "trialing" && trialDaysLeft <= 7;
  const showPastDueBanner = billingStatus === "past_due";

  if (role === "superadmin") return <SuperAdminView onSwitch={setRole} isMobile={isMobile} onSignOut={onSignOut}/>;
  if (role === "coach")      return <CoachView      onSwitch={setRole} isMobile={isMobile} coachName={coachName||MY_COACH_NAME} coachDisciplines={coachDisciplines}/>;
  if (role === "adherent")   return <AdherentView   onSwitch={setRole} isMobile={isMobile}/>;
  // admin avec is_coach → vue admin normale (ils ont accès à tout)
  const Page = PAGES[page] || Dashboard;
  // studioId partagé dans le context — priorité à la prop passée par layout.tsx
  const [sharedStudioId, setSharedStudioId] = useState(propStudioId || null);
  useEffect(() => {
    if (propStudioId) { setSharedStudioId(propStudioId); return; }
    if (sharedStudioId) return;
    // Fallback : résolution via Supabase si prop absente
    createClient().auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: prof } = await createClient().from("profiles").select("studio_id").eq("id", user.id).single();
      if (prof?.studio_id) setSharedStudioId(prof.studio_id);
    });
  }, [propStudioId]);
  const appCtxValue = { studioName, studioSlug, userName, planName, membersCount, userRole, userEmail: "", discs, setDiscs, studioId: sharedStudioId, setStudioId: setSharedStudioId };
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
      {!isMobile && <Sidebar active={page} onNav={setPage} studioName={studioName} planName={planName} membersCount={membersCount} userName={userName} userRole={userRole}/>}
      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, paddingBottom:isMobile?60:0 }}>
        <TopBar title={PAGE_TITLES[page]} isMobile={isMobile} onSignOut={onSignOut} isSuperAdmin={initialRole==="superadmin"} studioName={studioName}/>
        {/* Bannière trial expiration */}
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
        {/* Bannière paiement échoué */}
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
      {isMobile && <BottomNav active={page} onNav={setPage}/>}
    </div>
    </AppCtx.Provider>
  );
}