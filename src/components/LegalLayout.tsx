import Link from "next/link"

function FleurDeLys({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <path d="M40 8 C37 14 34 20 34 28 C34 34 36 38 40 42 C44 38 46 34 46 28 C46 20 43 14 40 8Z" fill="url(#lgc)"/>
      <ellipse cx="40" cy="9" rx="5" ry="5" fill="#F7D060"/>
      <path d="M34 30 C28 26 20 24 14 26 C10 28 9 33 12 37 C16 41 24 40 30 36 C34 33 34 30 34 30Z" fill="url(#lgs)"/>
      <ellipse cx="11" cy="30" rx="4" ry="4" fill="#F5C842"/>
      <path d="M46 30 C52 26 60 24 66 26 C70 28 71 33 68 37 C64 41 56 40 50 36 C46 33 46 30 46 30Z" fill="url(#lgs)"/>
      <ellipse cx="69" cy="30" rx="4" ry="4" fill="#F5C842"/>
      <path d="M34 38 C33 42 33 46 33 46 L47 46 C47 46 47 42 46 38 C44 40 40 41 40 41 C40 41 36 40 34 38Z" fill="#E8A830"/>
      <rect x="28" y="46" width="24" height="5" rx="2.5" fill="#D4922A"/>
      <path d="M36 51 C36 57 37 62 40 66 C43 62 44 57 44 51Z" fill="#C4822A"/>
      <defs>
        <linearGradient id="lgc" x1="40" y1="8" x2="40" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F7D060"/><stop offset="55%" stopColor="#E8A830"/><stop offset="100%" stopColor="#C47820"/>
        </linearGradient>
        <linearGradient id="lgs" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#F0BC3A"/><stop offset="100%" stopColor="#D4902A"/>
        </linearGradient>
      </defs>
    </svg>
  )
}

export default function LegalLayout({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        :root{
          --bg:#F4EFE8;--bg2:#EDE7DD;--surface:#FDFAF7;
          --border:rgba(160,104,56,.15);--text:#2A1F14;--mid:#5C4A38;
          --soft:#8C7B6C;--muted:#B0A090;--accent:#A06838;--gold:#C4922A;
          --D:'Cormorant Garamond',Georgia,serif;--B:'DM Sans',system-ui,sans-serif;
        }
        body{background:var(--bg);color:var(--text);font-family:var(--B);line-height:1.7;-webkit-font-smoothing:antialiased;}
        .legal-content h2{font-family:var(--D);font-size:22px;font-weight:700;color:var(--text);margin:32px 0 12px;padding-bottom:8px;border-bottom:1px solid var(--border);}
        .legal-content h3{font-size:16px;font-weight:700;color:var(--mid);margin:20px 0 8px;}
        .legal-content p{font-size:15px;color:var(--mid);margin-bottom:12px;line-height:1.75;}
        .legal-content ul{padding-left:20px;margin-bottom:12px;}
        .legal-content ul li{font-size:15px;color:var(--mid);margin-bottom:6px;line-height:1.65;}
        .legal-content a{color:var(--accent);text-decoration:none;}
        .legal-content a:hover{text-decoration:underline;}
        .legal-content strong{color:var(--text);font-weight:600;}
        @media(max-width:640px){.legal-nav-links a:not(:last-child){display:none;}}
      `}</style>

      {/* Nav simple */}
      <nav style={{borderBottom:"1px solid rgba(160,104,56,.12)",padding:"0 32px",height:58,display:"flex",alignItems:"center",justifyContent:"space-between",background:"var(--surface)",position:"sticky",top:0,zIndex:100}}>
        <Link href="/" style={{display:"flex",alignItems:"center",gap:9,textDecoration:"none"}}>
          <FleurDeLys size={26}/>
          <span style={{fontFamily:"var(--D)",fontSize:20,fontWeight:700,color:"var(--text)",letterSpacing:"-.2px"}}>Fydelys</span>
        </Link>
        <div className="legal-nav-links" style={{display:"flex",gap:12,alignItems:"center"}}>
          <Link href="/" style={{fontSize:13,color:"var(--soft)",textDecoration:"none",fontWeight:500}}>← Retour à l'accueil</Link>
          <Link href="/login" style={{fontSize:13,padding:"7px 16px",borderRadius:8,background:"linear-gradient(145deg,#B88050,#9A6030)",color:"#fff",textDecoration:"none",fontWeight:600}}>Connexion</Link>
        </div>
      </nav>

      {/* Content */}
      <div style={{maxWidth:760,margin:"0 auto",padding:"56px 24px 96px"}}>
        {/* Header */}
        <div style={{marginBottom:48}}>
          <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
            <Link href="/mentions-legales" style={{fontSize:12,padding:"4px 12px",borderRadius:12,background:"var(--bg2)",border:"1px solid var(--border)",color:"var(--mid)",textDecoration:"none",fontWeight:500}}>Mentions légales</Link>
            <Link href="/confidentialite" style={{fontSize:12,padding:"4px 12px",borderRadius:12,background:"var(--bg2)",border:"1px solid var(--border)",color:"var(--mid)",textDecoration:"none",fontWeight:500}}>Confidentialité</Link>
            <Link href="/cgu" style={{fontSize:12,padding:"4px 12px",borderRadius:12,background:"var(--bg2)",border:"1px solid var(--border)",color:"var(--mid)",textDecoration:"none",fontWeight:500}}>CGU</Link>
          </div>
          <h1 style={{fontFamily:"var(--D)",fontSize:"clamp(32px,5vw,48px)",fontWeight:700,color:"var(--text)",lineHeight:1.1,letterSpacing:"-1px",marginBottom:10}}>{title}</h1>
          <p style={{fontSize:13,color:"var(--muted)"}}>Dernière mise à jour : {updated}</p>
        </div>

        {/* Body */}
        <div className="legal-content">{children}</div>

        {/* Footer nav */}
        <div style={{marginTop:64,paddingTop:32,borderTop:"1px solid var(--border)",display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
          <Link href="/" style={{fontSize:13,color:"var(--accent)",textDecoration:"none",fontWeight:600}}>← Retour à l'accueil</Link>
          <div style={{display:"flex",gap:20}}>
            <Link href="/mentions-legales" style={{fontSize:13,color:"var(--muted)",textDecoration:"none"}}>Mentions légales</Link>
            <Link href="/confidentialite" style={{fontSize:13,color:"var(--muted)",textDecoration:"none"}}>Confidentialité</Link>
            <Link href="/cgu" style={{fontSize:13,color:"var(--muted)",textDecoration:"none"}}>CGU</Link>
          </div>
        </div>
      </div>
    </>
  )
}
