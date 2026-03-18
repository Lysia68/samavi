"use client"
import { useEffect, useRef, useState } from "react"

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
          <stop offset="0%" stopColor="#F7D060"/><stop offset="55%" stopColor="#E8A830"/><stop offset="100%" stopColor="#C47820"/>
        </linearGradient>
        <linearGradient id="gs" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#F0BC3A"/><stop offset="100%" stopColor="#D4902A"/>
        </linearGradient>
      </defs>
    </svg>
  )
}

// ── Icônes SVG premium (monochromes, style line) ──────────────────────────────
const IcoCalendar = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <rect x="2" y="5" width="24" height="21" rx="3" stroke="#A06838" strokeWidth="1.8"/>
    <path d="M2 11h24" stroke="#A06838" strokeWidth="1.8"/>
    <path d="M9 2v6M19 2v6" stroke="#A06838" strokeWidth="1.8" strokeLinecap="round"/>
    <rect x="7" y="15" width="4" height="3" rx="1" fill="#A06838"/>
    <rect x="12" y="15" width="4" height="3" rx="1" fill="#C4922A"/>
    <rect x="17" y="15" width="4" height="3" rx="1" fill="#A06838"/>
    <rect x="7" y="20" width="4" height="3" rx="1" fill="#C4922A"/>
    <rect x="12" y="20" width="4" height="3" rx="1" fill="#A06838"/>
  </svg>
)
const IcoMembers = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <circle cx="10" cy="9" r="4" stroke="#A06838" strokeWidth="1.8"/>
    <path d="M2 24c0-4 3.6-7 8-7" stroke="#A06838" strokeWidth="1.8" strokeLinecap="round"/>
    <circle cx="20" cy="9" r="4" stroke="#C4922A" strokeWidth="1.8"/>
    <path d="M26 24c0-4-3.6-7-8-7" stroke="#C4922A" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M14 18c4 0 7 2.7 7 6H7c0-3.3 3-6 7-6z" fill="#A06838" fillOpacity=".15" stroke="#A06838" strokeWidth="1.8"/>
  </svg>
)
const IcoPayment = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <rect x="2" y="6" width="24" height="16" rx="3" stroke="#A06838" strokeWidth="1.8"/>
    <path d="M2 11h24" stroke="#A06838" strokeWidth="1.8"/>
    <rect x="5" y="15" width="6" height="3" rx="1.5" fill="#C4922A"/>
    <rect x="13" y="15" width="3" height="3" rx="1.5" fill="#A06838" fillOpacity=".5"/>
    <rect x="18" y="15" width="3" height="3" rx="1.5" fill="#A06838" fillOpacity=".5"/>
  </svg>
)
const IcoDomain = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <circle cx="14" cy="14" r="11" stroke="#A06838" strokeWidth="1.8"/>
    <path d="M14 3c-3 3-5 6.2-5 11s2 8 5 11M14 3c3 3 5 6.2 5 11s-2 8-5 11" stroke="#A06838" strokeWidth="1.8"/>
    <path d="M3 14h22" stroke="#A06838" strokeWidth="1.8"/>
    <path d="M5 9h18M5 19h18" stroke="#A06838" strokeWidth="1.2" strokeDasharray="2 2"/>
  </svg>
)
const IcoChart = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <path d="M3 22h22" stroke="#A06838" strokeWidth="1.8" strokeLinecap="round"/>
    <rect x="5" y="14" width="5" height="8" rx="1.5" fill="#C4922A" fillOpacity=".7"/>
    <rect x="12" y="9" width="5" height="13" rx="1.5" fill="#A06838"/>
    <rect x="19" y="5" width="4" height="17" rx="1.5" fill="#C4922A"/>
    <path d="M6 12l6-5 6 3 6-6" stroke="#A06838" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const IcoInvite = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <circle cx="11" cy="10" r="4" stroke="#A06838" strokeWidth="1.8"/>
    <path d="M3 24c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="#A06838" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M21 8v8M17 12h8" stroke="#C4922A" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

const FEATURES = [
  { Icon: IcoCalendar, title: "Planning intelligent",  desc: "Créez vos séances, gérez créneaux et récurrences. Vos coachs et adhérents voient leur planning mis à jour en temps réel." },
  { Icon: IcoMembers,  title: "Gestion des membres",   desc: "Fiches adhérents complètes, crédits, abonnements et historique de présence — tout pour un suivi vraiment personnalisé." },
  { Icon: IcoPayment,  title: "Paiements intégrés",    desc: "Encaissez abonnements et séances sans friction. Stripe sécurise chaque transaction, vous gardez le contrôle." },
  { Icon: IcoDomain,   title: "Votre espace dédié",    desc: "Un sous-domaine à votre image — nom.fydelys.fr. Vos coachs et membres s'y connectent directement, sans app à installer." },
  { Icon: IcoChart,    title: "Tableaux de bord",      desc: "Chiffre d'affaires, taux de remplissage, tendances. Pilotez votre studio avec des données claires et actionnables." },
  { Icon: IcoInvite,   title: "Invitations & rôles",   desc: "Invitez vos coachs par email, définissez leurs disciplines. Vos adhérents s'inscrivent librement depuis votre URL." },
]

const DISCIPLINES = [
  { img: "https://images.unsplash.com/photo-1588286840104-8957b019727f?w=600&q=75&auto=format&fit=crop", name: "Yoga",          desc: "Hatha, Vinyasa, Yin, Ashtanga…",   tag: "Le plus populaire" },
  { img: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=75&auto=format&fit=crop", name: "Pilates",       desc: "Mat, réformateur, barre au sol…",  tag: "" },
  { img: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&q=75&auto=format&fit=crop", name: "Méditation",    desc: "Pleine conscience, sophrologie…",  tag: "" },
  { img: "https://images.unsplash.com/photo-1547153760-18fc86324498?w=600&q=75&auto=format&fit=crop",    name: "Danse",         desc: "Contemporary, jazz, barre…",       tag: "" },
  { img: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=75&auto=format&fit=crop", name: "Fitness",      desc: "HIIT, circuit training, cardio…",  tag: "" },
  { img: "https://images.unsplash.com/photo-1552196563-55cd4e45efb3?w=600&q=75&auto=format&fit=crop",    name: "Stretching",   desc: "Souplesse, récupération, barre…",  tag: "" },
]

// Feature : { label, included: true|false }
const PLANS = [
  {
    name: "Essentiel", price: "9", desc: "Pour démarrer", popular: false,
    features: [
      { label: "1 discipline",               included: true },
      { label: "1 coach",                     included: true },
      { label: "50 adhérents",                included: true },
      { label: "Planning + présences",         included: true },
      { label: "Espace adhérent (magic link)", included: true },
      { label: "Séances récurrentes",          included: true },
      { label: "Paiements adhérents (Stripe)", included: false },
      { label: "Invitation d'équipe",          included: false },
      { label: "Rappel cours 1h avant",        included: false },
      { label: "Support prioritaire",          included: false },
    ],
  },
  {
    name: "Standard", price: "29", desc: "Pour les studios actifs", popular: true,
    features: [
      { label: "3 disciplines",               included: true },
      { label: "3 coachs",                    included: true },
      { label: "100 adhérents",               included: true },
      { label: "Planning + présences",         included: true },
      { label: "Espace adhérent (magic link)", included: true },
      { label: "Séances récurrentes",          included: true },
      { label: "Paiements adhérents (Stripe)", included: true },
      { label: "Invitation d'équipe",          included: true },
      { label: "Rappel cours 1h avant",        included: true },
      { label: "Support prioritaire",          included: false },
    ],
  },
  {
    name: "Pro", price: "69", desc: "Pour les grands studios", popular: false,
    features: [
      { label: "Disciplines illimitées",       included: true },
      { label: "Coachs illimités",             included: true },
      { label: "Adhérents illimités",           included: true },
      { label: "Planning + présences",          included: true },
      { label: "Espace adhérent (magic link)",  included: true },
      { label: "Séances récurrentes",           included: true },
      { label: "Paiements adhérents (Stripe)",  included: true },
      { label: "Invitation d'équipe",           included: true },
      { label: "Rappel cours 1h avant",         included: true },
      { label: "Support prioritaire",           included: true },
    ],
  },
]

function useVisible(ref: React.RefObject<HTMLElement | null>, threshold = 0.2) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (!ref.current) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold })
    obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return visible
}

// ── Page vitrine studio (sous-domaine) ────────────────────────────────────
function StudioPage({ slug }: { slug: string }) {
  const [studio, setStudio] = useState<any>(null)
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/studio-public?slug=${slug}`)
      .then(r => r.json())
      .then(d => {
        if (d.redirect_login) { window.location.replace("/login"); return; }
        if (d.studio) { setStudio(d.studio); setSessions(d.sessions || []) }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [slug])

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#F4EFE8", fontFamily:"'Helvetica Neue',Arial,sans-serif" }}>
      <div style={{ fontSize:14, color:"#8C7B6C" }}>Chargement…</div>
    </div>
  )

  if (!studio) return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"#F4EFE8", fontFamily:"'Helvetica Neue',Arial,sans-serif", gap:12 }}>
      <div style={{ fontSize:40 }}>🔍</div>
      <div style={{ fontSize:18, fontWeight:700, color:"#2A1F14" }}>Studio introuvable</div>
      <div style={{ fontSize:14, color:"#8C7B6C" }}>Ce lien ne correspond à aucun studio actif.</div>
    </div>
  )

  const accent = studio.accent_color || "#B07848"
  const accentBg = accent + "18"
  const today = new Date().toISOString().slice(0, 10)
  const upcomingSessions = sessions.filter((s: any) => s.session_date >= today).slice(0, 8)

  return (
    <div style={{ minHeight:"100vh", background:"#F4EFE8", fontFamily:"'Helvetica Neue',Arial,sans-serif", color:"#2A1F14" }}>
      {/* Header */}
      <div style={{ background: studio.cover_photo_url ? "none" : "#2A1F14", position:"relative", overflow:"hidden" }}>
        {studio.cover_photo_url && (
          <img src={studio.cover_photo_url} alt={studio.name}
            style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", filter:"brightness(.45)" }}/>
        )}
        <div style={{ position:"relative", padding:"40px 24px 36px", maxWidth:720, margin:"0 auto", textAlign:"center" }}>
          <div style={{ fontSize:32, fontWeight:800, color:"#fff", letterSpacing:-0.5, marginBottom:8 }}>{studio.name}</div>
          {studio.city && <div style={{ fontSize:14, color:"rgba(255,255,255,.65)", marginBottom:16 }}>📍 {studio.city}</div>}
          {studio.description && (
            <div style={{ fontSize:15, color:"rgba(255,255,255,.8)", lineHeight:1.7, maxWidth:500, margin:"0 auto 24px" }}>
              {studio.description}
            </div>
          )}
          <a href="/login" style={{ display:"inline-block", padding:"12px 32px", borderRadius:12, background:accent, color:"#fff", fontSize:15, fontWeight:700, textDecoration:"none", boxShadow:"0 4px 20px rgba(0,0,0,.2)" }}>
            Je réserve →
          </a>
        </div>
      </div>

      {/* Prochaines séances */}
      <div style={{ maxWidth:720, margin:"0 auto", padding:"32px 24px" }}>
        {upcomingSessions.length > 0 && (
          <>
            <div style={{ fontSize:18, fontWeight:800, color:"#2A1F14", marginBottom:16 }}>📅 Prochaines séances</div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {upcomingSessions.map((s: any) => {
                const dateStr = new Date(s.session_date).toLocaleDateString("fr-FR", { weekday:"long", day:"numeric", month:"long" })
                return (
                  <div key={s.id} style={{ background:"#fff", borderRadius:12, padding:"14px 18px", border:"1px solid #DDD5C8", display:"flex", alignItems:"center", gap:14, boxShadow:"0 2px 8px rgba(42,31,20,.06)" }}>
                    <div style={{ width:48, height:48, borderRadius:10, background:accentBg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>
                      {s.disciplines?.icon || "🧘"}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:15, fontWeight:700 }}>{s.disciplines?.name || "Séance"}</div>
                      <div style={{ fontSize:12, color:"#8C7B6C", marginTop:2, textTransform:"capitalize" }}>
                        {dateStr} · {s.session_time?.slice(0,5)} · {s.duration_min} min
                      </div>
                      {s.teacher && <div style={{ fontSize:12, color:"#8C7B6C" }}>{s.teacher}{s.room ? ` · ${s.room}` : ""}</div>}
                    </div>
                    <div style={{ textAlign:"right", flexShrink:0 }}>
                      <div style={{ fontSize:13, fontWeight:700, color: s.spots - (s.booked||0) <= 0 ? "#D97706" : accent }}>
                        {s.spots - (s.booked||0) <= 0 ? "Complet" : `${s.spots - (s.booked||0)} places`}
                      </div>
                      <a href="/login" style={{ fontSize:12, color:accent, fontWeight:600, textDecoration:"none" }}>Réserver →</a>
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={{ textAlign:"center", marginTop:20 }}>
              <a href="/login" style={{ display:"inline-block", padding:"11px 28px", borderRadius:10, background:accent, color:"#fff", fontSize:14, fontWeight:700, textDecoration:"none" }}>
                Voir tout le planning →
              </a>
            </div>
          </>
        )}

        {/* Infos contact */}
        {(studio.phone || studio.email || studio.website) && (
          <div style={{ marginTop:32, padding:"20px 24px", background:"#fff", borderRadius:12, border:"1px solid #DDD5C8" }}>
            <div style={{ fontSize:15, fontWeight:700, marginBottom:12 }}>📞 Contact</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {studio.phone && <div style={{ fontSize:14, color:"#5C4A38" }}>📱 {studio.phone}</div>}
              {studio.email && <a href={`mailto:${studio.email}`} style={{ fontSize:14, color:accent, textDecoration:"none" }}>✉️ {studio.email}</a>}
              {studio.website && <a href={studio.website} target="_blank" rel="noopener noreferrer" style={{ fontSize:14, color:accent, textDecoration:"none" }}>🌐 {studio.website}</a>}
            </div>
          </div>
        )}

        <div style={{ textAlign:"center", marginTop:32, paddingTop:24, borderTop:"1px solid #DDD5C8" }}>
          <div style={{ fontSize:11, color:"#B0A090" }}>
            Géré avec <a href="https://fydelys.fr" style={{ color:accent, textDecoration:"none", fontWeight:600 }}>Fydelys</a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)
  const [studioSlug, setStudioSlug] = useState<string | null>(null)
  const stepsRef = useRef<HTMLDivElement>(null)
  const stepsVisible = useVisible(stepsRef, 0.2)

  useEffect(() => {
    const h = window.location.hostname
    const m = h.match(/^([a-z0-9-]+)\.fydelys\.fr$/)
    if (m && m[1] !== "www" && m[1] !== "app") {
      setStudioSlug(m[1])
    }
  }, [])

  // Afficher la page vitrine si sous-domaine studio
  if (studioSlug) return <StudioPage slug={studioSlug}/>

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener("scroll", fn)
    return () => window.removeEventListener("scroll", fn)
  }, [])



  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500;600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        :root{
          --bg:#F4EFE8;--bg2:#EDE7DD;--surface:#FDFAF7;
          --border:rgba(160,104,56,.15);--border2:rgba(160,104,56,.1);
          --text:#2A1F14;--mid:#5C4A38;--soft:#8C7B6C;--muted:#B0A090;
          --accent:#A06838;--gold:#C4922A;
          --btn:linear-gradient(145deg,#B88050,#9A6030);
          --D:'Cormorant Garamond',Georgia,serif;
          --B:'DM Sans',system-ui,sans-serif;
        }
        html{scroll-behavior:smooth;}
        body{background:var(--bg);color:var(--text);font-family:var(--B);line-height:1.6;-webkit-font-smoothing:antialiased;}

        /* Nav */
        nav{position:fixed;top:0;left:0;right:0;z-index:100;height:64px;padding:0 40px;display:flex;align-items:center;justify-content:space-between;transition:background .3s,box-shadow .3s;}
        nav.scrolled{background:rgba(244,239,232,.93);backdrop-filter:blur(14px);box-shadow:0 1px 0 var(--border);}
        .nav-logo{display:flex;align-items:center;gap:10px;text-decoration:none;}
        .nav-logo-name{font-family:var(--D);font-size:22px;font-weight:700;color:var(--text);letter-spacing:-.3px;}
        .nav-links{display:flex;align-items:center;gap:6px;}
        .nav-link{padding:8px 14px;border-radius:8px;font-size:14px;font-weight:500;color:var(--mid);text-decoration:none;transition:background .2s,color .2s;}
        .nav-link:hover{background:rgba(160,104,56,.08);color:var(--accent);}
        .nav-cta{padding:9px 20px;background:var(--btn);border-radius:9px;font-size:14px;font-weight:600;color:#fff;text-decoration:none;box-shadow:0 2px 8px rgba(154,96,48,.3);transition:opacity .2s,transform .15s;}
        .nav-cta:hover{opacity:.9;transform:translateY(-1px);}
        .nav-cta-ghost{display:inline-block;padding:9px 20px;border:1.5px solid rgba(160,104,56,.35);border-radius:9px;font-size:14px;font-weight:600;color:var(--accent);text-decoration:none;background:transparent;transition:background .2s,border-color .2s;}
        .nav-cta-ghost:hover{background:rgba(160,104,56,.07);border-color:rgba(160,104,56,.55);}
        @media(max-width:768px){.nav-links .nav-link{display:none;}.nav-cta-ghost{font-size:13px;padding:7px 12px;}.nav-cta{font-size:13px;padding:8px 14px;}}

        /* Hero */
        @keyframes fadeUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-16px)}}
        .h-tag{animation:fadeUp .55s ease both;}
        .h-title{animation:fadeUp .55s .1s ease both;}
        .h-sub{animation:fadeUp .55s .2s ease both;}
        .h-btns{animation:fadeUp .55s .3s ease both;}
        .h-note{animation:fadeUp .55s .4s ease both;}
        .orb{position:absolute;border-radius:50%;pointer-events:none;animation:float ease-in-out infinite;}

        /* Buttons */
        .btn-p{display:inline-block;padding:14px 32px;background:var(--btn);border-radius:11px;font-size:15px;font-weight:600;color:#fff;text-decoration:none;box-shadow:0 4px 16px rgba(154,96,48,.32);transition:opacity .2s,transform .15s,box-shadow .2s;}
        .btn-p:hover{opacity:.92;transform:translateY(-2px);box-shadow:0 8px 24px rgba(154,96,48,.28);}
        .btn-g{display:inline-block;padding:14px 32px;border:1.5px solid var(--border);border-radius:11px;font-size:15px;font-weight:600;color:var(--mid);text-decoration:none;background:rgba(255,255,255,.55);transition:background .2s,color .2s,border-color .2s;}
        .btn-g:hover{background:rgba(255,255,255,.95);color:var(--accent);border-color:rgba(160,104,56,.3);}

        /* Section */
        .sec{padding:96px 24px;}
        .sec-tag{display:inline-block;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:var(--accent);margin-bottom:12px;}
        .sec-h{font-family:var(--D);font-size:clamp(32px,5vw,52px);font-weight:700;line-height:1.08;letter-spacing:-1px;color:var(--text);margin-bottom:14px;}
        .sec-sub{font-size:16px;color:var(--soft);line-height:1.65;}
        .inner{max-width:1100px;margin:0 auto;}

        /* Feature cards */
        .feat-grid{display:grid;grid-template-columns:repeat(3,1fr);margin-top:56px;border:1.5px solid var(--border);border-radius:22px;overflow:hidden;}
        .feat-card{padding:32px 28px;background:var(--surface);border-right:1.5px solid var(--border2);border-bottom:1.5px solid var(--border2);transition:background .25s;}
        .feat-card:hover{background:#FEFCF9;}
        .feat-icon{width:52px;height:52px;border-radius:14px;background:rgba(160,104,56,.07);border:1.5px solid rgba(160,104,56,.12);display:flex;align-items:center;justify-content:center;margin-bottom:18px;transition:transform .25s;}
        .feat-card:hover .feat-icon{transform:scale(1.08) rotate(-3deg);}
        .feat-title{font-size:16px;font-weight:700;color:var(--text);margin-bottom:8px;}
        .feat-desc{font-size:13.5px;color:var(--soft);line-height:1.65;}

        /* Disciplines */
        .disc-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:48px;}
        .disc-card-photo{background:var(--surface);border:1.5px solid var(--border);border-radius:14px;overflow:hidden;transition:transform .25s,box-shadow .25s;}
        .disc-card-photo:hover{transform:translateY(-4px);box-shadow:0 14px 36px rgba(42,31,20,.1);}
        .disc-name{font-size:14px;font-weight:700;color:var(--text);margin-bottom:3px;}
        .disc-desc{font-size:12px;color:var(--soft);}

        /* Screenshot mockup */
        .mockup{background:var(--surface);border:1.5px solid var(--border);border-radius:20px;overflow:hidden;box-shadow:0 24px 60px rgba(42,31,20,.1);}
        .mockup-bar{height:36px;background:var(--bg2);border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 14px;gap:6px;}
        .mockup-dot{width:10px;height:10px;border-radius:50%;}
        .mockup-url{flex:1;margin-left:8px;height:18px;background:var(--bg);border-radius:6px;}
        .mockup-body{padding:20px;}
        .mockup-row{display:flex;gap:10px;margin-bottom:10px;}
        .mockup-stat{flex:1;background:var(--bg2);border-radius:10px;padding:12px;text-align:center;}
        .mockup-stat-n{font-family:var(--D);font-size:22px;font-weight:700;color:var(--accent);}
        .mockup-stat-l{font-size:10px;color:var(--muted);margin-top:2px;}
        .mockup-table{background:var(--bg2);border-radius:10px;overflow:hidden;}
        .mockup-tr{display:flex;align-items:center;gap:10px;padding:9px 12px;border-bottom:1px solid var(--border2);}
        .mockup-av{width:24px;height:24px;border-radius:50%;background:linear-gradient(135deg,#E8C88A,#C4922A);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff;flex-shrink:0;}
        .mockup-name{flex:1;height:9px;border-radius:4px;background:rgba(92,74,56,.2);}
        .mockup-badge{height:16px;width:40px;border-radius:8px;background:rgba(160,104,56,.15);}

        /* Steps */
        .step{display:flex;gap:20px;align-items:flex-start;padding:24px 0;border-bottom:1px solid var(--border2);opacity:0;transform:translateX(-14px);transition:opacity .5s,transform .5s;}
        .step.vis{opacity:1;transform:translateX(0);}
        .step-num{flex-shrink:0;width:40px;height:40px;border-radius:50%;background:var(--btn);display:flex;align-items:center;justify-content:center;font-family:var(--D);font-size:18px;font-weight:700;color:#fff;box-shadow:0 2px 8px rgba(154,96,48,.22);}
        .step h3{font-size:16px;font-weight:700;color:var(--text);margin-bottom:5px;}
        .step p{font-size:13.5px;color:var(--soft);line-height:1.65;}

        /* Pricing */
        .plan{background:var(--surface);border:1.5px solid var(--border);border-radius:20px;padding:28px 24px;position:relative;transition:transform .25s,box-shadow .25s;}
        .plan:hover{transform:translateY(-4px);box-shadow:0 16px 40px rgba(42,31,20,.08);}
        .plan.pop{border-color:var(--gold);box-shadow:0 4px 24px rgba(196,146,42,.15);}
        .plan-badge{position:absolute;top:-11px;left:50%;transform:translateX(-50%);background:var(--gold);color:#fff;font-size:11px;font-weight:700;padding:3px 14px;border-radius:12px;white-space:nowrap;}

        /* CTA band */
        .cta-band{background:linear-gradient(135deg,#2A1F14 0%,#3D2E1E 50%,#2A1F14 100%);border-radius:28px;padding:72px 40px;text-align:center;position:relative;overflow:hidden;margin:0 24px;}
        .cta-band::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 60% 70% at 50% 50%,rgba(196,146,42,.13) 0%,transparent 60%);}

        /* Footer */
        footer{border-top:1px solid var(--border);padding:48px 40px 32px;}
        .footer-top{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:48px;margin-bottom:40px;}
        .footer-h{font-size:12px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:var(--mid);margin-bottom:14px;}
        .footer-links{display:flex;flex-direction:column;gap:8px;}
        .footer-link{font-size:13px;color:var(--muted);text-decoration:none;transition:color .2s;}
        .footer-link:hover{color:var(--accent);}
        .footer-bottom{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;padding-top:24px;border-top:1px solid var(--border);}
        .footer-legal{display:flex;gap:20px;flex-wrap:wrap;}
        .footer-legal a{font-size:12px;color:var(--muted);text-decoration:none;}
        .footer-legal a:hover{color:var(--accent);}

        /* Mobile */
        @media(max-width:768px){
          nav{padding:0 18px;}
          .nav-link{display:none;}
          .nav-cta{display:flex;}
          .nav-link-conn{display:flex!important;font-size:13px;padding:7px 10px;}
          .nav-cta{font-size:13px;padding:8px 14px;}
          .sec{padding:64px 18px;}
          .feat-grid{grid-template-columns:1fr;border-radius:16px;}
          .disc-grid{grid-template-columns:1fr 1fr;}
          .cta-band{margin:0 14px;padding:48px 22px;border-radius:20px;}
          footer{padding:40px 18px 24px;}
          .footer-top{grid-template-columns:1fr 1fr;gap:28px;}
          .footer-bottom{flex-direction:column;align-items:flex-start;}
          .how-grid{grid-template-columns:1fr!important;}
          .plans-grid{grid-template-columns:1fr!important;}
          .mockups-grid{grid-template-columns:1fr!important;}
        }
        @media(max-width:480px){
          .disc-grid{grid-template-columns:1fr;}
        }
      `}</style>

      {/* ── NAV ── */}
      <nav className={scrolled ? "scrolled" : ""}>
        <a href="/" className="nav-logo">
          <FleurDeLys size={32}/>
          <span className="nav-logo-name">Fydelys</span>
        </a>
        <div className="nav-links">
          <a href="#fonctionnalites" className="nav-link">Fonctionnalités</a>
          <a href="#tarifs" className="nav-link">Tarifs</a>
          <a href="/login?force=1" className="nav-cta-ghost">Connexion</a>
          <a href="/login?tab=register" className="nav-cta">Créer mon studio</a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"100px 24px 80px",position:"relative",overflow:"hidden",textAlign:"center"}}>
        <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 70% 50% at 18% 28%,rgba(196,146,42,.13) 0%,transparent 58%), radial-gradient(ellipse 50% 60% at 82% 72%,rgba(160,104,56,.10) 0%,transparent 55%)",pointerEvents:"none"}}/>
        <div className="orb" style={{width:280,height:280,top:"4%",left:"-9%",background:"radial-gradient(circle,rgba(196,146,42,.16) 0%,transparent 70%)",animationDuration:"17s"}}/>
        <div className="orb" style={{width:160,height:160,bottom:"10%",right:"1%",background:"radial-gradient(circle,rgba(160,104,56,.13) 0%,transparent 70%)",animationDuration:"21s",animationDelay:"5s"}}/>
        <div className="orb" style={{width:90,height:90,top:"32%",right:"9%",background:"radial-gradient(circle,rgba(196,146,42,.2) 0%,transparent 70%)",animationDuration:"12s",animationDelay:"2s"}}/>

        <div className="h-tag" style={{display:"inline-flex",alignItems:"center",gap:6,padding:"5px 14px",background:"rgba(196,146,42,.1)",border:"1px solid rgba(196,146,42,.25)",borderRadius:20,fontSize:11,fontWeight:700,color:"#C4922A",letterSpacing:".8px",textTransform:"uppercase",marginBottom:28}}>
          ✦ Plateforme de gestion · Studios & Bien-être
        </div>

        <h1 className="h-title" style={{fontFamily:"var(--D)",fontSize:"clamp(48px,8vw,90px)",fontWeight:700,lineHeight:1.04,letterSpacing:"-2.5px",color:"#2A1F14",maxWidth:820,marginBottom:24}}>
          Gérez votre studio<br/>avec <em style={{fontStyle:"italic",color:"#A06838"}}>sérénité</em>
        </h1>

        <p className="h-sub" style={{fontSize:"clamp(16px,2vw,19px)",color:"#8C7B6C",maxWidth:520,lineHeight:1.7,marginBottom:44}}>
          Planning, membres, paiements — tout ce dont votre studio de yoga, pilates ou bien-être a besoin, dans une plateforme élégante et intuitive.
        </p>

        <div className="h-btns" style={{display:"flex",gap:12,flexWrap:"wrap",justifyContent:"center"}}>
          <a href="/login?tab=register" className="btn-p">Démarrer l'essai gratuit →</a>
          <a href="#fonctionnalites" className="btn-g">Découvrir Fydelys</a>
        </div>

        <p className="h-note" style={{marginTop:22,fontSize:13,color:"#B0A090"}}>
          <strong style={{color:"#C4922A"}}>15 jours offerts</strong> · Sans carte bancaire · Annulable à tout moment
        </p>
      </div>

      {/* ── FEATURES ── */}
      <section id="fonctionnalites" className="sec" style={{background:"var(--bg2)"}}>
        <div className="inner">
          <div className="sec-tag">✦ Fonctionnalités</div>
          <h2 className="sec-h">Tout ce dont vous avez besoin</h2>
          <p className="sec-sub" style={{maxWidth:480}}>Une solution complète conçue pour les gérants de studios de bien-être exigeants.</p>
          <div className="feat-grid">
            {FEATURES.map((f, i) => (
              <div key={i} className="feat-card">
                <div className="feat-icon"><f.Icon/></div>
                <div className="feat-title">{f.title}</div>
                <div className="feat-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SCREENSHOT + DISCIPLINES ── */}
      <section className="sec">
        <div className="inner">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:64,alignItems:"center"}} className="how-grid">
            {/* Mockup */}
            <div>
              <div className="sec-tag">✦ Interface intuitive</div>
              <h2 className="sec-h">Simple pour vous.<br/>Simple pour vos membres.</h2>
              <p className="sec-sub" style={{marginBottom:32}}>Un tableau de bord clair, sans formation. Vos coachs et adhérents prennent en main l'application en quelques minutes.</p>
              {/* Mini-mockup */}
              <div className="mockup">
                <div className="mockup-bar">
                  <div className="mockup-dot" style={{background:"#F87171"}}/>
                  <div className="mockup-dot" style={{background:"#FBBF24"}}/>
                  <div className="mockup-dot" style={{background:"#34D399"}}/>
                  <div className="mockup-url"/>
                  <div style={{fontSize:10,color:"#B0A090",fontFamily:"monospace",marginLeft:8}}>samavi.fydelys.fr</div>
                </div>
                <div className="mockup-body">
                  <div style={{fontSize:13,fontWeight:700,color:"#2A1F14",marginBottom:12}}>📊 Tableau de bord — Studio Samavi</div>
                  <div className="mockup-row">
                    {[["47","Membres actifs"],["12","Séances / sem."],["2 380 €","CA ce mois"]].map(([v,l])=>(
                      <div key={l} className="mockup-stat">
                        <div className="mockup-stat-n">{v}</div>
                        <div className="mockup-stat-l">{l}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{fontSize:11,fontWeight:700,color:"#8C7B6C",marginBottom:8,marginTop:4}}>PROCHAINES SÉANCES</div>
                  <div className="mockup-table">
                    {[["ML","09:00 Yoga Hatha — Salle A"],["JD","11:00 Pilates — Salle B"],["SC","18:30 Méditation — Studio"]].map(([init,label])=>(
                      <div key={label} className="mockup-tr">
                        <div className="mockup-av">{init}</div>
                        <div style={{flex:1,fontSize:11,color:"#5C4A38",fontWeight:500}}>{label}</div>
                        <div className="mockup-badge"/>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Disciplines */}
            <div>
              <div className="sec-tag">✦ Disciplines</div>
              <h2 className="sec-h">Adapté à toutes les pratiques</h2>
              <p className="sec-sub" style={{marginBottom:0}}>Fydelys s'adapte à votre studio, quelle que soit votre discipline.</p>
              <div className="disc-grid">
                {DISCIPLINES.map((d) => (
                  <div key={d.name} className="disc-card-photo">
                    <div style={{position:"relative",overflow:"hidden",borderRadius:"12px 12px 0 0",height:130}}>
                      <img src={d.img} alt={d.name + " studio"} style={{width:"100%",height:"100%",objectFit:"cover",transition:"transform .4s"}}
                        onMouseOver={e=>(e.currentTarget.style.transform="scale(1.05)")}
                        onMouseOut={e=>(e.currentTarget.style.transform="scale(1)")}
                      />
                      {d.tag && <span style={{position:"absolute",top:8,left:8,background:"rgba(196,146,42,.92)",color:"#fff",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:8,letterSpacing:".4px"}}>{d.tag}</span>}
                    </div>
                    <div style={{padding:"12px 14px"}}>
                      <div className="disc-name">{d.name}</div>
                      <div className="disc-desc">{d.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="sec" style={{background:"var(--bg2)"}}>
        <div className="inner how-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:80,alignItems:"center"}}>
          <div>
            <div className="sec-tag">✦ En 3 étapes</div>
            <h2 className="sec-h">Lancez votre studio en 5 minutes</h2>
            <div ref={stepsRef}>
              {[
                {n:"1",title:"Créez votre studio",    desc:"Nom, URL personnalisée (nom.fydelys.fr), type de studio. Prêt en 2 minutes."},
                {n:"2",title:"Invitez vos coachs",    desc:"Un email d'invitation — ils accèdent directement à leur espace et leurs disciplines."},
                {n:"3",title:"Accueillez vos membres", desc:"Partagez votre URL. Inscription, réservation, paiement en totale autonomie."},
              ].map((s, i) => (
                <div key={i} className={"step" + (stepsVisible ? " vis" : "")} style={{transitionDelay: stepsVisible ? i*0.15+"s" : "0s"}}>
                  <div className="step-num">{s.n}</div>
                  <div><h3>{s.title}</h3><p>{s.desc}</p></div>
                </div>
              ))}
            </div>
          </div>
          {/* Testimonial */}
          <div style={{background:"var(--surface)",border:"1.5px solid var(--border)",borderRadius:24,padding:"clamp(24px,4vw,40px)",boxShadow:"0 20px 60px rgba(42,31,20,.06)",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:-20,right:-20,fontFamily:"Georgia,serif",fontSize:120,color:"rgba(160,104,56,.06)",lineHeight:1,pointerEvents:"none",userSelect:"none"}}>"</div>
            <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:20}}>
              <div style={{width:48,height:48,borderRadius:"50%",background:"linear-gradient(135deg,#E8C88A,#C4922A)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:700,color:"#fff",fontFamily:"Georgia,serif",flexShrink:0}}>M</div>
              <div>
                <div style={{fontSize:15,fontWeight:700,color:"#2A1F14"}}>Marie L.</div>
                <div style={{fontSize:12,color:"#8C7B6C"}}>Studio Yoga Lumière · Lyon</div>
                <div style={{color:"#C4922A",fontSize:12,marginTop:2}}>⭐⭐⭐⭐⭐</div>
              </div>
            </div>
            <div style={{fontFamily:"var(--D)",fontSize:"clamp(16px,2.2vw,21px)",fontWeight:600,color:"#2A1F14",fontStyle:"italic",lineHeight:1.6,marginBottom:16}}>
              "Fydelys a transformé la gestion de mon studio. Mes adhérentes adorent pouvoir réserver et payer directement depuis leur téléphone."
            </div>
            <div style={{padding:"12px 16px",background:"var(--bg)",borderRadius:12,fontSize:13,color:"#8C7B6C",lineHeight:1.7,borderLeft:"3px solid var(--accent)"}}>
              Onboarding en 10 minutes, interface claire, support très réactif. Je recommande à tous les gérants de studio.
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="tarifs" className="sec">
        <div className="inner" style={{textAlign:"center"}}>
          <div className="sec-tag">✦ Tarifs</div>
          <h2 className="sec-h">Simple et transparent</h2>
          <p className="sec-sub" style={{margin:"0 auto 56px",maxWidth:440}}>15 jours d'essai offerts sur toutes les formules. Sans engagement.</p>
          <div className="plans-grid" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:20,alignItems:"start"}}>
            {PLANS.map(plan => (
              <div key={plan.name} className={"plan" + (plan.popular ? " pop" : "")}>
                {plan.popular && <div className="plan-badge">⭐ Populaire</div>}
                <div style={{fontSize:12,fontWeight:700,color:"var(--accent)",marginBottom:4}}>{plan.name}</div>
                <div style={{fontFamily:"var(--D)",fontSize:46,fontWeight:700,color:"var(--text)",lineHeight:1}}>{plan.price}€
                  <span style={{fontSize:15,fontWeight:400,color:"var(--soft)",fontFamily:"var(--B)"}}>/mois</span>
                </div>
                <div style={{fontSize:12,color:"var(--soft)",margin:"6px 0 20px"}}>{plan.desc}</div>
                <ul style={{listStyle:"none",display:"flex",flexDirection:"column",gap:7,marginBottom:24,textAlign:"left"}}>
                  {plan.features.map((f: any)=>(
                    <li key={f.label} style={{fontSize:13,color:f.included?"var(--mid)":"var(--muted)",display:"flex",gap:8,alignItems:"center"}}>
                      <span style={{flexShrink:0,fontWeight:700,fontSize:12,color:f.included?"var(--accent)":"var(--muted)"}}>
                        {f.included ? "✓" : "✕"}
                      </span>
                      <span style={{textDecoration:f.included?"none":"none"}}>{f.label}</span>
                    </li>
                  ))}
                </ul>
                <a href="/login?tab=register" style={{display:"block",width:"100%",padding:"11px",borderRadius:10,textAlign:"center",textDecoration:"none",fontSize:14,fontWeight:700,background:plan.popular?"var(--btn)":"transparent",color:plan.popular?"#fff":"var(--accent)",border:`1.5px solid ${"var(--accent)"}`}}>
                  Choisir {plan.name} →
                </a>
              </div>
            ))}
          </div>
          <p style={{marginTop:20,fontSize:13,color:"var(--muted)"}}>15 jours d'essai gratuit inclus · Sans engagement · Résiliable à tout moment</p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{padding:"32px 0 96px"}}>
        <div className="cta-band">
          <h2 style={{fontFamily:"var(--D)",fontSize:"clamp(32px,5vw,52px)",fontWeight:700,color:"#F4EFE8",marginBottom:16,position:"relative",letterSpacing:"-1px",lineHeight:1.08}}>
            Prêt à simplifier<br/>votre <em style={{fontStyle:"italic",color:"#C4922A"}}>quotidien&nbsp;?</em>
          </h2>
          <p style={{fontSize:16,color:"rgba(244,239,232,.6)",marginBottom:36,position:"relative"}}>Rejoignez les gérants qui pilotent leur studio avec Fydelys.</p>
          <a href="/login?tab=register" className="btn-p" style={{fontSize:16,padding:"16px 40px",position:"relative"}}>
            Créer mon studio gratuitement →
          </a>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer>
        <div className="footer-top">
          {/* Brand */}
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
              <FleurDeLys size={28}/>
              <span style={{fontFamily:"var(--D)",fontSize:20,fontWeight:700,color:"var(--mid)"}}>Fydelys</span>
            </div>
            <p style={{fontSize:13,color:"var(--muted)",lineHeight:1.7,maxWidth:260}}>
              La plateforme de gestion dédiée aux studios de bien-être — yoga, pilates, méditation et plus.
            </p>
            <p style={{marginTop:12,fontSize:12,color:"var(--muted)"}}>© 2025 Fydelys · Tous droits réservés</p>
          </div>
          {/* Produit */}
          <div>
            <div className="footer-h">Produit</div>
            <div className="footer-links">
              <a href="#fonctionnalites" className="footer-link">Fonctionnalités</a>
              <a href="#tarifs" className="footer-link">Tarifs</a>
              <a href="/login?tab=register" className="footer-link">Créer un studio</a>
              <a href="/login" className="footer-link">Se connecter</a>
            </div>
          </div>
          {/* Support */}
          <div>
            <div className="footer-h">Support</div>
            <div className="footer-links">
              <a href="mailto:info@lysia.fr" className="footer-link">Contact</a>
              <a href="mailto:support@fydelys.fr" className="footer-link">Assistance</a>
            </div>
          </div>
          {/* Légal */}
          <div>
            <div className="footer-h">Légal</div>
            <div className="footer-links">
              <a href="/mentions-legales" className="footer-link">Mentions légales</a>
              <a href="/confidentialite" className="footer-link">Confidentialité</a>
              <a href="/cgu" className="footer-link">CGU</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <div style={{fontSize:12,color:"var(--muted)"}}>Hébergé par Vercel · Paiements sécurisés par Stripe · Données protégées RGPD</div>
          <div className="footer-legal">
            <a href="/mentions-legales">Mentions légales</a>
            <a href="/confidentialite">Politique de confidentialité</a>
            <a href="/cgu">CGU</a>
          </div>
        </div>
      </footer>
    </>
  )
}