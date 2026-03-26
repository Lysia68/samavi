export const dynamic = "force-dynamic"
import { headers } from "next/headers"
import { createServiceSupabase } from "@/lib/supabase-server"
import LoginPage from "./LoginClient"

export default async function Page() {
  const h = await headers()
  const slug = h.get("x-tenant-slug") || ""

  let studioName = ""
  if (slug) {
    const db = createServiceSupabase()
    const { data } = await db
      .from("studios")
      .select("name")
      .eq("slug", slug)
      .single()
    if (data?.name) studioName = data.name
  }

  return <LoginPage initialStudioName={studioName} />
}
