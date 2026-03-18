"use client";

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
      { label: "Rappel cours 1h avant",                     ok: false },
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
      { label: "Rappel cours 1h avant",                     ok: true  },
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
      { label: "Rappel cours 1h avant",                     ok: true  },
      { label: "Support prioritaire",             ok: true  },
    ]
  },
];
const PAYMENTS = PAYMENTS_DEMO;


const ROLES_DEF = {
  superadmin: { label:"Super Admin", color:"#7C3AED", bg:"#F3EEFF", desc:"Accès complet à tous les tenants, configuration plateforme, facturation" },
  admin:      { label:"Admin",       color:"#B07848", bg:"#F5EBE0", desc:"Gestion complète du studio : membres, planning, paiements, paramètres" },
  staff:      { label:"Staff",       color:"#3A6E90", bg:"#E6EFF5", desc:"Accès planning et membres, pas d'accès aux paramètres ni paiements" },
  adherent:   { label:"Adhérent",    color:"#4E8A58", bg:"#E6F2E8", desc:"Accès à son espace personnel, réservations et historique de séances" },
};




const COACH_NAV_KEYS = [
  { key:"planning",  label:"Mes cours"    },
  { key:"students",  label:"Mes inscrits" },
  { key:"profile",   label:"Mon profil"   },
];

const ADH_NAV_KEYS = [
  { key:"planning",  label:"Planning"    },
  { key:"account",   label:"Mon compte"  },
  { key:"history",   label:"Historique"  },
  { key:"payment",   label:"Paiement"    },
];

const MY_COACH_NAME = "Sophie Laurent";

const TENANTS_INIT = [];

const TENANTS_DATA = [
  { id:"t1", name:"Yogalate Paris",    plan:"Pro",      members:124, revenue:"6 240 €", status:"actif",    city:"Paris 1er",   since:"Jan 2025" },
  { id:"t2", name:"Zen Studio Lyon",   plan:"Essentiel",members:48,  revenue:"1 890 €", status:"actif",    city:"Lyon 2e",     since:"Mar 2025" },
  { id:"t3", name:"Flow Bordeaux",     plan:"Pro",      members:87,  revenue:"4 120 €", status:"actif",    city:"Bordeaux",    since:"Fév 2025" },
  { id:"t4", name:"Pilates Nice",      plan:"Essentiel",members:31,  revenue:"980 €",   status:"suspendu", city:"Nice",        since:"Avr 2025" },
  { id:"t5", name:"Ashtanga Nantes",   plan:"Pro",      members:105, revenue:"5 100 €", status:"actif",    city:"Nantes",      since:"Nov 2024" },
];

const USERS_DATA = [
  { id:"u1", fn:"Marie",   ln:"Laurent",  email:"marie.l@yogalate.fr",  role:"admin",    tenant:"t1", status:"actif",    lastLogin:"Aujourd'hui" },
  { id:"u2", fn:"Thomas",  ln:"Blanc",    email:"thomas.b@yogalate.fr", role:"staff",    tenant:"t1", status:"actif",    lastLogin:"Hier" },
  { id:"u3", fn:"Sophie",  ln:"Leroux",   email:"sophie@yogalate.fr",   role:"adherent", tenant:"t1", status:"actif",    lastLogin:"Il y a 3j" },
  { id:"u4", fn:"Claire",  ln:"Martin",   email:"claire@yogalate.fr",   role:"adherent", tenant:"t1", status:"actif",    lastLogin:"Aujourd'hui" },
  { id:"u5", fn:"Paul",    ln:"Dubois",   email:"paul@zenstudio.fr",    role:"admin",    tenant:"t2", status:"actif",    lastLogin:"Il y a 2j" },
  { id:"u6", fn:"Julie",   ln:"Bernard",  email:"julie@zenstudio.fr",   role:"staff",    tenant:"t2", status:"actif",    lastLogin:"Il y a 5j" },
  { id:"u7", fn:"Antoine", ln:"Girard",   email:"ant@flow.fr",          role:"admin",    tenant:"t3", status:"actif",    lastLogin:"Hier" },
  { id:"u8", fn:"Nadia",   ln:"Blanco",   email:"nadia@flow.fr",        role:"adherent", tenant:"t3", status:"suspendu", lastLogin:"Il y a 14j" },
];

export {
  DISC_IDS, MEMBERS_DEMO, SESSIONS_DEMO, BOOKINGS_DEMO,
  SUBSCRIPTIONS_DEMO, PAYMENTS_DEMO,
  MEMBERS, DISCIPLINES, SESSIONS_INIT, BOOKINGS_INIT, SUBSCRIPTIONS_INIT,
  FYDELYS_PLANS, PAYMENTS, ROLES_DEF,
  COACH_NAV_KEYS, ADH_NAV_KEYS, MY_COACH_NAME, TENANTS_INIT, TENANTS_DATA, USERS_DATA,
};
