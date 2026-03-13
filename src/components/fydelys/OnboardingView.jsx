"use client";

import React, { useState, useContext } from "react";
import { createClient } from "@/lib/supabase";
import { AppCtx } from "./context";
import { C } from "./theme";
import { IcoUser2, IcoCheck, IcoAlert2 } from "./icons";
import { Button, Field } from "./ui";

function OnboardingView({ studioName = "", onComplete }) {
  const { studioId } = useContext(AppCtx);

  const [step, setStep]   = useState(1); // 1 = identité, 2 = adresse, 3 = confirmation
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const showToast = (msg, ok=true) => { setToast({msg,ok}); setTimeout(()=>setToast(null),3500); };

  const [form, setForm] = useState({
    first_name:   "",
    last_name:    "",
    phone:        "",
    address:      "",
    postal_code:  "",
    city:         "",
  });
  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

  const [errors, setErrors] = useState({});

  function validate(forStep) {
    const e = {};
    if (forStep >= 1) {
      if (!form.first_name.trim())  e.first_name  = "Obligatoire";
      if (!form.last_name.trim())   e.last_name   = "Obligatoire";
      if (!form.phone.trim())       e.phone       = "Obligatoire";
    }
    if (forStep >= 2) {
      if (!form.address.trim())     e.address     = "Obligatoire";
      if (!form.postal_code.trim()) e.postal_code = "Obligatoire";
      if (!form.city.trim())        e.city        = "Obligatoire";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function nextStep() {
    if (!validate(step)) return;
    setStep(s => s + 1);
  }

  async function handleSubmit() {
    if (!validate(2)) { setStep(errors.address || errors.postal_code || errors.city ? 2 : 1); return; }
    setSaving(true);
    try {
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) { showToast("Session expirée, reconnectez-vous", false); setSaving(false); return; }

      const { error } = await sb.from("members")
        .update({
          first_name:       form.first_name.trim(),
          last_name:        form.last_name.trim(),
          phone:            form.phone.trim(),
          address:          form.address.trim(),
          postal_code:      form.postal_code.trim(),
          city:             form.city.trim(),
          profile_complete: true,
          status:           "actif",
        })
        .eq("studio_id", studioId)
        .eq("email", user.email);

      if (error) { showToast("Erreur lors de l'enregistrement", false); setSaving(false); return; }

      // Synchroniser profiles avec le même prénom/nom
      await sb.from("profiles")
        .update({ first_name: form.first_name.trim(), last_name: form.last_name.trim() })
        .eq("id", user.id);

      // Mettre à jour aussi le profil auth (prénom/nom)
      await sb.auth.updateUser({ data: { first_name: form.first_name.trim(), last_name: form.last_name.trim() } });

      setStep(3);
    } catch (err) {
      showToast("Erreur réseau", false);
    }
    setSaving(false);
  }

  const progress = step === 3 ? 100 : step === 2 ? 66 : 33;

  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <style>{`* { box-sizing:border-box; font-family:-apple-system,'Inter',sans-serif; } body{margin:0;}`}</style>

      {toast && (
        <div style={{ position:"fixed", top:20, right:20, zIndex:600, display:"flex", alignItems:"center", gap:8, padding:"10px 16px", borderRadius:10, background:toast.ok?C.ok:C.warn, color:"white", fontSize:14, fontWeight:600, boxShadow:"0 4px 16px rgba(0,0,0,.15)" }}>
          {toast.ok ? <IcoCheck s={16} c="white"/> : <IcoAlert2 s={16} c="white"/>}{toast.msg}
        </div>
      )}

      <div style={{ width:"100%", maxWidth:480 }}>
        {/* Header studio */}
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ fontSize:26, fontWeight:800, color:C.text, letterSpacing:-0.5 }}>
            {studioName || <span>Fyde<span style={{ color:C.accent }}>lys</span></span>}
          </div>
          <div style={{ fontSize:14, color:C.textSoft, marginTop:6 }}>
            Complétez votre profil pour accéder à l'espace membre
          </div>
        </div>

        {/* Barre de progression */}
        {step < 3 && (
          <div style={{ marginBottom:24 }}>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:C.textMuted, marginBottom:6 }}>
              <span>Étape {step} / 2</span>
              <span>{progress}%</span>
            </div>
            <div style={{ height:4, background:C.bgDeep, borderRadius:2 }}>
              <div style={{ width:`${progress}%`, height:"100%", background:C.accent, borderRadius:2, transition:"width .3s" }}/>
            </div>
          </div>
        )}

        {/* Étape 1 — Identité */}
        {step === 1 && (
          <div style={{ background:C.surface, borderRadius:16, padding:28, boxShadow:"0 4px 24px rgba(42,31,20,.08)", border:`1px solid ${C.border}` }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:22 }}>
              <div style={{ width:40, height:40, borderRadius:10, background:C.accentBg, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <IcoUser2 s={20} c={C.accent}/>
              </div>
              <div>
                <div style={{ fontSize:17, fontWeight:700, color:C.text }}>Vos informations</div>
                <div style={{ fontSize:13, color:C.textSoft }}>Prénom, nom et téléphone</div>
              </div>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div>
                  <Field label="Prénom *" value={form.first_name} onChange={set("first_name")} placeholder="Sophie"/>
                  {errors.first_name && <div style={{ fontSize:11, color:C.warn, marginTop:3 }}>{errors.first_name}</div>}
                </div>
                <div>
                  <Field label="Nom *" value={form.last_name} onChange={set("last_name")} placeholder="Martin"/>
                  {errors.last_name && <div style={{ fontSize:11, color:C.warn, marginTop:3 }}>{errors.last_name}</div>}
                </div>
              </div>
              <div>
                <Field label="Téléphone *" value={form.phone} onChange={set("phone")} placeholder="06 12 34 56 78" type="tel"/>
                {errors.phone && <div style={{ fontSize:11, color:C.warn, marginTop:3 }}>{errors.phone}</div>}
              </div>
            </div>

            <div style={{ marginTop:22 }}>
              <Button block onClick={nextStep}>Suivant →</Button>
            </div>
          </div>
        )}

        {/* Étape 2 — Adresse */}
        {step === 2 && (
          <div style={{ background:C.surface, borderRadius:16, padding:28, boxShadow:"0 4px 24px rgba(42,31,20,.08)", border:`1px solid ${C.border}` }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:22 }}>
              <div style={{ width:40, height:40, borderRadius:10, background:C.accentBg, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <span style={{ fontSize:20 }}>📍</span>
              </div>
              <div>
                <div style={{ fontSize:17, fontWeight:700, color:C.text }}>Votre adresse</div>
                <div style={{ fontSize:13, color:C.textSoft }}>Adresse postale complète</div>
              </div>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div>
                <Field label="Adresse *" value={form.address} onChange={set("address")} placeholder="12 rue de la Paix"/>
                {errors.address && <div style={{ fontSize:11, color:C.warn, marginTop:3 }}>{errors.address}</div>}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"140px 1fr", gap:12 }}>
                <div>
                  <Field label="Code postal *" value={form.postal_code} onChange={set("postal_code")} placeholder="75001"/>
                  {errors.postal_code && <div style={{ fontSize:11, color:C.warn, marginTop:3 }}>{errors.postal_code}</div>}
                </div>
                <div>
                  <Field label="Ville *" value={form.city} onChange={set("city")} placeholder="Paris"/>
                  {errors.city && <div style={{ fontSize:11, color:C.warn, marginTop:3 }}>{errors.city}</div>}
                </div>
              </div>
            </div>

            <div style={{ display:"flex", gap:10, marginTop:22 }}>
              <Button variant="ghost" sm onClick={()=>setStep(1)}>← Retour</Button>
              <Button block onClick={handleSubmit} disabled={saving}>
                {saving ? "Enregistrement…" : "Terminer mon inscription"}
              </Button>
            </div>
          </div>
        )}

        {/* Étape 3 — Confirmation */}
        {step === 3 && (
          <div style={{ background:C.surface, borderRadius:16, padding:36, boxShadow:"0 4px 24px rgba(42,31,20,.08)", border:`1px solid ${C.border}`, textAlign:"center" }}>
            <div style={{ width:64, height:64, borderRadius:"50%", background:C.okBg, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
              <IcoCheck s={32} c={C.ok}/>
            </div>
            <div style={{ fontSize:22, fontWeight:800, color:C.text, marginBottom:8 }}>
              Bienvenue {form.first_name} !
            </div>
            <div style={{ fontSize:14, color:C.textSoft, marginBottom:28, lineHeight:1.6 }}>
              Votre profil est complet. Vous pouvez maintenant réserver vos séances.
            </div>
            <Button block onClick={onComplete}>
              Accéder au planning →
            </Button>
          </div>
        )}

        {/* Note RGPD */}
        {step < 3 && (
          <div style={{ marginTop:16, fontSize:11, color:C.textMuted, textAlign:"center", lineHeight:1.5 }}>
            🔒 Vos données sont utilisées uniquement par {studioName || "ce studio"} et ne sont jamais revendues.
          </div>
        )}
      </div>
    </div>
  );
}

export { OnboardingView };