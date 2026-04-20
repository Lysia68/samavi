// Helper d'audit log pour les actions sur les membres
// Utiliser depuis les API routes et webhooks (service role)

type ActivityAction =
  | "member_created"
  | "member_updated"
  | "member_deleted"
  | "member_frozen"
  | "member_unfrozen"
  | "member_suspended"
  | "member_reactivated"
  | "credit_add"           // achat, pack, offre
  | "credit_deduct"        // présence validée
  | "credit_restore"       // annulation réservation
  | "credit_manual"        // ajustement manuel admin
  | "subscription_change"
  | "booking_created"
  | "booking_attended"
  | "booking_absent"
  | "booking_cancelled"
  | "booking_promoted"     // waitlist → confirmed
  | "payment"              // paiement enregistré
  | "email_sent"
  | "sms_sent"
  | "magic_link_sent"

interface LogParams {
  memberId: string
  studioId: string
  action: ActivityAction
  actorId?: string | null
  actorRole?: "admin" | "coach" | "adherent" | "system" | "stripe" | null
  details?: Record<string, any>
}

export async function logActivity(db: any, params: LogParams): Promise<void> {
  try {
    await db.from("member_activity").insert({
      member_id:  params.memberId,
      studio_id:  params.studioId,
      actor_id:   params.actorId  ?? null,
      actor_role: params.actorRole ?? "system",
      action:     params.action,
      details:    params.details ?? {},
    })
  } catch (e) {
    // Ne jamais bloquer une action métier à cause d'un log qui échoue
    console.error("[activity] log failed:", params.action, e)
  }
}
