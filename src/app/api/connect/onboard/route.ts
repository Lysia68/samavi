import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createServiceSupabase } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" })

export async function POST(req: NextRequest) {
  try {
    const { studioId } = await req.json()
    if (!studioId) return NextResponse.json({ error: "studioId requis" }, { status: 400 })

    // Utiliser le service role directement — l'auth est vérifiée côté client
    // (TabPayments n'est accessible qu'aux admins)
    const db = createServiceSupabase()

    const { data: studio, error: studioErr } = await db
      .from("studios")
      .select("id, name, email, slug, address, city, phone, stripe_connect_id, stripe_connect_status")
      .eq("id", studioId).single()

    if (studioErr || !studio) {
      console.error("Studio query error:", studioErr)
      return NextResponse.json({ error: "Studio introuvable" }, { status: 404 })
    }

    // Si déjà actif → lien dashboard Stripe
    if (studio.stripe_connect_id && studio.stripe_connect_status === "active") {
      const loginLink = await stripe.accounts.createLoginLink(studio.stripe_connect_id)
      return NextResponse.json({ url: loginLink.url, existing: true })
    }

    // Créer ou réutiliser un compte Express
    let accountId = studio.stripe_connect_id
    if (!accountId) {
      // Pré-remplir avec les infos du studio pour réduire les étapes d'onboarding
      const accountData: any = {
        type: "express",
        country: "FR",
        email: studio.email || undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_profile: {
          name: studio.name,
          ...(studio.phone ? { support_phone: studio.phone.replace(/\s/g, "") } : {}),
          url: studio.slug ? `https://${studio.slug}.fydelys.fr` : undefined,
        },
        metadata: { studioId, platform: "fydelys" },
      }

      // Pré-remplir l'adresse si disponible
      if (studio.address && studio.city) {
        accountData.individual = {
          address: {
            line1: studio.address,
            city: studio.city,
            country: "FR",
          }
        }
      }

      const account = await stripe.accounts.create(accountData)
      accountId = account.id

      await db.from("studios").update({
        stripe_connect_id: accountId,
        stripe_connect_status: "pending",
      }).eq("id", studioId)
    }

    const origin = req.headers.get("origin") || `https://${studio.slug}.fydelys.fr`

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/settings?tab=payments&connect=refresh`,
      return_url:  `${origin}/settings?tab=payments&connect=success`,
      type: "account_onboarding",
    })

    return NextResponse.json({ url: accountLink.url })

  } catch (err: any) {
    console.error("Connect onboard error:", err?.message, JSON.stringify(err?.raw || {}))
    return NextResponse.json({
      error: err.message,
      stripe_code: err?.raw?.code,
      stripe_type: err?.raw?.type,
    }, { status: 500 })
  }
}
