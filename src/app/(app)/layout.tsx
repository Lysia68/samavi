"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import dynamic from "next/dynamic"

const ZenClassV4 = dynamic(() => import("@/components/ZenClassV4"), { ssr: false })

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push("/")
    })
  }, [])

  return <ZenClassV4 />
}
