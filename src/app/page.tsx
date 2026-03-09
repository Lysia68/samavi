"use client"
import { useState } from "react"
import { createClient } from "@/lib/supabase"

function LotusIcon() {
  return (
    <svg width="38" height="38" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="32" cy="38" rx="7" ry="9" fill="white" fillOpacity="0.95"/>
      <path d="M32 10 C28 18, 26 26, 32 32 C38 26, 36 18, 32 10Z" fill="white" fillOpacity="0.95"/>
      <path d="M10 30 C16 24, 24 24, 28 32 C20 34, 13 32, 10 30Z" fill="white" fillOpacity="0.85"/>
      <path d="M54 30 C48 24, 40 24, 36 32 C44 34, 51 32, 54 30Z" fill="white" fillOpacity="0.85"/>
      <path d="M4 42 C10 32, 20 30, 26 36 C18 42, 8 44, 4 42Z" fill="white" fillOpacity="0.7"/>
      <path d="M60 42 C54 32, 44 30, 38 36 C46 42, 56 44, 60 42Z" fill="white" fillOpacity="0.7"/>
      <path d="M14 52 C18 44, 26 42, 30 46 C26 52, 18 54, 14 52Z" fill="white" fillOpacity="0.5"/>
      <path d="M50 52 C46 44, 38 42, 34 46 C38 52, 46 54, 50 52Z" fill="white" fillOpacity="0.5"/>
      <path d="M32 54 L32 62" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.6"/>
    </svg>
  )
}

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [focused, setFocused] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    })
    if (error) { setError(error.message); setLoading(false) }
    else { setSent(true); setLoading(false) }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #F8F2EA 0%, #EDE4D8 50%, #E5D8C8 100%)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: 24,
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(176,120,72,.08) 0%, transparent 70%)",
        pointerEvents: "none"
      }} />

      <div style={{ width: "100%", maxWidth: 380, position: "relative" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 22,
            background: "linear-gradient(145deg, #C4956A 0%, #A06838 60%, #8A5530 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px",
            boxShadow: "0 12px 40px rgba(140,88,56,.35), 0 4px 12px rgba(140,88,56,.2), inset 0 1px 0 rgba(255,255,255,.15)",
          }}>
            <LotusIcon />
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: "#2A1F14", margin: "0 0 6px", letterSpacing: -0.8, lineHeight: 1 }}>
            Zen<span style={{ color: "#A06838" }}>Class</span>
          </h1>
          <p style={{ color: "#8C7B6C", fontSize: 13, margin: 0, fontWeight: 500, letterSpacing: 0.1 }}>
            Gestion de studio · Yoga &amp; Bien-être
          </p>
        </div>

        <div style={{
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(221,213,200,0.8)",
          borderRadius: 20, padding: "32px 28px",
          boxShadow: "0 8px 40px rgba(42,31,20,.08), 0 2px 8px rgba(42,31,20,.04)",
        }}>
          {!sent ? (
            <>
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: "#2A1F14", margin: "0 0 6px", letterSpacing: -0.3 }}>
                  Connexion sans mot de passe
                </h2>
                <p style={{ fontSize: 13, color: "#8C7B6C", margin: 0, lineHeight: 1.6 }}>
                  Recevez un lien sécurisé directement dans votre boîte mail.
                </p>
              </div>
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{
                    display: "block", fontSize: 11, fontWeight: 700,
                    color: focused ? "#A06838" : "#8C7B6C",
                    letterSpacing: 0.8, textTransform: "uppercase",
                    marginBottom: 7, transition: "color .15s"
                  }}>Adresse email</label>
                  <input
                    type="email" value={email}
                    onChange={e => setEmail(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    placeholder="vous@studio.com" required
                    style={{
                      width: "100%", padding: "13px 16px",
                      border: `1.5px solid ${focused ? "#A06838" : "#DDD5C8"}`,
                      borderRadius: 12, fontSize: 15, outline: "none",
                      color: "#2A1F14", background: "#FDFAF7",
                      boxSizing: "border-box", transition: "border-color .15s",
                      boxShadow: focused ? "0 0 0 3px rgba(160,104,56,.08)" : "none",
                    }}
                  />
                </div>
                {error && (
                  <div style={{
                    background: "#FDF0EC", border: "1px solid #EFC8BC",
                    borderRadius: 10, padding: "10px 14px", marginBottom: 14,
                    fontSize: 13, color: "#A85030",
                  }}>⚠ {error}</div>
                )}
                <button type="submit" disabled={loading || !email} style={{
                  width: "100%", padding: "14px",
                  background: loading || !email ? "#C4A882" : "linear-gradient(145deg, #B88050 0%, #9A6030 100%)",
                  color: "#fff", border: "none", borderRadius: 12,
                  fontSize: 15, fontWeight: 700,
                  cursor: loading || !email ? "not-allowed" : "pointer",
                  letterSpacing: -0.2,
                  boxShadow: loading || !email ? "none" : "0 4px 16px rgba(140,88,56,.35)",
                  transition: "all .2s",
                }}>
                  {loading ? "Envoi en cours…" : "Recevoir le lien magique ✦"}
                </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "12px 0" }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "linear-gradient(145deg, #E8F5EC, #D0EBD8)",
                border: "1.5px solid #B8DFC4",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 28, margin: "0 auto 20px",
              }}>✉</div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#2A1F14", marginBottom: 10, letterSpacing: -0.4 }}>
                Vérifiez vos emails !
              </h2>
              <p style={{ fontSize: 14, color: "#5C4A38", lineHeight: 1.7, marginBottom: 6 }}>Lien envoyé à</p>
              <p style={{
                fontSize: 15, fontWeight: 700, color: "#A06838",
                background: "#F5EBE0", borderRadius: 8, padding: "8px 16px",
                display: "inline-block", marginBottom: 20,
              }}>{email}</p>
              <p style={{ fontSize: 12, color: "#B0A090", lineHeight: 1.7 }}>
                Le lien expire dans <strong>1 heure</strong>.<br />Vérifiez aussi vos spams.
              </p>
              <button onClick={() => { setSent(false); setEmail("") }} style={{
                marginTop: 20, background: "none",
                border: "1.5px solid #DDD5C8", borderRadius: 10,
                padding: "9px 22px", cursor: "pointer",
                fontSize: 13, color: "#8C7B6C", fontWeight: 600,
              }}>← Changer d&apos;adresse</button>
            </div>
          )}
        </div>

        <p style={{
          textAlign: "center", color: "#B0A090", fontSize: 11,
          marginTop: 24, lineHeight: 1.8, letterSpacing: 0.2,
        }}>© 2026 ZenClass · Connexion 100% sécurisée</p>
      </div>
    </div>
  )
}
