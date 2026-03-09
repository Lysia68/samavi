import { useState, useEffect } from "react";

const MEMBERS = [
  { id:1, firstName:"Claire",  lastName:"Martin",   email:"claire.m@email.com",  phone:"06 12 34 56 78", joined:"2026-01-10", subscription:"Mensuel illimité",  status:"actif",    credits:0, nextPayment:"2026-04-10", avatar:"CM" },
  { id:2, firstName:"Sophie",  lastName:"Leroux",   email:"sophie.l@email.com",  phone:"06 23 45 67 89", joined:"2025-11-05", subscription:"Carnet 10 séances", status:"actif",    credits:4, nextPayment:null,         avatar:"SL" },
  { id:3, firstName:"Julie",   lastName:"Bernard",  email:"julie.b@email.com",   phone:"06 34 56 78 90", joined:"2026-02-20", subscription:"Mensuel illimité",  status:"actif",    credits:0, nextPayment:"2026-04-20", avatar:"JB" },
  { id:4, firstName:"Emma",    lastName:"Rousseau", email:"emma.r@email.com",    phone:"06 45 67 89 01", joined:"2025-09-15", subscription:"Mensuel illimité",  status:"suspendu", credits:0, nextPayment:"2026-03-15", avatar:"ER" },
  { id:5, firstName:"Anne",    lastName:"Dupont",   email:"anne.d@email.com",    phone:"06 56 78 90 12", joined:"2026-03-01", subscription:"Séance découverte", status:"nouveau",  credits:1, nextPayment:null,         avatar:"AD" },
  { id:6, firstName:"Lucie",   lastName:"Petit",    email:"lucie.p@email.com",   phone:"06 67 89 01 23", joined:"2025-12-10", subscription:"Carnet 10 séances", status:"actif",    credits:7, nextPayment:null,         avatar:"LP" },
];
const DISCIPLINES = [
  { id:1, name:"Yoga Vinyasa", icon:"🧘", color:"#C4956A" },
  { id:2, name:"Pilates",      icon:"⚡", color:"#6B9E7A" },
  { id:3, name:"Méditation",   icon:"☯",  color:"#6A8FAE" },
  { id:4, name:"Yin Yoga",     icon:"🌙", color:"#AE7A7A" },
];
const SESSIONS_INIT = [
  { id:1, disciplineId:1, teacher:"Sophie Laurent", date:"2026-03-09", time:"07:30", duration:60, spots:12, booked:8,  level:"Tous niveaux",  room:"Studio A",  waitlist:0 },
  { id:2, disciplineId:2, teacher:"Marie Dubois",   date:"2026-03-09", time:"09:00", duration:50, spots:10, booked:10, level:"Intermédiaire", room:"Studio B",  waitlist:3 },
  { id:3, disciplineId:3, teacher:"Camille Morin",  date:"2026-03-09", time:"12:00", duration:45, spots:15, booked:5,  level:"Tous niveaux",  room:"Salle Zen", waitlist:0 },
  { id:4, disciplineId:4, teacher:"Sophie Laurent", date:"2026-03-09", time:"18:00", duration:75, spots:12, booked:7,  level:"Tous niveaux",  room:"Studio A",  waitlist:0 },
  { id:5, disciplineId:1, teacher:"Emma Petit",     date:"2026-03-10", time:"07:00", duration:60, spots:12, booked:4,  level:"Débutant",      room:"Studio A",  waitlist:0 },
  { id:6, disciplineId:2, teacher:"Marie Dubois",   date:"2026-03-10", time:"10:00", duration:50, spots:10, booked:9,  level:"Avancé",        room:"Studio B",  waitlist:1 },
  { id:7, disciplineId:1, teacher:"Sophie Laurent", date:"2026-03-11", time:"08:00", duration:60, spots:12, booked:11, level:"Tous niveaux",  room:"Studio A",  waitlist:2 },
  { id:8, disciplineId:4, teacher:"Camille Morin",  date:"2026-03-11", time:"19:00", duration:75, spots:12, booked:6,  level:"Intermédiaire", room:"Salle Zen", waitlist:0 },
];
const BOOKINGS_INIT = {
  1: [
    {id:"b1",st:"confirmed",fn:"Claire",ln:"Martin",   phone:"06 12 34 56 78", sub:"Mensuel illimité",  credits:null, total:null},
    {id:"b2",st:"confirmed",fn:"Sophie",ln:"Leroux",   phone:"06 23 45 67 89", sub:"Carnet 10 séances", credits:4,    total:10},
    {id:"b3",st:"confirmed",fn:"Julie", ln:"Bernard",  phone:"06 34 56 78 90", sub:"Mensuel illimité",  credits:null, total:null},
    {id:"b4",st:"confirmed",fn:"Lucie", ln:"Petit",    phone:"06 67 89 01 23", sub:"Carnet 10 séances", credits:7,    total:10},
    {id:"b5",st:"confirmed",fn:"Thomas",ln:"Blanc",    phone:"06 71 22 33 44", sub:"Carnet 15 séances", credits:2,    total:15},
    {id:"b6",st:"confirmed",fn:"Marie", ln:"Roux",     phone:"06 82 33 44 55", sub:"Carnet 10 séances", credits:9,    total:10},
    {id:"b7",st:"confirmed",fn:"Pierre",ln:"Laurent",  phone:"06 93 44 55 66", sub:"Trimestriel",       credits:null, total:null},
    {id:"b8",st:"confirmed",fn:"Laura", ln:"Simon",    phone:"07 04 55 66 77", sub:"Séance découverte", credits:1,    total:1},
  ],
  2: [
    {id:"b9", st:"confirmed",fn:"Claire",  ln:"Martin",   phone:"06 12 34 56 78", sub:"Mensuel illimité",  credits:null, total:null},
    {id:"b10",st:"confirmed",fn:"Julie",   ln:"Bernard",  phone:"06 34 56 78 90", sub:"Mensuel illimité",  credits:null, total:null},
    {id:"b11",st:"confirmed",fn:"Nicolas", ln:"Moreau",   phone:"06 45 11 22 33", sub:"Carnet 10 séances", credits:1,    total:10},
    {id:"b12",st:"confirmed",fn:"Emma",    ln:"Rousseau", phone:"06 45 67 89 01", sub:"Mensuel illimité",  credits:null, total:null},
    {id:"b13",st:"confirmed",fn:"Antoine", ln:"Girard",   phone:"06 56 22 33 44", sub:"Carnet 15 séances", credits:12,   total:15},
    {id:"b14",st:"confirmed",fn:"Céline",  ln:"Morel",    phone:"06 67 33 44 55", sub:"Carnet 10 séances", credits:3,    total:10},
    {id:"b15",st:"confirmed",fn:"Maxime",  ln:"Lambert",  phone:"06 78 44 55 66", sub:"Trimestriel",       credits:null, total:null},
    {id:"b16",st:"confirmed",fn:"Laura",   ln:"Vincent",  phone:"07 89 55 66 77", sub:"Carnet 10 séances", credits:8,    total:10},
    {id:"b17",st:"confirmed",fn:"Paul",    ln:"Mercier",  phone:"06 90 66 77 88", sub:"Mensuel illimité",  credits:null, total:null},
    {id:"b18",st:"confirmed",fn:"Nadia",   ln:"Blanco",   phone:"07 01 77 88 99", sub:"Carnet 15 séances", credits:5,    total:15},
    {id:"b19",st:"waitlist", fn:"Anne",    ln:"Dupont",   phone:"06 56 78 90 12", sub:"Séance découverte", credits:1,    total:1},
    {id:"b20",st:"waitlist", fn:"Hugo",    ln:"Simon",    phone:"07 12 88 99 00", sub:"Carnet 10 séances", credits:6,    total:10},
    {id:"b21",st:"waitlist", fn:"Chloé",   ln:"Rousseau", phone:"06 23 99 00 11", sub:"Carnet 15 séances", credits:14,   total:15},
  ],
  7: [
    {id:"b22",st:"confirmed",fn:"Sophie",  ln:"Leroux",   phone:"06 23 45 67 89", sub:"Carnet 10 séances", credits:4,    total:10},
    {id:"b23",st:"confirmed",fn:"Lucie",   ln:"Petit",    phone:"06 67 89 01 23", sub:"Carnet 10 séances", credits:7,    total:10},
    {id:"b24",st:"confirmed",fn:"Marie",   ln:"Roux",     phone:"06 82 33 44 55", sub:"Carnet 10 séances", credits:9,    total:10},
    {id:"b25",st:"confirmed",fn:"Thomas",  ln:"Blanc",    phone:"06 71 22 33 44", sub:"Carnet 15 séances", credits:2,    total:15},
    {id:"b26",st:"confirmed",fn:"Pierre",  ln:"Laurent",  phone:"06 93 44 55 66", sub:"Trimestriel",       credits:null, total:null},
    {id:"b27",st:"confirmed",fn:"Nadia",   ln:"Blanco",   phone:"07 01 77 88 99", sub:"Carnet 15 séances", credits:5,    total:15},
    {id:"b28",st:"confirmed",fn:"Julien",  ln:"Robert",   phone:"06 34 66 77 88", sub:"Mensuel illimité",  credits:null, total:null},
    {id:"b29",st:"confirmed",fn:"Sandrine",ln:"Michel",   phone:"07 45 77 88 99", sub:"Carnet 10 séances", credits:1,    total:10},
    {id:"b30",st:"confirmed",fn:"Romain",  ln:"Garcia",   phone:"06 56 88 99 00", sub:"Mensuel illimité",  credits:null, total:null},
    {id:"b31",st:"confirmed",fn:"Valérie", ln:"Martinez", phone:"06 67 99 00 11", sub:"Carnet 10 séances", credits:3,    total:10},
    {id:"b32",st:"confirmed",fn:"Xavier",  ln:"Leclerc",  phone:"07 78 00 11 22", sub:"Carnet 15 séances", credits:13,   total:15},
    {id:"b33",st:"waitlist", fn:"Anne",    ln:"Dupont",   phone:"06 56 78 90 12", sub:"Séance découverte", credits:1,    total:1},
    {id:"b34",st:"waitlist", fn:"Emma",    ln:"Rousseau", phone:"06 45 67 89 01", sub:"Mensuel illimité",  credits:null, total:null},
  ],
};
const SUBSCRIPTIONS_INIT = [
  { id:1, name:"Mensuel illimité",  price:89,  period:"mois",      description:"Accès illimité à toutes les séances", popular:true,  color:"#C4956A" },
  { id:2, name:"Carnet 10 séances", price:120, period:"carnet",    description:"Valable 6 mois, toutes disciplines",  popular:false, color:"#6B9E7A" },
  { id:3, name:"Séance découverte", price:20,  period:"séance",    description:"Première venue pour les nouveaux",    popular:false, color:"#6A8FAE" },
  { id:4, name:"Trimestriel",       price:240, period:"trimestre", description:"3 mois d'accès illimité",             popular:false, color:"#AE7A7A" },
];
const PAYMENTS = [
  { id:1, member:"Claire Martin",  amount:89,  date:"2026-03-10", type:"Prélèvement", subscription:"Mensuel illimité",  status:"payé"   },
  { id:2, member:"Julie Bernard",  amount:89,  date:"2026-03-20", type:"Prélèvement", subscription:"Mensuel illimité",  status:"payé"   },
  { id:3, member:"Emma Rousseau",  amount:89,  date:"2026-03-15", type:"Prélèvement", subscription:"Mensuel illimité",  status:"impayé" },
  { id:4, member:"Lucie Petit",    amount:120, date:"2026-03-08", type:"Carte",       subscription:"Carnet 10 séances", status:"payé"   },
  { id:5, member:"Anne Dupont",    amount:20,  date:"2026-03-01", type:"Carte",       subscription:"Séance découverte", status:"payé"   },
  { id:6, member:"Sophie Leroux",  amount:120, date:"2026-02-15", type:"Carte",       subscription:"Carnet 10 séances", status:"payé"   },
];

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
const NAV_ICONS  = { dashboard: IcoHome, planning: IcoCalendar, members: IcoUsers, subscriptions: IcoTag, payments: IcoCreditCard, disciplines: IcoLayers, settings: IcoSettings };

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
];

function Sidebar({ active, onNav }) {
  return (
    <aside style={{ width:220, background:C.surface, borderRight:`1.5px solid ${C.border}`, minHeight:"100vh", display:"flex", flexDirection:"column", flexShrink:0 }}>
      <div style={{ padding:"24px 20px 18px" }}>
        <div style={{ fontSize:24, fontWeight:700, color:C.text, letterSpacing:-0.3, lineHeight:1 }}>Zen<span style={{ color:C.accent }}>Class</span></div>
        <div style={{ fontSize:12, color:C.textMuted, letterSpacing:0.2, textTransform:"uppercase", marginTop:4 }}>Studio Manager</div>
      </div>
      <div style={{ margin:"0 12px 12px", padding:"10px 12px", background:C.accentLight, borderRadius:10, border:`1.5px solid ${C.border}`, display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:34, height:34, borderRadius:8, background:C.accentBg, border:`1.5px solid #DFC0A0`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><IcoYoga s={18} c={C.accent}/></div>
        <div>
          <div style={{ fontSize:15, fontWeight:700, color:C.text }}>Yogalate Paris</div>
          <div style={{ fontSize:12, color:C.textSoft }}>Plan Pro · 124 membres</div>
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
        <div style={{ width:32, height:32, borderRadius:"50%", background:C.accentBg, border:`1.5px solid #DFC0A0`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:C.accent, flexShrink:0 }}>ML</div>
        <div>
          <div style={{ fontSize:14, fontWeight:600, color:C.text }}>Marie Laurent</div>
          <div style={{ fontSize:12, color:C.textMuted }}>Admin</div>
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

function IcoLogOut({s,c}) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  );
}

function TopBar({ title, isMobile }) {
  return (
    <div style={{ background:C.surface, borderBottom:`1.5px solid ${C.border}`, padding:`0 ${isMobile?16:28}px`, height:isMobile?48:56, display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0, position:"sticky", top:0, zIndex:50 }}>
      <div style={{ fontSize:isMobile?18:20, fontWeight:700, color:C.text, letterSpacing:isMobile?-0.3:0 }}>
        {isMobile ? <>Zen<span style={{ color:C.accent }}>Class</span></> : title}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        {!isMobile && <Pill color={C.textSoft} bg={C.bg}>Yogalate Paris</Pill>}
        {/* Avatar + nom */}
        <div style={{ display:"flex", alignItems:"center", gap:7, padding:"4px 10px 4px 5px", background:C.bg, border:`1px solid ${C.border}`, borderRadius:20 }}>
          <div style={{ width:24, height:24, borderRadius:"50%", background:C.accentBg, border:`1px solid #DFC0A0`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color:C.accent, flexShrink:0 }}>ML</div>
          <span style={{ fontSize:13, fontWeight:600, color:C.text, whiteSpace:"nowrap" }}>Marie Laurent</span>
        </div>
        {/* Bouton déconnexion */}
        <button
          title="Se déconnecter"
          onClick={()=>{ if(window.confirm("Se déconnecter de ZenClass ?")) window.location.reload(); }}
          style={{ display:"flex", alignItems:"center", justifyContent:"center", width:32, height:32, borderRadius:8, border:`1px solid ${C.border}`, background:C.bg, cursor:"pointer", flexShrink:0, transition:"all .15s" }}
          onMouseEnter={e=>{e.currentTarget.style.background=C.warnBg; e.currentTarget.style.borderColor="#EFC8BC";}}
          onMouseLeave={e=>{e.currentTarget.style.background=C.bg; e.currentTarget.style.borderColor=C.border;}}>
          <IcoLogOut s={15} c={C.warn}/>
        </button>
      </div>
    </div>
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
        <span style={{ fontSize:11, color:accentColor||C.ok, fontWeight:700, background:C.bg, padding:"2px 7px", borderRadius:10 }}>↑ {delta}</span>
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
        <span style={{ fontSize:12, color:accentColor||C.ok, fontWeight:700, background:C.bg, padding:"2px 8px", borderRadius:10 }}>↑ {delta}</span>
      </div>
      <div style={{ fontSize:28, fontWeight:800, color:C.text, lineHeight:1, marginBottom:4 }}>{value}</div>
      <div style={{ fontSize:13, color:C.textSoft, fontWeight:500 }}>{label}</div>
    </Card>
  );
}

function Dashboard({ isMobile }) {
  const p = isMobile?12:28;
  const [expandedId, setExpandedId] = useState(null);
  const [bookings, setBookings] = useState(() => JSON.parse(JSON.stringify(BOOKINGS_INIT)));
  const handleToggle = (id) => setExpandedId(prev => prev===id ? null : id);
  const handleChangeStatus = (bid, sid, ns) => {
    setBookings(prev => { const nb={...prev}; nb[sid]=(nb[sid]||[]).map(b=>b.id===bid?{...b,st:ns}:b); return nb; });
  };
  return (
    <div style={{ padding:p }}>
      <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)", gap:isMobile?8:14, marginBottom:isMobile?12:20 }}>
        <KpiCard icon={<IcoUsers s={isMobile?16:18} c={C.ok}/>}      label="Adhérents actifs" value="124"     delta="+8 ce mois"  accentColor={C.ok}     isMobile={isMobile}/>
        <KpiCard icon={<IcoCalendar s={isMobile?16:18} c="#6B9E7A"/>} label="Séances ce mois"  value="186"     delta="+12 vs mars" accentColor="#6B9E7A"  isMobile={isMobile}/>
        <KpiCard icon={<IcoBarChart s={isMobile?16:18} c="#6A8FAE"/>} label="Taux remplissage" value="76 %"    delta="+4 pts"      accentColor="#6A8FAE"  isMobile={isMobile}/>
        <KpiCard icon={<IcoEuro s={isMobile?16:18} c={C.accent}/>}   label="CA du mois"       value="6 240 €" delta="+18 %"       accentColor={C.accent} isMobile={isMobile}/>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1.6fr 1fr", gap:16 }}>
        <Card noPad>
          <SectionHead action={<Pill>Lun. 9 mars</Pill>}>Séances du jour</SectionHead>
          {SESSIONS_INIT.filter(s=>s.date==="2026-03-09").map(s=>(
            <DashboardSessionCard
              key={s.id}
              sess={s}
              expandedId={expandedId}
              bookings={bookings}
              onToggle={handleToggle}
              onChangeStatus={handleChangeStatus}
            />
          ))}
        </Card>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <Card noPad>
            <SectionHead><span style={{display:"flex",alignItems:"center",gap:6}}><IcoAlert s={15} c={C.warn}/>Alertes</span></SectionHead>
            {[
              {label:"Impayés en cours",     value:"89 €",      c:C.warn,   bg:C.warnBg},
              {label:"Abonnements expirant", value:"3",         c:C.accent, bg:C.accentBg},
              {label:"Liste d'attente",      value:"6 membres", c:C.info,   bg:C.infoBg},
            ].map(a=>(
              <div key={a.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 16px", borderBottom:`1.5px solid ${C.borderSoft}` }}>
                <span style={{ fontSize:15, color:C.textMid }}>{a.label}</span>
                <span style={{ fontSize:15, fontWeight:700, color:a.c, background:a.bg, padding:"3px 12px", borderRadius:12 }}>{a.value}</span>
              </div>
            ))}
          </Card>
          <Card noPad style={{ flex:1 }}>
            <SectionHead>Derniers inscrits</SectionHead>
            {MEMBERS.slice(-3).reverse().map(m=><MemberRow key={m.id} m={m} onSelect={()=>{}} selected={false}/>)}
          </Card>
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

function PlanningSessionCard({ sess, expandedId, bookings, onToggle, onChangeStatus }) {
  const disc   = DISCIPLINES.find(d=>d.id===sess.disciplineId)||DISCIPLINES[0];
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
      </div>
      {isExp && <PlanningAccordion sessId={sess.id} bookings={bookings} onChangeStatus={onChangeStatus}/>}
    </div>
  );
}

// ── DASHBOARD SESSION CARD (réutilise PlanningAccordion) ─────────────────────
function DashboardSessionCard({ sess, expandedId, bookings, onToggle, onChangeStatus }) {
  const disc  = DISCIPLINES.find(d=>d.id===sess.disciplineId)||DISCIPLINES[0];
  const bl    = bookings[sess.id]||[];
  const booked= bl.length ? bl.filter(b=>b.st==="confirmed").length : sess.booked;
  const wait  = bl.length ? bl.filter(b=>b.st==="waitlist").length  : sess.waitlist;
  const pct   = booked/sess.spots;
  const isExp = expandedId===sess.id;
  return (
    <div style={{ borderBottom:`1px solid ${C.borderSoft}` }}>
      <div onClick={()=>onToggle(sess.id)}
        style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 16px", cursor:"pointer", background:isExp?C.accentBg:C.surface, transition:"background .15s" }}
        onMouseEnter={e=>{ if(!isExp) e.currentTarget.style.background=C.surfaceWarm; }}
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
  const [sessions, setSessions] = useState(SESSIONS_INIT);
  const [bookings, setBookings] = useState(() => JSON.parse(JSON.stringify(BOOKINGS_INIT)));
  const [expandedId, setExpandedId] = useState(null);
  const [fd, setFd] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [nS, setNS] = useState({ disciplineId:1, teacher:"", date:"", time:"09:00", duration:60, spots:12, level:"Tous niveaux", room:"Studio A" });
  const p = isMobile?12:28;

  const filtered = fd ? sessions.filter(s=>s.disciplineId===fd) : sessions;
  const dates = [...new Set(filtered.map(s=>s.date))].sort();

  const addSession = () => {
    if (!nS.teacher || !nS.date) return;
    setSessions(prev => [...prev, { id:Date.now(), ...nS, booked:0, waitlist:0, disciplineId:parseInt(nS.disciplineId) }]);
    setShowAdd(false);
    setNS({ disciplineId:1, teacher:"", date:"", time:"09:00", duration:60, spots:12, level:"Tous niveaux", room:"Studio A" });
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
    <div style={{ padding:p }}>
      <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:4, marginBottom:18, alignItems:"center", WebkitOverflowScrolling:"touch" }}>
        <Button sm variant={fd===null?"primary":"ghost"} onClick={()=>setFd(null)}>Toutes</Button>
        {DISCIPLINES.map(d=>{ const Ico=DISC_ICONS[d.id]; return <Button key={d.id} sm variant={fd===d.id?"primary":"ghost"} onClick={()=>setFd(d.id)}><span style={{display:"flex",alignItems:"center",gap:5}}>{Ico&&<Ico s={13} c={fd===d.id?C.surface:d.color}/>}{d.name}</span></Button>; })}
        <div style={{ marginLeft:"auto", flexShrink:0 }}><Button sm variant="primary" onClick={()=>setShowAdd(!showAdd)}>＋ Séance</Button></div>
      </div>

      {showAdd && (
        <Card style={{ marginBottom:18, borderTop:`3px solid ${C.accent}` }}>
          <div style={{ fontSize:14, fontWeight:700, color:C.accent, textTransform:"uppercase", marginBottom:16 }}>Créer une séance</div>
          <div style={{ display:"grid", gridTemplateColumns:`repeat(${isMobile?2:4},1fr)`, gap:14 }}>
            <Field label="Discipline" value={nS.disciplineId} onChange={v=>setNS({...nS,disciplineId:v})} opts={DISCIPLINES.map(d=>({v:d.id,l:d.name}))}/>
            <Field label="Professeur" value={nS.teacher} onChange={v=>setNS({...nS,teacher:v})} placeholder="Nom"/>
            <Field label="Date" type="date" value={nS.date} onChange={v=>setNS({...nS,date:v})}/>
            <Field label="Heure" type="time" value={nS.time} onChange={v=>setNS({...nS,time:v})}/>
            <Field label="Durée (min)" type="number" value={nS.duration} onChange={v=>setNS({...nS,duration:v})}/>
            <Field label="Places" type="number" value={nS.spots} onChange={v=>setNS({...nS,spots:v})}/>
            <Field label="Niveau" value={nS.level} onChange={v=>setNS({...nS,level:v})} opts={["Tous niveaux","Débutant","Intermédiaire","Avancé"]}/>
            <Field label="Salle" value={nS.room} onChange={v=>setNS({...nS,room:v})} placeholder="Studio A"/>
          </div>
          <div style={{ marginTop:16, display:"flex", gap:10 }}>
            <Button variant="primary" onClick={addSession}>Créer la séance</Button>
            <Button variant="ghost" onClick={()=>setShowAdd(false)}>Annuler</Button>
          </div>
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
              onToggle={handleToggle}
              onChangeStatus={handleChangeStatus}
              onAddBooking={handleAddBooking}
              onSendReminder={handleSendReminder}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function Members({ isMobile }) {
  const [members, setMembers] = useState(MEMBERS);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [nM, setNM] = useState({ firstName:"", lastName:"", email:"", phone:"", subscription:"Mensuel illimité" });
  const [modal, setModal] = useState(null); // { type: "email"|"subscription"|"history", member }
  const p = isMobile?12:28;
  const filtered = members.filter(m=>`${m.firstName} ${m.lastName} ${m.email}`.toLowerCase().includes(search.toLowerCase()));

  const add = () => {
    if (!nM.firstName||!nM.email) return;
    setMembers(prev=>[...prev, { id:Date.now(), ...nM, joined:new Date().toISOString().split("T")[0], status:"nouveau", credits:0, nextPayment:null, avatar:(nM.firstName[0]||"")+(nM.lastName[0]||"") }]);
    setShowAdd(false);
    setNM({ firstName:"", lastName:"", email:"", phone:"", subscription:"Mensuel illimité" });
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
      <Card noPad>{filtered.map(m=><MemberRow key={m.id} m={m} onSelect={m=>setSelected(selected?.id===m.id?null:m)} selected={selected?.id===m.id}/>)}</Card>
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
  );
}

function Subscriptions({ isMobile }) {
  const [subs, setSubs] = useState(SUBSCRIPTIONS_INIT);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState(null);
  const [nSub, setNSub] = useState({ name:"", price:"", period:"mois", description:"" });
  const [editData, setEditData] = useState({});
  const p = isMobile?12:28;

  const startEdit = (sub) => {
    setEditId(sub.id);
    setEditData({ name:sub.name, price:sub.price, period:sub.period, description:sub.description, popular:sub.popular });
  };
  const saveEdit = (id) => {
    setSubs(prev=>prev.map(s=>s.id===id?{...s,...editData,price:parseFloat(editData.price)||0}:s));
    setEditId(null);
  };

  return (
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
            <Button variant="primary" onClick={()=>{ if(!nSub.name)return; setSubs(prev=>[...prev,{id:Date.now(),...nSub,price:parseFloat(nSub.price)||0,color:C.accent,popular:false}]); setShowAdd(false); setNSub({name:"",price:"",period:"mois",description:""}); }}>Créer</Button>
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
                  <Button sm variant="danger" onClick={()=>setSubs(prev=>prev.filter(s=>s.id!==sub.id))}>Supprimer</Button>
                </div>
              </>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

function Payments({ isMobile }) {
  const [payments, setPayments] = useState(PAYMENTS);
  const [toast, setToast] = useState(null);
  const total  = payments.filter(p=>p.status==="payé").reduce((s,p)=>s+p.amount,0);
  const unpaid = payments.filter(p=>p.status==="impayé").reduce((s,p)=>s+p.amount,0);
  const p = isMobile?12:28;

  const relancer = (id) => {
    setPayments(prev=>prev.map(p=>p.id===id?{...p,relance:true}:p));
    const pay = payments.find(p=>p.id===id);
    setToast(`Relance envoyée à ${pay.member}`);
    setTimeout(()=>setToast(null), 3000);
  };

  const stats = [
    {lbl:"Encaissé ce mois", val:`${total} €`,      icon:<IcoCreditCard s={20} c={C.ok}/>,  c:C.ok,   bg:C.okBg},
    {lbl:"Impayés",          val:`${unpaid} €`,      icon:<IcoAlert s={20} c={C.warn}/>,     c:C.warn, bg:C.warnBg},
    {lbl:"Transactions",     val:payments.length,    icon:<IcoBarChart s={20} c={C.info}/>,  c:C.info, bg:C.infoBg},
  ];
  return (
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
  );
}

function DisciplinesPage({ isMobile }) {
  const [discs, setDiscs] = useState(DISCIPLINES);
  const [nD, setND] = useState({ name:"", icon:"🏃", color:C.accent });
  const p = isMobile?16:28;
  return (
    <div style={{ padding:p }}>
      <div style={{ display:"grid", gridTemplateColumns:`repeat(${isMobile?2:4},1fr)`, gap:14, marginBottom:22 }}>
        {discs.map(d=>(
          <Card key={d.id} style={{ textAlign:"center", borderTop:`3px solid ${d.color}` }}>
            <div style={{ width:52, height:52, borderRadius:12, background:d.color+"18", border:`1.5px solid ${d.color}40`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:10, marginLeft:"auto", marginRight:"auto" }}>
              {(() => { const Ico = DISC_ICONS[d.id]; return Ico ? <Ico s={26} c={d.color}/> : null; })()}
            </div>
            <div style={{ fontWeight:700, fontSize:17, color:C.text, marginBottom:14 }}>{d.name}</div>
            <Button sm variant="danger" onClick={()=>setDiscs(prev=>prev.filter(x=>x.id!==d.id))}>Supprimer</Button>
          </Card>
        ))}
      </div>
      <Card style={{ maxWidth:480 }}>
        <div style={{ fontSize:14, fontWeight:700, color:C.accent, textTransform:"uppercase", marginBottom:16 }}>Ajouter une discipline</div>
        <div style={{ display:"grid", gridTemplateColumns:"56px 1fr auto", gap:10, alignItems:"end" }}>
          <Field label="Icône" value={nD.icon} onChange={v=>setND({...nD,icon:v})}/>
          <Field label="Nom" value={nD.name} onChange={v=>setND({...nD,name:v})} placeholder="Ex: Hot Yoga"/>
          <div style={{ paddingTop:22 }}>
            <Button variant="primary" onClick={()=>{ if(!nD.name)return; setDiscs(prev=>[...prev,{id:Date.now(),...nD}]); setND({name:"",icon:"🏃",color:C.accent}); }}>＋</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ── MOCK DATA MULTI-TENANT ────────────────────────────────────────────────────
const TENANTS_DATA = [
  { id:"t1", name:"Yogalate Paris",    plan:"Pro",     members:124, revenue:"6 240 €", status:"actif",    city:"Paris 1er",    since:"Jan 2025" },
  { id:"t2", name:"Zen Studio Lyon",   plan:"Starter", members:48,  revenue:"1 890 €", status:"actif",    city:"Lyon 2e",      since:"Mar 2025" },
  { id:"t3", name:"Flow Bordeaux",     plan:"Pro",     members:87,  revenue:"4 120 €", status:"actif",    city:"Bordeaux",     since:"Fév 2025" },
  { id:"t4", name:"Pilates Nice",      plan:"Starter", members:31,  revenue:"980 €",   status:"suspendu", city:"Nice",         since:"Avr 2025" },
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

function Settings({ isMobile }) {
  const p = isMobile?12:28;
  const [currentRole, setCurrentRole] = useState("superadmin");
  const [tab, setTab] = useState("studio");
  const [users, setUsers] = useState(USERS_DATA);
  const [tenants, setTenants] = useState(TENANTS_DATA);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [modal, setModal] = useState(null); // type: "newTenant"|"inviteUser"|"editUser"|"password"|"2fa"|"sessions"|"deleteAccount"
  const [toast, setToast] = useState(null);

  const isSA = currentRole === "superadmin";
  const isAdmin = currentRole === "admin" || isSA;

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
    const [f, setF] = useState({ name:"", city:"", plan:"Starter" });
    return (
      <Modal>
        <MHead title="Nouveau tenant"/>
        <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:18 }}>
          <div><FieldLabel>Nom du studio</FieldLabel><input value={f.name} onChange={e=>setF({...f,name:e.target.value})} placeholder="Ex: Hot Yoga Lyon" style={{ width:"100%", padding:"9px 12px", border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:14, outline:"none", boxSizing:"border-box", color:C.text, background:C.surfaceWarm }} onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/></div>
          <div><FieldLabel>Ville</FieldLabel><input value={f.city} onChange={e=>setF({...f,city:e.target.value})} placeholder="Paris, Lyon…" style={{ width:"100%", padding:"9px 12px", border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:14, outline:"none", boxSizing:"border-box", color:C.text, background:C.surfaceWarm }} onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/></div>
          <Field label="Plan" value={f.plan} onChange={v=>setF({...f,plan:v})} opts={["Starter","Pro"].map(v=>({v,l:v}))}/>
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
    { key:"users",   label:"Utilisateurs", icon:<IcoUsers s={14} c="currentColor"/> },
    { key:"roles",   label:"Rôles",        icon:<IcoTag s={14} c="currentColor"/> },
    { key:"account", label:"Mon compte",   icon:<IcoHome s={14} c="currentColor"/> },
  ].filter(Boolean);

  // ── Preview role switcher (demo only) ────────────────────────────────────
  const RoleSwitcher = () => (
    <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 14px", background:"#F3EEFF", border:"1px solid #C4A8F0", borderRadius:10, marginBottom:16, flexWrap:"wrap" }}>
      <span style={{ fontSize:12, color:"#7C3AED", fontWeight:600 }}>👁 Aperçu rôle :</span>
      {["superadmin","admin","staff","adherent"].map(r=>(
        <button key={r} onClick={()=>{ setCurrentRole(r); setTab(r==="superadmin"?"superadmin":"studio"); }}
          style={{ fontSize:11, padding:"3px 10px", borderRadius:8, border:`1.5px solid ${currentRole===r?"#7C3AED":C.border}`, background:currentRole===r?"#7C3AED":"white", color:currentRole===r?"white":C.textMid, fontWeight:700, cursor:"pointer" }}>
          {ROLES_DEF[r].label}
        </button>
      ))}
    </div>
  );

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
  const TabStudio = () => (
    <div>
      {[
        { title:"Informations du studio", fields:[["Nom du studio","Yogalate Paris"],["Adresse","12 rue de la Paix, 75001 Paris"],["Téléphone","01 42 00 00 00"],["Email contact","contact@yogalate.fr"],["Site web","yogalate.fr"]] },
        { title:"Paramètres de réservation", fields:[["Délai d'annulation (h)","12"],["Ouverture réservations (j avant)","7"],["Liste d'attente max","10"],["Confirmation automatique","Oui"]] },
        { title:"Notifications", fields:[["Email confirmation réservation","Activé"],["SMS rappel J-1","Activé"],["Alerte impayé","Activé"],["Rapport hebdomadaire","Activé"]] },
      ].map(sec=>(
        <Card key={sec.title} noPad style={{ marginBottom:14 }}>
          <SectionHead>{sec.title}</SectionHead>
          <div style={{ padding:"16px 18px", display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr", gap:12 }}>
            {sec.fields.map(([lbl,val])=>(
              <div key={lbl}>
                <FieldLabel>{lbl}</FieldLabel>
                <input defaultValue={val} disabled={!isAdmin}
                  style={{ width:"100%", padding:"9px 12px", border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:14, outline:"none", boxSizing:"border-box", color:C.text, background:isAdmin?C.surfaceWarm:"#F8F5F2", opacity:isAdmin?1:0.7 }}
                  onFocus={e=>{ if(isAdmin) e.target.style.borderColor=C.accent; }}
                  onBlur={e=>e.target.style.borderColor=C.border}/>
              </div>
            ))}
          </div>
          {isAdmin && <div style={{ padding:"0 18px 16px" }}><Button sm variant="primary" onClick={()=>showToast("Paramètres enregistrés !")}>Enregistrer</Button></div>}
        </Card>
      ))}
    </div>
  );

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
      {Object.entries(ROLES_DEF).map(([key, r])=>(
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
  const TabAccount = () => (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <Card>
        <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:18 }}>
          <div style={{ width:56, height:56, borderRadius:14, background:C.accentBg, border:`2px solid #DFC0A0`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:800, color:C.accent }}>ML</div>
          <div>
            <div style={{ fontSize:17, fontWeight:800, color:C.text }}>Marie Laurent</div>
            <div style={{ fontSize:13, color:C.textSoft, marginTop:2 }}>marie.l@yogalate.fr</div>
            <div style={{ marginTop:5 }}><RoleBadge role={currentRole}/></div>
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr", gap:12 }}>
          {[["Prénom","Marie"],["Nom","Laurent"],["Email","marie.l@yogalate.fr"],["Téléphone","06 12 34 56 78"]].map(([lbl,val])=>(
            <div key={lbl}><FieldLabel>{lbl}</FieldLabel>
              <input defaultValue={val} style={{ width:"100%", padding:"9px 12px", border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:14, outline:"none", boxSizing:"border-box", color:C.text, background:C.surfaceWarm }}
                onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/>
            </div>
          ))}
        </div>
        <div style={{ marginTop:14 }}><Button sm variant="primary" onClick={()=>showToast("Profil enregistré !")}>Enregistrer</Button></div>
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

  const TAB_CONTENT = { superadmin:<TabSuperAdmin/>, studio:<TabStudio/>, users:<TabUsers/>, roles:<TabRoles/>, account:<TabAccount/> };

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

const PAGE_TITLES = { dashboard:"Tableau de bord", planning:"Planning", members:"Adhérents", subscriptions:"Abonnements", payments:"Paiements", disciplines:"Disciplines", settings:"Paramètres" };
const PAGES = { dashboard:Dashboard, planning:Planning, members:Members, subscriptions:Subscriptions, payments:Payments, disciplines:DisciplinesPage, settings:Settings };

// ─── TENANTS DATA (Super Admin) ───────────────────────────────────────────────
const TENANTS_SA = [
  { id:"t1", name:"Yogalate Paris",   plan:"Pro",     members:124, revenue:6240, status:"actif",    city:"Paris 1er",  since:"Jan 2025", growth:+12 },
  { id:"t2", name:"Zen Studio Lyon",  plan:"Starter", members:48,  revenue:1890, status:"actif",    city:"Lyon 2e",    since:"Mar 2025", growth:+5  },
  { id:"t3", name:"Flow Bordeaux",    plan:"Pro",     members:87,  revenue:4120, status:"actif",    city:"Bordeaux",   since:"Fév 2025", growth:+8  },
  { id:"t4", name:"Pilates Nice",     plan:"Starter", members:31,  revenue:980,  status:"suspendu", city:"Nice",       since:"Avr 2025", growth:-2  },
  { id:"t5", name:"Ashtanga Nantes",  plan:"Pro",     members:105, revenue:5100, status:"actif",    city:"Nantes",     since:"Nov 2024", growth:+18 },
  { id:"t6", name:"Hatha Strasbourg", plan:"Starter", members:22,  revenue:720,  status:"actif",    city:"Strasbourg", since:"Fév 2026", growth:+22 },
];

// ─── MY HISTORY (Adhérent) ────────────────────────────────────────────────────
const MY_HISTORY = [
  { id:1, date:"2026-03-09", disc:"Yoga Vinyasa", teacher:"Sophie Laurent", status:"présent", duration:60 },
  { id:2, date:"2026-03-05", disc:"Pilates",       teacher:"Marie Dubois",   status:"présent", duration:50 },
  { id:3, date:"2026-02-28", disc:"Méditation",    teacher:"Camille Morin",  status:"présent", duration:45 },
  { id:4, date:"2026-02-24", disc:"Yoga Vinyasa",  teacher:"Sophie Laurent", status:"absent",  duration:60 },
  { id:5, date:"2026-02-18", disc:"Yin Yoga",      teacher:"Camille Morin",  status:"présent", duration:75 },
  { id:6, date:"2026-02-10", disc:"Pilates",       teacher:"Marie Dubois",   status:"présent", duration:50 },
];

// ══════════════════════════════════════════════════════════════════════════════
// SUPER ADMIN VIEW
// ══════════════════════════════════════════════════════════════════════════════
function SuperAdminView({ onSwitch, isMobile }) {
  const [tenants, setTenants] = useState(TENANTS_SA);
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState("tous");
  const [modal, setModal]     = useState(null);
  const [toast, setToast]     = useState(null);
  const showToast = (msg, ok=true) => { setToast({msg,ok}); setTimeout(()=>setToast(null),3000); };
  const p = isMobile ? 16 : 28;

  const filtered = tenants
    .filter(t => filter==="tous" || t.status===filter)
    .filter(t => (t.name+" "+t.city).toLowerCase().includes(search.toLowerCase()));

  const totalRev  = tenants.filter(t=>t.status==="actif").reduce((s,t)=>s+t.revenue,0);
  const totalMem  = tenants.reduce((s,t)=>s+t.members,0);
  const actifCount= tenants.filter(t=>t.status==="actif").length;
  const suspCount = tenants.filter(t=>t.status==="suspendu").length;

  // Modal Nouveau Tenant — proper component
  function NewTenantModalSA() {
    const [f, setF] = useState({ name:"", city:"", plan:"Starter" });
    return (
      <div onClick={e=>e.target===e.currentTarget&&setModal(null)}
        style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", zIndex:800, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
        <div style={{ background:C.surface, borderRadius:16, padding:28, width:"100%", maxWidth:440, boxShadow:"0 24px 56px rgba(0,0,0,.2)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
            <div style={{ fontSize:18, fontWeight:700, color:C.text }}>Nouveau tenant</div>
            <button onClick={()=>setModal(null)} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:7, padding:"3px 8px", cursor:"pointer", color:C.textSoft, fontSize:15 }}>✕</button>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:14, marginBottom:20 }}>
            <Field label="Nom du studio" value={f.name} onChange={v=>setF({...f,name:v})} placeholder="Ex: Hot Yoga Lyon"/>
            <Field label="Ville" value={f.city} onChange={v=>setF({...f,city:v})} placeholder="Paris, Lyon…"/>
            <Field label="Plan" value={f.plan} onChange={v=>setF({...f,plan:v})} opts={[{v:"Starter",l:"Starter — 29 €/mois"},{v:"Pro",l:"Pro — 79 €/mois"}]}/>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <Button sm onClick={()=>{
              if(!f.name) return;
              setTenants(p=>[...p,{id:`t${Date.now()}`,name:f.name,city:f.city,plan:f.plan,members:0,revenue:f.plan==="Pro"?79:29,status:"actif",since:"Mars 2026",growth:0}]);
              setModal(null); showToast(`"${f.name}" créé avec succès !`);
            }}>Créer le tenant</Button>
            <Button sm variant="ghost" onClick={()=>setModal(null)}>Annuler</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", background:"#0F0A1E" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing:border-box; font-family:-apple-system,'Inter',sans-serif; }
        body { margin:0; }
        ::-webkit-scrollbar { width:5px; } ::-webkit-scrollbar-thumb { background:#4A3870; border-radius:3px; }
      `}</style>

      {toast && (
        <div style={{ position:"fixed", top:20, right:20, zIndex:900, display:"flex", alignItems:"center", gap:10, padding:"12px 18px", background:toast.ok?C.ok:C.warn, borderRadius:10, color:"white", fontSize:14, fontWeight:600, boxShadow:"0 8px 24px rgba(0,0,0,.25)" }}>
          {toast.ok ? <IcoCheck s={16} c="white"/> : <IcoAlert s={16} c="white"/>} {toast.msg}
        </div>
      )}
      {modal?.type==="newTenant" && <NewTenantModalSA/>}

      {/* TopBar */}
      <div style={{ borderBottom:"1px solid rgba(255,255,255,.08)", padding:`14px ${p}px`, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:"#7C3AED", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>⚡</div>
          <div>
            <div style={{ fontSize:16, fontWeight:800, color:"#fff", letterSpacing:-0.3 }}>Zen<span style={{ color:"#A78BFA" }}>Class</span></div>
            <div style={{ fontSize:11, color:"#A78BFA", textTransform:"uppercase", letterSpacing:1, fontWeight:600 }}>Super Admin</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
          {!isMobile && <span style={{ fontSize:12, color:"#A78BFA", padding:"4px 12px", background:"rgba(124,58,237,.2)", borderRadius:16, border:"1px solid rgba(167,139,250,.2)" }}>👁 Changer de vue :</span>}
          {[["admin","🏠 Studio"],["adherent","🧘 Adhérent"]].map(([r,l])=>(
            <button key={r} onClick={()=>onSwitch(r)} style={{ fontSize:12, padding:"5px 14px", borderRadius:16, border:"1px solid rgba(167,139,250,.25)", background:"rgba(255,255,255,.06)", color:"#C4B5FD", fontWeight:600, cursor:"pointer" }}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{ padding:`${p}px` }}>
        {/* KPIs */}
        <div style={{ display:"grid", gridTemplateColumns:`repeat(${isMobile?2:4},1fr)`, gap:isMobile?10:16, marginBottom:24 }}>
          {[
            { l:"Tenants actifs",  v:actifCount, sub:`/ ${tenants.length} total`,   c:"#A78BFA", bg:"rgba(167,139,250,.1)", icon:"🏢" },
            { l:"Total membres",   v:totalMem,   sub:"tous studios",                c:"#34D399", bg:"rgba(52,211,153,.1)",  icon:"👥" },
            { l:"CA mensuel",      v:`${(totalRev/1000).toFixed(1)}k €`, sub:"actifs", c:"#FBBF24", bg:"rgba(251,191,36,.1)", icon:"💰" },
            { l:"Suspendus",       v:suspCount,  sub:"action requise",              c:"#F87171", bg:"rgba(248,113,113,.1)", icon:"⚠" },
          ].map(k=>(
            <div key={k.l} style={{ background:k.bg, borderRadius:14, padding:isMobile?"14px 12px":"20px", border:`1px solid ${k.c}20` }}>
              <div style={{ fontSize:22, marginBottom:6 }}>{k.icon}</div>
              <div style={{ fontSize:isMobile?22:30, fontWeight:800, color:k.c, lineHeight:1 }}>{k.v}</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,.5)", marginTop:4 }}>{k.l}</div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,.3)" }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Table tenants */}
        <div style={{ background:"rgba(255,255,255,.04)", borderRadius:14, border:"1px solid rgba(255,255,255,.08)", overflow:"hidden" }}>
          {/* Filtres */}
          <div style={{ padding:"14px 18px", borderBottom:"1px solid rgba(255,255,255,.06)", display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Rechercher un studio…"
              style={{ flex:1, minWidth:160, padding:"8px 14px", background:"rgba(255,255,255,.07)", border:"1px solid rgba(255,255,255,.12)", borderRadius:8, color:"#fff", fontSize:13, outline:"none", boxSizing:"border-box" }}/>
            <div style={{ display:"flex", gap:6 }}>
              {["tous","actif","suspendu"].map(f=>(
                <button key={f} onClick={()=>setFilter(f)} style={{ fontSize:12, padding:"5px 12px", borderRadius:16, border:`1px solid ${filter===f?"#7C3AED":"rgba(255,255,255,.15)"}`, background:filter===f?"#7C3AED":"transparent", color:filter===f?"#fff":"rgba(255,255,255,.6)", fontWeight:600, cursor:"pointer" }}>
                  {f.charAt(0).toUpperCase()+f.slice(1)}
                </button>
              ))}
            </div>
            <Button sm onClick={()=>setModal({type:"newTenant"})}>＋ Nouveau tenant</Button>
          </div>

          {/* Rows */}
          {filtered.map(t=>(
            <div key={t.id} style={{ padding:"13px 18px", borderBottom:"1px solid rgba(255,255,255,.05)", display:"flex", alignItems:"center", gap:14, flexWrap:isMobile?"wrap":"nowrap" }}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.03)"}
              onMouseLeave={e=>e.currentTarget.style.background=""}>
              <div style={{ width:34, height:34, borderRadius:8, background:"rgba(124,58,237,.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>🏛</div>
              <div style={{ flex:1, minWidth:100 }}>
                <div style={{ fontSize:14, fontWeight:700, color:"#fff" }}>{t.name}</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,.4)" }}>{t.city} · depuis {t.since}</div>
              </div>
              {!isMobile && <>
                <div style={{ textAlign:"center", minWidth:56 }}>
                  <div style={{ fontSize:15, fontWeight:800, color:"#34D399" }}>{t.members}</div>
                  <div style={{ fontSize:10, color:"rgba(255,255,255,.4)" }}>membres</div>
                </div>
                <div style={{ textAlign:"center", minWidth:70 }}>
                  <div style={{ fontSize:15, fontWeight:800, color:"#FBBF24" }}>{t.revenue.toLocaleString()} €</div>
                  <div style={{ fontSize:10, color:"rgba(255,255,255,.4)" }}>/mois</div>
                </div>
                <div style={{ textAlign:"center", minWidth:50 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:t.growth>=0?"#34D399":"#F87171" }}>{t.growth>=0?"+":""}{t.growth}%</div>
                  <div style={{ fontSize:10, color:"rgba(255,255,255,.4)" }}>croiss.</div>
                </div>
              </>}
              <div style={{ display:"flex", gap:6, alignItems:"center", flexShrink:0 }}>
                <span style={{ fontSize:11, fontWeight:700, padding:"3px 9px", borderRadius:10, background:t.plan==="Pro"?"rgba(124,58,237,.3)":"rgba(255,255,255,.08)", color:t.plan==="Pro"?"#C4B5FD":"rgba(255,255,255,.5)" }}>{t.plan}</span>
                <span style={{ fontSize:11, fontWeight:700, padding:"3px 9px", borderRadius:10, background:t.status==="actif"?"rgba(52,211,153,.15)":"rgba(248,113,113,.15)", color:t.status==="actif"?"#34D399":"#F87171" }}>{t.status.charAt(0).toUpperCase()+t.status.slice(1)}</span>
              </div>
              <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                <button onClick={()=>showToast(`Accès simulé : ${t.name}`)} style={{ fontSize:11, padding:"4px 10px", borderRadius:6, border:"1px solid rgba(255,255,255,.15)", background:"rgba(255,255,255,.06)", color:"rgba(255,255,255,.7)", cursor:"pointer", fontWeight:600 }}>Accéder</button>
                {t.status==="actif"
                  ? <button onClick={()=>{setTenants(p=>p.map(x=>x.id===t.id?{...x,status:"suspendu"}:x)); showToast(`"${t.name}" suspendu`,false);}} style={{ fontSize:11, padding:"4px 10px", borderRadius:6, border:"1px solid rgba(248,113,113,.3)", background:"rgba(248,113,113,.1)", color:"#F87171", cursor:"pointer", fontWeight:600 }}>Suspendre</button>
                  : <button onClick={()=>{setTenants(p=>p.map(x=>x.id===t.id?{...x,status:"actif"}:x)); showToast(`"${t.name}" réactivé`);}} style={{ fontSize:11, padding:"4px 10px", borderRadius:6, border:"1px solid rgba(52,211,153,.3)", background:"rgba(52,211,153,.1)", color:"#34D399", cursor:"pointer", fontWeight:600 }}>Réactiver</button>
                }
              </div>
            </div>
          ))}
        </div>

        {/* Stats bar */}
        <div style={{ marginTop:16, padding:"14px 18px", background:"rgba(255,255,255,.03)", borderRadius:12, border:"1px solid rgba(255,255,255,.06)", display:"grid", gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)", gap:14 }}>
          {[{l:"Taux occupation moyen",v:"74%",c:"#A78BFA"},{l:"Séances / semaine",v:"142",c:"#34D399"},{l:"Taux renouvellement",v:"88%",c:"#FBBF24"},{l:"Tickets support",v:"3",c:"#F87171"}].map(s=>(
            <div key={s.l}>
              <div style={{ fontSize:20, fontWeight:800, color:s.c }}>{s.v}</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,.4)", marginTop:2 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>
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
            <div style={{ fontSize:24, fontWeight:700, color:C.text, letterSpacing:-0.3, lineHeight:1 }}>Zen<span style={{ color:C.accent }}>Class</span></div>
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
            {isMobile ? <>Zen<span style={{ color:C.accent }}>Class</span></> : ADH_PAGE_TITLES[page]}
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
const PAGE_TITLES = { dashboard:"Tableau de bord", planning:"Planning", members:"Adhérents", subscriptions:"Abonnements", payments:"Paiements", disciplines:"Disciplines", settings:"Paramètres" };
const PAGES = { dashboard:Dashboard, planning:Planning, members:Members, subscriptions:Subscriptions, payments:Payments, disciplines:DisciplinesPage, settings:Settings };

export default function App() {
  const [role, setRole] = useState("admin"); // "superadmin" | "admin" | "adherent"
  const [page, setPage] = useState("planning");
  const width = useWidth();
  const isMobile = width < 768;

  if (role === "superadmin") return <SuperAdminView onSwitch={setRole} isMobile={isMobile}/>;
  if (role === "adherent")   return <AdherentView   onSwitch={setRole} isMobile={isMobile}/>;

  // ── Vue Studio (admin/staff) = v3 intact ──────────────────────────────────
  const Page = PAGES[page] || Dashboard;
  return (
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
      {!isMobile && <Sidebar active={page} onNav={setPage}/>}
      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, paddingBottom:isMobile?60:0 }}>
        <TopBar title={PAGE_TITLES[page]} isMobile={isMobile}/>
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
  );
}
