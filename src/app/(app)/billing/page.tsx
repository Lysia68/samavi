"use client"
export const dynamic = "force-dynamic"
import { useState, useEffect, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase"
import { useRouter, useSearchParams } from "next/navigation"
import { loadStripe, type Stripe, type StripeElements } from "@stripe/stripe-js"

const C = {
  bg:"#F4EFE8", surface:"#FFFFFF", border:"#DDD5C8", borderSoft:"#EAE4DA",
  text:"#2A1F14", textMid:"#5C4A38", textSoft:"#8C7B6C", textMuted:"#B0A090",
  accent:"#A06838", accentDark:"#8C5E38", accentBg:"#F5EBE0",
  ok:"#4E8A58", okBg:"#E6F2E8", warn:"#A85030", warnBg:"#F5EAE6",
  gold:"#C4922A", goldBg:"#FDF4E3",
}

const stripeAppearance = {
  theme: "stripe" as const,
  variables: {
    colorPrimary: "#A06838", colorBackground: "#FDFAF7",
    colorText: "#2A1F14", colorDanger: "#A85030",
    fontFamily: "'Inter', -apple-system, sans-serif",
    borderRadius: "9px",
  },
  rules: {
    ".Input": { border: "1.5px solid #DDD5C8", boxShadow: "none" },
    ".Input:focus": { border: "1.5px solid #A06838", boxShadow: "0 0 0 3px rgba(160,104,56,.07)" },
    ".Label": { color: "#8C7B6C", fontWeight: "600", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.8px" },
  },
}

const PLANS = [
  { slug:"essentiel", name:"Essentiel", price:9,  desc:"Pour débuter",           smsCredits:0,   features:["50 adhérents","2 coachs","Planning","Paiements","SMS à l'achat"],                             color:C.accent, bg:C.accentBg },
  { slug:"standard",  name:"Standard",  price:29, desc:"Pour les studios actifs", smsCredits:50,  features:["200 adhérents","5 coachs","Planning","Paiements","Statistiques","50 SMS/mois inclus"],       color:C.gold,   bg:C.goldBg, popular:true },
  { slug:"pro",       name:"Pro",       price:69, desc:"Pour les grands studios",  smsCredits:100, features:["Illimité","Coachs illimités","Tout Standard +","Support prioritaire","100 SMS/mois inclus"], color:C.ok,     bg:C.okBg },
]

const SMS_PACKS = [
  { id:"sms_100",  label:"100 SMS",  credits:100,  price:8,  pricePerSms:"0.08€" },
  { id:"sms_500",  label:"500 SMS",  credits:500,  price:35, pricePerSms:"0.07€" },
  { id:"sms_1000", label:"1000 SMS", credits:1000, price:60, pricePerSms:"0.06€" },
]

type Studio = {
  id:string; name:string; billing_status:string
  trial_ends_at:string|null; plan_slug:string
  stripe_customer_id:string|null; stripe_subscription_id:string|null
  sms_credits_balance:number|null; sms_credits_included:number|null
  sms_credits_reset_at:string|null
}

// ── Modal paiement avec Stripe.js vanilla ─────────────────────────────────────
function PaymentModal({ plan, clientSecret, intentType, trialDaysLeft, studioId, onSuccess, onClose }: {
  plan: typeof PLANS[0]; clientSecret: string; intentType: "payment"|"setup"
  trialDaysLeft: number; studioId: string; onSuccess:()=>void; onClose:()=>void
}) {
  const mountRef   = useRef<HTMLDivElement>(null)
  const stripeRef  = useRef<Stripe|null>(null)
  const elementsRef = useRef<StripeElements|null>(null)
  const [ready,   setReady]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string|null>(null)

  useEffect(() => {
    async function init() {
      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
      if (!stripe || !mountRef.current) return
      stripeRef.current = stripe

      const elements = stripe.elements({
        clientSecret,
        appearance: stripeAppearance,
        locale: "fr",
      })
      elementsRef.current = elements

      const paymentElement = elements.create("payment", { layout: "tabs" })
      paymentElement.mount(mountRef.current)
      paymentElement.on("ready", () => setReady(true))
    }
    init()
    return () => { elementsRef.current?.getElement("payment")?.destroy() }
  }, [clientSecret])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const stripe   = stripeRef.current
    const elements = elementsRef.current
    if (!stripe || !elements) return
    setLoading(true); setError(null)

    const { error: submitErr } = await elements.submit()
    if (submitErr) { setError(submitErr.message||"Erreur"); setLoading(false); return }

    const returnUrl = `${window.location.origin}/billing?success=1`
    const result = intentType === "setup"
      ? await stripe.confirmSetup({ elements, clientSecret, confirmParams:{return_url:returnUrl}, redirect:"if_required" })
      : await stripe.confirmPayment({ elements, clientSecret, confirmParams:{return_url:returnUrl}, redirect:"if_required" })

    if (result.error) { setError(result.error.message||"Paiement refusé"); setLoading(false) }
    else onSuccess()
  }

  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()}
      style={{position:"fixed",inset:0,background:"rgba(42,31,20,.5)",zIndex:900,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:20,padding:32,width:"100%",maxWidth:480,boxShadow:"0 32px 64px rgba(42,31,20,.15)",maxHeight:"90vh",overflowY:"auto"}}>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <div>
            <div style={{fontSize:20,fontWeight:800,color:C.text,letterSpacing:-0.5}}>Finaliser l'abonnement</div>
            <div style={{fontSize:12,color:C.textSoft,marginTop:2}}>Formule {plan.name} · {plan.price}€/mois</div>
          </div>
          <button onClick={onClose} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,width:32,height:32,cursor:"pointer",color:C.textSoft,fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>

        {/* Résumé */}
        <div style={{padding:"14px 16px",background:C.accentBg,borderRadius:10,border:"1px solid rgba(160,104,56,.2)",marginBottom:20,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:C.text}}>Formule {plan.name}</div>
            <div style={{fontSize:12,color:C.textSoft,marginTop:2}}>
              {intentType==="setup"&&trialDaysLeft>0
                ? `Carte enregistrée — débit dans ${trialDaysLeft} jour${trialDaysLeft>1?"s":""}`
                : "Abonnement mensuel · Sans engagement"}
            </div>
          </div>
          <div style={{fontSize:20,fontWeight:800,color:C.accent}}>
            {intentType==="setup"&&trialDaysLeft>0?"0€":`${plan.price}€`}
            <span style={{fontSize:12,color:C.textSoft}}>/mois</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Stripe Payment Element monté ici */}
          <div ref={mountRef} style={{minHeight:140}}/>
          {!ready && <div style={{textAlign:"center",fontSize:13,color:C.textSoft,padding:"20px 0"}}>Chargement du formulaire…</div>}

          {error && (
            <div style={{marginTop:12,padding:"10px 14px",background:C.warnBg,borderRadius:8,fontSize:13,color:C.warn,border:"1px solid #F5C2B5"}}>
              ⚠️ {error}
            </div>
          )}

          <div style={{display:"flex",gap:10,marginTop:20}}>
            <button type="button" onClick={onClose}
              style={{flex:1,padding:"11px",background:"transparent",border:`1.5px solid ${C.border}`,borderRadius:9,color:C.textSoft,fontSize:14,fontWeight:600,cursor:"pointer"}}>
              Annuler
            </button>
            <button type="submit" disabled={!ready||loading}
              style={{flex:2,padding:"11px",background:"linear-gradient(145deg,#B88050,#9A6030)",border:"none",borderRadius:9,color:"#fff",fontSize:14,fontWeight:700,cursor:(!ready||loading)?"wait":"pointer",opacity:(!ready||loading)?0.7:1}}>
              {loading?"Traitement…":intentType==="setup"&&trialDaysLeft>0?"Enregistrer ma carte":`Payer ${plan.price}€/mois`}
            </button>
          </div>
          <div style={{marginTop:12,textAlign:"center",fontSize:11,color:C.textMuted}}>
            🔒 Paiement sécurisé par Stripe · Annulable à tout moment
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function BillingPage() {
  const supabase = createClient()
  const router   = useRouter()
  const params   = useSearchParams()
  const [studio, setStudio]   = useState<Studio|null>(null)
  const [loading, setLoading] = useState(true)
  const [busy,    setBusy]    = useState<string|null>(null)
  const [toast,   setToast]   = useState<{msg:string;ok:boolean}|null>(null)
  const [modal,   setModal]   = useState<{plan:typeof PLANS[0];clientSecret:string;intentType:"payment"|"setup"}|null>(null)

  const showToast = useCallback((msg:string,ok=true)=>{setToast({msg,ok});setTimeout(()=>setToast(null),4000)},[])

  useEffect(()=>{
    if(params.get("success")==="1") showToast("🎉 Abonnement activé !")
    if(params.get("canceled")==="1") showToast("Paiement annulé.",false)
  },[params,showToast])

  useEffect(()=>{
    async function load(){
      const {data:{user}}=await supabase.auth.getUser()
      if(!user){router.push("/");return}
      const {data:profile}=await supabase.from("profiles").select("studio_id,role").eq("id",user.id).single()
      if(!profile||profile.role!=="admin"){router.push("/dashboard");return}
      const {data:st}=await supabase.from("studios")
        .select("id,name,billing_status,trial_ends_at,plan_slug,stripe_customer_id,stripe_subscription_id,sms_credits_balance,sms_credits_included,sms_credits_reset_at")
        .eq("id",profile.studio_id).single()
      setStudio(st);setLoading(false)
    }
    load()
  },[])

  const trialDaysLeft = studio?.trial_ends_at
    ? Math.max(0,Math.ceil((new Date(studio.trial_ends_at).getTime()-Date.now())/86400000)) : 0
  const isTrialing = studio?.billing_status==="trialing"
  const isActive   = studio?.billing_status==="active"
  const isPastDue  = studio?.billing_status==="past_due"
  const isBlocked  = ["canceled","suspended"].includes(studio?.billing_status||"")

  async function openCheckout(plan: typeof PLANS[0]) {
    if(!studio) return
    setBusy(plan.slug)
    try {
      const res  = await fetch("/api/stripe/subscribe",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({planSlug:plan.slug,studioId:studio.id})})
      const data = await res.json()
      if(data.clientSecret) setModal({plan,clientSecret:data.clientSecret,intentType:data.type})
      else showToast(data.error||"Erreur d'initialisation",false)
    } catch { showToast("Erreur réseau",false) }
    setBusy(null)
  }

  async function openPortal() {
    if(!studio) return
    setBusy("portal")
    try {
      const res  = await fetch("/api/stripe/portal",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({studioId:studio.id})})
      const data = await res.json()
      if(data.url) window.location.href=data.url
      else showToast(data.error||"Erreur",false)
    } catch { showToast("Erreur réseau",false) }
    setBusy(null)
  }

  function handlePaymentSuccess() {
    setModal(null)
    setTimeout(async()=>{
      if(!studio) return
      const {data}=await supabase.from("studios").select("billing_status,plan_slug").eq("id",studio.id).single()
      if(data) setStudio(s=>s?{...s,...data}:s)
      showToast("🎉 Abonnement activé !")
    },2000)
  }

  if(loading) return <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{fontSize:14,color:C.textSoft}}>Chargement…</div></div>

  return (
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'Inter',-apple-system,sans-serif"}}>
      {toast&&<div style={{position:"fixed",top:20,right:20,zIndex:999,padding:"12px 20px",background:toast.ok?C.ok:C.warn,borderRadius:10,color:"#fff",fontSize:14,fontWeight:600,boxShadow:"0 8px 24px rgba(0,0,0,.15)"}}>{toast.msg}</div>}
      {modal&&studio&&<PaymentModal plan={modal.plan} clientSecret={modal.clientSecret} intentType={modal.intentType} trialDaysLeft={trialDaysLeft} studioId={studio.id} onSuccess={handlePaymentSuccess} onClose={()=>setModal(null)}/>}

      <div style={{maxWidth:860,margin:"0 auto",padding:"40px 24px"}}>
        <div style={{marginBottom:32}}>
          <h1 style={{fontSize:26,fontWeight:800,color:C.text,margin:0,letterSpacing:-0.5}}>Abonnement</h1>
          <p style={{fontSize:14,color:C.textSoft,margin:"6px 0 0"}}>Gérez votre formule Fydelys</p>
        </div>

        {isTrialing&&(
          <div style={{padding:"16px 20px",background:trialDaysLeft<=3?C.warnBg:C.goldBg,border:`1px solid ${trialDaysLeft<=3?"#F5C2B5":"rgba(196,146,42,.25)"}`,borderRadius:14,marginBottom:28,display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
            <span style={{fontSize:28}}>⏳</span>
            <div style={{flex:1}}>
              <div style={{fontSize:15,fontWeight:700,color:trialDaysLeft<=3?C.warn:C.gold}}>
                {trialDaysLeft>0?`${trialDaysLeft} jour${trialDaysLeft>1?"s":""} d'essai restant${trialDaysLeft>1?"s":""}` : "Période d'essai expirée"}
              </div>
              <div style={{fontSize:13,color:C.textMid,marginTop:2}}>
                {trialDaysLeft>0?"Votre carte ne sera débitée qu'à la fin de l'essai.":"Choisissez une formule pour réactiver votre studio."}
              </div>
            </div>
          </div>
        )}

        {isActive&&(
          <div style={{padding:"14px 20px",background:C.okBg,border:"1px solid rgba(78,138,88,.2)",borderRadius:14,marginBottom:28,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:20}}>✅</span>
              <div>
                <div style={{fontSize:14,fontWeight:700,color:C.ok}}>Actif — Formule {PLANS.find(p=>p.slug===studio?.plan_slug)?.name}</div>
                <div style={{fontSize:12,color:C.textSoft,marginTop:1}}>Renouvellement mensuel automatique</div>
              </div>
            </div>
            <button onClick={openPortal} disabled={busy==="portal"} style={{padding:"8px 16px",background:"transparent",border:`1.5px solid ${C.ok}`,borderRadius:8,color:C.ok,fontSize:13,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>
              {busy==="portal"?"…":"Gérer / Annuler"}
            </button>
          </div>
        )}

        {(isPastDue||isBlocked)&&(
          <div style={{padding:"16px 20px",background:C.warnBg,border:"1px solid #F5C2B5",borderRadius:14,marginBottom:28}}>
            <div style={{fontSize:15,fontWeight:700,color:C.warn,marginBottom:4}}>{isPastDue?"⚠️ Paiement en échec":"🚫 Accès suspendu"}</div>
            <div style={{fontSize:13,color:C.textMid}}>{isPastDue?"Mettez à jour votre carte pour réactiver.":"Souscrivez pour réactiver votre studio."}</div>
            {isPastDue&&studio?.stripe_customer_id&&<button onClick={openPortal} style={{marginTop:12,padding:"8px 18px",background:C.warn,border:"none",borderRadius:8,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>Mettre à jour</button>}
          </div>
        )}

        <h2 style={{fontSize:17,fontWeight:700,color:C.text,marginBottom:16}}>{isActive?"Changer de formule":"Choisir une formule"}</h2>

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:16,marginBottom:40}}>
          {PLANS.map(plan=>{
            const isCurrent=studio?.plan_slug===plan.slug&&isActive
            const isBusy=busy===plan.slug
            return(
              <div key={plan.slug} style={{background:C.surface,border:`${isCurrent?"2.5px":"1.5px"} solid ${isCurrent?plan.color:C.border}`,borderRadius:16,padding:"24px 20px",position:"relative",boxShadow:isCurrent?`0 4px 20px ${plan.color}22`:"none"}}>
                {(plan as any).popular&&!isCurrent&&<div style={{position:"absolute",top:-11,left:"50%",transform:"translateX(-50%)",background:plan.color,color:"#fff",fontSize:11,fontWeight:700,padding:"3px 12px",borderRadius:12,whiteSpace:"nowrap"}}>⭐ Populaire</div>}
                {isCurrent&&<div style={{position:"absolute",top:-11,left:"50%",transform:"translateX(-50%)",background:plan.color,color:"#fff",fontSize:11,fontWeight:700,padding:"3px 12px",borderRadius:12,whiteSpace:"nowrap"}}>✓ Actuel</div>}
                <div style={{fontSize:13,fontWeight:700,color:plan.color,marginBottom:4}}>{plan.name}</div>
                <div style={{fontSize:28,fontWeight:800,color:C.text,letterSpacing:-1,lineHeight:1}}>{plan.price}€<span style={{fontSize:13,fontWeight:500,color:C.textSoft}}>/mois</span></div>
                <div style={{fontSize:12,color:C.textSoft,marginTop:4,marginBottom:16}}>{plan.desc}</div>
                <ul style={{listStyle:"none",padding:0,margin:"0 0 20px",display:"flex",flexDirection:"column",gap:6}}>
                  {plan.features.map(f=><li key={f} style={{fontSize:12,color:C.textMid,display:"flex",gap:6}}><span style={{color:plan.color,flexShrink:0}}>✓</span>{f}</li>)}
                </ul>
                <button onClick={()=>!isCurrent&&openCheckout(plan)} disabled={isCurrent||!!isBusy}
                  style={{width:"100%",padding:"11px",borderRadius:9,fontSize:13,fontWeight:700,cursor:isCurrent?"default":isBusy?"wait":"pointer",background:isCurrent?plan.bg:`linear-gradient(145deg,${plan.color}ee,${plan.color}99)`,color:isCurrent?plan.color:"#fff",border:isCurrent?`1.5px solid ${plan.color}44`:"none",opacity:isBusy?0.7:1}}>
                  {isBusy?"Chargement…":isCurrent?"✓ Actif":isActive?"Changer":isTrialing&&trialDaysLeft>0?"Enregistrer ma carte":"Souscrire"}
                </button>
              </div>
            )
          })}
        </div>

        {/* ── Section SMS ────────────────────────────────────────── */}
        {studio?.sms_credits_included !== null && (
          <div style={{marginBottom:24}}>
            <h2 style={{fontSize:17,fontWeight:700,color:C.text,marginBottom:4}}>📱 Crédits SMS</h2>
            <div style={{fontSize:13,color:C.textSoft,marginBottom:16}}>
              Votre plan inclut <strong>{studio?.sms_credits_included || 0} SMS/mois</strong>.
              Les crédits non utilisés se <strong>cumulent</strong> d'un mois à l'autre (rollover).
              Rechargez à tout moment si besoin.
            </div>

            {/* Solde actuel */}
            <div style={{padding:"14px 18px",background:C.accentBg,borderRadius:12,border:`1px solid ${C.border}`,marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div>
                <div style={{fontSize:13,color:C.textSoft}}>Solde actuel</div>
                <div style={{fontSize:28,fontWeight:800,color:C.accent,lineHeight:1}}>{studio?.sms_credits_balance ?? 0}</div>
                <div style={{fontSize:11,color:C.textMuted,marginTop:2}}>crédits disponibles</div>
              </div>
              {studio?.sms_credits_reset_at && (
                <div style={{fontSize:11,color:C.textSoft,textAlign:"right"}}>
                  <div>Remise à zéro le</div>
                  <div style={{fontWeight:700,color:C.text}}>{new Date(studio.sms_credits_reset_at).toLocaleDateString("fr-FR",{day:"numeric",month:"long"})}</div>
                </div>
              )}
            </div>

            {/* Packs d'achat */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
              {SMS_PACKS.map(pack => {
                const isBusy = busy === pack.id
                return (
                  <div key={pack.id} style={{background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"16px",textAlign:"center"}}>
                    <div style={{fontSize:13,fontWeight:700,color:C.textMid,marginBottom:4}}>{pack.label}</div>
                    <div style={{fontSize:24,fontWeight:800,color:C.text,lineHeight:1}}>{pack.price}€</div>
                    <div style={{fontSize:11,color:C.textMuted,marginBottom:12}}>{pack.pricePerSms}/SMS</div>
                    <button
                      onClick={async()=>{
                        if(!studio) return
                        setBusy(pack.id)
                        try {
                          const res = await fetch("/api/stripe/sms-credits",{
                            method:"POST",
                            headers:{"Content-Type":"application/json"},
                            body:JSON.stringify({studioId:studio.id,packId:pack.id})
                          })
                          const data = await res.json()
                          if(data.clientSecret) setModal({plan:{...PLANS[0],name:pack.label,price:pack.price,color:C.accent,bg:C.accentBg,desc:"",features:[],smsCredits:0},clientSecret:data.clientSecret,intentType:"payment"})
                          else showToast(data.error||"Erreur",false)
                        } catch { showToast("Erreur réseau",false) }
                        setBusy(null)
                      }}
                      disabled={!!isBusy}
                      style={{width:"100%",padding:"8px",background:C.accent,border:"none",borderRadius:8,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",opacity:isBusy?0.6:1}}>
                      {isBusy?"Chargement…":"Acheter"}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div style={{padding:"16px 20px",background:C.surface,border:`1px solid ${C.borderSoft}`,borderRadius:12,fontSize:12,color:C.textSoft,lineHeight:1.7}}>
          <div style={{fontWeight:700,color:C.textMid,marginBottom:4}}>ℹ️ Informations de facturation</div>
          Paiement sécurisé par Stripe. Annulable à tout moment. Les 15 premiers jours sont offerts — votre carte ne sera débitée qu'à l'issue de la période d'essai.
        </div>
      </div>
    </div>
  )
}
