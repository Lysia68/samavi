"use client";

import React, { useState } from "react";
import { C } from "./theme";
import { Button } from "./ui";
import { IcoChevron , IcoCalendar2 } from "./icons";

function DatePicker({ value, onChange, label, minDate, maxDate }) {
  const inputRef = React.useRef(null);
  const parsed = value ? new Date(value + "T12:00:00") : null;
  const displayValue = parsed
    ? parsed.toLocaleDateString("fr-FR", { weekday:"short", day:"numeric", month:"long", year:"numeric" })
    : "";

  return (
    <div style={{ position:"relative" }}>
      {label && (
        <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:.8, marginBottom:5 }}>
          {label}
        </div>
      )}
      <button type="button" onClick={() => inputRef.current?.showPicker?.() || inputRef.current?.click()}
        style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"9px 12px",
          border:`1.5px solid ${C.border}`, borderRadius:9, background:C.surfaceWarm,
          cursor:"pointer", textAlign:"left", boxSizing:"border-box" }}>
        <IcoCalendar2 s={16} c={C.textMuted}/>
        <span style={{ flex:1, fontSize:13, color:displayValue?C.text:C.textMuted, fontWeight:displayValue?600:400 }}>
          {displayValue || "Choisir une date\u2026"}
        </span>
        {value && (
          <span onClick={e=>{ e.stopPropagation(); onChange(""); }}
            style={{ fontSize:12, color:C.textMuted, lineHeight:1, padding:"0 2px", cursor:"pointer" }}>\u2715</span>
        )}
      </button>
      <input
        ref={inputRef}
        type="date"
        value={value || ""}
        min={minDate || ""}
        max={maxDate || ""}
        onChange={e => onChange(e.target.value)}
        style={{ position:"absolute", top:0, left:0, width:"100%", height:"100%",
          opacity:0, pointerEvents:"none" }}
      />
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


export { DatePicker, TimePicker, DurationPicker, DaySelect };