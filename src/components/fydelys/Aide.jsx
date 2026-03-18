"use client";

import React, { useContext } from "react";
import { C } from "./theme";
import { DISCIPLINES } from "./demoData";
import { IC } from "./icons";
import { AppCtx } from "./context";
import { Card, SectionHead, Button } from "./ui";

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


export { AideIllustration, AidePage };
