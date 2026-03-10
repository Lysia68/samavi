"use client"
export const dynamic = "force-dynamic"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"

function FleurDeLys({ size = 38 }: { size?: number }) {
  const s = size
  return (
    <svg width={s} height={s} viewBox="0 0 64 64" fill="none">
      <path d="M32 54 C32 54 28 46 28 38 C28 32 30 28 32 24 C34 28 36 32 36 38 C36 46 32 54 32 54Z" fill="white" fillOpacity="0.95"/>
      <path d="M32 24 C32 24 26 18 26 12 C26 7 29 4 32 4 C35 4 38 7 38 12 C38 18 32 24 32 24Z" fill="white" fillOpacity="0.95"/>
      <path d="M28 30 C28 30 20 28 14 22 C10 18 10 13 13 11 C16 9 21 11 24 16 C27 21 28 30 28 30Z" fill="white" fillOpacity="0.85"/>
      <path d="M36 30 C36 30 44 28 50 22 C54 18 54 13 51 11 C48 9 43 11 40 16 C37 21 36 30 36 30Z" fill="white" fillOpacity="0.85"/>
      <rect x="22" y="36" width="20" height="4" rx="2" fill="white" fillOpacity="0.7"/>
    </svg>
  )
}

type Ctx = "superadmin" | "tenant-login" | "tenant-register"

export default function LoginPage() {
  const [ctx, setCtx]               = useState<Ctx>("tenant-login")
  const [studioName, setStudioName] = useState("")
  const [tenantSlug, setTenantSlug] = useState("")
  const [tab, setTab]               = useState<"login"|"register">("login")

  // ── Login state ──
  const [email, setEmail]     = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState<string|null>(null)
  const [focused, setFocused] = useState(false)

  // ── Register state ──
  const [reg, setReg] = useState({
    studioName:"", slug:"", city:"", address:"",
    type:"Yoga", plan:"Starter",
    firstName:"", lastName:"", email:"", phone:"",
    isCoach: false
  })
  const [regErrors, setRegErrors] = useState<Record<string,string>>({})
  const [regStep, setRegStep]     = useState(1)
  const [regSent, setRegSent]     = useState(false)

  const supabase = createClient()

  useEffect(() => {
    const hostname = window.location.hostname
    if (hostname.startsWith("app.") || hostname === "localhost" || hostname === "localhost:3000") {
      setCtx("superadmin")
      setTab("login")
    } else {
      const match = hostname.match(/^([a-z0-9-]+)\.fydelys\.fr/)
      if (match) {
        setCtx("tenant-login")
        setTenantSlug(match[1])
        supabase.from("studios").select("name").eq("slug", match[1]).single()
          .then(({ data }) => { if (data) setStudioName(data.name) })
      }
    }
  }, [])

  // ── slug helper ──
  const toSlug = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")
     .replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"")
  const validSlug = (s: string) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s)

  const updReg = (k: string, v: string) => {
    const next: any = {...reg, [k]:v}
    if(k==="studioName") next.slug = toSlug(v)
    if(k==="slug") next.slug = v.toLowerCase().replace(/[^a-z0-9-]/g,"").replace(/\./g,"")
    setReg(next)
    setRegErrors(e=>({...e,[k]:undefined as any}))
  }

  // ── Login submit ──
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
    })
    if (error && !error.message?.includes("Database error")) setError(error.message)
    else setSent(true)
    setLoading(false)
  }

  // ── Register submit (step 3 → envoi magic link) ──
  async function handleRegister() {
    setLoading(true); setError(null)

    // 1. Vérifier que le slug n'est pas déjà pris
    const { data: existing } = await supabase
      .from("studios").select("id").eq("slug", reg.slug).single()
    if (existing) {
      setRegErrors({ slug: "Ce sous-domaine est déjà pris" })
      setRegStep(1); setLoading(false); return
    }

    // 2. Sauvegarder les données d'inscription en base (pending_registrations)
    //    Le callback les consommera après confirmation du magic link
    const { error: saveErr } = await supabase
      .from("pending_registrations")
      .upsert({
        email:      reg.email,
        data: {
          studioName: reg.studioName,
          slug:       reg.slug,
          city:       reg.city,
          address:    reg.address || null,
          type:       reg.type,
          plan:       reg.plan,
          firstName:  reg.firstName,
          lastName:   reg.lastName,
          phone:      reg.phone,
          isCoach:    reg.isCoach,
        },
        expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      }, { onConflict: "email" })

    if (saveErr) { setError("Erreur lors de l'enregistrement. Réessayez."); setLoading(false); return }

    // 3. Envoyer le magic link
    const { error } = await supabase.auth.signInWithOtp({
      email: reg.email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard&register=1`,
        shouldCreateUser: true,
        data: { first_name: reg.firstName, last_name: reg.lastName },
      },
    })
    if (error && !error.message?.includes("Database error")) setError(error.message)
    else setRegSent(true)
    setLoading(false)
  }

  const validateRegStep1 = () => {
    const e: Record<string,string> = {}
    if(!reg.studioName.trim()) e.studioName = "Obligatoire"
    if(!reg.city.trim())       e.city       = "Obligatoire"
    if(!reg.slug.trim())       e.slug       = "Obligatoire"
    else if(!validSlug(reg.slug)) e.slug    = "Lettres minuscules, chiffres et tirets uniquement"
    return e
  }
  const validateRegStep2 = () => {
    const e: Record<string,string> = {}
    if(!reg.firstName.trim())               e.firstName = "Obligatoire"
    if(!reg.lastName.trim())                e.lastName  = "Obligatoire"
    if(!reg.email.trim()||!reg.email.includes("@")) e.email = "Email invalide"
    if(!reg.phone.trim())                   e.phone     = "Obligatoire"
    return e
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // Styles — charte unique beige/doré Fydelys (app + tenant)
  const C = {
    bg:      "#F8F2EA",
    glow:    "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(176,120,72,.08) 0%, transparent 70%)",
    card:    "rgba(255,255,255,.85)",
    border:  "1px solid rgba(221,213,200,.8)",
    title:   "#2A1F14",
    accent:  "#A06838",
    sub:     "#8C7B6C",
    input:   { bg: "#FDFAF7", color: "#2A1F14",
               border: (f:boolean) => f ? "#A06838" : "#DDD5C8" },
    btn:     "linear-gradient(145deg,#B88050,#9A6030)",
    btnGhost:"rgba(160,104,56,.08)",
    logo:    "linear-gradient(145deg,#C4956A,#8A5530)",
    footer:  "#B0A090",
    label:   "#8C7B6C",
  }
  const inp = (f=false,err=false) => ({
    width:"100%", padding:"11px 14px",
    border:`1.5px solid ${err?"#F87171":C.input.border(f)}`,
    borderRadius:10, fontSize:14, outline:"none",
    color:C.input.color, background:C.input.bg,
    boxSizing:"border-box" as const,
    boxShadow: f ? "0 0 0 3px rgba(160,104,56,.07)" : "none"
  })
  const lbl = { fontSize:11, fontWeight:700, color:C.label, textTransform:"uppercase" as const, letterSpacing:.8, display:"block", marginBottom:5 }
  const btnStyle = (ghost=false) => ({
    width:"100%", padding:"13px",
    background: ghost ? C.btnGhost : C.btn,
    color: ghost ? C.accent : "#fff",
    border: ghost ? "1px solid rgba(160,104,56,.2)" : "none",
    borderRadius:12, fontSize:15, fontWeight:700,
    cursor:"pointer", letterSpacing:-0.2
  })

  const FieldReg = ({label, k, placeholder, type="text", required=false}: any) => {
    const [lf, setLf] = useState(false)
    return (
      <div>
        <label style={lbl}>{label}{required&&<span style={{color:"#F87171"}}> *</span>}</label>
        <input type={type} value={(reg as any)[k]} onChange={e=>updReg(k,e.target.value)}
          onFocus={()=>setLf(true)} onBlur={()=>setLf(false)}
          placeholder={placeholder} style={inp(lf, !!regErrors[k])}/>
        {regErrors[k]&&<div style={{fontSize:11,color:"#F87171",marginTop:3}}>{regErrors[k]}</div>}
      </div>
    )
  }
  const SelectReg = ({label, k, opts}: any) => (
    <div>
      <label style={lbl}>{label}</label>
      <select value={(reg as any)[k]} onChange={e=>updReg(k,e.target.value)}
        style={{...inp(), appearance:"none" as const, background:"#FDFAF7"}}>
        {opts.map((o:any)=><option key={o.v} value={o.v} style={{background:"#fff"}}>{o.l}</option>)}
      </select>
    </div>
  )

  // ──────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24, fontFamily:"'Inter',-apple-system,sans-serif"}}>
      <div style={{position:"fixed",inset:0,background:C.glow,pointerEvents:"none"}}/>

      <div style={{width:"100%", maxWidth: ctx==="superadmin" && tab==="register" ? 500 : 400, position:"relative"}}>

        {/* Logo */}
        <div style={{textAlign:"center", marginBottom:32}}>
          <div style={{width:72,height:72,borderRadius:22,background:C.logo,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 18px",boxShadow:`0 12px 40px ${"rgba(140,88,56,.3)"},inset 0 1px 0 rgba(255,255,255,.15)`}}>
            <FleurDeLys/>
          </div>
          <h1 style={{fontSize:30,fontWeight:800,color:C.title,margin:"0 0 6px",letterSpacing:-0.8,lineHeight:1}}>
            Fyde<span style={{color:C.accent}}>lys</span>
          </h1>
          <p style={{color:C.sub,fontSize:13,margin:0,fontWeight:500}}>
            {ctx==="superadmin" ? "Plateforme de gestion · Studios & Bien-être"
             : studioName ? `Bienvenue chez ${studioName}`
             : "Gestion de studio · Yoga & Bien-être"}
          </p>
        </div>

        {/* Tabs — seulement sur app.fydelys.fr */}
        {ctx === "superadmin" && (
          <div style={{display:"flex",background:"rgba(160,104,56,.08)",borderRadius:12,padding:4,marginBottom:20,border:"1px solid rgba(160,104,56,.2)"}}>
            {([["login","Se connecter"],["register","Créer mon studio"]] as const).map(([t,l])=>(
              <button key={t} onClick={()=>{setTab(t);setError(null);setSent(false);setRegSent(false)}}
                style={{flex:1,padding:"9px",borderRadius:9,border:"none",fontWeight:700,fontSize:14,cursor:"pointer",
                  background:tab===t?C.btn:"transparent",
                  color:tab===t?"#fff":C.sub}}>
                {l}
              </button>
            ))}
          </div>
        )}

        {/* Card */}
        <div style={{background:C.card,backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",border:C.border,borderRadius:20,padding:"28px 26px",boxShadow:`0 8px 40px ${"rgba(42,31,20,.08)"}`}}>

          {/* ── LOGIN ── */}
          {(ctx!=="superadmin" || tab==="login") && !sent && (
            <>
              <div style={{marginBottom:20}}>
                <h2 style={{fontSize:17,fontWeight:700,color:C.title,margin:"0 0 5px",letterSpacing:-0.3}}>Connexion sans mot de passe</h2>
                <p style={{fontSize:13,color:C.sub,margin:0,lineHeight:1.6}}>Recevez un lien sécurisé dans votre boîte mail.</p>
              </div>
              <form onSubmit={handleLogin}>
                <div style={{marginBottom:14}}>
                  <label style={{...lbl,color:focused?C.accent:C.label}}>Adresse email</label>
                  <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                    onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
                    placeholder="vous@studio.com" required style={inp(focused)}/>
                </div>
                {error&&<div style={{background:"#FDF0EC",border:"1px solid #EFC8BC",borderRadius:9,padding:"9px 13px",marginBottom:12,fontSize:13,color:"#A85030"}}>⚠ {error}</div>}
                <button type="submit" disabled={loading||!email} style={{...btnStyle(),opacity:loading||!email?.includes("@")?0.5:1}}>
                  {loading?"Envoi…":"Recevoir le lien ✦"}
                </button>
              </form>
            </>
          )}

          {(ctx!=="superadmin" || tab==="login") && sent && (
            <div style={{textAlign:"center",padding:"8px 0"}}>
              <div style={{width:56,height:56,borderRadius:"50%",background:"rgba(52,211,153,.1)",border:"1.5px solid rgba(52,211,153,.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,margin:"0 auto 16px"}}>✉</div>
              <h2 style={{fontSize:18,fontWeight:800,color:C.title,marginBottom:8}}>Vérifiez vos emails !</h2>
              <p style={{fontSize:13,color:C.sub,marginBottom:4}}>Lien envoyé à</p>
              <p style={{fontWeight:700,color:C.accent,background:"#F5EBE0",borderRadius:8,padding:"6px 14px",display:"inline-block",marginBottom:16}}>{email}</p>
              <p style={{fontSize:12,color:C.footer,lineHeight:1.7}}>Expire dans <strong>1h</strong> · Vérifiez vos spams</p>
              <button onClick={()=>{setSent(false);setEmail("")}} style={{marginTop:16,...btnStyle(true),fontSize:13,padding:"9px"}}>← Changer d&apos;adresse</button>
            </div>
          )}

          {/* ── REGISTER ── */}
          {ctx==="superadmin" && tab==="register" && !regSent && (
            <>
              {/* Progress */}
              <div style={{display:"flex",gap:6,marginBottom:22}}>
                {["Studio","Contact","Confirmation"].map((s,i)=>(
                  <div key={s} style={{flex:1}}>
                    <div style={{height:3,borderRadius:2,background:i+1<=regStep?C.accent:"#DDD5C8",marginBottom:4}}/>
                    <div style={{fontSize:10,fontWeight:600,color:i+1<=regStep?C.accent:"#B0A090",textAlign:"center"}}>{s}</div>
                  </div>
                ))}
              </div>

              {regStep===1 && (
                <div style={{display:"flex",flexDirection:"column",gap:14}}>
                  <FieldReg label="Nom du studio / centre" k="studioName" placeholder="Ex: Yoga Flow Paris" required/>
                  <div>
                    <label style={lbl}>Sous-domaine <span style={{color:"#B0A090"}}>(auto)</span> <span style={{color:"#F87171"}}>*</span></label>
                    <div style={{display:"flex",alignItems:"center",background:"#FAFAF8",border:`1.5px solid ${regErrors.slug?"#F87171":"#DDD5C8"}`,borderRadius:10,overflow:"hidden"}}>
                      <span style={{padding:"11px 12px",color:"#B0A090",fontSize:13,borderRight:"1px solid #DDD5C8",whiteSpace:"nowrap",flexShrink:0}}>fydelys.fr/</span>
                      <input value={reg.slug} onChange={e=>updReg("slug",e.target.value)} placeholder="yoga-flow-paris"
                        style={{...inp(),border:"none",background:"transparent",flex:1,padding:"11px 12px"}}/>
                    </div>
                    {regErrors.slug&&<div style={{fontSize:11,color:"#F87171",marginTop:3}}>{regErrors.slug}</div>}
                    <div style={{fontSize:11,color:"#B0A090",marginTop:4}}>✓ Ex: <code style={{color:C.accent}}>yoga-paris</code> · uniquement lettres, chiffres, tirets</div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                    <FieldReg label="Ville" k="city" placeholder="Paris" required/>
                    <FieldReg label="Adresse" k="address" placeholder="12 rue de la Paix"/>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                    <SelectReg label="Type de pratique" k="type" opts={[
                      {v:"Yoga",l:"🧘 Yoga"},{v:"Pilates",l:"⚡ Pilates"},{v:"Danse",l:"💃 Danse"},
                      {v:"Fitness",l:"🏋 Fitness"},{v:"Méditation",l:"☯ Méditation"},{v:"Multi",l:"🌀 Multi"}
                    ]}/>
                    <SelectReg label="Plan Fydelys" k="plan" opts={[
                      {v:"Starter",l:"Starter — 29€/mois"},{v:"Pro",l:"Pro — 79€/mois"},{v:"Business",l:"Business — 199€/mois"}
                    ]}/>
                  </div>
                  <button onClick={()=>{ const e=validateRegStep1(); if(Object.keys(e).length){setRegErrors(e);return}; setRegStep(2) }}
                    style={btnStyle()}>Continuer →</button>
                </div>
              )}

              {regStep===2 && (
                <div style={{display:"flex",flexDirection:"column",gap:14}}>
                  <div style={{padding:"10px 14px",background:"rgba(167,139,250,.08)",borderRadius:9,border:"1px solid rgba(167,139,250,.15)",fontSize:13,color:"#C4B5FD"}}>
                    👤 Vos coordonnées personnelles (gérant du studio)
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                    <FieldReg label="Prénom" k="firstName" placeholder="Marie" required/>
                    <FieldReg label="Nom" k="lastName" placeholder="Laurent" required/>
                  </div>
                  <FieldReg label="Email professionnel" k="email" type="email" placeholder="marie@studio.fr" required/>
                  <FieldReg label="Téléphone" k="phone" type="tel" placeholder="+33 6 12 34 56 78" required/>
                  {/* Toggle coach */}
                  <div onClick={()=>updReg("isCoach", (!reg.isCoach) as any)}
                    style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",background:reg.isCoach?"#F5EBE0":"#FAFAF8",border:`1px solid ${reg.isCoach?"rgba(160,104,56,.3)":"#DDD5C8"}`,borderRadius:10,cursor:"pointer",userSelect:"none"}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:700,color:reg.isCoach?"#8C5E38":"#5C4A38"}}>🎯 Je donne aussi des cours</div>
                      <div style={{fontSize:11,color:"#B0A090",marginTop:2}}>Je suis gérant et intervenant / coach dans mon studio</div>
                    </div>
                    <div style={{width:40,height:22,borderRadius:11,background:reg.isCoach?C.accent:"rgba(160,104,56,.15)",position:"relative",flexShrink:0,transition:"background .2s"}}>
                      <div style={{position:"absolute",top:3,left:reg.isCoach?20:3,width:16,height:16,borderRadius:"50%",background:"#fff",transition:"left .2s"}}/>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:10}}>
                    <button onClick={()=>setRegStep(1)} style={{...btnStyle(true),flex:1}}>← Retour</button>
                    <button onClick={()=>{ const e=validateRegStep2(); if(Object.keys(e).length){setRegErrors(e);return}; setRegStep(3) }}
                      style={{...btnStyle(),flex:2}}>Vérifier →</button>
                  </div>
                </div>
              )}

              {regStep===3 && (
                <div style={{display:"flex",flexDirection:"column",gap:14}}>
                  <div style={{padding:"14px",background:"rgba(52,211,153,.06)",borderRadius:12,border:"1px solid rgba(52,211,153,.2)"}}>
                    <div style={{fontSize:13,fontWeight:700,color:"#34D399",marginBottom:10}}>✅ Récapitulatif</div>
                    {[
                      ["Studio",       reg.studioName],
                      ["Sous-domaine", `${reg.slug}.fydelys.fr`],
                      ["Ville",        reg.city],
                      ["Type",         reg.type],
                      ["Plan",         reg.plan],
                      ["Gérant",       `${reg.firstName} ${reg.lastName}`],
                      ["Email",        reg.email],
                      ["Téléphone",    reg.phone],
                      ["Rôle",         reg.isCoach ? "Gérant + Coach" : "Gérant"],
                    ].map(([k,v])=>(
                      <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #EDE6DC",fontSize:13}}>
                        <span style={{color:"#8C7B6C"}}>{k}</span>
                        <span style={{color:"#fff",fontWeight:600}}>{v}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{padding:"10px 14px",background:"rgba(251,191,36,.07)",borderRadius:9,border:"1px solid rgba(251,191,36,.2)",fontSize:12,color:"#FCD34D",lineHeight:1.6}}>
                    🌱 Disciplines, abonnements et une séance de démo seront créés automatiquement.
                  </div>
                  {error&&<div style={{background:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.3)",borderRadius:9,padding:"9px 13px",fontSize:13,color:"#F87171"}}>⚠ {error}</div>}
                  <div style={{display:"flex",gap:10}}>
                    <button onClick={()=>setRegStep(2)} style={{...btnStyle(true),flex:1}}>← Retour</button>
                    <button onClick={handleRegister} disabled={loading}
                      style={{...btnStyle(),flex:2,opacity:loading?0.6:1}}>
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
              <h2 style={{fontSize:18,fontWeight:800,color:"#fff",marginBottom:8}}>Vérifiez vos emails !</h2>
              <p style={{fontSize:13,color:"#8C7B6C",marginBottom:4}}>Lien de confirmation envoyé à</p>
              <p style={{fontWeight:700,color:C.accent,background:"#F5EBE0",borderRadius:8,padding:"6px 14px",display:"inline-block",marginBottom:16}}>{reg.email}</p>
              <p style={{fontSize:12,color:"#B0A090",lineHeight:1.7}}>
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