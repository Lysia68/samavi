"use client";

import React, { useState, useContext, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { AppCtx } from "./context";
import { C } from "./theme";
import { DISCIPLINES, ROLES_DEF } from "./demoData";
import { IcoLayers2, IcoX, IcoChevron, DISC_ICONS } from "./icons";
import { Card, SectionHead, Button, Field, Pill, EmptyState, DemoBanner } from "./ui";
import { TimePicker, DurationPicker, DaySelect } from "./pickers";

const DISCIPLINE_EMOJIS = [
  "🧘","🧘‍♀️","🧘‍♂️","🤸","🤸‍♀️","🏃","🏋️","🏋️‍♀️","💃","🕺",
  "🥊","🤼","🏊","🚴","🧗","🤺","⛹️","🏌️","🎯","🎽",
  "🌿","🌸","🌺","🌻","☀️","🌙","⭐","✨","🔥","💧",
  "🫧","🍃","🌱","🪷","🦋","🕊️","🐚","🪨","🎋","🎍",
  "💪","🙏","❤️","🫀","🧠","👁️","🦵","🤲","👐","🫶",
];


function EmojiPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  return (
    <div ref={ref} style={{ position:"relative" }}>
      <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:.8, marginBottom:5 }}>Icône</div>
      <button onClick={()=>setOpen(o=>!o)}
        style={{ width:52, height:42, borderRadius:9, border:`1.5px solid ${open?C.accent:C.border}`, background:C.surfaceWarm, fontSize:22, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"border-color .15s" }}>
        {value || "🏃"}
      </button>
      {open && (
        <div style={{ position:"absolute", top:"calc(100% + 6px)", left:0, zIndex:999, background:C.surface, border:`1.5px solid ${C.accent}`, borderRadius:12, boxShadow:"0 8px 32px rgba(42,31,20,.18)", padding:12, width:320 }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(8,1fr)", gap:4 }}>
            {DISCIPLINE_EMOJIS.map(e => (
              <button key={e} onClick={()=>{ onChange(e); setOpen(false); }}
                style={{ width:32, height:32, border:"none", borderRadius:8, background:e===value?C.accentLight:"transparent", fontSize:22, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"background .1s", padding:0 }}
                onMouseEnter={ev=>{ if(e!==value) ev.currentTarget.style.background=C.accentLight; }}
                onMouseLeave={ev=>{ ev.currentTarget.style.background=e===value?C.accentLight:"transparent"; }}>
                {e}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


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
              {(() => { const Ico = DISC_ICONS[disc.id]; return Ico ? <Ico s={20} c={disc.color}/> : <span>{disc.icon||"🏃"}</span>; })()}
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
              <div style={{display:"grid", gridTemplateColumns:"1.6fr 0.9fr 1fr", gap:8}}>
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
                <EmojiPicker value={editName.icon} onChange={v=>setEditName(e=>({...e,icon:v}))}/>
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
          <EmojiPicker value={nD.icon} onChange={v=>setND({...nD,icon:v})}/>
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


export { DisciplinesPage };
