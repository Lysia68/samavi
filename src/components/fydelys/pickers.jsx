"use client";

import React, { useState } from "react";
import { C } from "./theme";
import { Button } from "./ui";
import { IcoChevron , IcoCalendar2 } from "./icons";

// ── CALENDAR DROPDOWN — partagé par DatePicker et BirthDatePicker ────────────
function CalendarDropdown({ value, onChange, minDate, maxDate, onClose, showYear=false }) {
  const today = new Date();
  const initial = value ? new Date(value + "T12:00:00") : today;
  const [view, setView] = React.useState({ year: initial.getFullYear(), month: initial.getMonth() });
  const [pickingYear, setPickingYear] = React.useState(false);

  const MONTHS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
  const DAYS_FR   = ["Lu","Ma","Me","Je","Ve","Sa","Di"];

  const toISO = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  const minD = minDate ? new Date(minDate+"T00:00:00") : null;
  const maxD = maxDate ? new Date(maxDate+"T23:59:59") : null;
  const selD = value ? new Date(value+"T12:00:00") : null;

  // Days grid
  const firstDay = new Date(view.year, view.month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7; // Mon=0
  const daysInMonth = new Date(view.year, view.month+1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isDisabled = (d) => {
    const dd = new Date(view.year, view.month, d);
    if (minD && dd < minD) return true;
    if (maxD && dd > maxD) return true;
    return false;
  };
  const isSelected = (d) => selD && selD.getFullYear()===view.year && selD.getMonth()===view.month && selD.getDate()===d;
  const isToday = (d) => today.getFullYear()===view.year && today.getMonth()===view.month && today.getDate()===d;

  const prevMonth = () => setView(v => v.month===0 ? {year:v.year-1,month:11} : {year:v.year,month:v.month-1});
  const nextMonth = () => setView(v => v.month===11 ? {year:v.year+1,month:0} : {year:v.year,month:v.month+1});

  const yearRange = [];
  const minYear = minD ? minD.getFullYear() : (showYear ? 1930 : today.getFullYear()-3);
  const maxYear = maxD ? maxD.getFullYear() : (showYear ? today.getFullYear() : today.getFullYear()+2);
  for (let y = maxYear; y >= minYear; y--) yearRange.push(y);

  const S = {
    wrap: { background:C.surface, border:`1.5px solid ${C.accent}40`, borderRadius:12,
      boxShadow:"0 8px 32px rgba(42,31,20,.18)", padding:14, width:252, userSelect:"none" },
    nav: { display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 },
    navBtn: { background:"none", border:`1px solid ${C.border}`, borderRadius:7, width:28, height:28,
      display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:C.textMuted, fontSize:13 },
    monthLabel: { fontSize:13, fontWeight:800, color:C.text, cursor:"pointer", padding:"2px 6px",
      borderRadius:6, transition:"background .12s" },
    grid: { display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2 },
    dayHead: { textAlign:"center", fontSize:10, fontWeight:700, color:C.textMuted, padding:"4px 0", textTransform:"uppercase" },
    day: (d, disabled, selected, tod) => ({
      textAlign:"center", fontSize:12, fontWeight: selected?700 : tod?600:400,
      padding:"5px 2px", borderRadius:7, cursor: disabled?"not-allowed":"pointer",
      background: selected ? C.accent : "transparent",
      color: disabled ? C.textMuted : selected ? "#fff" : tod ? C.accent : C.text,
      border: tod && !selected ? `1px solid ${C.accent}50` : "1px solid transparent",
      opacity: disabled ? .4 : 1, transition:"background .1s",
    }),
    footer: { display:"flex", justifyContent:"space-between", marginTop:10, paddingTop:8, borderTop:`1px solid ${C.border}` },
    link: { fontSize:11, fontWeight:600, color:C.accent, background:"none", border:"none", cursor:"pointer", padding:"2px 4px" },
    yearGrid: { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:4, maxHeight:180, overflowY:"auto",
      scrollbarWidth:"thin", scrollbarColor:`${C.accent}40 transparent` },
    yearBtn: (y) => ({ padding:"6px 4px", borderRadius:7, border:"none", cursor:"pointer", fontSize:12, fontWeight:view.year===y?800:400,
      background: view.year===y ? C.accent : "transparent", color: view.year===y ? "#fff" : C.text }),
  };

  if (pickingYear) return (
    <div style={S.wrap}>
      <div style={S.nav}>
        <span style={{ fontSize:12, fontWeight:700, color:C.text }}>Choisir une année</span>
        <button style={S.navBtn} onClick={()=>setPickingYear(false)}>✕</button>
      </div>
      <div style={S.yearGrid}>
        {yearRange.map(y => (
          <button key={y} style={S.yearBtn(y)} onClick={()=>{ setView(v=>({...v,year:y})); setPickingYear(false); }}>
            {y}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div style={S.wrap}>
      <div style={S.nav}>
        <button style={S.navBtn} onClick={prevMonth}>‹</button>
        <span style={S.monthLabel} onClick={()=>setPickingYear(true)}>
          {MONTHS_FR[view.month]} {view.year} ▾
        </span>
        <button style={S.navBtn} onClick={nextMonth}>›</button>
      </div>
      <div style={S.grid}>
        {DAYS_FR.map(d => <div key={d} style={S.dayHead}>{d}</div>)}
        {cells.map((d, i) => d === null
          ? <div key={`e${i}`}/>
          : <div key={d} style={S.day(d, isDisabled(d), isSelected(d), isToday(d))}
              onClick={()=>{ if(!isDisabled(d)) { onChange(toISO(new Date(view.year,view.month,d))); onClose?.(); } }}>
              {d}
            </div>
        )}
      </div>
      <div style={S.footer}>
        <button style={S.link} onClick={()=>{ onChange(""); onClose?.(); }}>Effacer</button>
        <button style={S.link} onClick={()=>{
          const t = toISO(today);
          if (!isDisabled(today.getDate()) || (!minD && !maxD)) {
            setView({ year:today.getFullYear(), month:today.getMonth() });
            onChange(t); onClose?.();
          }
        }}>Aujourd'hui</button>
      </div>
    </div>
  );
}

function DatePicker({ value, onChange, label, minDate, maxDate }) {
  const [open, setOpen] = React.useState(false);
  const [dropPos, setDropPos] = React.useState({});
  const ref = React.useRef(null);
  const triggerRef = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const openDrop = () => {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      const above = window.innerHeight - r.bottom < 300 && r.top > 300;
      setDropPos({ left:r.left, width:r.width, top:above?undefined:r.bottom+4, bottom:above?window.innerHeight-r.top+4:undefined });
    }
    setOpen(o => !o);
  };

  const parsed = value ? new Date(value + "T12:00:00") : null;
  const displayValue = parsed
    ? parsed.toLocaleDateString("fr-FR", { weekday:"short", day:"numeric", month:"long", year:"numeric" })
    : "";

  return (
    <div ref={ref} style={{ position:"relative" }}>
      {label && (
        <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:.8, marginBottom:5 }}>
          {label}
        </div>
      )}
      <button ref={triggerRef} type="button" onClick={openDrop}
        style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"9px 12px",
          border:`1.5px solid ${open?C.accent:C.border}`, borderRadius:9, background:C.surfaceWarm,
          cursor:"pointer", textAlign:"left", boxSizing:"border-box", transition:"border-color .15s" }}>
        <IcoCalendar2 s={16} c={open?C.accent:C.textMuted}/>
        <span style={{ flex:1, fontSize:13, color:displayValue?C.text:C.textMuted, fontWeight:displayValue?600:400 }}>
          {displayValue || "Choisir une date…"}
        </span>
        {value
          ? <span onClick={e=>{ e.stopPropagation(); onChange(""); setOpen(false); }}
              style={{ fontSize:12, color:C.textMuted, lineHeight:1, padding:"0 2px", cursor:"pointer" }}>✕</span>
          : <span style={{ fontSize:10, color:C.textMuted }}>▾</span>
        }
      </button>
      {open && (
        <div style={{ position:"fixed", left:dropPos.left, top:dropPos.top, bottom:dropPos.bottom, zIndex:9999 }}>
          <CalendarDropdown value={value} onChange={v=>{onChange(v);setOpen(false);}} minDate={minDate} maxDate={maxDate} onClose={()=>setOpen(false)}/>
        </div>
      )}
    </div>
  );
}

// ── BIRTH DATE PICKER — même calendrier, sélecteur d'année étendu ────────────
function BirthDatePicker({ value, onChange, error }) {
  const [open, setOpen] = React.useState(false);
  const [dropPos, setDropPos] = React.useState({});
  const ref = React.useRef(null);
  const triggerRef = React.useRef(null);
  const today = new Date().toISOString().split("T")[0];

  React.useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const openDrop = () => {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      const above = window.innerHeight - r.bottom < 300 && r.top > 300;
      setDropPos({ left:r.left, width: Math.max(r.width, 252), top:above?undefined:r.bottom+4, bottom:above?window.innerHeight-r.top+4:undefined });
    }
    setOpen(o => !o);
  };

  const parsed = value ? new Date(value + "T12:00:00") : null;
  const display = parsed ? parsed.toLocaleDateString("fr-FR", { day:"numeric", month:"long", year:"numeric" }) : "";

  return (
    <div ref={ref} style={{ position:"relative" }}>
      <button ref={triggerRef} type="button" onClick={openDrop}
        style={{ width:"100%", display:"flex", alignItems:"center", gap:8, padding:"9px 12px",
          border:`1.5px solid ${error?"#C43A3A":open?C.accent:C.border}`, borderRadius:8,
          background:C.surfaceWarm, cursor:"pointer", textAlign:"left", boxSizing:"border-box", transition:"border-color .15s" }}>
        <span style={{ fontSize:15 }}>🎂</span>
        <span style={{ flex:1, fontSize:13, color:display?C.text:C.textMuted, fontWeight:display?600:400 }}>
          {display || "jj/mm/aaaa"}
        </span>
        {value
          ? <span onClick={e=>{ e.stopPropagation(); onChange(""); setOpen(false); }}
              style={{ fontSize:12, color:C.textMuted, cursor:"pointer", padding:"0 2px" }}>✕</span>
          : <span style={{ fontSize:10, color:C.textMuted }}>▾</span>
        }
      </button>
      {open && (
        <div style={{ position:"fixed", left:dropPos.left, top:dropPos.top, bottom:dropPos.bottom, zIndex:9999 }}>
          <CalendarDropdown value={value} onChange={v=>{onChange(v);setOpen(false);}} maxDate={today} onClose={()=>setOpen(false)} showYear={true}/>
        </div>
      )}
    </div>
  );
}

// ── DURATION PICKER — durées prédéfinies + saisie libre ─────────────────────
const DURATIONS = [30, 45, 60, 75, 90, 105, 120];
function DurationPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = React.useState({ top:0, left:0, width:0 });
  const ref = React.useRef(null);
  const triggerRef = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const openDrop = () => {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      const above = window.innerHeight - r.bottom < 200 && r.top > 200;
      setDropPos({ left:r.left, width:r.width, top: above ? undefined : r.bottom+4, bottom: above ? window.innerHeight-r.top+4 : undefined });
    }
    setOpen(o => !o);
  };

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
        <button onMouseDown={e=>{e.preventDefault();openDrop();}} tabIndex={-1}
          style={{ flex:1, background:"none", border:"none", height:"100%", cursor:"pointer", fontSize:13, color:C.text, fontWeight:700, textAlign:"center", padding:"0 2px", minWidth:0, overflow:"hidden", whiteSpace:"nowrap" }}>
          {label(cur)}
        </button>
        <button onMouseDown={e=>{e.preventDefault();step(1);}} tabIndex={-1}
          style={{ background:"none", border:"none", borderLeft:`1px solid ${C.border}`, padding:"0 7px", height:"100%", cursor:"pointer", color:C.textMuted, fontSize:12, flexShrink:0 }}>▲</button>
      </div>
      {open && (
        <div style={{ position:"fixed", left:dropPos.left, top:dropPos.top, bottom:dropPos.bottom, width:dropPos.width,
          background:C.surface, border:`1.5px solid ${C.accent}`, borderRadius:10,
          boxShadow:"0 8px 32px rgba(42,31,20,.22)", zIndex:9999, maxHeight:200, overflowY:"scroll",
          scrollbarWidth:"thin", scrollbarColor:`${C.accent}40 transparent` }}>
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
  const [dropPos, setDropPos] = React.useState({ top:0, left:0, width:0 });
  const ref = React.useRef(null);
  const triggerRef = React.useRef(null);

  React.useEffect(() => { if (!editing) setInputVal(value || "09:00"); }, [value, editing]);

  React.useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const openDrop = () => {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      const above = window.innerHeight - r.bottom < 220 && r.top > 220;
      setDropPos({ left: r.left, width: r.width, top: above ? undefined : r.bottom + 4, bottom: above ? window.innerHeight - r.top + 4 : undefined });
    }
    setOpen(o => !o);
    setTimeout(() => {
      const el = document.querySelector('[data-timepicker-active="true"]');
      if (el) el.scrollIntoView({ block:"center" });
    }, 30);
  };

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
        <input value={inputVal}
          onChange={e=>{setEditing(true);setInputVal(e.target.value);}}
          onFocus={()=>{setEditing(true);setOpen(false);}}
          onBlur={e=>commit(e.target.value)}
          onKeyDown={e=>{
            if(e.key==="Enter") e.target.blur();
            if(e.key==="ArrowUp"){e.preventDefault();step(1);}
            if(e.key==="ArrowDown"){e.preventDefault();step(-1);}
          }}
          style={{ flex:1, border:"none", outline:"none", background:"transparent", padding:"0 6px", fontSize:13, color:C.text, fontWeight:700, minWidth:0, textAlign:"center", height:"100%", cursor:"pointer" }}
          onClick={openDrop}
        />
        <span onClick={openDrop} style={{ padding:"0 6px", color:C.textMuted, fontSize:10, cursor:"pointer", flexShrink:0 }}>▼</span>
      </div>
      {open && (
        <div style={{ position:"fixed", left:dropPos.left, top:dropPos.top, bottom:dropPos.bottom, width:dropPos.width,
          background:C.surface, border:`1.5px solid ${C.accent}`, borderRadius:10,
          boxShadow:"0 8px 32px rgba(42,31,20,.22)", zIndex:9999, maxHeight:200, overflowY:"scroll",
          scrollbarWidth:"thin", scrollbarColor:`${C.accent}40 transparent` }}>
          {slots.map(t => (
            <button key={t} data-timepicker-active={t===value?"true":"false"}
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
        style={{ width:"100%", padding:"9px 20px 9px 8px", borderRadius:9, border:`1.5px solid ${C.border}`, fontSize:13, color:C.text, background:C.surfaceWarm, outline:"none", appearance:"none", WebkitAppearance:"none", cursor:"pointer", fontWeight:600, minWidth:0, boxSizing:"border-box" }}>
        {DAYS_FULL.map(d => <option key={d.short} value={d.short}>{d.short}</option>)}
      </select>
      <span style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", pointerEvents:"none", fontSize:10, color:C.textMuted }}>▼</span>
    </div>
  );
}

const DAYS_FR = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];


export { DatePicker, BirthDatePicker, TimePicker, DurationPicker, DaySelect };