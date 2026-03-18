"use client";

import React from "react";

function IC({d,size=16,color="currentColor",sw=1.5,fill="none"}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      {Array.isArray(d) ? d.map((p,i)=><path key={i} d={p}/>) : <path d={d}/>}
    </svg>
  );
}
function ICG({children,size=16,color="currentColor",sw=1.5}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{children}</svg>
  );
}

// Navigation icons
function IcoHome({s,c}) { return <ICG size={s} color={c}><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></ICG>; }
function IcoCalendar({s,c}) { return <ICG size={s} color={c}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/></ICG>; }
function IcoUsers({s,c}) { return <ICG size={s} color={c}><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/><path d="M16 3.13a4 4 0 010 7.75"/><path d="M21 21v-2a4 4 0 00-3-3.87"/></ICG>; }
function IcoUser({s,c}) { return <ICG size={s} color={c}><circle cx="12" cy="8" r="4"/><path d="M4 20v-2a4 4 0 014-4h8a4 4 0 014 4v2"/></ICG>; }
function IcoCreditCard({s,c}) { return <ICG size={s} color={c}><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></ICG>; }
function IcoTag({s,c}) { return <ICG size={s} color={c}><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></ICG>; }
function IcoLayers({s,c}) { return <ICG size={s} color={c}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></ICG>; }
function IcoSettings({s,c}) { return <ICG size={s} color={c}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></ICG>; }

// KPI icons
function IcoTrend({s,c}) { return <ICG size={s} color={c}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></ICG>; }
function IcoBarChart({s,c}) { return <ICG size={s} color={c}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></ICG>; }
function IcoEuro({s,c}) { return <ICG size={s} color={c}><path d="M4 10h12M4 14h12M19 6a7 7 0 100 12"/></ICG>; }

// Action icons
function IcoCheck({s,c}) { return <ICG size={s} color={c}><polyline points="20 6 9 17 4 12"/></ICG>; }
function IcoX({s,c}) { return <ICG size={s} color={c}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></ICG>; }
function IcoUndo({s,c}) { return <ICG size={s} color={c}><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></ICG>; }
function IcoMail({s,c}) { return <ICG size={s} color={c}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></ICG>; }
function IcoPhone({s,c}) { return <ICG size={s} color={c}><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.22 1.18 2 2 0 012.22 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.18 6.18l1.27-.56a2 2 0 012.11.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></ICG>; }
function IcoDoor({s,c}) { return <ICG size={s} color={c}><rect x="3" y="3" width="18" height="20" rx="2"/><path d="M9 12h.01"/><path d="M15 3v18"/></ICG>; }
function IcoUserPlus({s,c}) { return <ICG size={s} color={c}><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="17" y1="11" x2="23" y2="11"/></ICG>; }
function IcoChevron({s,c,up}) { return <ICG size={s} color={c}><polyline points={up?"18 15 12 9 6 15":"6 9 12 15 18 9"}/></ICG>; }
function IcoAlert({s,c}) { return <ICG size={s} color={c}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></ICG>; }

// Discipline icons (SVG custom)
function IcoYoga({s,c}) { return <ICG size={s} color={c}><circle cx="12" cy="4" r="2"/><path d="M12 6v4M8 10c0 0 1 4 4 4s4-4 4-4"/><path d="M6 14l2-2M18 14l-2-2"/><path d="M8 19l4-3 4 3"/></ICG>; }
function IcoPilates({s,c}) { return <ICG size={s} color={c}><circle cx="12" cy="5" r="2"/><path d="M12 7v5l3 3"/><path d="M12 12l-3 3"/><path d="M9 21v-4a3 3 0 016 0v4"/></ICG>; }
function IcoMeditation({s,c}) { return <ICG size={s} color={c}><circle cx="12" cy="5" r="2"/><path d="M7 12c0-2.8 2.2-5 5-5s5 2.2 5 5"/><path d="M5 17c0 0 2-2 7-2s7 2 7 2"/><path d="M12 12v5"/></ICG>; }
function IcoMoon({s,c}) { return <ICG size={s} color={c}><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></ICG>; }


function IcoHelpCircle({s,c}) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
      <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="2"/>
    </svg>
  );
}


// ── Icônes premium remplaçant les basiques ───────────────────────────────────
function IcoCalendar2({s,c}) { return <ICG size={s} color={c}><rect x="3" y="4" width="18" height="18" rx="3"/><path d="M3 10h18"/><path d="M8 2v4M16 2v4"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></ICG>; }
function IcoUsers2({s,c}) { return <ICG size={s} color={c}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></ICG>; }
function IcoUser2({s,c}) { return <ICG size={s} color={c}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></ICG>; }
function IcoSettings2({s,c}) { return <ICG size={s} color={c}><path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z"/><circle cx="12" cy="12" r="3"/></ICG>; }
function IcoCreditCard2({s,c}) { return <ICG size={s} color={c}><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/><path d="M6 15h2M10 15h4"/></ICG>; }
function IcoHome2({s,c}) { return <ICG size={s} color={c}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></ICG>; }
function IcoEuro2({s,c}) { return <ICG size={s} color={c}><circle cx="12" cy="12" r="10"/><path d="M8 12h8M8 9.5A4 4 0 0115.5 9M8 14.5A4 4 0 0015.5 15"/></ICG>; }
function IcoTrend2({s,c}) { return <ICG size={s} color={c}><polyline points="22 7 13.5 15.5 8.5 10.5 1 18"/><polyline points="16 7 22 7 22 13"/></ICG>; }
function IcoAlert2({s,c}) { return <ICG size={s} color={c}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></ICG>; }
function IcoTag2({s,c}) { return <ICG size={s} color={c}><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><circle cx="7" cy="7" r="1.5"/></ICG>; }
function IcoLayers2({s,c}) { return <ICG size={s} color={c}><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></ICG>; }
function IcoUserPlus2({s,c}) { return <ICG size={s} color={c}><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="16" y1="11" x2="22" y2="11"/></ICG>; }
function IcoBarChart2({s,c}) { return <ICG size={s} color={c}><rect x="3" y="12" width="4" height="9" rx="1"/><rect x="10" y="7" width="4" height="14" rx="1"/><rect x="17" y="3" width="4" height="18" rx="1"/></ICG>; }
// ── Icônes premium pour nav coach/adhérent ──────────────────────────────────
function IcoSearch({s,c}) { return <ICG size={s} color={c}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></ICG>; }
function IcoBookOpen({s,c}) { return <ICG size={s} color={c}><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></ICG>; }
function IcoGraduate({s,c}) { return <ICG size={s} color={c}><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></ICG>; }
function IcoStar({s,c}) { return <ICG size={s} color={c}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></ICG>; }
function IcoActivity({s,c}) { return <ICG size={s} color={c}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></ICG>; }
function IcoAward({s,c}) { return <ICG size={s} color={c}><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></ICG>; }
function IcoClipboard({s,c}) { return <ICG size={s} color={c}><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></ICG>; }
function IcoHeart({s,c}) { return <ICG size={s} color={c}><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></ICG>; }
function IcoZap({s,c}) { return <ICG size={s} color={c}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></ICG>; }

function IcoLogOut({s,c}) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  );
}




function getDiscIcons() { return { 1: IcoYoga, 2: IcoPilates, 3: IcoMeditation, 4: IcoMoon }; }
function getNavIcons()  { return { dashboard: IcoHome2, planning: IcoCalendar2, members: IcoUsers2, subscriptions: IcoTag2, payments: IcoCreditCard2, disciplines: IcoLayers2, settings: IcoSettings2, aide: IcoHelpCircle }; }
// Aliases pour compatibilité
const DISC_ICONS = { 1: IcoYoga, 2: IcoPilates, 3: IcoMeditation, 4: IcoMoon };
const NAV_ICONS  = { dashboard: IcoHome2, planning: IcoCalendar2, members: IcoUsers2, subscriptions: IcoTag2, payments: IcoCreditCard2, disciplines: IcoLayers2, settings: IcoSettings2, aide: IcoHelpCircle };

export {
  IC, ICG,
  IcoHome, IcoCalendar, IcoUsers, IcoUser, IcoCreditCard, IcoTag, IcoLayers, IcoSettings,
  IcoTrend, IcoBarChart, IcoEuro,
  IcoCheck, IcoX, IcoUndo, IcoMail, IcoPhone, IcoDoor, IcoUserPlus, IcoChevron, IcoAlert,
  IcoYoga, IcoPilates, IcoMeditation, IcoMoon,
  IcoSearch, IcoBookOpen, IcoGraduate, IcoStar, IcoActivity, IcoAward, IcoClipboard, IcoHeart, IcoZap,
  IcoCalendar2, IcoUsers2, IcoUser2, IcoSettings2, IcoCreditCard2, IcoHome2, IcoEuro2, IcoTrend2, IcoAlert2, IcoTag2, IcoLayers2, IcoUserPlus2, IcoBarChart2,
  IcoHelpCircle, IcoLogOut,
  DISC_ICONS, NAV_ICONS,
};