import { NextResponse } from "next/server"
import { createServiceSupabase } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

// Cron quotidien : nettoyer les comptes non validés après 7 jours
// Supprime les membres "nouveau" sans connexion confirmée
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const db = createServiceSupabase()
  const DAYS_LIMIT = 7

  // Date limite : créé il y a plus de 7 jours
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - DAYS_LIMIT)
  const cutoffStr = cutoff.toISOString()

  // Charger les membres "nouveau" non complétés, créés avant la date limite
  const { data: staleMembers } = await db.from("members")
    .select("id, email, auth_user_id, studio_id, first_name, last_name, created_at")
    .eq("status", "nouveau")
    .eq("profile_complete", false)
    .lt("created_at", cutoffStr)

  if (!staleMembers?.length) {
    return NextResponse.json({ ok: true, cleaned: 0, message: "Aucun compte à nettoyer" })
  }

  // Vérifier que l'auth user n'a jamais confirmé son email
  let cleaned = 0
  const errors: string[] = []

  for (const member of staleMembers) {
    try {
      let shouldDelete = true

      if (member.auth_user_id) {
        const { data: authUser } = await db.auth.admin.getUserById(member.auth_user_id)
        // Si l'utilisateur a confirmé son email, ne pas supprimer
        if (authUser?.user?.email_confirmed_at) {
          shouldDelete = false
        }
      }

      if (shouldDelete) {
        // Supprimer le membre (soft delete)
        await db.from("members").update({ deleted_at: new Date().toISOString(), status: "suspendu" }).eq("id", member.id)

        // Supprimer le profil et l'auth user si existant
        if (member.auth_user_id) {
          await db.from("profiles").delete().eq("id", member.auth_user_id)
          await db.auth.admin.deleteUser(member.auth_user_id)
        }

        console.log(`[cleanup] Supprimé: ${member.email} (${member.first_name} ${member.last_name}) — studio ${member.studio_id}`)
        cleaned++
      }
    } catch (err: any) {
      errors.push(`${member.email}: ${err.message}`)
    }
  }

  console.log(`[cleanup] ${cleaned} compte(s) nettoyé(s) sur ${staleMembers.length} candidats`)
  return NextResponse.json({ ok: true, cleaned, total: staleMembers.length, errors })
}
