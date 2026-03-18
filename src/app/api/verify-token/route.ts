import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { createServiceSupabase } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const { tokenHash, type, tenantSlug, accessToken, refreshToken } = await request.json()
  if (!tokenHash && !accessToken) return NextResponse.json({ error: "token manquant" }, { status: 400 })

  const db = createServiceSupabase()
  const cookiesToSet: any[] = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(list) { cookiesToSet.push(...list) },
      },
    }
  )

  const { data, error } = tokenHash
    ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type || "magiclink" })
    : await supabase.auth.setSession({ access_token: accessToken!, refresh_token: refreshToken! })

  if (error || !data?.user) {
    return NextResponse.json({ error: error?.message || "verify_failed" }, { status: 401 })
  }

  const user = data.user
  let profileComplete = true
  let slug = tenantSlug

  if (tenantSlug) {
    const { data: studio } = await db.from("studios").select("id,slug").eq("slug", tenantSlug).single()
    if (studio) {
      const { data: existing } = await db.from("profiles").select("role,studio_id").eq("id", user.id).single()

      if (!existing) {
        const { data: invite } = await db.from("invitations")
          .select("role").eq("email", user.email!).eq("studio_id", studio.id).eq("used", false).single()
        const role = invite?.role || user.user_metadata?.role || "adherent"
        await db.from("profiles").insert({
          id: user.id, role, studio_id: studio.id,
          first_name: user.user_metadata?.first_name || "",
          last_name:  user.user_metadata?.last_name  || "",
          is_coach: role === "coach",
        })
        if (invite) {
          await db.from("invitations").update({ used: true })
            .eq("email", user.email!).eq("studio_id", studio.id)
        }
        if (role === "adherent") {
          const { data: existingMember } = await db.from("members")
            .select("id,profile_complete").eq("studio_id", studio.id).eq("email", user.email!).single()
          if (existingMember) {
            await db.from("members").update({ auth_user_id: user.id }).eq("id", existingMember.id)
            profileComplete = existingMember.profile_complete ?? false
          } else {
            await db.from("members").insert({
              studio_id: studio.id, auth_user_id: user.id,
              first_name: user.user_metadata?.first_name || "Nouveau",
              last_name:  user.user_metadata?.last_name  || "Membre",
              email: user.email!, status: "nouveau", credits: 0, credits_total: 0,
              profile_complete: false,
            })
            profileComplete = false
          }
        }
      } else {
        if (existing.role === "adherent") {
          await db.from("members").update({ auth_user_id: user.id })
            .eq("studio_id", existing.studio_id || studio.id).eq("email", user.email!)
          const { data: member } = await db.from("members").select("profile_complete")
            .eq("studio_id", existing.studio_id || studio.id).eq("email", user.email!).single()
          profileComplete = member?.profile_complete ?? false
        }
      }
    }
  }

  const res = NextResponse.json({ ok: true, slug, profile_complete: profileComplete })
  // Poser les cookies avec domain .fydelys.fr
  cookiesToSet.forEach(({ name, value, options }) => {
    res.cookies.set(name, value, {
      ...options,
      domain: ".fydelys.fr",
      path: "/",
      sameSite: "lax",
      secure: true,
    })
  })
  return res
}