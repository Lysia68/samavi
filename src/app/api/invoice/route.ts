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
  const memberName = member ? `${member.first_name} ${member.last_name}` : "Adhérent"
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
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a1a; background: #f5f5f5; }
  .page { max-width: 760px; margin: 0 auto; background: #fff; min-height: 100vh; display: flex; flex-direction: column; position: relative; }
  .full-width-wrap { position: relative; left: 50%; right: 50%; margin-left: -50vw; margin-right: -50vw; width: 100vw; }
  /* ── Header ── */
  .header { background: linear-gradient(135deg, #2A1F14 0%, #5C3D20 100%); color: white; padding: 24px 36px 18px; display: flex; justify-content: space-between; align-items: flex-start; }
  .logo-block .studio-name { font-size: 20px; font-weight: 800; letter-spacing: -0.5px; color: #F5D5A8; }
  .logo-block .studio-sub { font-size: 12px; color: rgba(255,255,255,0.6); margin-top: 4px; line-height: 1.6; }
  .invoice-meta { text-align: right; }
  .invoice-meta .label { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: rgba(255,255,255,0.5); margin-bottom: 6px; }
  .invoice-meta .invoice-number { font-size: 22px; font-weight: 800; color: #F5D5A8; }
  .invoice-meta .invoice-date { font-size: 13px; color: rgba(255,255,255,0.7); margin-top: 4px; }
  .status-bar { background: #A06838; padding: 7px 36px; display: flex; justify-content: space-between; align-items: center; }
  .status-bar .status-label { font-size: 12px; font-weight: 700; color: white; text-transform: uppercase; letter-spacing: 1px; }
  .status-bar .status-badge { background: rgba(255,255,255,0.2); color: white; padding: 3px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
  /* ── Body ── */
  .body { padding: 20px 36px 12px; }
  /* ── Parties ── */
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; padding-bottom: 14px; border-bottom: 2px solid #F0E8DC; }
  .party-card { background: #FDFAF7; border: 1px solid #EDE4D8; border-radius: 10px; padding: 12px 16px; }
  .party-card .party-type { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #A06838; margin-bottom: 12px; }
  .party-card .party-name { font-size: 16px; font-weight: 800; color: #2A1F14; margin-bottom: 6px; }
  .party-card .party-detail { font-size: 13px; color: #5C4A38; line-height: 1.7; }
  /* ── Items table ── */
  .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #A06838; margin-bottom: 14px; }
  .items-table { width: 100%; border-collapse: collapse; margin-bottom: 0; }
  .items-table thead tr { background: #F5EBE0; }
  .items-table th { padding: 11px 16px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #8C6040; }
  .items-table th:last-child { text-align: right; }
  .items-table tbody tr { border-bottom: 1px solid #F0E8DC; }
  .items-table tbody tr:last-child { border-bottom: none; }
  .items-table td { padding: 14px 16px; font-size: 14px; color: #2A1F14; }
  .items-table td:last-child { text-align: right; font-weight: 700; }
  .items-table .desc { font-weight: 600; }
  .items-table .desc-sub { font-size: 12px; color: #8C7B6C; margin-top: 3px; font-weight: 400; }
  /* ── Totals ── */
  .totals { border-top: 2px solid #F0E8DC; margin-top: 0; }
  .totals-grid { display: flex; flex-direction: column; align-items: flex-end; padding: 10px 16px 0; gap: 5px; }
  .total-line { display: flex; gap: 48px; justify-content: flex-end; align-items: center; }
  .total-line .total-label { font-size: 13px; color: #8C7B6C; min-width: 120px; text-align: right; }
  .total-line .total-value { font-size: 14px; font-weight: 600; color: #2A1F14; min-width: 80px; text-align: right; }
  .total-line.grand-total { margin-top: 8px; padding-top: 12px; border-top: 1.5px solid #E0D0C0; }
  .total-line.grand-total .total-label { font-size: 15px; font-weight: 800; color: #2A1F14; }
  .total-line.grand-total .total-value { font-size: 18px; font-weight: 800; color: #A06838; }
  /* ── Payment info ── */
  .payment-info { margin-top: 14px; background: #F5EBE0; border-radius: 10px; padding: 12px 18px; display: flex; gap: 24px; align-items: center; }
  .payment-info .pi-item { display: flex; flex-direction: column; gap: 3px; }
  .payment-info .pi-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #A06838; }
  .payment-info .pi-value { font-size: 14px; font-weight: 600; color: #2A1F14; }
  /* ── Footer ── */
  .footer { padding: 14px 36px; background: #2A1F14; border-top: none; }
  .footer-legal { font-size: 11px; color: rgba(255,255,255,0.7); line-height: 1.8; }
  .footer-legal strong { color: #F5D5A8; }
  .footer-brand { text-align: center; margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.15); font-size: 11px; color: rgba(255,255,255,0.5); font-weight: 600; letter-spacing: 0.5px; }
  /* ── Actions (masqués à l'impression) ── */
  .actions { position: fixed; bottom: 24px; right: 24px; display: flex; gap: 10px; }
  .btn { display: inline-flex; align-items: center; gap: 8px; padding: 12px 20px; border-radius: 10px; border: none; font-size: 14px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 16px rgba(0,0,0,0.15); }
  .btn-primary { background: #A06838; color: white; }
  .btn-secondary { background: white; color: #2A1F14; border: 1.5px solid #DDD5C8; }
  @media print {
    @page { margin: 0; size: A4; }
    body { background: white; padding: 0; }
    .actions { display: none !important; }
    .page { box-shadow: none; }
    .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .status-bar { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .footer { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
<div class="page">
  <!-- Header -->
  <div class="full-width-wrap"><div class="header">
    <div class="logo-block">
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
  </div></div>
  <div class="full-width-wrap"><div class="status-bar">
    <span class="status-label">Statut du paiement</span>
    <span class="status-badge">✓ ${pay.status || "payé"}</span>
  </div></div>

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

    <!-- Détail de la prestation -->
    <div class="section-title" style="margin-bottom:8px">Détail de la prestation</div>
    <div style="border: 1.5px solid #EDE4D8; border-radius: 10px; overflow: hidden;">
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
        <div style="height:20px"></div>
      </div>
    </div>

    <!-- Informations de paiement -->
    <div class="payment-info">
      <div class="pi-item">
        <span class="pi-label">Référence</span>
        <span class="pi-value">${invoiceNum}</span>
      </div>
      <div class="pi-item">
        <span class="pi-label">Date de paiement</span>
        <span class="pi-value">${dateStr}</span>
      </div>
      <div class="pi-item">
        <span class="pi-label">Moyen de paiement</span>
        <span class="pi-value">${pay.payment_type || "Carte bancaire"}</span>
      </div>
      <div class="pi-item">
        <span class="pi-label">Statut</span>
        <span class="pi-value" style="color:#4E8A58; font-weight:800;">✓ ${pay.status || "payé"}</span>
      </div>
    </div>
  </div>

  <!-- Footer légal -->
  <div class="full-width-wrap"><div class="footer">
    <div class="footer-legal">
      <strong>Mentions légales :</strong> TVA non applicable, article 293 B du CGI. 
      Ce document tient lieu de facture conformément à la législation française en vigueur.
      ${pay.stripe_payment_id ? `Référence transaction : ${pay.stripe_payment_id}` : ""}
    </div>
    <div class="footer-brand">Propulsé par Fydelys — fydelys.fr</div>
  </div></div>
</div>

<!-- Boutons d'action -->
<div class="actions">
  <button class="btn btn-secondary" onclick="window.close()">✕ Fermer</button>
  ${stripeReceiptUrl ? `<a href="${stripeReceiptUrl}" target="_blank" class="btn btn-secondary" style="text-decoration:none">🧾 Reçu Stripe</a>` : ""}
  <button class="btn btn-primary" onclick="window.print()">🖨 Imprimer / PDF</button>
</div>

<script>
  // Déclenche automatiquement la boîte de dialogue d'impression si ?print=1
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