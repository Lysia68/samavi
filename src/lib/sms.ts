// ── Helper SMS Twilio ─────────────────────────────────────────
// Usage : await sendSMS({ to: "+33612345678", body: "Votre séance est confirmée" })

const TWILIO_SID   = process.env.TWILIO_ACCOUNT_SID
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_FROM  = process.env.TWILIO_PHONE_NUMBER // +33... ou MessagingServiceSid

export interface SMSResult {
  ok: boolean
  sid?: string
  error?: string
}

export async function sendSMS({ to, body, from }: { to: string; body: string; from?: string }): Promise<SMSResult> {
  if (!TWILIO_SID || !TWILIO_TOKEN || !TWILIO_FROM) {
    console.log(`[SMS simulé] → ${to} : ${body}`)
    return { ok: true, sid: "simulated" }
  }

  // Normaliser le numéro FR : 06... → +336...
  const normalized = normalizePhone(to)
  if (!normalized) {
    console.warn(`[SMS] Numéro invalide : ${to}`)
    return { ok: false, error: "Numéro invalide" }
  }

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Authorization": `Basic ${Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          From: from || TWILIO_FROM,
          To:   normalized,
          Body: body,
        }).toString(),
      }
    )
    const data = await res.json()
    if (!res.ok || data.error_code) {
      console.error(`[SMS] Twilio error ${data.error_code}: ${data.message}`)
      return { ok: false, error: data.message }
    }
    return { ok: true, sid: data.sid }
  } catch (err: any) {
    console.error("[SMS] Fetch error:", err.message)
    return { ok: false, error: err.message }
  }
}

// Normalise un numéro FR vers E.164
export function normalizePhone(phone: string): string | null {
  if (!phone) return null
  const cleaned = phone.replace(/[\s\-\.\(\)]/g, "")
  if (cleaned.startsWith("+")) return cleaned           // déjà E.164
  if (cleaned.startsWith("0033")) return "+" + cleaned.slice(2)
  if (cleaned.startsWith("33"))   return "+" + cleaned
  if (cleaned.startsWith("06") || cleaned.startsWith("07")) return "+33" + cleaned.slice(1)
  if (cleaned.length === 10 && cleaned.startsWith("0"))     return "+33" + cleaned.slice(1)
  return null
}

// ── Messages SMS ──────────────────────────────────────────────
export function smsConfirmation({ studioName, discName, sessDate, sessTime }: {
  studioName: string; discName: string; sessDate: string; sessTime: string
}) {
  return `✅ Réservé : ${discName} ${sessDate} à ${sessTime} chez ${studioName}. À bientôt !`
}

export function smsWaitlist({ studioName, discName, sessDate, sessTime }: {
  studioName: string; discName: string; sessDate: string; sessTime: string
}) {
  return `⏳ Liste d'attente : ${discName} ${sessDate} à ${sessTime} chez ${studioName}. On vous prévient si une place se libère.`
}

export function smsReminder({ studioName, discName, sessTime, reminderHours }: {
  studioName: string; discName: string; sessTime: string; reminderHours: number
}) {
  const when = reminderHours <= 2 ? "dans moins de 2h" : reminderHours <= 24 ? `demain à ${sessTime}` : `à ${sessTime}`
  return `⏰ Rappel : ${discName} ${when} chez ${studioName}. À tout de suite !`
}

export function smsCancellation({ studioName, discName, sessDate, sessTime }: {
  studioName: string; discName: string; sessDate: string; sessTime: string
}) {
  return `⚠ Séance annulée : ${discName} ${sessDate} à ${sessTime} chez ${studioName}. Désolés pour la gêne.`
}
