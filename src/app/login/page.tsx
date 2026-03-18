"use client"
export const dynamic = "force-dynamic"
import React, { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"

function FleurDeLys({ size = 46 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <path d="M40 8 C37 14 34 20 34 28 C34 34 36 38 40 42 C44 38 46 34 46 28 C46 20 43 14 40 8Z" fill="url(#gc)"/>
      <ellipse cx="40" cy="9" rx="5" ry="5" fill="#F7D060"/>
      <path d="M34 30 C28 26 20 24 14 26 C10 28 9 33 12 37 C16 41 24 40 30 36 C34 33 34 30 34 30Z" fill="url(#gs)"/>
      <ellipse cx="11" cy="30" rx="4" ry="4" fill="#F5C842"/>
      <path d="M46 30 C52 26 60 24 66 26 C70 28 71 33 68 37 C64 41 56 40 50 36 C46 33 46 30 46 30Z" fill="url(#gs)"/>
      <ellipse cx="69" cy="30" rx="4" ry="4" fill="#F5C842"/>
      <path d="M34 38 C33 42 33 46 33 46 L47 46 C47 46 47 42 46 38 C44 40 40 41 40 41 C40 41 36 40 34 38Z" fill="#E8A830"/>
      <rect x="28" y="46" width="24" height="5" rx="2.5" fill="#D4922A"/>
      <path d="M36 51 C36 57 37 62 40 66 C43 62 44 57 44 51Z" fill="#C4822A"/>
      <defs>
        <linearGradient id="gc" x1="40" y1="8" x2="40" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F7D060"/>
          <stop offset="55%" stopColor="#E8A830"/>
          <stop offset="100%" stopColor="#C47820"/>
        </linearGradient>
        <linearGradient id="gs" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#F0BC3A"/>
          <stop offset="100%" stopColor="#D4902A"/>
        </linearGradient>
      </defs>
    </svg>
  )
}

type DisciplineSlot = { day: string; time: string }
type DisciplineConfig = { name: string; icon: string; slots: DisciplineSlot[] }

const DAYS = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"]
const DISC_OPTS = [
  {name:"Yoga Vinyasa",icon:"🧘"},{name:"Yin Yoga",icon:"🌙"},{name:"Méditation",icon:"☯"},
  {name:"Pilates Mat",icon:"⚡"},{name:"Pilates Réform.",icon:"🔧"},{name:"Stretching",icon:"🤸"},
  {name:"Danse Contemp.",icon:"💃"},{name:"Hip-Hop",icon:"🎵"},{name:"Classique",icon:"🩰"},
  {name:"HIIT",icon:"🔥"},{name:"Cardio",icon:"❤"},{name:"Musculation",icon:"💪"},
]
const DEFAULTS: Record<string,string[]> = {
  Yoga:["Yoga Vinyasa","Yin Yoga","Méditation"], Pilates:["Pilates Mat","Pilates Réform.","Stretching"],
  Danse:["Danse Contemp.","Hip-Hop","Classique"], Fitness:["HIIT","Cardio","Musculation"],
  Méditation:["Méditation","Yin Yoga","Yoga Vinyasa"], Multi:["Yoga Vinyasa","Pilates Mat","HIIT"],
}

function DisciplinesModal({ studioType, onClose, onSave }: {
  studioType: string; onClose: ()=>void; onSave: (d: DisciplineConfig[])=>void
}) {
  const init = DISC_OPTS.filter(d=>(DEFAULTS[studioType]||DEFAULTS.Multi).includes(d.name))
    .map((d,i)=>({...d, slots:[{day:["Lun","Mar","Mer","Jeu","Ven"][i%5], time:"19:00"}]}))
  const [discs, setDiscs] = useState<DisciplineConfig[]>(init)
  const [active, setActive] = useState(0)

  const toggle = (d: {name:string;icon:string}) => {
    const i = discs.findIndex(x=>x.name===d.name)
    if(i>=0){ setDiscs(p=>p.filter((_,j)=>j!==i)); setActive(0) }
    else { setDiscs(p=>[...p,{...d,slots:[{day:"Lun",time:"19:00"}]}]); setActive(discs.length) }
  }
  const addSlot = (di:number) => setDiscs(p=>p.map((d,i)=>i===di?{...d,slots:[...d.slots,{day:"Lun",time:"19:00"}]}:d))
  const rmSlot  = (di:number,si:number) => setDiscs(p=>p.map((d,i)=>i===di?{...d,slots:d.slots.filter((_,j)=>j!==si)}:d))
  const upSlot  = (di:number,si:number,f:"day"|"time",v:string) =>
    setDiscs(p=>p.map((d,i)=>i===di?{...d,slots:d.slots.map((s,j)=>j===si?{...s,[f]:v}:s)}:d))

  const B = {bg:"#F8F2EA",w:"#fff",border:"#DDD5C8",accent:"#A06838",text:"#2A1F14",sub:"#8C7B6C",muted:"#B0A090"}
  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()}
      style={{position:"fixed",inset:0,background:"rgba(42,31,20,.5)",zIndex:900,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:B.w,borderRadius:20,width:"100%",maxWidth:580,maxHeight:"90vh",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 24px 60px rgba(0,0,0,.2)"}}>
        <div style={{padding:"18px 24px",borderBottom:`1px solid ${B.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:16,fontWeight:800,color:B.text}}>🗓 Disciplines & Horaires</div>
            <div style={{fontSize:12,color:B.sub,marginTop:2}}>Configurez les cours de votre studio</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:`1.5px solid ${B.border}`,borderRadius:9,padding:"5px 10px",cursor:"pointer",fontSize:16,color:B.sub}}>✕</button>
        </div>
        <div style={{display:"flex",flex:1,overflow:"hidden"}}>
          {/* Gauche — liste disciplines */}
          <div style={{width:185,borderRight:`1px solid ${B.border}`,overflowY:"auto",padding:"10px 8px",flexShrink:0,background:B.bg}}>
            <div style={{fontSize:10,fontWeight:700,color:B.muted,textTransform:"uppercase",letterSpacing:.8,marginBottom:8,paddingLeft:4}}>Disciplines</div>
            {DISC_OPTS.map(d=>{
              const sel=discs.some(x=>x.name===d.name)
              const idx=discs.findIndex(x=>x.name===d.name)
              return (
                <div key={d.name} onClick={()=>{toggle(d);if(!sel)setTimeout(()=>setActive(discs.length),10)}}
                  style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",borderRadius:9,marginBottom:2,cursor:"pointer",
                    background:sel?"#F5EBE0":"transparent",border:`1px solid ${sel&&idx===active?B.accent:sel?"rgba(160,104,56,.25)":"transparent"}`,transition:"all .15s"}}>
                  <span style={{fontSize:15}}>{d.icon}</span>
                  <span style={{fontSize:12,fontWeight:sel?700:400,color:sel?B.accent:B.text,flex:1,lineHeight:1.2}}>{d.name}</span>
                  {sel&&<span onClick={e=>{e.stopPropagation();setActive(idx)}} style={{fontSize:10,color:B.accent}}>→</span>}
                </div>
              )
            })}
          </div>
          {/* Droite — horaires */}
          <div style={{flex:1,overflowY:"auto",padding:"16px 18px"}}>
            {discs.length===0 ? (
              <div style={{textAlign:"center",padding:"48px 0",color:B.muted}}>
                <div style={{fontSize:36,marginBottom:8}}>🗓</div>
                <div style={{fontSize:13}}>Sélectionnez des disciplines</div>
              </div>
            ) : (
              <>
                <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>
                  {discs.map((d,i)=>(
                    <button key={d.name} onClick={()=>setActive(i)}
                      style={{padding:"5px 11px",borderRadius:20,border:`1.5px solid ${i===active?B.accent:B.border}`,
                        background:i===active?"#F5EBE0":"#fff",color:i===active?B.accent:B.sub,
                        fontSize:12,fontWeight:i===active?700:400,cursor:"pointer"}}>
                      {d.icon} {d.name}
                    </button>
                  ))}
                </div>
                {discs[active] && (
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:B.text,marginBottom:12}}>{discs[active].icon} {discs[active].name} — Créneaux</div>
                    {discs[active].slots.map((slot,si)=>(
                      <div key={si} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                        <select value={slot.day} onChange={e=>upSlot(active,si,"day",e.target.value)}
                          style={{padding:"8px 10px",borderRadius:9,border:`1.5px solid ${B.border}`,fontSize:13,color:B.text,background:"#FDFAF7",flex:1,outline:"none"}}>
                          {DAYS.map(d=><option key={d}>{d}</option>)}
                        </select>
                        <input type="time" value={slot.time} onChange={e=>upSlot(active,si,"time",e.target.value)}
                          style={{padding:"8px 10px",borderRadius:9,border:`1.5px solid ${B.border}`,fontSize:13,color:B.text,background:"#FDFAF7",flex:1,outline:"none"}}/>
                        {discs[active].slots.length>1 &&
                          <button onClick={()=>rmSlot(active,si)}
                            style={{padding:"6px 10px",borderRadius:9,border:`1px solid ${B.border}`,background:"#fff",color:"#F87171",cursor:"pointer",fontSize:13}}>✕</button>}
                      </div>
                    ))}
                    <button onClick={()=>addSlot(active)}
                      style={{width:"100%",padding:"9px",borderRadius:9,border:"1.5px dashed #C4A87A",background:"transparent",color:B.accent,fontSize:13,fontWeight:600,cursor:"pointer",marginTop:4}}>
                      + Ajouter un créneau
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        <div style={{padding:"14px 24px",borderTop:`1px solid ${B.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontSize:12,color:B.muted}}>{discs.length} discipline{discs.length!==1?"s":""} · {discs.reduce((n,d)=>n+d.slots.length,0)} créneau{discs.reduce((n,d)=>n+d.slots.length,0)!==1?"x":""}</div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={onClose} style={{padding:"9px 18px",borderRadius:10,border:`1.5px solid ${B.border}`,background:"#fff",color:B.sub,fontSize:14,fontWeight:600,cursor:"pointer"}}>Annuler</button>
            <button onClick={()=>onSave(discs)} style={{padding:"9px 20px",borderRadius:10,border:"none",background:"linear-gradient(145deg,#B88050,#9A6030)",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer"}}>
              Valider {discs.length>0?`(${discs.length})`:""}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

type Ctx = "superadmin" | "tenant-login"

// FR / SR définis HORS de LoginPage pour éviter la perte de focus
type FRProps = { label:string; k:string; placeholder?:string; type?:string; required?:boolean; value:string; onChange:(k:string,v:string)=>void; error?:string }
function FR({ label, k, placeholder, type="text", required=false, value, onChange, error }:FRProps) {
  const [lf,setLf] = useState(false)
  const inp=(f=false,err=false)=>({
    width:"100%",padding:"11px 14px",border:`1.5px solid ${err?"#F87171":f?"rgba(160,104,56,.6)":"#DDD5C8"}`,
    borderRadius:10,fontSize:14,outline:"none",color:"#2A1F14",background:"#FDFAF7",
    boxSizing:"border-box" as const,boxShadow:f?"0 0 0 3px rgba(160,104,56,.07)":"none"
  })
  const lbl={fontSize:11,fontWeight:700,color:"#8C7B6C",textTransform:"uppercase" as const,letterSpacing:.8,display:"block",marginBottom:5}
  return (
    <div>
      <label style={lbl}>{label}{required&&<span style={{color:"#F87171"}}> *</span>}</label>
      <input type={type} value={value} onChange={e=>onChange(k,e.target.value)}
        onFocus={()=>setLf(true)} onBlur={()=>setLf(false)} placeholder={placeholder} style={inp(lf,!!error)}/>
      {error&&<div style={{fontSize:11,color:"#F87171",marginTop:3}}>{error}</div>}
    </div>
  )
}
type SRProps = { label:string; k:string; opts:{v:string;l:string}[]; value:string; onChange:(k:string,v:string)=>void }
function SR({ label, k, opts, value, onChange }:SRProps) {
  const inp=()=>({
    width:"100%",padding:"11px 14px",border:"1.5px solid #DDD5C8",
    borderRadius:10,fontSize:14,outline:"none",color:"#2A1F14",background:"#FDFAF7",
    boxSizing:"border-box" as const
  })
  const lbl={fontSize:11,fontWeight:700,color:"#8C7B6C",textTransform:"uppercase" as const,letterSpacing:.8,display:"block",marginBottom:5}
  return (
    <div>
      <label style={lbl}>{label}</label>
      <select value={value} onChange={e=>onChange(k,e.target.value)}
        style={{...inp(),appearance:"none" as const}}>
        {opts.map((o)=><option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  )
}

export default function LoginPage() {
  const [ctx, setCtx]           = useState<Ctx>("tenant-login")
  const [studioName, setStudioName] = useState("")
  const [tab, setTab]           = useState<"login"|"register">("login")
  const [email, setEmail]       = useState("")
  const [loading, setLoading]   = useState(false)
  const [sent, setSent]         = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [error, setError]       = useState<string|null>(null)
  const [focused, setFocused]   = useState(false)
  const [reg, setReg] = useState({
    studioName:"", slug:"", city:"", zip:"", address:"",
    type:"Yoga", firstName:"", lastName:"", email:"", phone:"",
    isCoach:false,
  })
  const [regErrors, setRegErrors] = useState<Record<string,string>>({})
  const [regStep, setRegStep]     = useState(1)
  const [regSent, setRegSent]     = useState(false)
  const [slugStatus, setSlugStatus]   = useState<"idle"|"checking"|"ok"|"taken">("idle")
  const [emailStatus, setEmailStatus] = useState<"idle"|"checking"|"ok"|"taken">("idle")

  // Instance stable pour éviter locks et re-renders multiples
  const supabase = useState(() => createClient())[0]

  useEffect(()=>{
    const saved = localStorage.getItem("fydelys_last_email")
    if (saved) setEmail(saved)
    const h = window.location.hostname
    if(h==="fydelys.fr"||h==="localhost"||h.startsWith("localhost:")) {
      setCtx("superadmin")
      // Si ?tab=register dans l'URL → créer studio directement
      const tabParam = new URLSearchParams(window.location.search).get("tab")
      if (tabParam === "register") { setTab("register") }
      else { setTab("login") }  // Par défaut : connexion directe, pas les 2 CTA
    } else {
      const m = h.match(/^([a-z0-9-]+)\.fydelys\.fr/)
      if(m) supabase.from("studios").select("name").eq("slug",m[1]).single()
        .then(({data})=>{ if(data) setStudioName(data.name) })
    }
    // Afficher message si redirect depuis callback avec erreur
    const params = new URLSearchParams(window.location.search)
    const errParam = params.get("error")
    if(errParam === "lien_expire") {
      setError("Ce lien de connexion a expiré ou a déjà été utilisé. Entrez votre email pour recevoir un nouveau lien.")
    } else if(errParam) {
      setError("Erreur de connexion. Veuillez réessayer.")
    }
    setHydrated(true)
  },[])

  const toSlug = (s:string) =>
    s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")
     .replace(/[^a-z0-9]/g,"")  // supprime tout sauf lettres et chiffres, pas de tirets
  const validSlug = (s:string) => /^[a-z0-9]+$/.test(s)
  const updReg = (k:string,v:any) => {
    const n:any={...reg,[k]:v}
    if(k==="studioName") { n.slug=toSlug(v); checkSlug(n.slug) }
    if(k==="slug") { n.slug=v.toLowerCase().replace(/[^a-z0-9]/g,""); checkSlug(n.slug) }
    if(k==="email") checkEmail(v)
    setReg(n); setRegErrors(e=>({...e,[k]:undefined as any}))
  }

  // Vérification slug avec debounce
  const slugTimerRef = React.useRef<ReturnType<typeof setTimeout>|null>(null)
  const checkSlug = (slug: string) => {
    if (!slug || slug.length < 2) { setSlugStatus("idle"); return }
    if (slugTimerRef.current) clearTimeout(slugTimerRef.current)
    setSlugStatus("checking")
    slugTimerRef.current = setTimeout(async () => {
      const res = await fetch(`/api/check-availability?slug=${encodeURIComponent(slug)}`)
      const { slugTaken } = await res.json()
      setSlugStatus(slugTaken ? "taken" : "ok")
    }, 500)
  }

  // Vérification email avec debounce
  const emailTimerRef = React.useRef<ReturnType<typeof setTimeout>|null>(null)
  const checkEmail = (email: string) => {
    if (!email || !email.includes("@")) { setEmailStatus("idle"); return }
    if (emailTimerRef.current) clearTimeout(emailTimerRef.current)
    setEmailStatus("checking")
    emailTimerRef.current = setTimeout(async () => {
      const res = await fetch(`/api/check-availability?email=${encodeURIComponent(email)}`)
      const { emailTaken } = await res.json()
      setEmailStatus(emailTaken ? "taken" : "ok")
    }, 600)
  }

  const lastLoginAttempt = React.useRef<number>(0)
  async function handleLogin(e:React.FormEvent){
    e.preventDefault()
    // Guard anti-429 : pas plus d'1 tentative toutes les 3 secondes
    const now = Date.now()
    if (now - lastLoginAttempt.current < 3000) {
      setError("Veuillez patienter quelques secondes avant de réessayer.")
      return
    }
    lastLoginAttempt.current = now
    setLoading(true); setError(null)
    const hostname = window.location.hostname
    const tenantMatch = hostname.match(/^([a-z0-9-]+)\.fydelys\.fr/)
    const slug = tenantMatch ? tenantMatch[1] : null

    if (slug) {
      // Sur slug.fydelys.fr : on génère le magic link côté serveur
      // pour envoyer un email brandé au nom du studio (pas "Fydelys")
      try {
        const res = await fetch("/api/send-magic-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, tenantSlug: slug }),
        })
        if (!res.ok) {
          const { error: apiErr } = await res.json()
          setError(apiErr || "Erreur lors de l'envoi")
          setLoading(false)
          return
        }
        localStorage.setItem("fydelys_last_email", email)
        setSent(true)
      } catch {
        setError("Erreur réseau. Réessayez.")
      }
    } else {
      // Sur fydelys.fr : connexion admin standard via Supabase directement
      const redirectTo = `https://fydelys.fr/auth/confirm`
      const {error}=await supabase.auth.signInWithOtp({email,
        options:{emailRedirectTo: redirectTo}})
      if (error) {
        if (error.message?.includes("rate limit") || error.status === 429) {
          setError("Trop de tentatives. Attendez quelques minutes avant de réessayer.")
        } else if (!error.message?.includes("Database error")) {
          setError(error.message)
        } else {
          setSent(true)
        }
      } else {
        localStorage.setItem("fydelys_last_email", email)
        setSent(true)
      }
    }
    setLoading(false)
  }

  async function handleRegister(){
    setLoading(true); setError(null)
    // Double vérification finale slug + email (au cas où les états ne seraient pas à jour)
    const checkRes = await fetch(`/api/check-availability?slug=${encodeURIComponent(reg.slug)}&email=${encodeURIComponent(reg.email)}`)
    const { slugTaken, emailTaken } = await checkRes.json()
    if(slugTaken){ setRegErrors({slug:"Ce sous-domaine est déjà pris"}); setSlugStatus("taken"); setRegStep(1); setLoading(false); return }
    if(emailTaken){ setRegErrors({email:"Un compte existe déjà avec cet email"}); setEmailStatus("taken"); setRegStep(2); setLoading(false); return }
    const {error:se}=await supabase.from("pending_registrations").upsert({
      email:reg.email,
      data:{studioName:reg.studioName,slug:reg.slug,city:reg.city,zip:reg.zip||null,address:reg.address||null,
            type:reg.type,firstName:reg.firstName,lastName:reg.lastName,phone:reg.phone,
            isCoach:reg.isCoach},
      expires_at:new Date(Date.now()+24*3600*1000).toISOString(),
    },{onConflict:"email"})
    if(se){ setError("Erreur lors de l'enregistrement."); setLoading(false); return }
    const {error}=await supabase.auth.signInWithOtp({email:reg.email,options:{
      emailRedirectTo:`https://fydelys.fr/auth/callback?next=/dashboard&register=1`,
      shouldCreateUser:true,
      data:{first_name:reg.firstName,last_name:reg.lastName},
    }})
    if(error&&!error.message?.includes("Database error")) setError(error.message)
    else setRegSent(true)
    setLoading(false)
  }

  const step1valid = () => {
    const e:Record<string,string>={}
    if(!reg.studioName.trim()) e.studioName="Obligatoire"
    if(!reg.city.trim())       e.city="Obligatoire"
    if(!reg.address.trim())    e.address="Obligatoire"
    if(!reg.slug.trim())       e.slug="Obligatoire"
    else if(!validSlug(reg.slug)) e.slug="Lettres minuscules et chiffres uniquement, sans tirets"
    return e
  }
  const step2valid = () => {
    const e:Record<string,string>={}
    if(!reg.firstName.trim()) e.firstName="Obligatoire"
    if(!reg.lastName.trim())  e.lastName="Obligatoire"
    if(!reg.email.includes("@")) e.email="Email invalide"
    if(!reg.phone.trim())     e.phone="Obligatoire"
    return e
  }

  const C = {
    bg:"#F8F2EA",
    glow:"radial-gradient(ellipse 80% 60% at 50% 0%, rgba(176,120,72,.08) 0%, transparent 70%)",
    card:"rgba(255,255,255,.88)", border:"1px solid rgba(221,213,200,.8)",
    title:"#2A1F14", accent:"#A06838", sub:"#8C7B6C",
    input:{bg:"#FDFAF7",color:"#2A1F14",border:(f:boolean)=>f?"#A06838":"#DDD5C8"},
    btn:"linear-gradient(145deg,#B88050,#9A6030)",
    btnGhost:"rgba(160,104,56,.08)", logo:"#F0EAE0",
    footer:"#B0A090", label:"#8C7B6C",
  }
  const inp=(f=false,err=false)=>({
    width:"100%",padding:"11px 14px",border:`1.5px solid ${err?"#F87171":C.input.border(f)}`,
    borderRadius:10,fontSize:14,outline:"none",color:C.input.color,background:C.input.bg,
    boxSizing:"border-box" as const,boxShadow:f?"0 0 0 3px rgba(160,104,56,.07)":"none"
  })
  const lbl={fontSize:11,fontWeight:700,color:C.label,textTransform:"uppercase" as const,letterSpacing:.8,display:"block",marginBottom:5}
  const btn=(ghost=false)=>({
    width:"100%",padding:"13px",background:ghost?C.btnGhost:C.btn,
    color:ghost?C.accent:"#fff",border:ghost?"1px solid rgba(160,104,56,.2)":"none",
    borderRadius:12,fontSize:15,fontWeight:700,cursor:"pointer",letterSpacing:-0.2
  })




  if (!hydrated) return (
    <div style={{minHeight:"100vh",background:"#F4EFE8",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{width:56,height:56,borderRadius:"50%",background:"rgba(160,104,56,.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>✦</div>
    </div>
  )

  return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"'Inter',-apple-system,sans-serif"}}>
      <div style={{position:"fixed",inset:0,background:C.glow,pointerEvents:"none"}}/>

      <div style={{width:"100%",maxWidth:ctx==="superadmin"&&tab==="register"?500:400,position:"relative"}}>

        {/* Logo */}
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{width:80,height:80,borderRadius:24,background:C.logo,display:"flex",alignItems:"center",
            justifyContent:"center",margin:"0 auto 18px",
            boxShadow:"0 4px 24px rgba(160,104,56,.16), inset 0 1px 0 rgba(255,255,255,.9), inset 0 -1px 0 rgba(160,104,56,.12)",
            border:"1.5px solid rgba(210,180,140,.35)"}}>
            <FleurDeLys size={50}/>
          </div>
          <h1 style={{fontSize:30,fontWeight:800,color:C.title,margin:"0 0 6px",letterSpacing:-0.8,lineHeight:1}}>
            {ctx === "tenant-login" && studioName
              ? studioName
              : <>Fyde<span style={{color:C.accent}}>lys</span></>
            }
          </h1>
          <p style={{color:C.sub,fontSize:13,margin:0,fontWeight:500}}>
            {ctx==="superadmin" ? "Plateforme de gestion · Studios & Bien-être"
             : studioName ? "Votre espace membre" : "Gestion de studio · Yoga & Bien-être"}
          </p>
        </div>

        {/* Pas de tabs : le register est accessible via un lien sous le formulaire login */}

        <div style={{background:C.card,backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",border:C.border,borderRadius:20,padding:"28px 26px",boxShadow:"0 8px 40px rgba(42,31,20,.08)"}}>

          {/* LOGIN */}
          {(ctx!=="superadmin"||tab==="login") && !sent && (
            <>

              <div style={{marginBottom:20}}>
                <h2 style={{fontSize:17,fontWeight:700,color:C.title,margin:"0 0 5px",letterSpacing:-0.3}}>
                  {ctx==="superadmin" ? "Connexion sans mot de passe" : "Connexion / Inscription"}
                </h2>
                <p style={{fontSize:13,color:C.sub,margin:0,lineHeight:1.6}}>
                  {ctx==="superadmin"
                    ? "Recevez un lien sécurisé dans votre boîte mail."
                    : "Entrez votre email pour recevoir un lien de connexion. Si vous êtes nouveau, votre compte est créé automatiquement."}
                </p>
              </div>
              <form onSubmit={handleLogin}>
                <div style={{marginBottom:14}}>
                  <label style={{...lbl,color:focused?C.accent:C.label}}>Adresse email</label>
                  <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                    onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
                    placeholder="vous@studio.com" required style={inp(focused)}/>
                </div>
                {error&&<div style={{background:"#FDF0EC",border:"1px solid #EFC8BC",borderRadius:9,padding:"9px 13px",marginBottom:12,fontSize:13,color:"#A85030"}}>⚠ {error}</div>}
                <button type="submit" disabled={loading||!email} style={{...btn(),opacity:loading||!email?.includes("@")?0.5:1}}>
                  {loading?"Envoi…":"Recevoir le lien ✦"}
                </button>
                {ctx!=="superadmin" && (
                  <p style={{fontSize:11,color:C.footer,margin:"10px 0 0",textAlign:"center",lineHeight:1.5}}>
                    Première fois ? Votre compte est créé automatiquement.
                  </p>
                )}
              </form>

              {/* Lien Créer mon studio — visible uniquement sur fydelys.fr */}
              {ctx==="superadmin" && (
                <div style={{textAlign:"center",marginTop:18,paddingTop:16,borderTop:"1px solid rgba(160,104,56,.1)"}}>
                  <p style={{fontSize:12,color:C.footer,margin:"0 0 8px"}}>Pas encore de compte ?</p>
                  <button onClick={()=>{setTab("register");setError(null);setSent(false);setRegSent(false)}}
                    style={{background:"transparent",border:"1.5px solid rgba(160,104,56,.3)",borderRadius:10,
                      padding:"9px 20px",fontSize:13,fontWeight:700,color:C.accent,cursor:"pointer",width:"100%"}}>
                    Créer mon studio →
                  </button>
                </div>
              )}
            </>
          )}

          {(ctx!=="superadmin"||tab==="login") && sent && (
            <div style={{textAlign:"center",padding:"8px 0"}}>
              <div style={{width:56,height:56,borderRadius:"50%",background:"rgba(52,211,153,.1)",border:"1.5px solid rgba(52,211,153,.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,margin:"0 auto 16px"}}>✉</div>
              <h2 style={{fontSize:18,fontWeight:800,color:C.title,marginBottom:8}}>Vérifiez vos emails !</h2>
              <p style={{fontSize:13,color:C.sub,marginBottom:4}}>Lien envoyé à</p>
              <p style={{fontWeight:700,color:C.accent,background:"#F5EBE0",borderRadius:8,padding:"6px 14px",display:"inline-block",marginBottom:16}}>{email}</p>
              <p style={{fontSize:12,color:C.footer,lineHeight:1.7}}>Expire dans <strong>1h</strong> · Vérifiez vos spams</p>
              <button onClick={()=>{setSent(false);setEmail("")}} style={{marginTop:16,...btn(true),fontSize:13,padding:"9px"}}>← Changer d&apos;adresse</button>
            </div>
          )}

          {/* REGISTER */}
          {ctx==="superadmin" && tab==="register" && !regSent && (
            <>
              <button onClick={()=>{setTab("login");setError(null);setRegStep(1);setRegSent(false)}}
                style={{background:"none",border:"none",color:C.sub,fontSize:13,cursor:"pointer",padding:"0 0 16px",display:"flex",alignItems:"center",gap:6,fontWeight:600}}>
                ← Retour à la connexion
              </button>
              <div style={{display:"flex",gap:6,marginBottom:22}}>
                {["Studio","Contact","Confirmation"].map((s,i)=>(
                  <div key={s} style={{flex:1}}>
                    <div style={{height:3,borderRadius:2,background:i+1<=regStep?C.accent:"#DDD5C8",marginBottom:4}}/>
                    <div style={{fontSize:10,fontWeight:600,color:i+1<=regStep?C.accent:"#B0A090",textAlign:"center"}}>{s}</div>
                  </div>
                ))}
              </div>

              {/* Étape 1 */}
              {regStep===1 && (
                <div style={{display:"flex",flexDirection:"column",gap:14}}>
                  <FR label="Nom du studio / centre" k="studioName" placeholder="Ex: Yoga Flow Paris" required value={reg.studioName} onChange={updReg} error={regErrors.studioName}/>

                  {/* Slug — format input.fydelys.fr */}
                  <div>
                    <label style={lbl}>Adresse web <span style={{color:"#B0A090"}}>(auto)</span> <span style={{color:"#F87171"}}>*</span></label>
                    <div style={{display:"flex",alignItems:"center",background:"#FAFAF8",border:`1.5px solid ${regErrors.slug||slugStatus==="taken"?"#F87171":slugStatus==="ok"?"#34D399":"#DDD5C8"}`,borderRadius:10,overflow:"hidden"}}>
                      <input value={reg.slug} onChange={e=>updReg("slug",e.target.value)} placeholder="yoga-flow-paris"
                        style={{...inp(),border:"none",background:"transparent",flex:1,padding:"11px 12px",textAlign:"right"}}/>
                      <span style={{padding:"11px 12px",color:"#8C7B6C",fontSize:13,borderLeft:"1px solid #DDD5C8",whiteSpace:"nowrap",flexShrink:0,fontWeight:600}}>.fydelys.fr</span>
                    </div>
                    {regErrors.slug&&<div style={{fontSize:11,color:"#F87171",marginTop:3}}>{regErrors.slug}</div>}
                    <div style={{display:"flex",alignItems:"center",gap:12,marginTop:4,flexWrap:"wrap"}}>
                      <div style={{fontSize:11,color:"#B0A090"}}>
                        Votre URL : <code style={{color:C.accent}}>{reg.slug||"monstudio"}.fydelys.fr</code>
                      </div>
                      {slugStatus==="checking" && <span style={{fontSize:11,color:"#B0A090"}}>⏳ Vérification…</span>}
                      {slugStatus==="ok"       && <span style={{fontSize:11,color:"#34D399",fontWeight:700}}>✓ Disponible</span>}
                      {slugStatus==="taken"    && <span style={{fontSize:11,color:"#F87171",fontWeight:700}}>✗ Déjà pris</span>}
                    </div>
                  </div>

                  <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:12}}>
                    <FR label="Ville" k="city" placeholder="Paris" required value={reg.city} onChange={updReg} error={regErrors.city}/>
                    <FR label="Code postal" k="zip" placeholder="75001" value={reg.zip} onChange={updReg}/>
                  </div>
                  <FR label="Adresse" k="address" placeholder="12 rue de la Paix" required value={reg.address} onChange={updReg} error={regErrors.address}/>
                  <SR label="Type de pratique" k="type" value={reg.type} onChange={updReg} opts={[
                    {v:"Yoga",l:"🧘 Yoga"},{v:"Pilates",l:"⚡ Pilates"},{v:"Danse",l:"💃 Danse"},
                    {v:"Fitness",l:"🏋 Fitness"},{v:"Méditation",l:"☯ Méditation"},{v:"Multi",l:"🌀 Multi"}
                  ]}/>

                  <button
                    disabled={slugStatus==="taken"||slugStatus==="checking"}
                    onClick={()=>{const e=step1valid();if(Object.keys(e).length){setRegErrors(e);return};setRegStep(2)}}
                    style={{...btn(),opacity:slugStatus==="taken"||slugStatus==="checking"?0.5:1}}>
                    {slugStatus==="checking"?"Vérification…":"Continuer →"}
                  </button>
                </div>
              )}

              {/* Étape 2 */}
              {regStep===2 && (
                <div style={{display:"flex",flexDirection:"column",gap:14}}>
                  <div style={{padding:"10px 14px",background:"#FBF6EE",borderRadius:9,border:"1px solid rgba(160,104,56,.2)",fontSize:13,color:C.sub}}>
                    👤 Vos coordonnées (gérant du studio)
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                    <FR label="Prénom" k="firstName" placeholder="Marie" required value={reg.firstName} onChange={updReg} error={regErrors.firstName}/>
                    <FR label="Nom" k="lastName" placeholder="Laurent" required value={reg.lastName} onChange={updReg} error={regErrors.lastName}/>
                  </div>
                  <div>
                    <label style={lbl}>Email professionnel <span style={{color:"#F87171"}}>*</span></label>
                    <div style={{position:"relative"}}>
                      <input type="email" value={reg.email}
                        onChange={e=>updReg("email",e.target.value)}
                        placeholder="marie@studio.fr"
                        style={{...inp(),width:"100%",boxSizing:"border-box",paddingRight:32,
                          border:`1.5px solid ${regErrors.email||emailStatus==="taken"?"#F87171":emailStatus==="ok"?"#34D399":"#DDD5C8"}`}}
                      />
                      {emailStatus==="checking" && <span style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",fontSize:12,color:"#B0A090"}}>⏳</span>}
                      {emailStatus==="ok"       && <span style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",fontSize:13,color:"#34D399",fontWeight:700}}>✓</span>}
                      {emailStatus==="taken"    && <span style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",fontSize:13,color:"#F87171",fontWeight:700}}>✗</span>}
                    </div>
                    {(regErrors.email||emailStatus==="taken") && (
                      <div style={{fontSize:11,color:"#F87171",marginTop:3}}>
                        {regErrors.email||"Un compte existe déjà avec cet email — connectez-vous plutôt"}
                      </div>
                    )}
                    {emailStatus==="ok" && !regErrors.email && (
                      <div style={{fontSize:11,color:"#34D399",marginTop:3}}>✓ Email disponible</div>
                    )}
                  </div>
                  <FR label="Téléphone" k="phone" type="tel" placeholder="+33 6 12 34 56 78" required value={reg.phone} onChange={updReg} error={regErrors.phone}/>
                  <div onClick={()=>updReg("isCoach",!reg.isCoach)}
                    style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",
                      background:reg.isCoach?"#F5EBE0":"#FAFAF8",border:`1px solid ${reg.isCoach?"rgba(160,104,56,.3)":"#DDD5C8"}`,
                      borderRadius:10,cursor:"pointer",userSelect:"none"}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:700,color:reg.isCoach?"#8C5E38":"#5C4A38"}}>🎯 Je donne aussi des cours</div>
                      <div style={{fontSize:11,color:"#B0A090",marginTop:2}}>Gérant et coach intervenant dans le studio</div>
                    </div>
                    <div style={{width:40,height:22,borderRadius:11,background:reg.isCoach?C.accent:"rgba(160,104,56,.15)",position:"relative",flexShrink:0,transition:"background .2s"}}>
                      <div style={{position:"absolute",top:3,left:reg.isCoach?20:3,width:16,height:16,borderRadius:"50%",background:"#fff",transition:"left .2s"}}/>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:10}}>
                    <button onClick={()=>setRegStep(1)} style={{...btn(true),flex:1}}>← Retour</button>
                    <button
                      disabled={emailStatus==="taken"||emailStatus==="checking"}
                      style={{...btn(),flex:2,opacity:emailStatus==="taken"||emailStatus==="checking"?0.5:1}}
                      onClick={()=>{const e=step2valid();if(Object.keys(e).length){setRegErrors(e);return};setRegStep(3)}}>
                      Vérifier →
                    </button>
                  </div>
                </div>
              )}

              {/* Étape 3 — Récap */}
              {regStep===3 && (
                <div style={{display:"flex",flexDirection:"column",gap:14}}>
                  <div style={{padding:"14px",background:"rgba(52,211,153,.06)",borderRadius:12,border:"1px solid rgba(52,211,153,.2)"}}>
                    <div style={{fontSize:13,fontWeight:700,color:"#34D399",marginBottom:10}}>✅ Récapitulatif</div>
                    {[
                      ["Studio",      reg.studioName],
                      ["URL",         `${reg.slug||"—"}.fydelys.fr`],
                      ["Ville",       reg.city],
                      ["Code postal",  reg.zip],
                      ["Type",        reg.type],

                      ["Plan",        "À choisir après l'activation (9 · 29 · 69 €/mois)"],
                      ["Gérant",      `${reg.firstName} ${reg.lastName}`],
                      ["Email",       reg.email],
                      ["Téléphone",   reg.phone],
                      ["Rôle",        reg.isCoach?"Gérant + Coach":"Gérant"],
                    ].map(([k,v])=>(
                      <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #EDE6DC",fontSize:13}}>
                        <span style={{color:"#8C7B6C"}}>{k}</span>
                        <span style={{color:C.title,fontWeight:600,textAlign:"right",maxWidth:"58%"}}>{v}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{padding:"10px 14px",background:"#FBF6EE",borderRadius:9,border:"1px solid rgba(160,104,56,.2)",fontSize:12,color:C.sub,lineHeight:1.6}}>
                    🌱 Vos disciplines, créneaux et abonnements de base seront configurés automatiquement.
                  </div>
                  {error&&<div style={{background:"#FDF0EC",border:"1px solid #EFC8BC",borderRadius:9,padding:"9px 13px",fontSize:13,color:"#A85030"}}>⚠ {error}</div>}
                  <div style={{display:"flex",gap:10}}>
                    <button onClick={()=>setRegStep(2)} style={{...btn(true),flex:1}}>← Retour</button>
                    <button onClick={handleRegister} disabled={loading} style={{...btn(),flex:2,opacity:loading?0.6:1}}>
                      {loading?"Envoi…":"🚀 Créer mon studio"}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {ctx==="superadmin" && tab==="register" && regSent && (
            <div style={{textAlign:"center",padding:"8px 0"}}>
              <div style={{width:56,height:56,borderRadius:"50%",background:"rgba(52,211,153,.1)",border:"1.5px solid rgba(52,211,153,.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,margin:"0 auto 16px"}}>✉</div>
              <h2 style={{fontSize:18,fontWeight:800,color:C.title,marginBottom:8}}>Vérifiez vos emails !</h2>
              <p style={{fontSize:13,color:C.sub,marginBottom:4}}>Lien de confirmation envoyé à</p>
              <p style={{fontWeight:700,color:C.accent,background:"#F5EBE0",borderRadius:8,padding:"6px 14px",display:"inline-block",marginBottom:16}}>{reg.email}</p>
              <p style={{fontSize:12,color:C.footer,lineHeight:1.7}}>
                Cliquez sur le lien pour activer votre studio.<br/>
                Vous serez redirigé vers <strong style={{color:C.accent}}>{reg.slug}.fydelys.fr</strong>
              </p>
            </div>
          )}
        </div>

        <p style={{textAlign:"center",color:C.footer,fontSize:11,marginTop:20}}>© 2026 Fydelys · Connexion 100% sécurisée</p>
      </div>
    </div>
  )
}