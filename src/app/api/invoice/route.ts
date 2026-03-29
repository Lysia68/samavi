import { NextRequest, NextResponse } from "next/server"
import { createServiceSupabase } from "@/lib/supabase-server"
import Stripe from "stripe"

export const dynamic = "force-dynamic"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" })

export async function GET(req: NextRequest) {
  const paymentId = req.nextUrl.searchParams.get("paymentId")
  if (!paymentId) return NextResponse.json({ error: "paymentId requis" }, { status: 400 })

  const db = createServiceSupabase()

  // Récupérer le paiement + studio
  const { data: pay } = await db.from("member_payments")
    .select("id, amount, payment_date, payment_type, notes, status, source, studio_id, member_id, stripe_payment_id, members(first_name, last_name, email, address, postal_code, city)")
    .eq("id", paymentId).single()

  if (!pay) return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 })

  const { data: studio } = await db.from("studios")
    .select("name, address, city, postal_code, email, phone, slug, stripe_sk, payment_mode, stripe_connect_id")
    .eq("id", pay.studio_id).single()

  // ── Tenter de récupérer la facture/reçu Stripe ─────────────────────────────
  const stripePaymentId = (pay as any).stripe_payment_id
  let stripeReceiptUrl: string | null = null
  if (stripePaymentId) {
    try {
      // Choisir la bonne instance Stripe selon payment_mode
      let stripeInstance = stripe
      let connectAccount: string | undefined

      if (studio?.payment_mode === "direct" && studio?.stripe_sk) {
        stripeInstance = new Stripe(studio.stripe_sk, { apiVersion: "2024-06-20" })
      } else if (studio?.payment_mode === "connect" && studio?.stripe_connect_id) {
        connectAccount = studio.stripe_connect_id
      }

      const options = connectAccount ? { stripeAccount: connectAccount } : {}

      // Récupérer le receipt_url Stripe pour l'afficher comme lien dans la facture HTML
      // (on ne redirige PAS — on sert toujours notre template HTML)
      if (stripePaymentId.startsWith("pi_")) {
        try {
          const pi = await stripeInstance.paymentIntents.retrieve(
            stripePaymentId,
            { expand: ["latest_charge"] },
            options
          )
          const charge = pi.latest_charge as Stripe.Charge
          if (charge?.receipt_url) stripeReceiptUrl = charge.receipt_url
        } catch { /* ignore */ }
      }
      if (stripePaymentId.startsWith("ch_")) {
        try {
          const charge = await stripeInstance.charges.retrieve(stripePaymentId, options)
          if (charge?.receipt_url) stripeReceiptUrl = charge.receipt_url
        } catch { /* ignore */ }
      }
    } catch (err: any) {
      console.warn("[invoice] Stripe lookup failed, fallback to HTML receipt:", err.message)
    }
  }

  // ── Fallback : reçu HTML maison ────────────────────────────────────────────
  const member = (pay as any).members as any
  const memberName = member ? `${member.first_name} ${member.last_name}` : "Membre"
  const dateStr = new Date(pay.payment_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })
  const invoiceNum = `FAC-${pay.id.slice(0,8).toUpperCase()}`
  const studioName = studio?.name || "Studio"
  const now = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Facture ${invoiceNum} — ${studioName}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a1a; background: #fff; width: 210mm; min-height: 297mm; margin: 0 auto; display: flex; flex-direction: column; }

  /* ── Header ── */
  .header { background: linear-gradient(135deg, #2A1F14 0%, #5C3D20 100%); color: white; padding: 20px 28px 16px; display: flex; justify-content: space-between; align-items: flex-start; }
  .studio-name { font-size: 18px; font-weight: 800; color: #F5D5A8; letter-spacing: -0.5px; }
  .studio-sub { font-size: 11px; color: rgba(255,255,255,0.6); margin-top: 3px; line-height: 1.5; }
  .invoice-meta { text-align: right; }
  .invoice-meta .label { font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: rgba(255,255,255,0.5); margin-bottom: 4px; }
  .invoice-meta .invoice-number { font-size: 20px; font-weight: 800; color: #F5D5A8; }
  .invoice-meta .invoice-date { font-size: 11px; color: rgba(255,255,255,0.7); margin-top: 3px; }

  /* ── Status bar ── */
  .status-bar { background: #A06838; padding: 7px 28px; display: flex; justify-content: space-between; align-items: center; }
  .status-label { font-size: 11px; font-weight: 700; color: white; text-transform: uppercase; letter-spacing: 1px; }
  .status-badge { background: rgba(255,255,255,0.2); color: white; padding: 2px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; text-transform: uppercase; }

  /* ── Body ── */
  .body { padding: 18px 28px 12px; }

  /* ── Parties ── */
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; padding-bottom: 14px; border-bottom: 1.5px solid #F0E8DC; }
  .party-card { background: #FDFAF7; border: 1px solid #EDE4D8; border-radius: 8px; padding: 10px 14px; }
  .party-type { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #A06838; margin-bottom: 8px; }
  .party-name { font-size: 14px; font-weight: 800; color: #2A1F14; margin-bottom: 4px; }
  .party-detail { font-size: 12px; color: #5C4A38; line-height: 1.6; }

  /* ── Table ── */
  .section-title { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #A06838; margin-bottom: 8px; }
  .items-wrap { border: 1.5px solid #EDE4D8; border-radius: 8px; overflow: hidden; margin-bottom: 0; }
  .items-table { width: 100%; border-collapse: collapse; }
  .items-table thead tr { background: #F5EBE0; }
  .items-table th { padding: 8px 12px; text-align: left; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #8C6040; }
  .items-table th:last-child { text-align: right; }
  .items-table tbody tr { border-bottom: 1px solid #F0E8DC; }
  .items-table td { padding: 10px 12px; font-size: 12px; color: #2A1F14; }
  .items-table td:last-child { text-align: right; font-weight: 700; }
  .desc { font-weight: 600; }
  .desc-sub { font-size: 11px; color: #8C7B6C; margin-top: 2px; font-weight: 400; }

  /* ── Totals ── */
  .totals { border-top: 1.5px solid #F0E8DC; }
  .totals-grid { display: flex; flex-direction: column; align-items: flex-end; padding: 10px 12px 4px; gap: 5px; }
  .total-line { display: flex; gap: 40px; justify-content: flex-end; align-items: center; }
  .total-label { font-size: 11px; color: #8C7B6C; min-width: 120px; text-align: right; }
  .total-value { font-size: 12px; font-weight: 600; color: #2A1F14; min-width: 70px; text-align: right; }
  .grand-total { margin-top: 6px; padding-top: 8px; border-top: 1.5px solid #E0D0C0; }
  .grand-total .total-label { font-size: 13px; font-weight: 800; color: #2A1F14; }
  .grand-total .total-value { font-size: 16px; font-weight: 800; color: #A06838; }

  /* ── Payment info ── */
  .payment-info { margin-top: 12px; background: #F5EBE0; border-radius: 8px; padding: 10px 14px; display: flex; gap: 24px; align-items: center; }
  .pi-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #A06838; margin-bottom: 2px; }
  .pi-value { font-size: 12px; font-weight: 600; color: #2A1F14; }

  /* ── Footer ── */
  .footer { background: #FDFAF7; padding: 12px 28px; margin-top: auto; border-top: 2px solid #F0E8DC; }
  .footer-legal { font-size: 10px; color: #8C7B6C; line-height: 1.7; }
  .footer-legal strong { color: #5C4A38; }
  .footer-brand { text-align: center; margin-top: 8px; padding-top: 8px; border-top: 1px solid #EDE4D8; font-size: 10px; color: #C4A880; font-weight: 600; letter-spacing: 0.5px; }

  /* ── Actions ── */
  .actions { position: fixed; bottom: 20px; right: 20px; display: flex; gap: 8px; }
  .btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 18px; border-radius: 8px; border: none; font-size: 13px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
  .btn-primary { background: #A06838; color: white; }
  .btn-secondary { background: white; color: #2A1F14; border: 1.5px solid #DDD5C8; }

  @media print {
    @page { margin: 0; size: A4 portrait; }
    body { margin: 0; width: 100%; }
    .actions { display: none !important; }
    .header, .status-bar, .footer { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>

  <div style="flex:1">
  <!-- Header -->
  <div class="header">
    <div>
      <div class="studio-name">${studioName}</div>
      <div class="studio-sub">
        ${studio?.address ? `${studio.address}<br/>` : ""}
        ${studio?.postal_code ? `${studio.postal_code} ` : ""}${studio?.city || ""}
      </div>
    </div>
    <div class="invoice-meta">
      <div class="label">Facture</div>
      <div class="invoice-number">${invoiceNum}</div>
      <div class="invoice-date">Émise le ${now}</div>
    </div>
  </div>
  <div class="status-bar">
    <span class="status-label">Statut du paiement</span>
    <span class="status-badge">✓ ${pay.status || "payé"}</span>
  </div>

  <div class="body">
    <!-- Émetteur / Destinataire -->
    <div class="parties">
      <div class="party-card">
        <div class="party-type">Émetteur</div>
        <div class="party-name">${studioName}</div>
        <div class="party-detail">
          ${studio?.address ? `${studio.address}<br/>` : ""}
          ${studio?.postal_code ? `${studio.postal_code} ` : ""}${studio?.city || ""}
        </div>
      </div>
      <div class="party-card">
        <div class="party-type">Destinataire</div>
        <div class="party-name">${memberName}</div>
        <div class="party-detail">
          ${(member as any)?.address ? `${(member as any).address}<br/>` : ""}
          ${(member as any)?.postal_code ? `${(member as any).postal_code} ` : ""}${(member as any)?.city || ""}
        </div>
      </div>
    </div>

    <!-- Détail -->
    <div class="section-title">Détail de la prestation</div>
    <div class="items-wrap">
      <table class="items-table">
        <thead>
          <tr>
            <th style="width:50%">Description</th>
            <th>Date</th>
            <th>Mode de paiement</th>
            <th>Montant HT</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <div class="desc">${pay.notes || "Prestation"}</div>
              <div class="desc-sub">${studioName}</div>
            </td>
            <td>${dateStr}</td>
            <td>${pay.payment_type || "Carte bancaire"}</td>
            <td>${Number(pay.amount).toFixed(2)} €</td>
          </tr>
        </tbody>
      </table>
      <div class="totals">
        <div class="totals-grid">
          <div class="total-line">
            <span class="total-label">Sous-total HT</span>
            <span class="total-value">${Number(pay.amount).toFixed(2)} €</span>
          </div>
          <div class="total-line">
            <span class="total-label">TVA (non applicable)</span>
            <span class="total-value">0,00 €</span>
          </div>
          <div class="total-line grand-total">
            <span class="total-label">Total TTC</span>
            <span class="total-value">${Number(pay.amount).toFixed(2)} €</span>
          </div>
        </div>
        <div style="height:12px"></div>
      </div>
    </div>

    <!-- Infos paiement -->
    <div class="payment-info">
      <div><div class="pi-label">Référence</div><div class="pi-value">${invoiceNum}</div></div>
      <div><div class="pi-label">Date de paiement</div><div class="pi-value">${dateStr}</div></div>
      <div><div class="pi-label">Moyen de paiement</div><div class="pi-value">${pay.payment_type || "Carte bancaire"}</div></div>
      <div><div class="pi-label">Statut</div><div class="pi-value" style="color:#4E8A58;font-weight:800;">✓ ${pay.status || "payé"}</div></div>
    </div>
  </div>

  </div>
  <!-- Footer -->
  <div class="footer">
    <div class="footer-legal">
      <strong>Mentions légales :</strong> TVA non applicable, article 293 B du CGI.
      Ce document tient lieu de facture conformément à la législation française en vigueur.
      ${pay.stripe_payment_id ? `Référence transaction : ${pay.stripe_payment_id}` : ""}
    </div>
    <div class="footer-brand">Propulsé par Fydelys — fydelys.fr</div>
  </div>

<!-- Boutons -->
<div class="actions">
  <button class="btn btn-secondary" onclick="window.close()">✕ Fermer</button>
  ${stripeReceiptUrl ? `<a href="${stripeReceiptUrl}" target="_blank" class="btn btn-secondary" style="text-decoration:none">🧾 Reçu Stripe</a>` : ""}
  <button class="btn btn-primary" onclick="window.print()">🖨 Imprimer / PDF</button>
</div>

<script>
  if (new URLSearchParams(window.location.search).get('print') === '1') {
    window.addEventListener('load', () => setTimeout(() => window.print(), 300));
  }
</script>
</body>
</html>`

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
}